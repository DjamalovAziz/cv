import { type NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            fields: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio GET error:", error);
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
    const { displayName, title, bio, avatar, isPublic } = body;

    let portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
    });

    if (portfolio) {
      portfolio = await db.portfolio.update({
        where: { id: portfolio.id },
        data: {
          displayName: displayName ?? portfolio.displayName,
          title: title ?? portfolio.title,
          bio: bio ?? portfolio.bio,
          avatar: avatar ?? portfolio.avatar,
          isPublic: isPublic ?? portfolio.isPublic,
        },
      });
    } else {
      portfolio = await db.portfolio.create({
        data: {
          username: session.user.username,
          displayName: displayName || session.user.username,
          title,
          bio,
          avatar,
          isPublic: isPublic ?? true,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Portfolio POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}