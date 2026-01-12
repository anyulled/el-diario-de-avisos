"use client";

import { Calendar, ChevronDown, ChevronUp, Search, Type } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { publicationColumns } from "@/db/schema";
import { normalizeDateRange } from "@/lib/date-range";

interface SearchFiltersProps {
  types: (typeof publicationColumns.$inferSelect)[];
}

function getTypeLabel(types: SearchFiltersProps["types"], selectedType: string | null) {
  if (!selectedType) {
    return "Tipo de Noticia";
  }

  return types.find((type) => String(type.id) === selectedType)?.name || "Tipo Seleccionado";
}

// Helper to build URLSearchParams to reduce component complexity
function buildSearchParams(currentParams: URLSearchParams, allStates: Record<string, string | null>, explicitPageUpdate: boolean): URLSearchParams {
  const params = new URLSearchParams(currentParams);

  // Trim text
  if (allStates.text) {
    allStates.text = allStates.text.trim();
  }

  // Reset page if not explicitly updated
  if (!explicitPageUpdate) {
    params.set("page", "1");
  }

  // Clear legacy year logic if dates involved
  if (allStates.dateFrom || allStates.dateTo) {
    params.delete("year");
  }

  // Apply updates to params
  Object.entries(allStates).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  return params;
}

interface DateRangeRowProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onBlur: () => void;
  error: string | null;
}

function DateRangeRow({ dateFrom, dateTo, onDateFromChange, onDateToChange, onBlur, error }: DateRangeRowProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <label className="text-xs font-semibold text-gray-500 mb-1 block pl-1">Desde</label>
          <div className="relative">
            <input
              type="date"
              aria-label="Fecha desde"
              className={`w-full h-11 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 border focus:ring-2 transition-all text-gray-700 dark:text-gray-300 ${
                error ? "border-red-500 focus:ring-red-500" : "border-transparent focus:ring-amber-600"
              }`}
              onChange={(e) => onDateFromChange(e.target.value)}
              onBlur={onBlur}
              value={dateFrom}
            />
            <Calendar className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="relative">
          <label className="text-xs font-semibold text-gray-500 mb-1 block pl-1">Hasta</label>
          <div className="relative">
            <input
              type="date"
              aria-label="Fecha hasta"
              className={`w-full h-11 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 border focus:ring-2 transition-all text-gray-700 dark:text-gray-300 ${
                error ? "border-red-500 focus:ring-red-500" : "border-transparent focus:ring-amber-600"
              }`}
              onChange={(e) => onDateToChange(e.target.value)}
              onBlur={onBlur}
              value={dateTo}
            />
            <Calendar className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-red-600 font-medium animate-pulse">{error}</p>}
    </>
  );
}

interface TypeFilterPanelProps {
  types: SearchFiltersProps["types"];
  selectedType: string;
  onSelect: (typeId: string) => void;
  onClear: () => void;
}

function TypeFilterPanel({ types, selectedType, onSelect, onClear }: TypeFilterPanelProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg animate-in fade-in slide-in-from-top-2 border border-gray-100 dark:border-zinc-700 relative z-40">
      <h3 className="text-xs font-bold mb-3 text-gray-500 uppercase tracking-widest">Filtrar por Tipo</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {types.map((type) => (
          <label key={type.id} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 dark:hover:bg-zinc-700 p-2 rounded transition-colors">
            <input
              type="radio"
              name="type"
              value={type.id}
              checked={selectedType === String(type.id)}
              onChange={(e) => onSelect(e.target.value)}
              className="text-amber-600 focus:ring-amber-500 border-gray-300"
            />
            <span className="text-sm truncate">{type.name}</span>
          </label>
        ))}
        <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 dark:hover:bg-zinc-700 p-2 rounded transition-colors text-amber-600">
          <input type="radio" name="type" value="" checked={!selectedType} onChange={onClear} className="text-amber-600 focus:ring-amber-500" />
          <span className="text-sm font-semibold">Ver Todos</span>
        </label>
      </div>
    </div>
  );
}

