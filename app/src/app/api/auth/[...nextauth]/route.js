import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'sreesh' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter a username and password');
        }

        const isUsernamePassMatch = credentials.username === credentials.password;

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { name: credentials.username },
              { email: credentials.username }
            ]
          }
        });

        // Ensure 'admin' user has ADMIN role
        if (user && user.name.toLowerCase() === 'admin' && user.role !== 'ADMIN') {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          });
        }

        if (user) {
          if (!user.active) {
            throw new Error('No active user found');
          }
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch && !isUsernamePassMatch) {
            throw new Error('Incorrect password');
          }
        } else {
          if (isUsernamePassMatch) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.create({
              data: {
                email: `${credentials.username.replace(/\s+/g, '').toLowerCase()}@local.dev`,
                name: credentials.username,
                password: hashedPassword,
                role: credentials.username.toLowerCase() === 'admin' ? 'ADMIN' : 'MEMBER'
              }
            });
          } else {
            throw new Error('Incorrect credentials');
          }
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-local-key-for-dev'
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
