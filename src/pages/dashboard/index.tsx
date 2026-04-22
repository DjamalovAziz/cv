import { type GetServerSideProps, type GetServerSidePropsContext } from "next";
import { useSession, signOut } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { db } from "~/server/db";
import { getServerAuthSession } from "~/server/auth";

interface Section {
  id: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
}

interface Field {
  id: string;
  name: string;
  value: string | null;
  type: string;
  sortOrder: number;
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
  sections: (Section & { fields: Field[] })[];
}

export default function Dashboard({
  portfolio,
  session,
}: {
  portfolio: PortfolioData | null;
  session: any;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "sections" | "preview">("profile");
  const [profile, setProfile] = useState({
    displayName: portfolio?.displayName || session?.user?.username || "",
    title: portfolio?.title || "",
    bio: portfolio?.bio || "",
    avatar: portfolio?.avatar || "",
    isPublic: portfolio?.isPublic ?? true,
  });

  const handleSaveProfile = async () => {
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
    } catch (err) {
      console.error("Failed to save profile");
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | Portfolio Builder</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Portfolio Dashboard</h1>
            <div className="flex items-center gap-4">
              {portfolio && (
                <Link
                  href={`/${session?.user?.username}`}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View CV ({portfolio.viewCount} views)
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-4 mb-8 border-b">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium ${
                activeTab === "profile"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("sections")}
              className={`px-4 py-2 font-medium ${
                activeTab === "sections"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 font-medium ${
                activeTab === "preview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Preview
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Avatar URL</label>
                  <input
                    type="text"
                    value={profile.avatar}
                    onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={profile.isPublic}
                    onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic">Public CV</label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Sections</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Section
                </button>
              </div>
              <div className="space-y-4">
                {portfolio?.sections.map((section) => (
                  <div
                    key={section.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{section.title}</h3>
                      <p className="text-sm text-gray-500">
                        {section.fields.length} fields
                      </p>
                    </div>
                    <button className="text-blue-600 hover:underline">
                      Edit
                    </button>
                  </div>
                ))}
                {(!portfolio?.sections || portfolio.sections.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    No sections yet. Click "Add Section" to get started.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="border rounded-lg p-8">
                {portfolio ? (
                  <div>
                    <h1 className="text-2xl font-bold">{portfolio.displayName}</h1>
                    {portfolio.title && (
                      <p className="text-gray-600 mt-2">{portfolio.title}</p>
                    )}
                    {portfolio.bio && (
                      <p className="mt-4">{portfolio.bio}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No portfolio created yet. Fill out your profile first.
                  </p>
                )}
              </div>
              {portfolio && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/${session?.user?.username}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Open Public CV →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
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

  return {
    props: {
      portfolio,
      session: {
        user: session.user,
      },
    },
  };
};