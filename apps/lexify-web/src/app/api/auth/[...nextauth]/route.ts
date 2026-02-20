import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/admin/login`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const adminData = await res.json();
          if (res.ok && adminData?.access_token) {
            return {
              id: adminData.user.id,
              name: adminData.user.name,
              email: adminData.user.email,
              role: adminData.user.role,
              accessToken: adminData.access_token,
            } as any;
          }
        } catch (e) {
          console.error("Admin login failed", e);
        }
        return null;
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // If logging in via Credentials, user object will have accessToken and role
      if (user && (user as any).accessToken) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
      }
      
      // If logging in via Google OAuth
      if (account && account.id_token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/auth/web`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: account.id_token }),
          });

          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.role = data.user?.role || "USER";
          } else {
            token.accessToken = account.id_token;
            token.role = "USER";
          }
        } catch (error) {
          console.error("Failed to exchange token during NextAuth callback:", error);
          token.accessToken = account.id_token;
          token.role = "USER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
