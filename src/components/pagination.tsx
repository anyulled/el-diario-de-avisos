"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
    total: number;
    pageSize: number;
    currentPage: number;
}

export function Pagination({ total, pageSize, currentPage }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        startTransition(() => {
            router.push(`/?${params.toString()}`);
        });
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    disabled={currentPage === i || isPending}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i
                            ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                            : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="flex flex-col items-center gap-4 mt-12 pb-10">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    title="Primera página"
                >
                    <ChevronsLeft size={18} />
                </button>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    title="Anterior"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2 mx-2">
                    {renderPageNumbers()}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    title="Siguiente"
                >
                    <ChevronRight size={18} />
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                    title="Última página"
                >
                    <ChevronsRight size={18} />
                </button>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Página {currentPage} de {totalPages} • Total {total} resultados
            </p>
        </div>
    );
}
