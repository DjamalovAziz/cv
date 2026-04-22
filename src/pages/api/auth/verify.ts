import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, telegramId, action } = body;

    if (action === "verify") {
      if (!token) {
        return NextResponse.json(
          { error: "Токен верификации обязателен" },
          { status: 400 }
        );
      }

      const user = await db.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Неверный токен верификации" },
          { status: 404 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: "VERIFIED",
          verificationToken: null,
          telegramId: telegramId || user.telegramId,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "generate_token") {
      const { username } = body;

      if (!username) {
        return NextResponse.json(
          { error: "Имя пользователя обязательно" },
          { status: 400 }
        );
      }

      const crypto = await import("crypto");
      const newToken = crypto.randomBytes(32).toString("hex");

      const user = await db.user.update({
        where: { username },
        data: {
          verificationToken: newToken,
          verificationStatus: "PENDING",
        },
      });

      return NextResponse.json({
        token: newToken,
        verificationUrl: `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${newToken}`,
      });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("Verification API error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
  }

  const user = await db.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/?error=invalid_token", process.env.NEXTAUTH_URL));
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      verificationStatus: "VERIFIED",
      verificationToken: null,
    },
  });

  return NextResponse.redirect(new URL("/auth/signin?verified=true", process.env.NEXTAUTH_URL));
}