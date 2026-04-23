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
  verificationMethod: string;
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

  // Modal state for field editing
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    value: "",
    type: "TEXT" as "TEXT" | "IMAGE" | "URL",
    verificationMethod: "NONE" as "NONE" | "EMAIL" | "TELEGRAM",
    sortOrder: 0,
  });
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

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

  const openFieldModal = (sectionId: string, field?: Field) => {
    setCurrentSectionId(sectionId);
    if (field) {
      setEditingField(field);
      setFieldForm({
        name: field.name,
        value: field.value || "",
        type: field.type as "TEXT" | "IMAGE" | "URL",
        verificationMethod: (field.verificationMethod as "NONE" | "EMAIL" | "TELEGRAM") || "NONE",
        sortOrder: field.sortOrder,
      });
    } else {
      setEditingField(null);
      setFieldForm({
        name: "",
        value: "",
        type: "TEXT",
        verificationMethod: "NONE",
        sortOrder: 0,
      });
    }
    setIsFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setIsFieldModalOpen(false);
    setEditingField(null);
  };

  const handleSaveField = async () => {
    try {
      if (!currentSectionId) return;

      // If creating new field, calculate sortOrder
      let finalSortOrder = fieldForm.sortOrder;
      if (!editingField) {
        const maxOrder = Math.max(...portfolio?.sections
          .find(s => s.id === currentSectionId)?.fields.map(f => f.sortOrder) || [-1]);
        finalSortOrder = maxOrder + 1;
      }

      const body = editingField
        ? { id: editingField.id, ...fieldForm, sortOrder: fieldForm.sortOrder }
        : { ...fieldForm, sectionId: currentSectionId, sortOrder: finalSortOrder };

      await fetch("/api/fields", {
        method: editingField ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      closeFieldModal();
      window.location.reload();
    } catch (err) {
      console.error("Failed to save field");
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
              <div className="space-y-6">
                {portfolio?.sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-lg">{section.title}</h3>
                      <button className="text-blue-600 hover:underline">
                        Edit Section
                      </button>
                    </div>
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div>
                            <p className="font-medium">{field.name}</p>
                            <p className="text-sm text-gray-500">
                              Type: {field.type} | Verification: {field.verificationMethod}
                            </p>
                          </div>
                          <button
                            onClick={() => openFieldModal(section.id, field)}
                            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => openFieldModal(section.id)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500"
                      >
                        + Add Field
                      </button>
                    </div>
                  </div>
                ))}
                {(!portfolio?.sections || portfolio.sections.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    No sections yet. Click &quot;Add Section&quot; to get started.
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

      {/* Modal for field editing */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingField ? "Edit Field" : "Add Field"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field Name</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <textarea
                  value={fieldForm.value}
                  onChange={(e) => setFieldForm({ ...fieldForm, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field Type</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image URL</option>
                  <option value="URL">URL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Validation Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="NONE"
                      checked={fieldForm.verificationMethod === "NONE"}
                      onChange={() => setFieldForm({ ...fieldForm, verificationMethod: "NONE" })}
                    />
                    None
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="EMAIL"
                      checked={fieldForm.verificationMethod === "EMAIL"}
                      onChange={() => setFieldForm({ ...fieldForm, verificationMethod: "EMAIL" })}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="TELEGRAM"
                      checked={fieldForm.verificationMethod === "TELEGRAM"}
                      onChange={() => setFieldForm({ ...fieldForm, verificationMethod: "TELEGRAM" })}
                    />
                    Telegram
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input
                  type="number"
                  value={fieldForm.sortOrder}
                  onChange={(e) => setFieldForm({ ...fieldForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveField}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingField ? "Update" : "Create"}
              </button>
              <button
                onClick={closeFieldModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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