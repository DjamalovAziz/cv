import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    const body = await request.json();
    const { action, username, password, confirmPassword, code, pendingId } = body;

    if (action === "init") {
      if (!username || !password || !confirmPassword) {
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

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
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
      const verificationCode = generateCode();
      const tempId = uuidv4();

      await db.user.create({
        data: {
          id: tempId,
          username,
          password: passwordHash,
          verificationToken: verificationCode,
          verificationStatus: "PENDING",
        },
      });

      return NextResponse.json({
        pendingId: tempId,
        status: "pending",
        expiresIn: 900,
        method: "telegram",
      });
    }

    if (action === "verify") {
      if (!pendingId || !code) {
        return NextResponse.json(
          { error: "Pending ID and code required" },
          { status: 400 }
        );
      }

      const user = await db.user.findFirst({
        where: {
          id: pendingId,
          verificationStatus: "PENDING",
        },
      });

      if (!user || user.verificationToken !== code) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: "VERIFIED",
          verificationToken: null,
          isVerified: true,
        },
      });

      const portfolio = await db.portfolio.findUnique({
        where: { userId: user.id },
      });

      if (!portfolio) {
        await db.portfolio.create({
          data: {
            username: user.username,
            displayName: user.username,
            userId: user.id,
          },
        });
      }

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

      const user = await db.user.findFirst({
        where: {
          id: pendingId,
          verificationStatus: "PENDING",
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Session expired. Please register again." },
          { status: 400 }
        );
      }

      const newCode = generateCode();
      await db.user.update({
        where: { id: user.id },
        data: { verificationToken: newCode },
      });

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