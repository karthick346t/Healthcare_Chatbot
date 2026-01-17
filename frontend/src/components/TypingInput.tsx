import React, { useEffect, useState, useRef } from "react";
import { Send, Paperclip } from "lucide-react"; // Assuming you use lucide-react icons

interface TypingInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  handleFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export default function TypingInput({ 
  input, 
  setInput, 
  handleSend, 
  handleFileSelect,
  isLoading 
}: TypingInputProps) {
  
  // 🩺 Healthcare-specific placeholders
  const texts = [
    "Describe your symptoms...",
    "Upload a blood test report...",
    "Ask about medication side effects...",
    "How do I lower my cholesterol?",
    "Upload a prescription...",
    "Ask about preventative care..."
  ];

  const [placeholder, setPlaceholder] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 Typing Animation Logic
  useEffect(() => {
    const currentText = texts[textIndex];
    const typingSpeed = isDeleting ? 40 : 80; // Adjusted for smoother feel

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);

        // If full phrase typed, wait before deleting
        if (charIndex + 1 === currentText.length) {
          setTimeout(() => setIsDeleting(true), 1500); // Wait 1.5s before deleting
        }
      } else {
        // Deleting backward
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);

        // If fully deleted, switch to next text
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Upload Medical Document"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
        />

        {/* Typing Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder} // 👈 The dynamic placeholder
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            input.trim() && !isLoading
              ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Send size={20} />
        </button>
      </div>
      
      {/* Disclaimer under input */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">
          AI can make mistakes. Please verify important medical information.
        </p>
      </div>
    </div>
  );
}