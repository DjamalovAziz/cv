import { type GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { db } from "~/server/db";

interface PublicPortfolio {
  id: string;
  username: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  viewCount: number;
}

export default function Browse({
  portfolios,
}: {
  portfolios: PublicPortfolio[];
}) {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>Browse CVs | Portfolio Platform</title>
        <meta
          name="description"
          content="Browse public portfolios from developers"
        />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold">Browse Portfolios</h1>
            <p className="text-gray-600 mt-2">
              Discover talented developers and their work
            </p>
          </header>

          {session ? (
            <div className="text-center mb-8">
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="text-center mb-8">
              <button
                onClick={() => signIn("credentials")}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign In
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                href={`/${portfolio.username}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
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
                {portfolio.title && (
                  <p className="text-gray-600 text-center mt-1">{portfolio.title}</p>
                )}
                {portfolio.bio && (
                  <p className="text-gray-700 mt-3 line-clamp-3">{portfolio.bio}</p>
                )}
                <div className="mt-4 text-center text-sm text-gray-500">
                  {portfolio.viewCount} views
                </div>
              </Link>
            ))}
          </div>

          {portfolios.length === 0 && (
            <p className="text-center text-gray-500">
              No public portfolios yet.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const portfolios = await db.portfolio.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      username: true,
      displayName: true,
      title: true,
      bio: true,
      avatar: true,
      viewCount: true,
    },
    orderBy: { viewCount: "desc" },
    take: 50,
  });

  return {
    props: {
      portfolios,
    },
  };
};