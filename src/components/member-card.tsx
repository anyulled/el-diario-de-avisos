import Image from "next/image";

type MemberCardProps = {
  photoPath?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  subtitle?: string | null;
  subtitleTone?: "accent" | "muted";
  eyebrow?: string | null;
  resume?: string | null;
  fallbackLetter?: string;
};

const getSubtitleClassName = (subtitleTone: MemberCardProps["subtitleTone"]) =>
  subtitleTone === "muted" ? "text-sm text-gray-500 dark:text-gray-400 mt-1" : "text-sm text-amber-600 dark:text-amber-500 mt-1";

const getHeaderClassName = (hasMeta: boolean) => `flex items-start gap-4${hasMeta ? " mb-4" : ""}`;

export function MemberCard({
  photoPath,
  firstName,
  lastName,
  fullName,
  subtitle,
  subtitleTone = "accent",
  eyebrow,
  resume,
  fallbackLetter = "M",
}: MemberCardProps) {
  const displayName = fullName || [firstName, lastName].filter(Boolean).join(" ");
  const hasMeta = Boolean(eyebrow || resume);
  const subtitleClassName = getSubtitleClassName(subtitleTone);

  return (
    <article className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
      <div className={getHeaderClassName(hasMeta)}>
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
      {eyebrow && <span className="text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wide">{eyebrow}</span>}
      {resume && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{resume}</p>}
    </article>
  );
}
