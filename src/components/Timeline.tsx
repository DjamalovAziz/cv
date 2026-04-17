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

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}

interface TimelineProps {
  experiences: Experience[];
  educations: Education[];
}

function formatDate(date: Date | null): string {
  if (!date) return "Present";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function Timeline({ experiences, educations }: TimelineProps) {
  const items = [
    ...experiences.map((e) => ({
      type: "experience" as const,
      ...e,
      title: e.position,
      subtitle: e.company,
      description: e.description,
    })),
    ...educations.map((e) => ({
      type: "education" as const,
      ...e,
      title: e.degree,
      subtitle: e.institution,
      description: e.field,
    })),
  ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />

      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.id} className="relative pl-12">
            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-gray-900" />
            
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-blue-400 text-sm">{item.subtitle}</p>
                </div>
                <span className="text-gray-500 text-sm">
                  {formatDate(item.startDate)} - {item.isCurrent ? "Present" : formatDate(item.endDate)}
                </span>
              </div>
              {item.description && (
                <p className="text-gray-400 text-sm">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}