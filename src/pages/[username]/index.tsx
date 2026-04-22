import { type GetServerSideProps, type GetServerSidePropsContext } from "next";
import Head from "next/head";
import { notFound } from "next/navigation";
import { db } from "~/server/db";

interface Field {
  id: string;
  name: string;
  value: string | null;
  type: string;
  sortOrder: number;
}

interface Section {
  id: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
  fields: Field[];
}

interface PortfolioData {
  id: string;
  username: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  isPublic: boolean;
  viewCount: number;
  sections: Section[];
}

export default function PublicCV({ portfolio }: { portfolio: PortfolioData }) {
  if (!portfolio) {
    return notFound();
  }

  return (
    <>
      <Head>
        <title>{portfolio.displayName} | {portfolio.title || "Portfolio"}</title>
        <meta name="description" content={portfolio.bio || `${portfolio.displayName}'s portfolio`} />
        <meta property="og:title" content={`${portfolio.displayName} | Portfolio`} />
        <meta property="og:description" content={portfolio.bio || `${portfolio.displayName}'s portfolio`} />
        <meta property="og:image" content={portfolio.avatar || "/og-image.png"} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <header className="text-center mb-12">
            {portfolio.avatar && (
              <img
                src={portfolio.avatar}
                alt={portfolio.displayName}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
            )}
            <h1 className="text-4xl font-bold">{portfolio.displayName}</h1>
            {portfolio.title && (
              <p className="text-xl text-gray-600 mt-2">{portfolio.title}</p>
            )}
            {portfolio.bio && (
              <p className="mt-4 text-gray-700 max-w-2xl mx-auto">{portfolio.bio}</p>
            )}
          </header>

          <div className="space-y-8">
            {portfolio.sections
              .filter((s) => s.isVisible)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => (
                <section
                  key={section.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                  <div className="space-y-4">
                    {section.fields
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((field) => (
                        <div key={field.id}>
                          {field.type === "IMAGE" && field.value ? (
                            <img
                              src={field.value}
                              alt={field.name}
                              className="w-full rounded-lg"
                            />
                          ) : field.type === "URL" ? (
                            <a
                              href={field.value || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {field.name}
                            </a>
                          ) : (
                            <div>
                              <h3 className="font-medium text-sm text-gray-500">
                                {field.name}
                              </h3>
                              <p className="mt-1">{field.value}</p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              ))}
          </div>

          <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>{portfolio.viewCount} views</p>
          </footer>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { username } = context.params || {};

  if (!username || typeof username !== "string") {
    return {
      notFound: true,
    };
  }

  const portfolio = await db.portfolio.findUnique({
    where: { username },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
          fields: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!portfolio || !portfolio.isPublic) {
    return {
      notFound: true,
    };
  }

  await db.portfolio.update({
    where: { id: portfolio.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    props: {
      portfolio: {
        ...portfolio,
        sections: portfolio.sections.map((s) => ({
          ...s,
          fields: s.fields.map((f) => ({
            ...f,
            type: f.type as string,
          })),
        })),
      },
    },
  };
}