import React, { useState, useRef, useCallback, memo, useContext, useEffect } from "react";
import { HiDocument } from "react-icons/hi2";
import { RiVoiceAiFill } from "react-icons/ri";
import { TbSend } from "react-icons/tb";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition"; 
import { LanguageContext } from "../context/LanguageContext"; 

type MessageInputProps = {
  onSend: (text: string) => void;
  onFileUpload: (file: File) => void;
};

// Healthcare-specific placeholder texts
const PLACEHOLDER_TEXTS = [
  "Describe your symptoms...",
  "Upload a blood test report...",
  "Ask about medication side effects...",
  "How do I lower my cholesterol?",
  "Ask about preventative care..."
];

const MessageInput = memo(function MessageInput({ onSend, onFileUpload }: MessageInputProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const [input, setInput] = useState("");
  
  // --- TYPEWRITER STATE START ---
  const [placeholder, setPlaceholder] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  // --- TYPEWRITER STATE END ---

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- TYPEWRITER EFFECT LOGIC ---
  useEffect(() => {
    // Pause animation if user is typing or listening
    if (input.length > 0) return;

    const currentText = PLACEHOLDER_TEXTS[textIndex];
    const typingSpeed = isDeleting ? 40 : 80; 

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);

        // If full phrase typed, wait before deleting
        if (charIndex + 1 === currentText.length) {
          setTimeout(() => setIsDeleting(true), 250); 
        }
      } else {
        // Deleting backward
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);

        // If fully deleted, switch to next text
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, input]);

  // --- VOICE LOGIC START ---
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => {
      const separator = prev.trim().length > 0 ? " " : "";
      return prev + separator + text;
    });
    setTimeout(adjustHeight, 0); 
  }, [adjustHeight]);

  const { isListening, toggleListening, isSupported } = useSpeechRecognition({
    onResult: handleVoiceResult,
    langCode: selectedLanguage
  });
  // --- VOICE LOGIC END ---

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  }, [adjustHeight]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed) {
      onSend(trimmed);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [input, onSend]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  }, [sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUploadWrapper = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = "";
    }
  }, [onFileUpload]);

  const isDisabled = !input.trim();

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-end gap-2 px-4 py-3 rounded-3xl bg-white 
                   border transition-all duration-200 shadow-sm hover:shadow-md
                   ${isListening ? "border-red-400 ring-1 ring-red-400" : "border-gray-200"}`}
      >
        {/* Left side buttons */}
        <div className="flex items-center gap-1 pb-1">
          {/* Voice button */}
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isListening 
                  ? "bg-red-100 text-red-600 animate-pulse" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-primary"
              }`}
              aria-label={isListening ? "Stop recording" : "Start recording"}
            >
              <RiVoiceAiFill className="w-5 h-5" />
            </button>
          )}

          {/* Upload button */}
          <button
            type="button"
            onClick={handleFileClick}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 
                      hover:text-primary transition-colors"
            aria-label="Upload file"
          >
            <HiDocument className="w-5 h-5" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUploadWrapper}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {/* Auto-resizing textarea with Typewriter Placeholder */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          // LOGIC: If listening, say "Listening...", otherwise use typewriter state
          placeholder={isListening ? "Listening..." : placeholder}
          className="flex-1 max-h-[200px] py-2 bg-transparent outline-none border-none 
                     text-gray-900 placeholder-gray-400 
                     text-[15px] leading-6 resize-none overflow-y-auto focus:ring-0"
          style={{ boxShadow: 'none' }}
          rows={1}
        />

        {/* Send button */}
        <div className="pb-1">
          <button
            type="submit"
            disabled={isDisabled}
            className={`p-2 rounded-lg transition-all ${
              isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-white bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transform active:scale-95"
            }`}
          >
            <TbSend className="w-5 h-5" />
          </button>
        </div>
      </form>
      
      {/* Listening Indicator Text */}
      {isListening && (
        <p className="text-xs text-red-500 text-center mt-2 font-medium animate-pulse">
          Listening to your voice... (Click mic to stop)
        </p>
      )}
    </div>
  );
});

export default MessageInput;