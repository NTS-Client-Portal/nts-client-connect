import NextAuth, { DefaultSession } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users, shippers, ntsUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType: "shipper" | "nts_user" | null;
      role?: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User {
    userType?: "shipper" | "nts_user" | null;
    role?: "admin" | "user";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user) {
          return null;
        }

        // Check if shipper
        const [shipper] = await db
          .select()
          .from(shippers)
          .where(eq(shippers.id, user.id))
          .limit(1);

        if (shipper) {
          // Verify password
          if (!user.password) {
            return null;
          }
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${shipper.firstName} ${shipper.lastName}`,
            userType: "shipper" as const,
          };
        }

        // Check if NTS user
        const [ntsUser] = await db
          .select()
          .from(ntsUsers)
          .where(eq(ntsUsers.id, user.id))
          .limit(1);

        if (ntsUser) {
          // Verify password
          if (!user.password) {
            return null;
          }
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${ntsUser.firstName} ${ntsUser.lastName}`,
            userType: "nts_user" as const,
            role: ntsUser.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as "shipper" | "nts_user" | null;
        session.user.role = token.role as "admin" | "user" | undefined;
      }
      return session;
    },
  },
});
