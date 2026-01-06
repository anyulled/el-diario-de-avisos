"use client";

import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { Bot, Library, Send, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatInterface({ className }: { className?: string }) {
  const { messages, sendMessage, setMessages, status } = useChat();
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  };

  const getMessageContent = (m: UIMessage) => {
    return m.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("");
  };

  return (
    <div
      className={`flex flex-col border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl ${className ?? "h-[600px] w-full max-w-4xl mx-auto"
        }`}
    >
      {/* Header */}
      <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6" />
          <div>
            <h3 className="font-bold leading-none">Asistente del Archivo</h3>
            <p className="text-xs text-amber-100 mt-1">
              Chat con la historia periodística
            </p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="p-2 hover:bg-amber-700 rounded-full transition-colors"
          title="Limpiar conversación"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <Bot className="w-12 h-12 text-amber-600" />
            <div className="max-w-xs">
              <p className="font-medium text-lg">¿En qué puedo ayudarte hoy?</p>
              <p className="text-sm">
                Pregúntame sobre noticias antiguas, efemérides o personajes de
                nuestros archivos.
              </p>
            </div>
          </div>
        )}

        {messages.map((m: UIMessage) => (
          <div
            key={m.id}
            className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-zinc-800" : "bg-amber-600"
                }`}
            >
              {m.role === "user" ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${m.role === "user"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-none"
                : "bg-amber-50 dark:bg-amber-900/20 text-zinc-800 dark:text-zinc-200 border border-amber-100 dark:border-amber-900/30 rounded-tl-none"
                }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {getMessageContent(m)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl rounded-tl-none px-4 py-3 border border-amber-100 dark:border-amber-900/30">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50"
      >
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu consulta sobre el archivo..."
            className="w-full bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-lg pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all dark:text-white shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 text-amber-600 hover:text-amber-700 disabled:opacity-30 disabled:hover:text-amber-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          El asistente puede cometer errores. Verifique la información
          importante con los artículos originales.
        </p>
      </form>
    </div>
  );
}
