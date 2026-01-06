import { Info } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="absolute top-0 left-0 right-0 z-50 py-6 text-white/90">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="font-bold text-xl tracking-tighter hover:text-white transition-colors">
                    DIARIO DE AVISOS
                </Link>
                <Link href="/about" className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm">
                    <Info size={16} />
                    <span className="text-sm font-medium">Acerca de</span>
                </Link>
            </div>
        </nav>
    );
}
