import ImageGallery from "@/components/ImageGallery";
import { Metadata } from "next";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Galería | Crónicas Musicales",
  description: "Galería de imágenes históricas restauradas",
};

export default async function GalleryPage() {
  const imagesDir = path.join(process.cwd(), "public/images/restored");

  const getImages = () => {
    try {
      return fs
        .readdirSync(imagesDir)
        .filter((file) => file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg"))
        .sort();
    } catch (error) {
      console.error("Error reading images directory:", error);
      return [];
    }
  };
  const imageFiles = getImages();

  const images = imageFiles.map((filename) => ({
    src: `/images/restored/${filename}`,
    alt: `Recorte histórico restaurado: ${filename.replaceAll("_", " ").split(".")[0]}`,
  }));

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300">
        Galería de Imágenes
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
        Explora nuestra colección de recortes históricos y documentos restaurados digitalmente.
      </p>

      <ImageGallery images={images} />
    </div>
  );
}