export function SearchFilters({ types }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("text") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync from URL to local state on navigation
  const textParam = searchParams.get("text");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");
  const typeParam = searchParams.get("type");

  useEffect(() => {
    setSearchTerm(textParam || "");
    setDateFrom(dateFromParam || "");
    setDateTo(dateToParam || "");
    setSelectedType(typeParam || "");
    setDateError(null);
  }, [textParam, dateFromParam, dateToParam, typeParam]);

  const handleValidation = () => {
    const { isValidRange } = normalizeDateRange({ start: dateFrom, end: dateTo });
    if (!isValidRange && dateFrom && dateTo) {
      const error = "La fecha inicial no puede ser posterior a la fecha final.";
      setDateError(error);
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleDateBlur = () => {
    handleValidation();
  };

  const executeSearch = (updates: Record<string, string | null> = {}) => {
    // Merge updates with current state to check validation
    const allStates: Record<string, string | null> = {
      text: searchTerm,
      dateFrom,
      dateTo,
      type: selectedType,
      ...updates,
    };

    // Centralized validation for ALL search triggers (manual, sort, page, type)
    if (allStates.dateFrom && allStates.dateTo) {
      const { isValidRange } = normalizeDateRange({ start: allStates.dateFrom, end: allStates.dateTo });
      if (!isValidRange) {
        const error = "La fecha inicial no puede ser posterior a la fecha final.";
        setDateError(error);
        return;
      }
    }
    setDateError(null);

    const params = buildSearchParams(searchParams, allStates, !!updates.page);

    startTransition(() => {
      router.replace(`/?${params.toString()}`);
    });
  };

  const handleManualSearch = () => {
    // Use trimmed value for explicit searches to align input with validation/params
    executeSearch({ text: searchTerm.trim() });
  };

  const handleSortChange = (sortValue: string) => {
    executeSearch({ sort: sortValue });
  };

  const handlePageSizeChange = (sizeValue: string) => {
    executeSearch({ pageSize: sizeValue });
  };

  return (
    <div className="w-full max-w-7xl mx-auto -mt-10 relative z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6">
      {/* Row 1: Search Input & Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por palabra clave o texto..."
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-amber-600 transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        <button
          type="button"
          aria-label="Buscar"
          onClick={handleManualSearch}
          className="h-12 px-6 rounded-lg bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-sm"
        >
          {isPending ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Search size={18} />}
          <span>Buscar</span>
        </button>
      </div>

      <DateRangeRow dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onBlur={handleDateBlur} error={dateError} />

      {/* Row 3: Type & Other Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Dropdown / Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsTypeExpanded(!isTypeExpanded)}
            className="w-full h-11 pl-10 pr-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-between text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <span className="truncate">{getTypeLabel(types, selectedType)}</span>
            {isTypeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <Type className="absolute left-3 top-3 text-gray-400" size={16} />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            className="w-full h-11 pl-4 pr-10 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 appearance-none focus:ring-2 focus:ring-amber-600 cursor-pointer text-sm"
            onChange={(e) => handleSortChange(e.target.value)}
            defaultValue={searchParams.get("sort") || "date_asc"}
          >
            <option value="rank">Ordenar por: Relevancia</option>
            <option value="date_desc">Ordenar por: Fecha (Reciente)</option>
            <option value="date_asc">Ordenar por: Fecha (Antiguo)</option>
            <option value="id_desc">Ordenar por: ID (Descendente)</option>
            <option value="id_asc">Ordenar por: ID (Ascendente)</option>
          </select>
          <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={14} />
        </div>

        {/* Page Size */}
        <div className="relative">
          <select
            className="w-full h-11 pl-4 pr-10 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 appearance-none focus:ring-2 focus:ring-amber-600 cursor-pointer text-sm"
            onChange={(e) => handlePageSizeChange(e.target.value)}
            defaultValue={searchParams.get("pageSize") || "20"}
          >
            <option value="20">Mostrar: 20 por página</option>
            <option value="50">Mostrar: 50 por página</option>
            <option value="100">Mostrar: 100 por página</option>
          </select>
          <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Expanded Type Selection Panel */}
      {isTypeExpanded && (
        <TypeFilterPanel
          types={types}
          selectedType={selectedType}
          onSelect={(id) => {
            executeSearch({ type: id });
            setIsTypeExpanded(false);
          }}
          onClear={() => {
            executeSearch({ type: "" });
            setIsTypeExpanded(false);
          }}
        />
      )}
    </div>
  );
}
