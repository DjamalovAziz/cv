import { type GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";
import { type Role, AuthStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      telegramId: string;
      role: Role;
    };
  }

  interface User {
    telegramId: string;
    role: Role;
  }
}

export async function generateCode(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAuthRequest(userId: string, code: string) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.authRequest.create({
    data: {
      code,
      status: AuthStatus.PENDING,
      userId,
      expiresAt,
    },
  });
}

export async function getLatestAuthRequest(userId: string) {
  return db.authRequest.findFirst({
    where: {
      userId,
      status: AuthStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function confirmAuthRequest(userId: string) {
  const request = await getLatestAuthRequest(userId);
  if (!request) return false;

  await db.authRequest.update({
    where: { id: request.id },
    data: { status: AuthStatus.CONFIRMED },
  });

  return true;
}

export async function checkAuthConfirmation(userId: string): Promise<boolean> {
  const request = await getLatestAuthRequest(userId);
  return request?.status === AuthStatus.CONFIRMED;
}

const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Telegram",
      credentials: {
        telegramId: { label: "Telegram ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.telegramId) return null;

        const user = await db.user.findUnique({
          where: { telegramId: credentials.telegramId },
        });

        if (!user) return null;

        if (adminIds.includes(credentials.telegramId)) {
          const code = await generateCode();
          await createAuthRequest(user.id, code);
        }

        return {
          id: user.id,
          name: user.telegramId,
          telegramId: user.telegramId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.telegramId = user.telegramId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.telegramId = token.telegramId as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);