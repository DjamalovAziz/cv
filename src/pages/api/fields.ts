import { type NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";

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

    const { sectionId } = await request.json();

    const fields = await db.field.findMany({
      where: { sectionId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Fields GET error:", error);
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
    const data = FieldSchema.parse(body);
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId required" }, { status: 400 });
    }

    const maxOrder = await db.field.aggregate({
      where: { sectionId },
      _max: { sortOrder: true },
    });

    const field = await db.field.create({
      data: {
        ...data,
        type: data.type ?? "TEXT",
        sortOrder: data.sortOrder ?? ((maxOrder._max?.sortOrder ?? -1) + 1),
        sectionId,
      },
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Fields POST error:", error);
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

    const field = await db.field.update({
      where: { id },
      data,
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Fields PUT error:", error);
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

    await db.field.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fields DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fields, sectionId } = body;

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid fields array" }, { status: 400 });
    }

    for (let i = 0; i < fields.length; i++) {
      await db.field.update({
        where: { id: fields[i].id },
        data: { sortOrder: i },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fields reorder error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}