import { type NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXTAUTH_URL || "https://your-domain.com";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/api/sitemap.xml`;

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}