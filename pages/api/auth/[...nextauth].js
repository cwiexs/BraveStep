// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';       // ← default import
import { pool, query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default NextAuth({
  adapter: PostgresAdapter(pool),                    // ← be gražiųjų skliaustų

  providers: [
    CredentialsProvider({
      name: 'El. paštas',
      credentials: {
        email: { label: 'El. paštas', type: 'email' },
        password: { label: 'Slaptažodis', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await query(
          'SELECT id, name, email, password FROM users WHERE email = $1',
          [credentials.email]
        );
        const user = res.rows[0];
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return { id: user.id, name: user.name, email: user.email };
        }
        return null;
      },
    }),

    FacebookProvider({
      authorization: { params: { scope: 'email,public_profile' } },
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
    newUser: '/auth/signup',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },

  debug: process.env.NODE_ENV !== 'production',
});
