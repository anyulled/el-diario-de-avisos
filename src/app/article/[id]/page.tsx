import { getArticleById } from "@/app/actions";
import { Navbar } from "@/components/navbar";
import { notFound } from "next/navigation";
// @ts-ignore
import { fromString } from '@iarna/rtf-to-html';
import iconv from 'iconv-lite';
import { promisify } from 'util';

const rtfToHtml = promisify(fromString);

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

    if (!article) {
        notFound();
    }

    let htmlContent = "Contenido no disponible";
    if (article.content) {
        try {
            // Using iconv-lite to decode as Windows-1252 first to ensure 8-bit bytes are mapped to correct chars
            let rtfString = '';
            if (Buffer.isBuffer(article.content)) {
                rtfString = iconv.decode(article.content, 'win1252');
            } else {
                rtfString = String(article.content);
            }

            // HACK: Manually unescape RTF hex sequences for Latin1 characters (\'xx)
            // The rtf-to-html library seems to fail to parse these standard escapes correctly 
            // (likely due to missing/default codepage handling), resulting in replacement characters.
            // We convert \'e9 -> é, etc. assuming Windows-1252/Latin1 mapping for 0x80-0xFF.
            rtfString = rtfString.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
                const code = parseInt(hex, 16);
                // Only decode extended ASCII range (128-255). 
                // Standard ASCII escapes (if any) might be handled slightly differently or not occur as \'xx often.
                if (code >= 0x80 && code <= 0xFF) {
                    return String.fromCharCode(code);
                }
                return match;
            });

            // Allow bypassing the document structure (html/head/body) which adds unwanted margins
            htmlContent = await rtfToHtml(rtfString, {
                template: (_doc: any, _defaults: any, content: string) => content
            });
        } catch (e) {
            console.error("Error converting RTF", e);
            if (Buffer.isBuffer(article.content)) {
                htmlContent = iconv.decode(article.content, 'win1252');
            } else {
                htmlContent = String(article.content);
            }
        }
    }

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
            <div className="relative h-[40vh] w-full bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-50" />
                <Navbar />
                <div className="relative z-20 container mx-auto h-full flex items-end pb-12 px-4">
                    <div className="max-w-4xl">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="bg-amber-600/90 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
                                Noticia
                            </span>
                            <span className="text-white/80 font-mono text-sm">
                                {article.date || `Año ${article.publicationYear}`}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                            {article.title || "Sin Título"}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-3xl -mt-10 relative z-30">
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 md:p-12 border border-gray-100 dark:border-zinc-800">
                    <h2 className="text-xl md:text-2xl font-serif italic text-gray-600 dark:text-gray-300 mb-8 leading-relaxed border-b border-gray-200 dark:border-zinc-800 pb-8">
                        {article.subtitle}
                    </h2>

                    <div className="prose prose-lg dark:prose-invert max-w-none font-serif">
                        <div
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
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
