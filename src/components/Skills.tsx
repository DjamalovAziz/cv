interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string | null;
}

interface SkillsProps {
  skills: Skill[];
}

export function Skills({ skills }: SkillsProps) {
  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 text-gray-400">{category}</h3>
          <div className="flex flex-wrap gap-3">
            {skills
              .filter((s) => s.category === category)
              .map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors"
                >
                  {skill.icon && <span>{skill.icon}</span>}
                  <span>{skill.name}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}