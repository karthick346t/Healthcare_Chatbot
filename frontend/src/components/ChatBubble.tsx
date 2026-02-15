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
        "w-full flex mb-3 animate-fadeIn",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "relative px-4 py-3 rounded-3xl shadow-md animate-fadeIn",
          "max-w-[85%] md:max-w-[75%] lg:max-w-[65%]",
          "text-[15px] leading-relaxed break-words",
          isUser ? "bg-[#4C5BD8] text-white" : "bg-[#3A4CA8] text-white"
        )}
      >
        {/* Speaker Button for Bot */}
        {!isUser && isSupported && (
          <button
            onClick={() => isSpeaking ? stop() : speak(text)}
            className={clsx(
              "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200",
              isSpeaking ? "bg-red-500/20 text-red-200" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            )}
            title={isSpeaking ? "Stop speaking" : "Read out loud"}
          >
            {isSpeaking ? <MdStop className="w-4 h-4" /> : <MdVolumeUp className="w-4 h-4" />}
          </button>
        )}

        {/* Bubble tail */}
        <span
          className={clsx(
            "absolute bottom-1 w-3 h-3 rounded-full",
            isUser ? "right-[-4px] bg-[#4C5BD8]" : "left-[-4px] bg-[#3A4CA8]"
          )}
        />

        {/* ⚠️ Non-health warning */}
        {showWarning && (
          <div className="mb-3 p-3 rounded-2xl bg-yellow-100/95 text-yellow-900 text-sm flex gap-2 shadow-sm">
            <span>⚠️</span>
            <span>This document may not be health-related.</span>
          </div>
        )}

        {/* MARKDOWN */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 whitespace-pre-wrap">{children}</p>,

            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),

            em: ({ children }) => <em className="italic">{children}</em>,

            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li>{children}</li>,

            a: ({ href, children }) => (
              <a
                href={href}
                className="text-teal-200 underline hover:text-teal-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),

            h1: ({ children }) => (
              <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold mb-2 mt-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mb-2 mt-2">{children}</h3>
            ),

            hr: () => <hr className="my-3 border-white/20" />,

            pre: ({ children }) => (
              <pre className="bg-black/25 text-teal-50 p-3 rounded-xl overflow-x-auto text-[13px] font-mono my-3">
                {children}
              </pre>
            ),

            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code
                    className="bg-black/20 px-1.5 py-0.5 rounded text-[13px] font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },

            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-xl shadow-md">
                <table className="w-full border-collapse overflow-hidden rounded-xl text-sm bg-white/10 backdrop-blur">
                  {children}
                </table>
              </div>
            ),

            thead: ({ children }) => (
              <thead className="bg-white/20 text-white font-semibold">
                {children}
              </thead>
            ),

            tbody: ({ children }) => <tbody>{children}</tbody>,

            tr: ({ children }) => (
              <tr className="border-b border-white/10 even:bg-white/5">{children}</tr>
            ),

            th: ({ children }) => (
              <th className="px-4 py-3 text-left border border-white/10 font-semibold">
                {children}
              </th>
            ),

            td: ({ children }) => (
              <td className="px-4 py-3 border border-white/10">
                {children}
              </td>
            ),
          }}
        >
          {normalizedText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
