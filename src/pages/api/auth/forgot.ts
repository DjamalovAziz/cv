import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const body = await request.json();
    const { action, username, code, newPassword, confirmPassword, pendingId } = body;

    if (action === "request") {
      if (!username) {
        return NextResponse.json(
          { message: "If the account exists, instructions have been sent." },
          { status: 200 }
        );
      }

      const user = await db.user.findUnique({
        where: { username },
      });

      if (!user) {
        return NextResponse.json(
          { message: "If the account exists, instructions have been sent." },
          { status: 200 }
        );
      }

      const tempId = uuidv4();
      const resetCode = generateCode();

      await db.user.update({
        where: { id: user.id },
        data: {
          verificationToken: resetCode,
          verificationStatus: "PENDING",
        },
      });

      return NextResponse.json({
        pendingId: tempId,
        method: user.telegramId ? "telegram" : "email",
      });
    }

    if (action === "verify") {
      if (!pendingId || !code || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "All fields required" },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "Passwords don't match" },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const user = await db.user.findFirst({
        where: {
          verificationToken: code,
          verificationStatus: "PENDING",
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          verificationToken: null,
          verificationStatus: "VERIFIED",
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated. Please sign in.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "If the account exists, instructions have been sent." },
      { status: 200 }
    );
  }
}