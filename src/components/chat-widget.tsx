"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ChatInterface from "./chat-interface";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Don't show the widget on the dedicated chat page
    if (pathname === "/chat") return null;

    return (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end pointer-events-none">
            <div
                className={`pointer-events-auto transition-all duration-300 ease-in-out transform origin-bottom-right mb-4 w-[400px] max-w-[90vw] shadow-2xl rounded-xl overflow-hidden ${isOpen
                        ? "scale-100 opacity-100 translate-y-0"
                        : "scale-90 opacity-0 translate-y-10 pointer-events-none h-0"
                    }`}
            >
                <ChatInterface className="h-[500px] w-full" />
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-50"
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}
