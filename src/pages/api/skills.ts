import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

export async function GET() {
  const skills = await db.skill.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(skills);
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const skill = await db.skill.create({ data });

  return NextResponse.json(skill);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.skill.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

export default { GET, POST, DELETE };