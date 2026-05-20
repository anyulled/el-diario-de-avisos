"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";

/*
 * ⚡ Bolt: Dynamically import ChatInterface to code-split the heavy @ai-sdk/react library
 * and its dependencies. It will only be loaded when the user opens the chat for the first time,
 * significantly reducing the initial JS bundle size for all pages.
 */
const ChatInterface = dynamic(() => import("./chat-interface"), { ssr: false });

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const pathname = usePathname();

  if (pathname === "/chat") return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-in-out transform origin-bottom-right mb-4 w-[400px] max-w-[90vw] shadow-2xl rounded-xl overflow-hidden ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none h-0"
        }`}
      >
        {hasOpened && <ChatInterface className="h-[500px] w-full" />}
      </div>

      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasOpened(true);
        }}
        className="pointer-events-auto bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-50"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
