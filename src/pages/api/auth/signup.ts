import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  console.log("[SIGNUP] Starting signup process...");
  
  try {
    const body = await request.json();
    console.log("[SIGNUP] Body parsed:", JSON.stringify(body));
    
    const { action, username, password, confirmPassword, code, pendingId } = body;

    if (action === "init") {
      console.log("[SIGNUP] Action: init");
      
      if (!username || !password || !confirmPassword) {
        console.log("[SIGNUP] Error: All fields required");
        return NextResponse.json({ error: "All fields required" }, { status: 400 });
      }

      if (password !== confirmPassword) {
        console.log("[SIGNUP] Error: Passwords don't match");
        return NextResponse.json({ error: "Passwords don't match" }, { status: 400 });
      }

      if (password.length < 8) {
        console.log("[SIGNUP] Error: Password too short");
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }

      console.log("[SIGNUP] Checking existing user:", username);
      const existingUser = await db.user.findUnique({ where: { username } });
      
      if (existingUser) {
        console.log("[SIGNUP] Error: Username taken");
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      console.log("[SIGNUP] Hashing password...");
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationCode = generateCode();
      const tempId = uuidv4();

      console.log("[SIGNUP] Creating user with tempId:", tempId);
      
      const user = await db.user.create({
        data: {
          id: tempId,
          username,
          password: passwordHash,
          verificationToken: verificationCode,
          verificationStatus: "PENDING",
        },
      });

      console.log("[SIGNUP] User created:", user.id);

      return NextResponse.json({
        pendingId: tempId,
        status: "pending",
        code: verificationCode,
      });
    }

    if (action === "verify") {
      console.log("[SIGNUP] Action: verify");
      
      if (!pendingId || !code) {
        console.log("[SIGNUP] Error: Pending ID and code required");
        return NextResponse.json({ error: "Pending ID and code required" }, { status: 400 });
      }

      console.log("[SIGNUP] Finding user with pendingId:", pendingId);
      const user = await db.user.findFirst({
        where: { id: pendingId, verificationStatus: "PENDING" },
      });

      if (!user) {
        console.log("[SIGNUP] Error: User not found or already verified");
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      }

      console.log("[SIGNUP] Comparing code:", code, "vs stored:", user.verificationToken);
      
      if (user.verificationToken !== code) {
        console.log("[SIGNUP] Error: Code mismatch");
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      }

      console.log("[SIGNUP] Updating user to verified...");
      await db.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: "VERIFIED",
          verificationToken: null,
          isVerified: true,
        },
      });

      console.log("[SIGNUP] Creating portfolio...");
      await db.portfolio.create({
        data: {
          username: user.username,
          displayName: user.username,
          userId: user.id,
        },
      });

      console.log("[SIGNUP] Success!");
      return NextResponse.json({ success: true, username: user.username });
    }

    if (action === "resend") {
      console.log("[SIGNUP] Action: resend");
      
      if (!pendingId) {
        return NextResponse.json({ error: "Pending ID required" }, { status: 400 });
      }

      const user = await db.user.findFirst({
        where: { id: pendingId, verificationStatus: "PENDING" },
      });

      if (!user) {
        return NextResponse.json({ error: "Session expired" }, { status: 400 });
      }

      const newCode = generateCode();
      await db.user.update({
        where: { id: user.id },
        data: { verificationToken: newCode },
      });

      return NextResponse.json({ success: true, code: newCode });
    }

    console.log("[SIGNUP] Error: Invalid action");
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[SIGNUP] FATAL ERROR:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}