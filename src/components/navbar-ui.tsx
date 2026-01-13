"use client";

import { cn } from "@/lib/styles";
import { BookOpen, Calendar, Info, Menu, MessageSquare, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Essay {
  id: number;
  title: string | null;
}

interface NavbarUIProps {
  essays: Essay[];
}

export function NavbarUI({ essays }: NavbarUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 py-4 md:py-6 text-white/90">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl tracking-tighter hover:text-white transition-colors z-50 relative uppercase">
          Noticias Musicales
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
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
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md truncate"
                  >
                    {essay.title || "Sin Título"}
                  </Link>
                ))}
                {essays.length === 0 && <span className="px-4 py-2 text-sm text-gray-500">No hay ensayos disponibles</span>}
              </div>
            </div>
          </div>

          <Link href="/tal-dia-como-hoy" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
            <Calendar size={16} />
            <span className="text-sm font-medium">Tal día como hoy</span>
          </Link>

          <Link href="/chat" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
            <MessageSquare size={16} />
            <span className="text-sm font-medium">Asistente</span>
          </Link>
          <Link href="/about" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
            <Info size={16} />
            <span className="text-sm font-medium">Acerca de</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors z-50 relative"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-40 md:hidden transition-all duration-300 ease-in-out flex flex-col pt-24 px-6",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-6">
            <Link href="/" className="text-2xl font-light hover:text-white transition-colors flex items-center gap-3 py-2 border-b border-white/10">
              <Search size={24} />
              Buscar
            </Link>

            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <BookOpen size={14} />
                Ensayos
              </div>
              <div className="flex flex-col gap-2 pl-4 border-l border-white/10">
                {essays.map((essay) => (
                  <Link key={essay.id} href={`/ensayos/${essay.id}`} className="text-lg text-white/80 hover:text-white transition-colors py-1 truncate">
                    {essay.title || "Sin Título"}
                  </Link>
                ))}
                {essays.length === 0 && <span className="text-white/40 italic">No hay ensayos disponibles</span>}
              </div>
            </div>

            <Link
              href="/tal-dia-como-hoy"
              className="text-2xl font-light hover:text-white transition-colors flex items-center gap-3 py-2 border-b border-white/10"
            >
              <Calendar size={24} />
              Tal día como hoy
            </Link>

            <Link href="/chat" className="text-2xl font-light hover:text-white transition-colors flex items-center gap-3 py-2 border-b border-white/10">
              <MessageSquare size={24} />
              Asistente
            </Link>

            <Link href="/about" className="text-2xl font-light hover:text-white transition-colors flex items-center gap-3 py-2 border-b border-white/10">
              <Info size={24} />
              Acerca de
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
