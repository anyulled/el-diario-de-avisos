import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { NewsGrid } from "@/components/news-grid";
import { Pagination } from "@/components/pagination";
import { ScrollToResults } from "@/components/scroll-to-results";
import { SearchFilters } from "@/components/search-filters";
import { getNews, getNewsTypes, getPublications, SearchParams } from "@/actions/actions";

export default async function Home({ searchParams }: Readonly<{ searchParams: Promise<SearchParams> }>) {
  const typesPromise = getNewsTypes();
  const pubsPromise = getPublications();
  const params = await searchParams;
  const [types, publications, { data: news, total }] = await Promise.all([typesPromise, pubsPromise, getNews(params)]);

  const currentPage = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 20);
  const scrollParams = { ...params };
  delete scrollParams.page;
  const scrollKey = new URLSearchParams(
    Object.entries(scrollParams)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 relative">
      <Navbar />
      <Hero />
      <SearchFilters types={types} publications={publications} />
      <ScrollToResults shouldScroll={total > 0 && scrollKey.length > 0} scrollKey={scrollKey} />
      <div id="search-results" className="mt-8 container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Resultados de Búsqueda ({total})</h2>
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>
        <NewsGrid news={news} searchTerm={params.text || null} />

        <Pagination total={total} pageSize={pageSize} currentPage={currentPage} />
      </div>
    </main>
  );
}
