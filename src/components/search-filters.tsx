"use client";

import { Calendar, ChevronDown, ChevronUp, Search, Type } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { publicationColumns, publications } from "@/db/schema";
import { normalizeDateRange } from "@/lib/date-range";
import { cn } from "@/lib/styles";

interface SearchFiltersProps {
  types: (typeof publicationColumns.$inferSelect)[];
  publications: (typeof publications.$inferSelect)[];
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
        <div className="relative group">
          <label className="text-[10px] font-bold text-gray-500/80 mb-1.5 block pl-4 uppercase tracking-[0.15em]">Desde</label>
          <div className="relative">
            <input
              type="date"
              aria-label="Fecha desde"
              className={`w-full h-12 pl-12 pr-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 transition-all text-gray-700 dark:text-gray-300 font-medium outline-hidden ${
                error
                  ? "border-red-500 focus:bg-white dark:focus:bg-zinc-900"
                  : "border-transparent focus:border-amber-500/50 focus:bg-white dark:focus:bg-zinc-900"
              }`}
              onChange={(e) => onDateFromChange(e.target.value)}
              onBlur={onBlur}
              value={dateFrom}
            />
            <Calendar className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
          </div>
        </div>

        <div className="relative group">
          <label className="text-[10px] font-bold text-gray-500/80 mb-1.5 block pl-4 uppercase tracking-[0.15em]">Hasta</label>
          <div className="relative">
            <input
              type="date"
              aria-label="Fecha hasta"
              className={`w-full h-12 pl-12 pr-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 transition-all text-gray-700 dark:text-gray-300 font-medium outline-hidden ${
                error
                  ? "border-red-500 focus:bg-white dark:focus:bg-zinc-900"
                  : "border-transparent focus:border-amber-500/50 focus:bg-white dark:focus:bg-zinc-900"
              }`}
              onChange={(e) => onDateToChange(e.target.value)}
              onBlur={onBlur}
              value={dateTo}
            />
            <Calendar className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
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
    <div className="mt-6 p-6 glass rounded-2xl animate-in slide-up border border-gray-100 dark:border-zinc-800/50 relative z-40 bg-white/50 dark:bg-zinc-900/50 shadow-2xl">
      <h3 className="text-[10px] font-bold mb-4 text-gray-500 uppercase tracking-widest text-center">Filtrar por Tipo</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {types.map((type) => (
          <label
            key={type.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-amber-500/10 p-2.5 rounded-xl transition-all border border-transparent hover:border-amber-500/20 group"
          >
            <input
              type="radio"
              name="type"
              value={type.id}
              checked={selectedType === String(type.id)}
              onChange={(e) => onSelect(e.target.value)}
              className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:bg-zinc-800 transition-all checked:scale-110"
            />
            <span className="text-sm truncate font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-700 dark:group-hover:text-amber-500">
              {type.name}
            </span>
          </label>
        ))}
        <label className="flex items-center gap-3 cursor-pointer hover:bg-amber-500/10 p-2.5 rounded-xl transition-all border border-transparent hover:border-amber-500/20 group text-amber-600">
          <input
            type="radio"
            name="type"
            value=""
            checked={!selectedType}
            onChange={onClear}
            className="w-4 h-4 text-amber-600 focus:ring-amber-500 transition-all checked:scale-110"
          />
          <span className="text-sm font-bold uppercase tracking-wide">Mostar Todos</span>
        </label>
      </div>
    </div>
  );
}

// Choice Card UI Components (Shadcn-like pattern)
const Field = ({
  children,
  orientation = "vertical",
  className,
}: {
  children: React.ReactNode;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) => (
  <div
    className={cn("flex gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer", orientation === "horizontal" ? "items-center" : "flex-col", className)}
  >
    {children}
  </div>
);

const FieldContent = ({ children }: { children: React.ReactNode }) => <div className="flex-1 min-w-0">{children}</div>;
const FieldTitle = ({ children }: { children: React.ReactNode }) => <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{children}</h4>;
const FieldDescription = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">{children}</p>;
const FieldLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) => (
  <label htmlFor={htmlFor} className="block cursor-pointer">
    {children}
  </label>
);

const RadioGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid gap-4", className)}>{children}</div>
);

const RadioGroupItem = ({ value, id, checked, onChange }: { value: string; id: string; checked: boolean; onChange: (val: string) => void }) => (
  <input
    type="radio"
    id={id}
    name="publication"
    value={value}
    checked={checked}
    onChange={(e) => onChange(e.target.value)}
    className="w-4 h-4 text-amber-600 focus:ring-amber-600 border-gray-300 transition-all cursor-pointer"
  />
);

