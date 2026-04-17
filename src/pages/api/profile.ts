import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await db.profile.findFirst({
    where: { isVisible: true },
  });

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const userId = session.user.id;

  const profile = await db.profile.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId },
  });

  return NextResponse.json(profile);
}

export default function handler() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}