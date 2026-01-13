"use client";

import { articles } from "@/db/schema";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Navigation, Pagination, Parallax } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useState } from "react";
import { type Swiper as SwiperType } from "swiper";

export function ArticleSwiper({
  articles: news,
  backgroundImage = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop",
}: {
  articles: (typeof articles.$inferSelect & { extract: string })[];
  backgroundImage?: string;
}) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  return (
    <div className="relative group max-w-5xl mx-auto">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, Parallax]}
        spaceBetween={40}
        slidesPerView={1}
        parallax={true}
        speed={600}
        onSwiper={(s) => {
          setSwiper(s);
          setIsBeginning(s.isBeginning);
          setIsEnd(s.isEnd);
        }}
        onSlideChange={(s) => {
          setIsBeginning(s.isBeginning);
          setIsEnd(s.isEnd);
        }}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 8000,
          disableOnInteraction: false,
        }}
        className="rounded-3xl overflow-hidden shadow-2xl"
      >
        <div
          slot="container-start"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
          data-swiper-parallax="-23%"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>

        {news.map((item) => {
          const year = item.publicationYear && item.publicationYear > 0 ? item.publicationYear : item.date ? new Date(item.date).getFullYear() : "N/A";

          return (
            <SwiperSlide key={item.id} className="min-h-[500px] flex items-center justify-center py-20">
              <div className="relative z-10 p-8 md:p-16 text-center text-white max-w-3xl mx-auto" data-swiper-parallax="-300">
                <div className="mb-8" data-swiper-parallax="-200">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-4">
                    {year}
                  </span>
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight drop-shadow-lg">
                    <Link href={`/article/${item.id}`} className="hover:text-amber-300 transition-colors">
                      {item.title || "Sin Título"}
                    </Link>
                  </h3>
                  {item.subtitle && <h4 className="text-xl text-zinc-300 font-light mb-6">{item.subtitle}</h4>}
                </div>

                <div className="prose prose-lg prose-invert mx-auto mb-10 line-clamp-6" data-swiper-parallax="-100">
                  <p>{item.extract}</p>
                </div>

                <div data-swiper-parallax="-100">
                  <Link
                    href={`/article/${item.id}`}
                    className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition-colors shadow-lg hover:shadow-amber-500/20"
                  >
                    Leer artículo completo
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button
        onClick={() => swiper?.slidePrev()}
        disabled={isBeginning}
        aria-disabled={isBeginning}
        className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed hover:scale-110 hover:bg-white/20"
        aria-label="Previous slide"
      >
        <ArrowLeft size={24} />
      </button>
      <button
        onClick={() => swiper?.slideNext()}
        disabled={isEnd}
        aria-disabled={isEnd}
        className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed hover:scale-110 hover:bg-white/20"
        aria-label="Next slide"
      >
        <ArrowRight size={24} />
      </button>
    </div>
  );
}
