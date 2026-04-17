import { Github, Linkedin, Mail, MapPin } from "lucide-react";

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

interface HeroProps {
  profile: Profile | null | undefined;
}

export function Hero({ profile }: HeroProps) {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4">
      <div className="animate-float mb-8">
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-32 h-32 rounded-full border-4 border-blue-500/30 object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-blue-500/30 flex items-center justify-center text-4xl font-bold">
            {profile?.name?.charAt(0) || "?"}
          </div>
        )}
      </div>

      <h1 className="text-5xl font-bold mb-4 gradient-text">
        {profile?.name || "Developer"}
      </h1>

      <p className="text-xl text-gray-400 mb-2">
        {profile?.title || "Full Stack Developer"}
      </p>

      {profile?.location && (
        <div className="flex items-center gap-2 text-gray-500 mb-6">
          <MapPin className="w-4 h-4" />
          <span>{profile.location}</span>
        </div>
      )}

      {profile?.bio && (
        <p className="max-w-xl text-gray-300 mb-8 leading-relaxed">
          {profile.bio}
        </p>
      )}

      <div className="flex gap-4">
        {profile?.github && (
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:text-blue-400 transition-colors"
          >
            <Github className="w-6 h-6" />
          </a>
        )}
        {profile?.linkedin && (
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:text-blue-400 transition-colors"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        )}
        {profile?.email && (
          <a
            href={`mailto:${profile.email}`}
            className="p-2 hover:text-blue-400 transition-colors"
          >
            <Mail className="w-6 h-6" />
          </a>
        )}
      </div>
    </section>
  );
}