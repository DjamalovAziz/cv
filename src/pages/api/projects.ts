import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");

  const where = tag
    ? { tags: { has: tag }, isFeatured: true }
    : { isFeatured: true };

  const projects = await db.project.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const project = await db.project.create({
    data: {
      ...data,
      tags: data.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    },
  });

  return NextResponse.json(project);
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

  await db.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

const handler = { GET, POST, DELETE };
export default handler;