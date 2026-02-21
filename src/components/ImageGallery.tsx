"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Image from "next/image";

interface ImageGalleryProps {
  images: { src: string; alt?: string }[];
}

export default function ImageGallery({ images }: Readonly<ImageGalleryProps>) {
  const [index, setIndex] = useState(-1);

  if (!images || images.length === 0) {
    return <div className="text-center py-10 text-gray-500">No hay imágenes en la galería.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((image, idx) => (
          <div
            key={idx}
            className="cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all aspect-square relative group"
            onClick={() => setIndex(idx)}
          >
            <Image
              src={image.src}
              alt={image.alt || `Image ${idx}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        ))}
      </div>

      <Lightbox index={index} open={index >= 0} close={() => setIndex(-1)} slides={images} plugins={[Zoom, Thumbnails]} />
    </>
  );
}
