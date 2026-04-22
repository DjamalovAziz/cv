import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import {
  rateLimit,
  setPendingReg,
  setCode,
  deleteCode,
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
    subject: "Your verification code",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Your code for registration:</p>
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

  try {
    if (!(await isRedisAvailable())) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, username, password, confirmPassword, email, method, code, pendingId } = body;

    if (action === "init") {
      const isLimited = await rateLimit(ip, username || email || "unknown");
      if (!isLimited) {
        return NextResponse.json(
          { error: "Too many requests. Please wait 60 seconds." },
          { status: 429 }
        );
      }

      if (!username || !password || !confirmPassword || !method) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: "Passwords don't match" },
          { status: 400 }
        );
      }

      if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters with letters and numbers" },
          { status: 400 }
        );
      }

      const existingUser = await db.user.findUnique({ where: { username } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const verificationCode = generateCode();

      const pendingData = {
        username,
        passwordHash,
        email: method === "email" ? email : undefined,
        telegramChatId: method === "telegram" ? email : undefined,
        method,
      };

      await setPendingReg(userId, pendingData);
      await setCode(userId, verificationCode);

      if (method === "email" && email) {
        sendEmailCode(email, verificationCode).catch((err) => {
          console.error("[SECURITY] Email send failed:", err);
        });
      }

      return NextResponse.json({
        pendingId: userId,
        status: "pending",
        expiresIn: 900,
        method,
      });
    }

    if (action === "verify") {
      if (!pendingId || !code) {
        return NextResponse.json(
          { error: "Pending ID and code required" },
          { status: 400 }
        );
      }

      const storedCode = await db.user.findUnique({
        where: { username: pendingId },
      });

      const redisCode = await new Promise<string | null>(async (resolve) => {
        try {
          const { getCode } = await import("~/server/redis");
          resolve(await getCode(pendingId));
        } catch {
          resolve(null);
        }
      });

      if (!redisCode || redisCode !== code) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      const { getPendingReg, deletePendingReg } = await import("~/server/redis");
      const pendingData = await getPendingReg(pendingId);

      if (!pendingData) {
        return NextResponse.json(
          { error: "Session expired. Please register again." },
          { status: 400 }
        );
      }

      const user = await db.user.create({
        data: {
          username: pendingData.username,
          password: pendingData.passwordHash,
          email: pendingData.email,
          telegramId: pendingData.telegramChatId,
          isVerified: true,
        },
      });

      await db.portfolio.create({
        data: {
          username: user.username,
          displayName: user.username,
          userId: user.id,
        },
      });

      await deletePendingReg(pendingId);

      return NextResponse.json({
        success: true,
        username: user.username,
      });
    }

    if (action === "resend") {
      if (!pendingId) {
        return NextResponse.json(
          { error: "Pending ID required" },
          { status: 400 }
        );
      }

      const isLimited = await rateLimit(ip, pendingId);
      if (!isLimited) {
        return NextResponse.json(
          { error: "Too many requests. Please wait 60 seconds." },
          { status: 429 }
        );
      }

      const { getPendingReg, setCode } = await import("~/server/redis");
      const pendingData = await getPendingReg(pendingId);

      if (!pendingData) {
        return NextResponse.json(
          { error: "Session expired. Please register again." },
          { status: 400 }
        );
      }

      await deleteCode(pendingId);
      const newCode = generateCode();
      await setCode(pendingId, newCode);

      if (pendingData.method === "email" && pendingData.email) {
        sendEmailCode(pendingData.email, newCode).catch((err) => {
          console.error("[SECURITY] Email resend failed:", err);
        });
      }

      return NextResponse.json({
        success: true,
        expiresIn: 300,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}