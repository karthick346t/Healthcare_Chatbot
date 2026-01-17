import { useState, useEffect, useRef } from "react";

// 1. Type definitions for the Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export function useSpeechRecognition({ 
  onResult, 
  langCode = "en" 
}: { 
  onResult: (text: string) => void;
  langCode?: string | null;
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // 2. Map your simple language codes to BCP 47 tags required by browsers
  const getBCP47Tag = (code: string | null) => {
    switch (code) {
      case "ta": return "ta-IN"; // Tamil
      case "hi": return "hi-IN"; // Hindi
      case "te": return "te-IN"; // Telugu
      case "kn": return "kn-IN"; // Kannada
      default: return "en-US";   // English (Default)
    }
  };

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechConstructor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechConstructor();
    recognition.continuous = false; // Stop automatically after one sentence
    recognition.interimResults = false;
    recognition.lang = getBCP47Tag(langCode);

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && onResult) {
        onResult(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [langCode, onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Mic already active");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return { isListening, toggleListening, isSupported };
}