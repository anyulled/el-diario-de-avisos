interface HeroProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  backgroundImage?: string;
}

export function Hero(props: Readonly<HeroProps>) {
  const {
    title = "Noticias Musicales en la prensa caraqueña del siglo XIX",
    subtitle = "Un viaje a través del tiempo, descubriendo las noticias que marcaron la historia musical venezolana.",
    badge = "Archivo Histórico",
    backgroundImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop",
  } = props;
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden bg-zinc-900">
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-900/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-linear-to-r from-amber-900/30 to-blue-900/30 z-10" />

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75 bg-fixed"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
        }}
      />

      <div className="relative z-20 container mx-auto h-full flex flex-col justify-center items-center text-center px-4 pt-10">
        <div className="mb-6 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full backdrop-blur-md animate-in fade-in duration-700">
          <span className="text-amber-200 text-xs font-bold tracking-[0.2em] uppercase">{badge}</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tight mb-8 drop-shadow-2xl animate-slide-up [animation-delay:200ms]">{title}</h1>
        <p className="text-lg md:text-2xl text-zinc-300 max-w-3xl font-light leading-relaxed animate-slide-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
