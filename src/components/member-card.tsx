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
  subtitleTone === "muted" ? "text-sm text-gray-500 dark:text-gray-400 mt-1" : "text-sm text-amber-600 dark:text-amber-500 mt-1";

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
    <div className="mt-3 flex items-center gap-3">
      {cvUrl && (
        <a
          href={cvUrl}
          aria-label="Curriculum Vitae"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400"
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400"
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-amber-500 hover:text-amber-600 dark:border-zinc-800 dark:text-gray-400"
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
        <Image src={photoPath} alt={displayName || ""} width={64} height={64} className="rounded-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
          <span className="text-xl font-serif">{fallbackLetter}</span>
        </div>
      )}
    </aside>
    <header className="flex flex-col">
      {displayName && <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{displayName}</span>}
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
    <article className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
      <MemberHeader
        className={headerClassName}
        photoPath={photoPath}
        displayName={displayName}
        subtitle={subtitle}
        subtitleClassName={subtitleClassName}
        fallbackLetter={fallbackLetter}
      />
      {eyebrow && <span className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wide">{eyebrow}</span>}
      {resume && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{resume}</p>}
      <SocialLinks linkedinUrl={linkedinUrl} twitterUrl={twitterUrl} cvUrl={cvUrl} />
    </article>
  );
}
