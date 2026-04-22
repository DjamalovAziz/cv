import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const SignupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  password: z.string().min(6),
  confirmPassword: z.string(),
  displayName: z.string().min(1),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, displayName } = body;
    
    const validated = SignupSchema.parse({ username, password, confirmPassword: body.confirmPassword, displayName });

    const existingUser = await db.user.findUnique({
      where: { username: validated.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await db.user.create({
      data: {
        username: validated.username,
        password: hashedPassword,
        role: "USER",
      },
    });

    await db.portfolio.create({
      data: {
        username: validated.username,
        displayName: validated.displayName,
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