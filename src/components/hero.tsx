export function Hero() {
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden bg-zinc-900">
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 to-blue-900/30 z-10" />

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75 bg-fixed"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop')",
        }}
      />

      <div className="relative z-20 container mx-auto h-full flex flex-col justify-center items-center text-center px-4 pt-10">
        <div className="mb-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full backdrop-blur-sm">
          <span className="text-amber-200 text-xs font-semibold tracking-widest uppercase">Archivo Histórico</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter mb-6 drop-shadow-2xl">Noticias Musicales en el Diario de Avisos</h1>
        <p className="text-lg md:text-2xl text-zinc-300 max-w-2xl font-light leading-relaxed">
          Un viaje a través del tiempo, descubriendo las noticias que marcaron la historia musical venezolana.
        </p>
      </div>
    </div>
  );
}
