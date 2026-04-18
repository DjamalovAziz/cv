import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Project GET error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch projects", message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const tags = typeof data.tags === "string"
      ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(data.tags) ? data.tags : [];

    const project = await db.project.create({
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url || null,
        repoUrl: data.repoUrl || null,
        image: data.image || null,
        tags,
        userRole: data.userRole || null,
        isFeatured: data.isFeatured || false,
        sortOrder: data.sortOrder || 0,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "Failed to create project",
      message,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Project DELETE error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete project", message }, { status: 500 });
  }
}

const handler = { GET, POST, DELETE };
export default handler;