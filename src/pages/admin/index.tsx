import { type GetServerSideProps } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ProfileFormData {
  name: string;
  title?: string;
  bio?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  location?: string;
}

  interface ProjectFormData {
    title: string;
    description?: string;
    url?: string;
    repoUrl?: string;
    image?: string;
    tags: string;
    userRole?: string;
    isFeatured: boolean;
  }

interface SkillFormData {
  name: string;
  category: string;
}

interface ExperienceFormData {
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export default function AdminDashboard({
  initialProfile,
  initialProjects,
  initialSkills,
  initialExperience,
}: {
  initialProfile?: any;
  initialProjects: any[];
  initialSkills: any[];
  initialExperience: any[];
}) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "skills" | "experience">("profile");
  const [projects, setProjects] = useState(initialProjects);
  const [skills, setSkills] = useState(initialSkills);
  const [experience, setExperience] = useState(initialExperience);

  const profileForm = useForm<ProfileFormData>({ defaultValues: initialProfile });
  const projectForm = useForm<ProjectFormData>({ defaultValues: { tags: "", isFeatured: false, description: "", userRole: "" } });
  const skillForm = useForm<SkillFormData>({ defaultValues: { category: "Technical" } });
  const experienceForm = useForm<ExperienceFormData>({ defaultValues: { isCurrent: false } });

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access admin panel.</p>
      </div>
    );
  }

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Profile saved successfully!");
      } else {
        const error = await res.json();
        console.error("Profile error:", error);
        alert("Failed to save profile: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Profile submit error:", err);
      alert("Failed to save profile");
    }
  };

  const handleProjectSubmit = async (data: ProjectFormData) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]);
        projectForm.reset({ tags: "", isFeatured: false });
      } else {
        const error = await res.json();
        console.error("Project error:", error);
        alert("Failed to add project: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Project submit error:", err);
      alert("Failed to add project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleSkillSubmit = async (data: SkillFormData) => {
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newSkill = await res.json();
        setSkills([...skills, newSkill]);
        skillForm.reset({ category: "Technical" });
      } else {
        const error = await res.json();
        console.error("Skill error:", error);
        alert("Failed to add skill: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Skill submit error:", err);
      alert("Failed to add skill");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
    setSkills(skills.filter((s) => s.id !== id));
  };

  const handleExperienceSubmit = async (data: ExperienceFormData) => {
    try {
      const res = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        }),
      });
      if (res.ok) {
        const newExp = await res.json();
        setExperience([...experience, newExp]);
        experienceForm.reset({ isCurrent: false });
      } else {
        const error = await res.json();
        console.error("Experience error:", error);
        alert("Failed to add experience: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Experience submit error:", err);
      alert("Failed to add experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    await fetch(`/api/experience?id=${id}`, { method: "DELETE" });
    setExperience(experience.filter((e) => e.id !== id));
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="border-b border-gray-800 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </header>

        <div className="flex">
          <nav className="w-48 border-r border-gray-800 p-4">
            {(["profile", "projects", "skills", "experience"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`block w-full text-left px-4 py-2 rounded mb-2 transition-colors ${
                  activeTab === tab ? "bg-blue-600" : "hover:bg-gray-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <main className="flex-1 p-8">
            {activeTab === "profile" && (
              <form
                onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                className="max-w-xl space-y-4"
              >
                <div>
                  <label className="block text-sm mb-2">Name</label>
                  <input
                    {...profileForm.register("name")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Title</label>
                  <input
                    {...profileForm.register("title")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Bio</label>
                  <textarea
                    {...profileForm.register("bio")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    {...profileForm.register("email")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">GitHub</label>
                  <input
                    type="url"
                    {...profileForm.register("github")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">LinkedIn</label>
                  <input
                    type="url"
                    {...profileForm.register("linkedin")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Location</label>
                  <input
                    {...profileForm.register("location")}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Profile
                </button>
              </form>
            )}

            {activeTab === "projects" && (
              <div className="space-y-8">
                <form
                  onSubmit={projectForm.handleSubmit(handleProjectSubmit)}
                  className="max-w-xl space-y-4 p-4 border border-gray-800 rounded"
                >
                  <h3 className="font-bold mb-4">Add Project</h3>
                  <div>
                    <label className="block text-sm mb-2">Title</label>
                    <input
                      {...projectForm.register("title")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                      required
                    />
                  </div>
                   <div>
                     <label className="block text-sm mb-2">Description</label>
                     <textarea
                       {...projectForm.register("description")}
                       rows={4}
                       className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded resize-y min-h-[100px]"
                     />
                   </div>
                  <div>
                    <label className="block text-sm mb-2">URL</label>
                    <input
                      type="url"
                      {...projectForm.register("url")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Repository URL</label>
                    <input
                      type="url"
                      {...projectForm.register("repoUrl")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Image URL</label>
                    <input
                      type="url"
                      {...projectForm.register("image")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    />
                  </div>
                   <div>
                     <label className="block text-sm mb-2">Tags (comma separated)</label>
                     <input
                       {...projectForm.register("tags")}
                       placeholder="react,typescript,nextjs"
                       className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                     />
                   </div>
                   <div>
                     <label className="block text-sm mb-2">Your Role in this Project</label>
                     <input
                       {...projectForm.register("userRole")}
                       placeholder="e.g., Frontend Developer, Project Manager, Architect"
                       className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                     />
                   </div>
                   <div>
                     <label className="block text-sm mb-2">
                       <input type="checkbox" {...projectForm.register("isFeatured")} className="mr-2" />
                       Featured
                     </label>
                   </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Project
                  </button>
                </form>

                 <div className="space-y-2">
                   {projects.map((project) => (
                     <div
                       key={project.id}
                       className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded"
                     >
                       <div>
                         <span className="font-medium">{project.title}</span>
                         {project.userRole && (
                           <span className="ml-3 text-sm text-gray-500">({project.userRole})</span>
                         )}
                       </div>
                       <button
                         onClick={() => handleDeleteProject(project.id)}
                        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-8">
                <form
                  onSubmit={skillForm.handleSubmit(handleSkillSubmit)}
                  className="max-w-xl space-y-4 p-4 border border-gray-800 rounded"
                >
                  <h3 className="font-bold mb-4">Add Skill</h3>
                  <div>
                    <label className="block text-sm mb-2">Name</label>
                    <input
                      {...skillForm.register("name")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Category</label>
                    <select
                      {...skillForm.register("category")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Tools">Tools</option>
                      <option value="Soft Skills">Soft Skills</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Skill
                  </button>
                </form>

                 <div className="space-y-2">
                   {projects.map((project) => (
                     <div
                       key={project.id}
                       className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded"
                     >
                       <div>
                         <span className="font-medium">{project.title}</span>
                         {project.userRole && (
                           <span className="ml-3 text-sm text-gray-500">({project.userRole})</span>
                         )}
                       </div>
                       <button
                         onClick={() => handleDeleteProject(project.id)}
                         className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                       >
                         Delete
                       </button>
                     </div>
                   ))}
                 </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-8">
                <form
                  onSubmit={experienceForm.handleSubmit(handleExperienceSubmit)}
                  className="max-w-xl space-y-4 p-4 border border-gray-800 rounded"
                >
                  <h3 className="font-bold mb-4">Add Experience</h3>
                  <div>
                    <label className="block text-sm mb-2">Company</label>
                    <input
                      {...experienceForm.register("company")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Position</label>
                    <input
                      {...experienceForm.register("position")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Description</label>
                    <textarea
                      {...experienceForm.register("description")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Start Date</label>
                    <input
                      type="date"
                      {...experienceForm.register("startDate")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">End Date</label>
                    <input
                      type="date"
                      {...experienceForm.register("endDate")}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">
                      <input type="checkbox" {...experienceForm.register("isCurrent")} className="mr-2" />
                      Currently Working
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Experience
                  </button>
                </form>

                <div className="space-y-2">
                  {experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded"
                    >
                      <span>{exp.position} at {exp.company}</span>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { db } = await import("~/server/db");

  const profile = await db.profile.findFirst();
  const projects = await db.project.findMany({ orderBy: { sortOrder: "asc" } });
  const skills = await db.skill.findMany({ orderBy: { sortOrder: "asc" } });
  const experience = await db.experience.findMany({ orderBy: { sortOrder: "asc" } });

  return {
    props: {
      initialProfile: profile,
      initialProjects: projects,
      initialSkills: skills,
      initialExperience: experience,
    },
  };
};