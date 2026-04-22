import { type NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";

const SectionSchema = z.object({
  title: z.string().min(1),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const FieldSchema = z.object({
  name: z.string().min(1),
  value: z.string().optional(),
  type: z.enum(["TEXT", "IMAGE", "URL"]).optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const sections = await db.section.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { sortOrder: "asc" },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Sections GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = SectionSchema.parse(body);

    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const maxOrder = await db.section.aggregate({
      where: { portfolioId: portfolio.id },
      _max: { sortOrder: true },
    });

    const section = await db.section.create({
      data: {
        ...data,
        sortOrder: data.sortOrder ?? ((maxOrder._max?.sortOrder ?? -1) + 1),
        portfolioId: portfolio.id,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Sections POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    const section = await db.section.update({
      where: { id },
      data,
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Sections PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    await db.section.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sections DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}