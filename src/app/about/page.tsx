import { MemberCard } from "@/components/member-card";
import { Navbar } from "@/components/navbar";
import type { Metadata } from "next";
import { getDevelopers, getIntegrantes, getTutores } from "../actions";

const aboutHeroImage = "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=2071&auto=format&fit=crop";

export async function generateMetadata(): Promise<Metadata> {
  const [integrantes, tutores, desarrolladores] = await Promise.all([getIntegrantes(), getTutores(), getDevelopers()]);

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
  const integrantes = await getIntegrantes();
  const tutores = await getTutores();
  const desarrolladores = await getDevelopers();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="relative h-[40vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center brightness-50" />
        <Navbar />
        <div className="relative z-20 container mx-auto h-full flex items-center justify-center pt-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Acerca del Proyecto</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-16">
        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800 text-amber-700 dark:text-amber-500">
            Integrantes del Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrantes.map((i) => (
              <MemberCard
                key={i.id}
                firstName={i.firstName}
                photoPath={i.photo}
                lastName={i.lastName}
                subtitle={i.faculty}
                subtitleTone="muted"
                eyebrow={i.department}
                fallbackLetter="I"
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800 text-amber-700 dark:text-amber-500">Tutores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutores.map((t) => (
              <MemberCard key={t.id} fullName={t.names} subtitle={t.title} photoPath={t.photoPath} resume={t.resume} fallbackLetter="T" />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800 text-amber-700 dark:text-amber-500">Desarrolladores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {desarrolladores.map((dev) => (
              <MemberCard
                key={dev.id}
                photoPath={dev.photoPath}
                firstName={dev.firstName}
                lastName={dev.lastName}
                subtitle="Desarrollador"
                resume={dev.resume}
                fallbackLetter="D"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
