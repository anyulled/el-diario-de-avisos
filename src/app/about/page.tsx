import { MemberCard } from "@/components/member-card";
import { Navbar } from "@/components/navbar";
import type { Metadata } from "next";
import { getDevelopers, getDevelopersNames, getIntegrantes, getIntegrantesNames, getTutores, getTutoresNames } from "../actions";

const aboutHeroImage = "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=2071&auto=format&fit=crop";

export async function generateMetadata(): Promise<Metadata> {
  const [integrantes, tutores, desarrolladores] = await Promise.all([getIntegrantesNames(), getTutoresNames(), getDevelopersNames()]);

  const integranteNames = integrantes.map((i) => `${i.firstName} ${i.lastName}`.trim()).filter(Boolean);
  const tutorNames = tutores.map((t) => t.names).filter(Boolean);
  const developerNames = desarrolladores.map((d) => `${d.firstName} ${d.lastName}`.trim()).filter(Boolean);
  const people = [...integranteNames, ...tutorNames, ...developerNames];
  const peopleSummary = people.length ? ` Participan: ${people.slice(0, 8).join(", ")}${people.length > 8 ? ", y más." : "."}` : "";

  const title = "Acerca del Proyecto";
  const description = `Conoce el equipo y el trabajo detrás del Archivo de Noticias Musicales de El Diario de Avisos.${peopleSummary}`;

  return {
    title,
    description,
    alternates: {
      canonical: "/about",
    },
    openGraph: {
      title,
      description,
      url: "/about",
      type: "website",
      images: [
        {
          url: aboutHeroImage,
          width: 2071,
          height: 1381,
          alt: "Acerca del Proyecto - Diario de Avisos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [aboutHeroImage],
    },
  };
}

export default async function AboutPage() {
  const [integrantes, tutores, desarrolladores] = await Promise.all([getIntegrantes(), getTutores(), getDevelopers()]);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
      <div className="relative h-[50vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-linear-to-r from-amber-900/20 to-blue-900/20 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center brightness-50 bg-fixed" />
        <Navbar />
        <div className="relative z-20 container mx-auto h-full flex flex-col items-center justify-center pt-24 text-center px-4">
          <div className="mb-4 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-md animate-in fade-in duration-700">
            <span className="text-amber-200 text-xs font-bold tracking-[0.2em] uppercase">Nuestro Equipo</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tight animate-slide-up [animation-delay:200ms]">Acerca del Proyecto</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 max-w-5xl space-y-24">
        <section className="animate-slide-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading whitespace-nowrap">Integrantes del Equipo</h2>
            <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrantes.map((i) => (
              <MemberCard
                key={i.id}
                firstName={i.firstName}
                photoPath={i.photo}
                lastName={i.lastName}
                subtitle={i.faculty}
                resume={i.resume}
                subtitleTone="muted"
                eyebrow={i.department}
                linkedinUrl={i.linkedinUrl}
                twitterUrl={i.twitterUrl}
                cvUrl={i.cvUrl}
                fallbackLetter="I"
              />
            ))}
          </div>
        </section>

        <section className="animate-slide-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading whitespace-nowrap">Tutores</h2>
            <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutores.map((t) => (
              <MemberCard
                key={t.id}
                fullName={t.names}
                subtitle={t.title}
                photoPath={t.photoPath}
                resume={t.resume}
                linkedinUrl={t.linkedinUrl}
                twitterUrl={t.twitterUrl}
                cvUrl={t.cvUrl}
                fallbackLetter="T"
              />
            ))}
          </div>
        </section>

        <section className="animate-slide-up [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading whitespace-nowrap">Desarrolladores</h2>
            <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {desarrolladores.map((dev) => (
              <MemberCard
                key={dev.id}
                photoPath={dev.photoPath}
                firstName={dev.firstName}
                lastName={dev.lastName}
                subtitle="Desarrollador"
                resume={dev.resume}
                linkedinUrl={dev.linkedinUrl}
                twitterUrl={dev.twitterUrl}
                cvUrl={dev.cvUrl}
                fallbackLetter="D"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
