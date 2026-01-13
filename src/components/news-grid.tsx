import { articles } from "@/db/schema";
import { ArticleCard } from "./article-card";

export function NewsGrid({ news }: { news: (typeof articles.$inferSelect)[] }) {
  if (news.length === 0) {
    return <div className="text-center py-20 text-gray-500 italic">No se encontraron resultados para su búsqueda.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      {news.map((item) => (
        <ArticleCard key={item.id} item={item} />
      ))}
    </div>
  );
}
