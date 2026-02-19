import clsx from "clsx";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MdVolumeUp, MdStop } from "react-icons/md";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface ChatBubbleProps {
  sender: "user" | "bot";
  text: string;
  isHealthRelated?: boolean;
}

/**
 * Turn a single-line, pipe-heavy health message into:
 *   [intro paragraph] + markdown table + [note paragraph]
 *
 * Works for inputs like:
 *   | long intro... | Header1 | Header2 | Header3 | | --- | --- | --- | | row... | ... | ... | Note... |
 */
function normalizeHealthMarkdown(input: string): string {
  // Only touch single-line texts that contain pipes.
  if (input.includes("\n") || !input.includes("|")) return input;

  const firstPipe = input.indexOf("|");
  const lastPipe = input.lastIndexOf("|");
  if (firstPipe === -1 || lastPipe <= firstPipe) return input;

  const globalPrefix = input.slice(0, firstPipe).trim();
  const middle = input.slice(firstPipe, lastPipe + 1);
  const globalSuffix = input.slice(lastPipe + 1).trim();

  // Split rows at " | | " or "||" (row glue)
  let segments = middle.split(/\s*\|\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return input;

  let headerCells: string[] | null = null;
  const dataRows: string[][] = [];

  let extraIntro = "";
  let extraNote = "";

  segments.forEach((seg, idx) => {
    // Split into cells on single pipes
    let cells = seg
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    if (!cells.length) return;

    // If all cells are just dashes, it's the separator row -> skip (we'll insert our own)
    const allDash = cells.every((c) => /^-+$/.test(c.replace(/\s+/g, "")));
    if (allDash) return;

    // Heuristic: very long first cell in the first segment is likely the intro paragraph.
    if (idx === 0 && cells.length > 1 && cells[0].length > 120) {
      extraIntro = cells[0];
      cells = cells.slice(1);
    }

    // Heuristic: very long last cell in the last segment is likely the trailing note.
    if (
      idx === segments.length - 1 &&
      cells.length > 1 &&
      cells[cells.length - 1].length > 120
    ) {
      extraNote = cells[cells.length - 1];
      cells = cells.slice(0, -1);
    }

    if (!cells.length) return;

    if (!headerCells) {
      headerCells = cells;
    } else {
      dataRows.push(cells);
    }
  });

  if (!headerCells) return input;

  const headers = headerCells as string[];
  const colCount = headers.length;

  const headerLine = "| " + headers.join(" | ") + " |";
  const sepLine = "| " + Array(colCount).fill("---").join(" | ") + " |";

  const rowLines: string[] = [headerLine, sepLine];

  dataRows.forEach((row) => {
    const normalized = [...row];
    if (normalized.length < colCount) {
      while (normalized.length < colCount) normalized.push("");
    } else if (normalized.length > colCount) {
      normalized.length = colCount;
    }
    rowLines.push("| " + normalized.join(" | ") + " |");
  });

  const prefixText = [globalPrefix, extraIntro].filter(Boolean).join(" ").trim();
  const suffixText = [extraNote, globalSuffix].filter(Boolean).join(" ").trim();

  let result = "";

  if (prefixText) result += prefixText + "\n\n";
  result += rowLines.join("\n");
  if (suffixText) result += "\n\n" + suffixText;

  return result;
}

export default function ChatBubble({ sender, text, isHealthRelated }: ChatBubbleProps) {
  const isUser = sender === "user";
  const showWarning = sender === "bot" && isHealthRelated === false;

  const normalizedText = React.useMemo(() => normalizeHealthMarkdown(text), [text]);
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  return (
    <div
      className={clsx(
        "w-full flex mb-4 animate-fadeIn group", // Added group for hover effects if needed later
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={clsx("flex max-w-[85%] md:max-w-[75%] lg:max-w-[65%] gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* AVATAR PLACEHOLDER (Optional - can be added here) */}
        
        {/* MESSAGE BUBBLE */}
        <div
          className={clsx(
            "relative px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words border",
            isUser 
              ? "bg-[#4C5BD8] text-white rounded-br-sm border-[#4C5BD8]" 
              : "bg-white text-neutral-800 rounded-bl-sm border-neutral-100"
          )}
        >
           {/* ⚠️ Non-health warning */}
          {showWarning && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-100 flex gap-2">
              <span>⚠️</span>
              <span>This document may not be health-related.</span>
            </div>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              a: ({ href, children }) => (
                <a href={href} className="text-cyan-600 underline hover:text-cyan-700" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-2">{children}</h3>,
              hr: () => <hr className="my-3 border-neutral-200" />,
              pre: ({ children }) => (
                <pre className="bg-neutral-900 text-neutral-50 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3">
                  {children}
                </pre>
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded textxs font-mono border border-neutral-200" {...props}>{children}</code>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              },
              table: ({ children }) => (
                <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200">
                  <table className="w-full text-sm text-left">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-neutral-50 text-neutral-700 font-semibold">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-neutral-100">{children}</tbody>,
              tr: ({ children }) => <tr className="hover:bg-neutral-50/50 transition-colors">{children}</tr>,
              th: ({ children }) => <th className="px-4 py-2 border-b border-neutral-200">{children}</th>,
              td: ({ children }) => <td className="px-4 py-2">{children}</td>,
            }}
          >
            {normalizedText}
          </ReactMarkdown>
        </div>

        {/* ACTIONS SIDEBAR (Speaker, etc.) */}
        {!isUser && (
          <div className="flex flex-col justify-end pb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             {isSupported && (
              <button
                onClick={() => isSpeaking ? stop() : speak(text)}
                className={clsx(
                  "p-2 rounded-full transition-all duration-200 shadow-sm border",
                  isSpeaking 
                    ? "bg-red-50 text-red-500 border-red-100 animate-pulse" 
                    : "bg-white text-neutral-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 border-transparent"
                )}
                title={isSpeaking ? "Stop speaking" : "Read out loud"}
              >
                {isSpeaking ? <MdStop className="w-4 h-4" /> : <MdVolumeUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
