import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { NewsGrid } from "@/components/news-grid";
import { Pagination } from "@/components/pagination";
import { SearchFilters } from "@/components/search-filters";
import { getNews, getNewsTypes, getYears, SearchParams } from "./actions";

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const years = await getYears();
  const types = await getNewsTypes();
  const { data: news, total } = await getNews(params);

  const currentPage = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 20);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 relative">
      <Navbar />
      <Hero />
      <SearchFilters years={years} types={types} />
      <div className="mt-8 container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Resultados de Búsqueda ({total})</h2>
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>
        <NewsGrid news={news} />

        <Pagination total={total} pageSize={pageSize} currentPage={currentPage} />
      </div>
    </main>
  );
}
