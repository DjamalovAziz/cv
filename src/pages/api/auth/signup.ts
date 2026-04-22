import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const SignupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  password: z.string().min(6),
  displayName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SignupSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await db.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: "USER",
      },
    });

    await db.portfolio.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      username: user.username,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}