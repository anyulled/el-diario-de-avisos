import ChatInterface from "@/components/chat-interface";
import { Navbar } from "@/components/navbar";
import { getArticleCount } from "@/lib/articles";

export const metadata = {
  title: "Asistente del Archivo | Noticias Musicales en el Diario de Avisos",
  description: "Conversa con la historia de nuestros archivos a través de nuestro asistente inteligente.",
};

export default async function ChatPage() {
  const articleCount = await getArticleCount();
  // Fallback static number if DB fails or returns 0, matching the user's intent
  const fallbackCount = "22,900+";

  const displayCount = articleCount > 0 ? `${(Math.floor(articleCount / 100) * 100).toLocaleString("en-US")}+` : fallbackCount;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Explora el Archivo Histórico</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-serif italic">
            "Un viaje a través de las décadas, ahora al alcance de tu mano."
          </p>
        </div>

        <ChatInterface />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm">
            <h4 className="font-bold mb-2 dark:text-white">Búsqueda Semántica</h4>
            <p className="text-sm text-gray-500">No solo palabras clave, entiende el contexto de tu consulta.</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm">
            <h4 className="font-bold mb-2 dark:text-white">Acceso a {displayCount} Artículos</h4>
            <p className="text-sm text-gray-500">Recuperación instantánea de décadas de periodismo.</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm">
            <h4 className="font-bold mb-2 dark:text-white">Citas Directas</h4>
            <p className="text-sm text-gray-500">Obtén referencias exactas de fechas y títulos de noticias.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
