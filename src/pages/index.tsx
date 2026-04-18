import { type GetServerSideProps } from "next";
import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import { Hero } from "~/components/Hero";
import { ProjectsGrid } from "~/components/ProjectsGrid";
import { Timeline } from "~/components/Timeline";
import { Skills } from "~/components/Skills";
import { db } from "~/server/db";

interface Profile {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  github: string | null;
  linkedin: string | null;
  location: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  repoUrl: string | null;
  image: string | null;
  tags: string[];
  userRole: string | null;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string | null;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}

export default function Home({
  profile,
  projects,
  skills,
  experience,
  education,
}: {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
  experience: Experience[];
  education: Experience[];
}) {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>{profile?.name || "Portfolio"} | {profile?.title || "Developer"}</title>
        <meta name="description" content={profile?.bio || "Full Stack Developer Portfolio"} />
        <meta property="og:title" content={profile?.name || "Portfolio"} />
        <meta property="og:description" content={profile?.bio || "Full Stack Developer Portfolio"} />
        <meta property="og:image" content={profile?.avatar || "/og-image.png"} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen grid-bg">
        <Hero profile={profile} />

        <section id="projects" className="py-20 px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 gradient-text">Projects</h2>
          <ProjectsGrid projects={projects} />
        </section>

        <section id="experience" className="py-20 px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 gradient-text">Experience</h2>
          <Timeline experiences={experience} educations={education as any} />
        </section>

        <section id="skills" className="py-20 px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 gradient-text">Skills</h2>
          <Skills skills={skills} />
        </section>

        {!session && (
          <section className="py-20 text-center">
            <button
              onClick={() => signIn("credentials")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Admin Login
            </button>
          </section>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const profile = await db.profile.findFirst({
    where: { isVisible: true },
  });

  const projects = await db.project.findMany({
    where: { isFeatured: true },
    orderBy: { sortOrder: "asc" },
  });

  const skills = await db.skill.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const experience = await db.experience.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const education = await db.education.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return {
    props: {
      profile,
      projects,
      skills,
      experience,
      education,
    },
  };
};