function PublicationFilter({
  publications: pubs,
  selectedPub,
  onSelect,
}: {
  publications: SearchFiltersProps["publications"];
  selectedPub: string;
  onSelect: (id: string) => void;
}) {
  const getPubDescription = (name: string | null) => {
    if (!name) return "";
    if (name.includes("Diario de Avisos")) return "Fundado en 1837, un Semanario de las Provincias de Venezuela.";
    if (name.includes("La Opinión Nacional")) return "Un referente histórico del periodismo venezolano.";
    return "Todas las publicaciones disponibles.";
  };

  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-bold mb-4 text-gray-500 uppercase tracking-[0.2em] pl-4">Filtrar por Publicación</h3>
      <RadioGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option: Todas */}
        <FieldLabel htmlFor="pub-all">
          <Field
            orientation="horizontal"
            className={cn(
              "hover:border-amber-500/30",
              !selectedPub ? "border-amber-500 bg-amber-500/5" : "border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50",
            )}
          >
            <FieldContent>
              <FieldTitle>Todas</FieldTitle>
              <FieldDescription>Mostrar artículos de todas las publicaciones.</FieldDescription>
            </FieldContent>
            <RadioGroupItem value="" id="pub-all" checked={!selectedPub} onChange={onSelect} />
          </Field>
        </FieldLabel>

        {/* Dynamic Publications */}
        {pubs.map((pub) => (
          <FieldLabel key={pub.id} htmlFor={`pub-${pub.id}`}>
            <Field
              orientation="horizontal"
              className={cn(
                "hover:border-amber-500/30",
                selectedPub === String(pub.id) ? "border-amber-500 bg-amber-500/5" : "border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50",
              )}
            >
              <FieldContent>
                <FieldTitle>{pub.name}</FieldTitle>
                <FieldDescription>{getPubDescription(pub.name)}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={String(pub.id)} id={`pub-${pub.id}`} checked={selectedPub === String(pub.id)} onChange={onSelect} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  );
}

export function SearchFilters({ types, publications: pubs }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("text") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(searchParams.get("pubId") || "");
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync from URL to local state on navigation
  const textParam = searchParams.get("text");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");
  const typeParam = searchParams.get("type");
  const pubParam = searchParams.get("pubId");

  useEffect(() => {
    setSearchTerm(textParam || "");
    setDateFrom(dateFromParam || "");
    setDateTo(dateToParam || "");
    setSelectedType(typeParam || "");
    setSelectedPublication(pubParam || "");
    setDateError(null);
  }, [textParam, dateFromParam, dateToParam, typeParam, pubParam]);

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
      pubId: selectedPublication,
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
    <div className="w-full max-w-7xl mx-auto -mt-12 relative z-30 glass premium-shadow rounded-3xl p-6 md:p-8 animate-slide-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
      {/* Row 1: Search Input & Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <input
            type="search"
            placeholder="Buscar por palabra clave o texto..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-amber-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all dark:text-white outline-hidden text-lg placeholder:text-gray-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
          <Search className="absolute left-4 top-4.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
        </div>
        <button
          type="button"
          aria-label="Buscar"
          onClick={handleManualSearch}
          className="h-14 px-8 rounded-2xl bg-amber-600 text-white font-bold flex items-center justify-center gap-3 hover:bg-amber-700 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 group"
        >
          {isPending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <Search className="group-hover:scale-110 transition-transform" size={20} />
          )}
          <span>Buscar</span>
        </button>
      </div>

      <DateRangeRow dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onBlur={handleDateBlur} error={dateError} />

      <PublicationFilter
        publications={pubs}
        selectedPub={selectedPublication}
        onSelect={(id) => {
          setSelectedPublication(id);
          executeSearch({ pubId: id });
        }}
      />

      {/* Row 3: Type & Other Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Type Dropdown / Toggle */}
        <div className="relative group">
          <button
            onClick={() => setIsTypeExpanded(!isTypeExpanded)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-transparent hover:border-amber-500/30 flex items-center justify-between text-gray-700 dark:text-gray-300 transition-all text-sm font-semibold cursor-pointer group-focus-within:border-amber-500/50"
          >
            <span className="truncate">{getTypeLabel(types, selectedType)}</span>
            {isTypeExpanded ? <ChevronUp size={18} className="text-amber-600" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          <Type className="absolute left-4 top-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" size={18} />
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
