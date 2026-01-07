import { getEssays } from "@/app/actions";
import { BookOpen, Info } from "lucide-react";
import Link from "next/link";

export async function Navbar() {
  const essays = await getEssays();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 py-6 text-white/90">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl tracking-tighter hover:text-white transition-colors">
          DIARIO DE AVISOS
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm cursor-pointer">
              <BookOpen size={16} />
              <span className="text-sm font-medium">Ensayos</span>
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right p-2 max-h-96 overflow-y-auto z-50">
              <div className="flex flex-col gap-1">
                {essays.map((essay) => (
                  <Link
                    key={essay.id}
                    href={`/ensayos/${essay.id}`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                  >
                    {essay.title || "Sin Título"}
                  </Link>
                ))}
                {essays.length === 0 && <span className="px-4 py-2 text-sm text-gray-500">No hay ensayos disponibles</span>}
              </div>
            </div>
          </div>

          <Link href="/chat" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
            <span className="text-sm font-medium">Asistente</span>
          </Link>
          <Link href="/about" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
            <Info size={16} />
            <span className="text-sm font-medium">Acerca de</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
