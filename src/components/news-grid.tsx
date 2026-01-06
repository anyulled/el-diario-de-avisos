import { articles } from "@/db/schema";
import Link from "next/link";

export function NewsGrid({ news }: { news: (typeof articles.$inferSelect)[] }) {
  if (news.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 italic">
        No se encontraron resultados para su búsqueda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      {news.map((item) => (
        <Link
          key={item.id}
          href={`/article/${item.id}`}
          className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-zinc-800 flex flex-col h-full group block"
        >
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/50">
                {item.date || item.publicationYear}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
              {item.title || "Sin Título"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-4 leading-relaxed flex-1">
              {item.subtitle}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-950/50 p-4 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wide font-medium">
              <span>Pág. {item.page}</span>
              <span title="Código de referencia">Ref: {item.id}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
