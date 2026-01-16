import { getArticleById, getArticleSection } from "@/app/actions";
import { Navbar } from "@/components/navbar";
import { processRtfContent } from "@/lib/rtf-html-converter";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<import("next").Metadata> {
  const { id } = await params;
  const article = await getArticleById(Number(id));

  if (!article) return {};

  return {
    title: article.title || "Sin Título",
    description: article.subtitle || `Año ${article.publicationYear} - Página ${article.page}`,
    openGraph: {
      title: article.title || "Sin Título",
      description: article.subtitle || `Año ${article.publicationYear} - Página ${article.page}`,
      type: "article",
      publishedTime: article.date || undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(Number(id));
  const section = article.columnId ? await getArticleSection(article.columnId) : null;

  if (!article) {
    notFound();
  }

  const htmlContent = await processRtfContent(article.content as Buffer | string | null, id);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
      <div className="relative h-[40vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-50" />
        <Navbar />
        <div className="relative z-20 container mx-auto h-full flex items-end pb-12 px-4">
          <div className="max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="bg-amber-600/90 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">{section?.name || "Noticia"}</span>
              <span className="text-white/80 font-mono text-sm">
                {article.date
                  ? new Date(article.date).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" })
                  : `Año ${article.publicationYear}`}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-white tracking-tight leading-tight">{article.title || "Sin Título"}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl -mt-10 relative z-30">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 md:p-12 border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl md:text-2xl font-serif italic text-gray-600 dark:text-gray-300 mb-8 leading-relaxed border-b border-gray-200 dark:border-zinc-800 pb-8">
            {article.subtitle}
          </h2>

          <div className="prose prose-lg dark:prose-invert max-w-none font-serif">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-sm text-gray-500">
            <span>Página: {article.page}</span>
            <span>Ref: {article.id}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
