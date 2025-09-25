import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
// import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '../../../lib/prisma'

export default NextAuth({
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        console.log('🔍 授权函数被调用，凭据:', credentials);
        
        if (credentials?.email) {
          try {
            console.log('🔎 查找用户:', credentials.email);
            
            // 查找或创建用户
            let user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });
            
            console.log('📊 查找结果:', user);
            
            if (!user) {
              console.log('👤 创建新用户...');
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: credentials.email.split('@')[0],
                },
              });
              console.log('✅ 用户创建成功:', user);
            }
            
            const result = {
              id: user.id,
              email: user.email,
              name: user.name,
            };
            
            console.log('✅ 返回用户信息:', result);
            return result;
            
          } catch (error) {
            console.error('❌ 授权错误:', error);
            return null;
          }
        }
        
        console.log('❌ 没有提供邮箱');
        return null;
      },
    }),
  ],
  secret: process.env.SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔑 JWT 回调:', { token, user });
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      console.log('🔑 JWT 返回:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 Session 回调:', { session, token });
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      console.log('🔐 Session 返回:', session);
      return session;
    }
  }
});
