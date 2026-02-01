import Image from "next/image";
import { FileText, Linkedin, Twitter } from "lucide-react";

type MemberCardProps = {
  photoPath?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  subtitle?: string | null;
  subtitleTone?: "accent" | "muted";
  eyebrow?: string | null;
  resume?: string | null;
  linkedinUrl?: string | null;
  cvUrl?: string | null;
  twitterUrl?: string | null;
  fallbackLetter?: string;
};

const getSubtitleClassName = (subtitleTone: MemberCardProps["subtitleTone"]) =>
  subtitleTone === "muted" ? "text-sm text-gray-500 dark:text-gray-400 mt-1" : "text-sm font-semibold text-amber-600 dark:text-amber-500 mt-1";

const getHeaderClassName = (hasMeta: boolean) => `flex items-start gap-4${hasMeta ? " mb-4" : ""}`;

type SocialLinksProps = {
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  cvUrl?: string | null;
};

const SocialLinks = ({ linkedinUrl, twitterUrl, cvUrl }: SocialLinksProps) => {
  if (!linkedinUrl && !twitterUrl && !cvUrl) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      {cvUrl && (
        <a
          href={cvUrl}
          aria-label="Curriculum Vitae"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-all hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-amber-500/20 active:scale-95"
        >
          <FileText className="h-4 w-4" />
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-all hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-amber-500/20 active:scale-95"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
      {twitterUrl && (
        <a
          href={twitterUrl}
          aria-label="Twitter"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-all hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-amber-500/20 active:scale-95"
        >
          <Twitter className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

type MemberHeaderProps = {
  className: string;
  photoPath?: string | null;
  displayName: string;
  subtitle?: string | null;
  subtitleClassName: string;
  fallbackLetter: string;
};

const MemberHeader = ({ className, photoPath, displayName, subtitle, subtitleClassName, fallbackLetter }: MemberHeaderProps) => (
  <div className={className}>
    <aside className="shrink-0">
      {photoPath ? (
        <Image src={photoPath} alt={displayName || ""} width={80} height={80} className="rounded-2xl object-cover shadow-md" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-zinc-700">
          <span className="text-2xl font-serif">{fallbackLetter}</span>
        </div>
      )}
    </aside>
    <header className="flex flex-col justify-center">
      {displayName && <span className="text-xl font-bold text-gray-900 dark:text-gray-100 font-heading tracking-tight">{displayName}</span>}
      {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
    </header>
  </div>
);

export function MemberCard({
  photoPath,
  firstName,
  lastName,
  fullName,
  subtitle,
  subtitleTone = "accent",
  eyebrow,
  resume,
  linkedinUrl,
  twitterUrl,
  cvUrl,
  fallbackLetter = "M",
}: Readonly<MemberCardProps>) {
  const displayName = fullName || [firstName, lastName].filter(Boolean).join(" ");
  const hasSocialLinks = Boolean(linkedinUrl || twitterUrl || cvUrl);
  const hasMeta = Boolean(eyebrow || resume || hasSocialLinks);
  const headerClassName = getHeaderClassName(hasMeta);
  const subtitleClassName = getSubtitleClassName(subtitleTone);

  return (
    <article className="flex flex-col p-8 glass premium-shadow rounded-3xl border border-gray-100 dark:border-zinc-800/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group">
      <MemberHeader
        className={headerClassName}
        photoPath={photoPath}
        displayName={displayName}
        subtitle={subtitle}
        subtitleClassName={subtitleClassName}
        fallbackLetter={fallbackLetter}
      />
      {eyebrow && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] mb-3">{eyebrow}</span>}
      {resume && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal">{resume}</p>}
      <SocialLinks linkedinUrl={linkedinUrl} twitterUrl={twitterUrl} cvUrl={cvUrl} />
    </article>
  );
}
