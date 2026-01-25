import { Navbar } from "@/components/navbar";
import Image from "next/image";
import { getDevelopers, getIntegrantes, getTutores } from "../actions";

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
              <div key={i.id} className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {i.firstName} {i.lastName}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{i.faculty}</span>
                <span className="text-xs text-amber-600 dark:text-amber-500 mt-2 uppercase tracking-wide">{i.department}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800 text-amber-700 dark:text-amber-500">Tutores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutores.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                  <span className="text-lg font-serif">T</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.names}</span>
                  <span className="text-sm text-amber-600 dark:text-amber-500">{t.title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-zinc-800 text-amber-700 dark:text-amber-500">Desarrolladores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {desarrolladores.map((dev) => (
              <div key={dev.id} className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  {dev.photoPath ? (
                    <Image src={dev.photoPath} alt={`${dev.firstName} ${dev.lastName}`} width={64} height={64} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                      <span className="text-xl font-serif">D</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {dev.firstName} {dev.lastName}
                    </span>
                    <span className="text-sm text-amber-600 dark:text-amber-500">Desarrollador</span>
                  </div>
                </div>
                {dev.resume && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{dev.resume}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
