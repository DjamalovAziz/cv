import { useState } from "react";
import { ExternalLink, Github } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  repoUrl: string | null;
  image: string | null;
  tags: string[];
}

interface ProjectsGridProps {
  projects: Project[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));
  const filteredProjects = filter
    ? projects.filter((p) => p.tags.includes(filter))
    : projects;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !filter ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === tag ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500/50 transition-colors group"
          >
            {project.image && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{project.title}</h3>
              {project.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-800 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Live
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    Code
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}