import { useState, useCallback, useEffect, useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export function useTextToSpeech() {
    const { selectedLanguage } = useContext(LanguageContext);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (!("speechSynthesis" in window)) {
            setSupported(false);
            return;
        }

        const updateVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            console.log("Voices updated:", availableVoices.length);
            setVoices(availableVoices);
        };

        // Some browsers need this event to load voices
        window.speechSynthesis.onvoiceschanged = updateVoices;
        updateVoices();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const detectLanguage = (text: string): string => {
        // Unicode ranges for local languages
        const patterns = {
            "ta-IN": /[\u0B80-\u0BFF]/, // Tamil
            "hi-IN": /[\u0900-\u097F]/, // Hindi/Devanagari
            "te-IN": /[\u0C00-\u0C7F]/, // Telugu
            "kn-IN": /[\u0C80-\u0CFF]/, // Kannada
        };

        for (const [lang, regex] of Object.entries(patterns)) {
            if (regex.test(text)) return lang;
        }

        // Fallback to the context's selected language or English
        const getBCP47Tag = (code: string | null) => {
            switch (code) {
                case "ta": return "ta-IN";
                case "hi": return "hi-IN";
                case "te": return "te-IN";
                case "kn": return "kn-IN";
                default: return "en-US";
            }
        };
        return getBCP47Tag(selectedLanguage);
    };

    const cleanForSpeech = (text: string) => {
        return text
            .replace(/#{1,6}\s?/g, "")
            .replace(/\*\*/g, "")
            .replace(/\|/g, " ")
            .replace(/-{3,}/g, " ")
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/[-*]\s/g, "")
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    const speak = useCallback((text: string) => {
        if (!supported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const cleanedText = cleanForSpeech(text);
        if (!cleanedText) return;

        const langTag = detectLanguage(text);
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = langTag;

        // Force voice selection based on detected language
        const currentVoices = window.speechSynthesis.getVoices();
        const preferredVoice = currentVoices.find(v => v.lang === langTag) ||
            currentVoices.find(v => v.lang.startsWith(langTag.split('-')[0]));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [selectedLanguage, supported, voices]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking, isSupported: supported };
}
