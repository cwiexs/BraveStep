import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { PostgresAdapter } from '@next-auth/postgres-adapter';
import { createPool } from '@neondatabase/serverless';

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export default NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
});
