import { type GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { db } from "~/server/db";

interface PublicPortfolio {
  id: string;
  username: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  viewCount: number;
  createdAt: string;
}

export default function Browse({
  portfolios,
  total,
  page,
}: {
  portfolios: PublicPortfolio[];
  total: number;
  page: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("");

  const totalPages = Math.ceil(total / 10);

  return (
    <>
      <Head>
        <title>Portfolio Platform</title>
        <meta name="description" content="Browse portfolios" />
      </Head>

      <main className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text">Portfolio Platform</h1>
            <p className="text-gray-400 mt-2">Discover developers and their work</p>
          </header>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
            <div className="flex gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => signIn("credentials")}
                  className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search..."
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios
              .filter(p => 
                !filter || 
                p.displayName.toLowerCase().includes(filter.toLowerCase()) ||
                p.username.toLowerCase().includes(filter.toLowerCase()) ||
                p.title?.toLowerCase().includes(filter.toLowerCase())
              )
              .map((portfolio) => (
              <Link
                key={portfolio.id}
                href={`/${portfolio.username}`}
                className="block bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors p-6"
              >
                {portfolio.avatar && (
                  <img
                    src={portfolio.avatar}
                    alt={portfolio.displayName}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                )}
                <h2 className="text-xl font-semibold text-center">
                  {portfolio.displayName}
                </h2>
                <p className="text-gray-400 text-center text-sm">@{portfolio.username}</p>
                {portfolio.title && (
                  <p className="text-gray-300 text-center mt-1">{portfolio.title}</p>
                )}
                {portfolio.bio && (
                  <p className="text-gray-400 mt-3 line-clamp-3 text-sm">{portfolio.bio}</p>
                )}
                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <span>{portfolio.viewCount} views</span>
                  <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {portfolios.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              No portfolios yet. Be the first to create one!
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/?page=${page - 1}`}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  ← Prev
                </Link>
              )}
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/?page=${page + 1}`}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = parseInt(context.query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const [portfolios, total] = await Promise.all([
    db.portfolio.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        username: true,
        displayName: true,
        title: true,
        bio: true,
        avatar: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.portfolio.count({
      where: { isPublic: true },
    }),
  ]);

  return {
    props: {
      portfolios: portfolios.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
    },
  };
};