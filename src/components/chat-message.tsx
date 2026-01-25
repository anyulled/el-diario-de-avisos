"use client";

import { type UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

function ChatMessage({ message }: { message: UIMessage }) {
  const getMessageContent = (m: UIMessage) => {
    return m.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  return (
    <div className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user" ? "bg-zinc-800" : "bg-amber-600"}`}>
        {message.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          message.role === "user"
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-none"
            : "bg-amber-50 dark:bg-amber-900/20 text-zinc-800 dark:text-zinc-200 border border-amber-100 dark:border-amber-900/30 rounded-tl-none"
        }`}
      >
        {message.role === "assistant" ? (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline prose-a:font-medium hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300">
            <ReactMarkdown
              components={{
                a: ({ node: _node, ...props }) => (
                  <a
                    {...props}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            >
              {getMessageContent(message)}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{getMessageContent(message)}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Memoized to prevent re-renders of all messages when the user types in the input
 * or when new messages are added to the list.
 */
export default memo(ChatMessage);
