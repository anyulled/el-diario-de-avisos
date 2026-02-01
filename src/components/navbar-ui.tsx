"use client";

import { cn } from "@/lib/styles";
import { BookOpen, Calendar, Info, Menu, MessageSquare, Quote, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Essay {
  id: number;
  title: string | null;
  groupName: string;
}

interface NavbarUIProps {
  essays: Essay[];
}

export function NavbarUI({ essays }: NavbarUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnsayosOpen, setIsEnsayosOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const ensayosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsEnsayosOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ensayosRef.current && !ensayosRef.current.contains(event.target as Node)) {
        setIsEnsayosOpen(false);
      }
    };

    if (isEnsayosOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEnsayosOpen]);

  // Group essays by publication (groupName)
  const groupedEssays = essays.reduce(
    (acc, essay) => {
      const group = essay.groupName || "Diario de Avisos";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(essay);
      return acc;
    },
    {} as Record<string, Essay[]>,
  );

  const navLinks = [
    { href: "/tal-dia-como-hoy", icon: Calendar, label: "Tal día como hoy" },
    { href: "/chat", icon: MessageSquare, label: "Asistente" },
    { href: "/como-citar", icon: Quote, label: "Cómo citar" },
    { href: "/about", icon: Info, label: "Acerca de" },
  ];

  return (
    <>
      <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-4 translate-y-0")}>
        <div
          className={cn(
            "container mx-auto px-4 py-3 flex justify-between items-center transition-all duration-300 rounded-full",
            isScrolled ? "glass premium-shadow" : "bg-transparent text-white",
          )}
        >
          <Link
            href="/"
            className={cn(
              "font-bold text-xl tracking-tighter hover:opacity-80 transition-all z-50 relative uppercase flex items-center gap-3",
              !isScrolled && "text-white",
              isScrolled && "text-gray-900 dark:text-white",
            )}
          >
            <Image src="/icon.png" alt="Logo" width={32} height={32} className="rounded-lg shadow-sm" />
            <span className="hidden sm:inline">Noticias Musicales</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <div className="relative group" ref={ensayosRef}>
              <button
                onClick={() => setIsEnsayosOpen(!isEnsayosOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer text-sm font-medium",
                  isScrolled ? "hover:bg-black/5 dark:hover:bg-white/10" : "hover:bg-white/10 text-white",
                )}
              >
                <BookOpen size={16} />
                <span>Ensayos</span>
              </button>
              <div
                className={cn(
                  "absolute right-0 mt-2 w-72 glass rounded-2xl shadow-2xl transition-all duration-300 transform origin-top-right p-4 max-h-[80vh] overflow-y-auto z-50",
                  isEnsayosOpen
                    ? "opacity-100 scale-100 visible"
                    : "opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible",
                )}
              >
                <div className="flex flex-col gap-4">
                  {Object.entries(groupedEssays).map(([group, groupEssays]) => (
                    <div key={group} className="flex flex-col gap-1">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-1 border-b border-gray-200 dark:border-gray-700/50 pb-1">
                        {group}
                      </h3>
                      {groupEssays.map((essay) => (
                        <Link
                          key={essay.id}
                          href={`/ensayos/${essay.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl truncate transition-colors"
                        >
                          {essay.title || "Sin Título"}
                        </Link>
                      ))}
                    </div>
                  ))}
                  {essays.length === 0 && <span className="px-4 py-2 text-sm text-gray-500">No hay ensayos disponibles</span>}
                </div>
              </div>
            </div>

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                  isScrolled ? "hover:bg-black/5 dark:hover:bg-white/10" : "hover:bg-white/10 text-white",
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-full transition-all z-50 relative",
              isScrolled ? "hover:bg-black/5 dark:hover:bg-white/10" : "hover:bg-white/10 text-white",
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
<div className={cn("fixed inset-0 w-screen h-screen bg-black z-999 md:hidden flex flex-col pt-24 px-6 overflow-y-auto transition-opacity duration-300 ease-in-out", isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}>
        {/* Defined navLinks array to reuse across desktop and mobile menus */}
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
              {Object.entries(groupedEssays).map(([group, groupEssays]) => (
                <div key={group} className="flex flex-col gap-1 mb-2">
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">{group}</h4>
                  {groupEssays.map((essay) => (
                    <Link key={essay.id} href={`/ensayos/${essay.id}`} className="text-lg text-white/80 hover:text-white transition-colors py-1 truncate">
                      {essay.title || "Sin Título"}
                    </Link>
                  ))}
                </div>
              ))}
              {essays.length === 0 && <span className="text-white/40 italic">No hay ensayos disponibles</span>}
            </div>
          </div>

          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-2xl font-light hover:text-white transition-colors flex items-center gap-3 py-2 border-b border-white/10"
            >
              <item.icon size={24} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
