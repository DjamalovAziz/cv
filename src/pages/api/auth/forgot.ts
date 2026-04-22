import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import {
  rateLimit,
  setCode,
  isRedisAvailable,
} from "~/server/redis";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendEmailCode(email: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Portfolio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Code",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Your reset code:</p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; padding: 20px; background: #f5f5f5; text-align: center;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px;">This code expires in 5 minutes.</p>
      </div>
    `,
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    if (!(await isRedisAvailable())) {
      return NextResponse.json(
        { message: "If the account exists and has an active contact, instructions have been sent." },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { action, username, code, newPassword, confirmPassword, method, pendingId } = body;

    if (action === "request") {
      const isLimited = await rateLimit(ip, username || "unknown");
      if (!isLimited) {
        return NextResponse.json(
          { message: "If the account exists and has an active contact, instructions have been sent." },
          { status: 200 }
        );
      }

      if (!username) {
        return NextResponse.json(
          { message: "If the account exists and has an active contact, instructions have been sent." },
          { status: 200 }
        );
      }

      const user = await db.user.findUnique({
        where: { username },
      });

      if (!user) {
        console.log(`[SECURITY] Password reset attempt for non-existent user: ${username}`);
        return NextResponse.json(
          { message: "If the account exists and has an active contact, instructions have been sent." },
          { status: 200 }
        );
      }

      const userId = uuidv4();
      const resetCode = generateCode();
      await setCode(`reset:${userId}`, resetCode);

      if (user.email) {
        sendEmailCode(user.email, resetCode).catch((err) => {
          console.error("[SECURITY] Password reset email failed:", err);
        });
      }

      return NextResponse.json({
        pendingId: userId,
        method: user.email ? "email" : "telegram",
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

      const storedCode = await new Promise<string | null>(async () => {
        try {
          const { getCode } = await import("~/server/redis");
          return await getCode(`reset:${pendingId}`);
        } catch {
          return null;
        }
      });

      if (!storedCode || storedCode !== code) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const user = await db.user.findFirst({
        where: {
          OR: [
            { username: pendingId },
            { email: pendingId },
          ],
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
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
      { message: "If the account exists and has an active contact, instructions have been sent." },
      { status: 200 }
    );
  }
}