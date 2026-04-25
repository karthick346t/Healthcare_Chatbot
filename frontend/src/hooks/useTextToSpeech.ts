import { useState, useCallback, useEffect, useContext, useRef } from "react";
import { LanguageContext } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/apiConfig";

export function useTextToSpeech() {
    const { selectedLanguage } = useContext(LanguageContext);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const fetchGoogleTts = async (text: string, lang: string): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, languageCode: lang })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.audioContent;
        } catch (error) {
            console.error("[TTS Hook] Google TTS fetch failed:", error);
            return null;
        }
    };

    const speak = useCallback(async (text: string) => {
        if (!supported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const cleanedText = cleanForSpeech(text);
        if (!cleanedText) return;

        const langTag = detectLanguage(text);

        // --- 1. Attempt Google Cloud TTS (Premium) ---
        setIsSpeaking(true);
        const googleAudio = await fetchGoogleTts(cleanedText, langTag);

        if (googleAudio) {
            try {
                console.info(`[TTS Hook] 🚀 Using High-Quality Google Cloud TTS (${langTag})`);
                
                // Cleanup previous audio if any
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }

                const audio = new Audio(`data:audio/mp3;base64,${googleAudio}`);
                audioRef.current = audio;

                audio.onended = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };

                audio.play();
                return; // Audio found, we're done!
            } catch (err) {
                console.error("[TTS Hook] Error playing Google audio:", err);
                audioRef.current = null;
            }
        }

        // --- 2. Fallback to Native Speech API (Free) ---
        console.log("[TTS Hook] Falling back to native browser speech synthesis");
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
        // Stop browser native speech
        window.speechSynthesis.cancel();
        
        // Stop Google Cloud audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking, isSupported: supported };
}
