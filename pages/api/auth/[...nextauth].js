// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import PostgresAdapter from '@auth/pg-adapter';
import { pool } from '../../../lib/db';

export default NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      // Įtraukiame vartotojo ID į seansą
      session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user, account }) {
      // Įrašome access token, kai tik vartotojas autentifikuojasi
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  debug: true,  // Debug režimas log'ins veikimo duomenis
});
