import { type GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession, type NextAuthOptions, type Account } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";
import { type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    username: string;
    role: Role;
    isVerified: boolean;
    password?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    isVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("VERIFICATION_REQUIRED");
        }

        const user = await db.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (!user.isVerified) {
          throw new Error("VERIFICATION_REQUIRED");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("INVALID_CREDENTIALS");
        }

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);