import { getArticlesOnThisDay } from "@/actions/actions";
import { ArticleSwiper } from "@/components/article-swiper";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { DateTime } from "luxon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tal día como hoy | Noticias Musicales",
  description: "Artículos musicales publicados tal día como hoy en el diario de avisos.",
};

export const dynamic = "force-dynamic";

export default async function OnThisDayPage() {
  // Computes the date in 'America/Caracas' timezone
  const now = DateTime.now().setZone("America/Caracas");
  const day = now.day;
  const month = now.month;

  // Format date for display using Spanish locale
  const dateStr = now.setLocale("es-VE").toLocaleString({ day: "numeric", month: "long" });

  const articles = await getArticlesOnThisDay(day, month);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 relative">
      <Navbar />
      <Hero title="Tal día como hoy" subtitle={`Artículos musicales publicados el ${dateStr} en el diario de avisos.`} badge="Efemérides" />

      <div className="container mx-auto px-4 mt-12 mb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Artículos del {dateStr}</h2>
          <div className="h-px bg-gray-200 dark:bg-zinc-800 flex-1"></div>
        </div>

        {!articles || articles.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700">
            <p className="text-xl text-gray-500 font-medium">No se encontraron artículos para esta fecha.</p>
            <p className="text-gray-400 mt-2">Intenta visitar la sección de búsqueda para explorar otros días.</p>
          </div>
        ) : (
          <ArticleSwiper articles={articles} />
        )}
      </div>
    </main>
  );
}
