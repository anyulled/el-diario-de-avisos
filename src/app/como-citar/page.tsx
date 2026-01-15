import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ComoCitarPage() {
  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          Volver al inicio
        </Link>

        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">¿Cómo citar esta fuente?</h1>
        </header>

        <section className="space-y-6 text-lg text-white/80 leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Artículo con autor:</h2>
            <p>
              Nombre del autor del artículo; nombre del título del artículo &quot;entre comillas&quot;; y <em>Diario de avisos</em> (en cursiva), sucedido de
              fecha y página. Tomado de: <strong>Raquel Campomás y Yurenia Santana, Noticias Musicales en el Diario de Avisos</strong> (en negrillas). Base de
              datos disponible en: https://diario-de-avisos.vercel.app/
            </p>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest mb-2">Ejemplo:</h3>
              <p className="font-serif">
                M. de B. [Mariano de Briceño], “Concierto de la Srita Seamann”. <em>Diario de Avisos</em>, miércoles 11 de julio de 1855, pp. 3 y 4. Tomado de:{" "}
                <strong>Raquel Campomás y Yurenia Santana, Noticias musicales en el Diario de Avisos</strong>. Base de datos disponible en:
                https://diario-de-avisos.vercel.app/
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Artículo sin autor:</h2>
            <p>De no señalarse autor, la referencia entra por título, quedando el resto de la información igual:</p>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest mb-2">Ejemplo:</h3>
              <p className="font-serif">
                “Brindis Salas”. <em>Diario de avisos</em>, sábado 18 de noviembre de 1876, p. 3. Tomado de:{" "}
                <strong>Raquel Campomás y Yurenia Santana, Noticias musicales en el Diario de Avisos</strong>. Base de datos disponible en:
                https://diario-de-avisos.vercel.app/
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
