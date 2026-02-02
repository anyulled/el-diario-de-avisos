import { getArticleById, getArticleSection } from "@/app/actions";
import { Navbar } from "@/components/navbar";
import { processRtfContent } from "@/lib/rtf-html-converter";
import { highlightText } from "@/lib/search-highlighter";
import { formatArticleTitle } from "@/lib/title-formatter";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<import("next").Metadata> {
  const { id } = await params;
  const article = await getArticleById(Number(id));

  if (!article) return {};

  return {
    title: formatArticleTitle(article.title),
    description: article.subtitle || `Año ${article.publicationYear}${article.page ? ` - Página ${article.page}` : ""}`,
    openGraph: {
      title: formatArticleTitle(article.title),
      description: article.subtitle || `Año ${article.publicationYear} - Página ${article.page}`,
      type: "article",
      publishedTime: article.date || undefined,
    },
  };
}

export default async function ArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ text?: string }> }) {
  const { id } = await params;
  const { text: searchTerm } = await searchParams;
  const article = await getArticleById(Number(id));
  const section = article.columnId ? await getArticleSection(article.columnId) : null;

  if (!article) {
    notFound();
  }

  const rawHtmlContent = await processRtfContent(article.content as Buffer | string | null, id);

  // Apply highlighting if search term is present
  const htmlContent = searchTerm ? highlightText(rawHtmlContent, searchTerm) : rawHtmlContent;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
      <div className="relative h-[45vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-linear-to-r from-amber-900/20 to-blue-900/20 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-50 bg-fixed" />
        <Navbar />
        <div className="relative z-20 container mx-auto h-full flex items-end justify-center pb-12 px-4">
          <div className="max-w-4xl animate-slide-up text-center">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="bg-amber-600 inline-flex items-center justify-center text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm leading-none">
                {section?.name || "Noticia"}
              </span>
              <span className="text-white/80 font-mono text-xs uppercase tracking-[0.2em] flex items-center">
                {article.date
                  ? new Date(article.date).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" })
                  : `Año ${article.publicationYear}`}
              </span>
              {article.publicationName && (
                <>
                  <span className="text-white/40 font-mono text-xs">•</span>
                  <span className="text-white/80 font-mono text-xs uppercase tracking-[0.2em]">{article.publicationName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl -mt-10 relative z-30">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 md:p-12 border border-gray-100 dark:border-zinc-800">
          <h1 className="text-xl md:text-2xl font-serif text-gray-600 dark:text-gray-300 mb-8 leading-relaxed border-b border-gray-200 dark:border-zinc-800 pb-8">
            {formatArticleTitle(article.title)}
          </h1>

          <article className="prose prose-lg dark:prose-invert max-w-none font-serif">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </article>

          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-sm text-gray-500">
            <span>Página: {article.page || "No especificada"}</span>
            <span>Ref: {article.id}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
