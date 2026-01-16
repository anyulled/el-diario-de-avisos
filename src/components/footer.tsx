import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full py-12 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 pb-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Noticias Musicales en el Diario de Avisos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Un archivo histórico digital dedicado a la preservación y difusión de la memoria musical venezolana.
            </p>
          </div>

          <div className="flex items-center gap-8 pl-4 border-l-0 md:border-l border-gray-200 dark:border-zinc-800">
            <div className="flex flex-col items-center gap-2">
              <a
                href="http://www.ucv.ve/artes"
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-12 w-auto aspect-[1/1] grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
              >
                <Image src="/logo.png" alt="Logo Escuela de Artes" height={48} width={48} className="object-contain h-full w-auto" />
              </a>
            </div>

            <div className="flex flex-col items-center gap-2">
              <a
                href="http://www.ucv.ve/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-12 w-auto aspect-[1/1] grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
              >
                <Image
                  src="/logo_ucv.jpg"
                  alt="Logo Universidad Central de Venezuela"
                  height={48}
                  width={48}
                  className="object-contain h-full w-auto mix-blend-multiply dark:mix-blend-normal rounded-full"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Noticias Musicales en el Diario de Avisos. Todos los derechos reservados.</p>
          <p>
            <a href="http://www.ucv.ve/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition-colors">
              Universidad Central de Venezuela
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
