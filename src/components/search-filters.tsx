"use client";

import { Calendar, ChevronDown, ChevronUp, Search, Type } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { publicationColumns } from "@/db/schema";

interface SearchFiltersProps {
  years: number[];
  types: (typeof publicationColumns.$inferSelect)[];
}

export function SearchFilters({ years, types }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();

  const handleSearch = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Debounce could be good here for text, but keeping it simple
    startTransition(() => {
      router.replace(`/?${params.toString()}`);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto -mt-10 relative z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Buscar por palabra clave o texto..."
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-amber-600 transition-all"
            defaultValue={searchParams.get("text") || ""}
            onChange={(e) => {
              const term = e.target.value;
              clearTimeout(timeoutId);
              const id = setTimeout(() => handleSearch("text", term), 500);
              setTimeoutId(id);
            }}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>

        <div className="relative">
          <select
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 border-none appearance-none focus:ring-2 focus:ring-amber-600 cursor-pointer"
            onChange={(e) => handleSearch("year", e.target.value)}
            defaultValue={searchParams.get("year") || ""}
          >
            <option value="">Año</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Calendar
            className="absolute left-3 top-3.5 text-gray-400"
            size={18}
          />
          <ChevronDown
            className="absolute right-3 top-4 text-gray-400 pointer-events-none"
            size={16}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setIsTypeExpanded(!isTypeExpanded)}
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-between text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <span>
              {searchParams.get("type")
                ? "Tipo Seleccionado"
                : "Tipo de Noticia"}
            </span>
            {isTypeExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          <Type className="absolute left-3 top-3.5 text-gray-400" size={18} />
          {isPending && (
            <div className="absolute right-12 top-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {isTypeExpanded && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg animate-in fade-in slide-in-from-top-2 border border-gray-100 dark:border-zinc-700">
          <h3 className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-widest">
            Filtrar por Tipo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {types.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 dark:hover:bg-zinc-700 p-2 rounded transition-colors"
              >
                <input
                  type="radio"
                  name="type"
                  value={type.id}
                  checked={searchParams.get("type") === String(type.id)}
                  onChange={(e) => {
                    handleSearch("type", e.target.value);
                    setIsTypeExpanded(false);
                  }}
                  className="text-amber-600 focus:ring-amber-500 border-gray-300"
                />
                <span className="text-sm truncate">{type.name}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 dark:hover:bg-zinc-700 p-2 rounded transition-colors text-amber-600">
              <input
                type="radio"
                name="type"
                value=""
                checked={!searchParams.get("type")}
                onChange={() => {
                  handleSearch("type", null);
                  setIsTypeExpanded(false);
                }}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold">Ver Todos</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
