import { useState, useContext, useRef, useEffect } from "react";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import QuickReplies from "./QuickReplies";
import TyperIndicator from "./TyperIndicator";

import { sendChatMessage, uploadFile } from "../services/chatApi";
import { LanguageContext } from "../context/LanguageContext";

import { GiCycle } from "react-icons/gi";
import { useTranslation } from "react-i18next";

import BotLogo from "../assets/logo.png";

/* ---------- SESSION HELPER ---------- */
function getSessionId() {
  let sid = window.sessionStorage.getItem("healthbot-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    window.sessionStorage.setItem("healthbot-session-id", sid);
  }
  return sid;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UIMessage = {
  sender: "user" | "bot";
  text: string;
  isHealthRelated?: boolean;
};

export default function Chatbot() {
  const userSessionId = useRef(getSessionId()).current;
  const { selectedLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();

  /* ---------- CHAT STATE ---------- */
  // Note: We removed 'open' state because App.tsx handles visibility now
  
  const [messages, setMessages] = useState<UIMessage[]>([
    { sender: "bot", text: t("greeting") },
  ]);

  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    { role: "assistant", content: t("greeting") },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* ---------- AUTO SCROLL ---------- */
  // Runs whenever messages change to keep view at the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ---------- UPDATE GREETING ON LANGUAGE CHANGE ---------- */
  useEffect(() => {
    // Only reset if it's the very first message to avoid wiping active chats
    if (messages.length === 1 && messages[0].sender === 'bot') {
       const greeting = t("greeting");
       setMessages([{ sender: "bot", text: greeting }]);
       setConversationHistory([{ role: "assistant", content: greeting }]);
    }
  }, [selectedLanguage, t]);

  /* ---------- SEND MESSAGE ---------- */
  async function handleUserMessage(text: string) {
    setMessages((m) => [...m, { sender: "user", text }]);

    const history: Message[] = [...conversationHistory, { role: "user", content: text }];
    setIsTyping(true);

    try {
      const reply = await sendChatMessage({
        message: text,
        conversationHistory: history,
        locale: selectedLanguage || "en",
        sessionId: userSessionId,
      });

      setMessages((m) => [...m, { sender: "bot", text: reply }]);
      setConversationHistory([...history, { role: "assistant", content: reply }]);
    } catch {
      const err = t("error_something_went_wrong");
      setMessages((m) => [...m, { sender: "bot", text: err }]);
    } finally {
      setIsTyping(false);
    }
  }

  /* ---------- FILE UPLOAD ---------- */
  async function handleFileUpload(file: File) {
    const label = `${file.type.startsWith("image/") ? "🖼️" : "📄"} ${file.name}`;
    setMessages((m) => [...m, { sender: "user", text: label }]);

    const history: Message[] = [...conversationHistory, { role: "user", content: label }];
    setIsTyping(true);

    try {
      const res = await uploadFile({
        file,
        conversationHistory: history,
        locale: selectedLanguage || undefined,
        sessionId: userSessionId,
      });

      setMessages((m) => [
        ...m,
        { sender: "bot", text: res.message, isHealthRelated: res.isHealthRelated },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  /* ---------- RESTART ---------- */
  function handleStartOver() {
    const greeting = t("greeting");
    setMessages([{ sender: "bot", text: greeting }]);
    setConversationHistory([{ role: "assistant", content: greeting }]);
  }

  /* ---------- UI RENDER ---------- */
  // The outer container fills the wrapper provided by App.tsx
  return (
    <div className="flex flex-col w-full h-[600px] bg-white text-neutral-dark">
      
      {/* HEADER: Teal Background */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-primary-dark border-b border-primary-darker">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1 rounded-lg">
             <img src={BotLogo} className="h-8 w-8 object-contain" alt="Bot Logo" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {t("HealthBot Assistant")}
            </div>
            <div className="text-xs text-primary-lighter opacity-90">
              {t("Always here to help")}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartOver}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          title={t("Start Over")}
        >
          <GiCycle />
        </button>
      </div>

      {/* MESSAGES AREA: Light Teal/Grey Background */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-secondary-light">
        {messages.map((m, i) => (
          <ChatBubble 
            key={i} 
            sender={m.sender} 
            text={m.text} 
            isHealthRelated={m.isHealthRelated} 
          />
        ))}
        {isTyping && <TyperIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA: White Background */}
      <div className="border-t border-gray-100 bg-white px-5 py-4 space-y-3">
        {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
             <QuickReplies
                options={[t("Yes"), t("No"), t("Not sure")]}
                onSelect={handleUserMessage}
              />
        )}
        
        <MessageInput
          onSend={handleUserMessage}
          onFileUpload={handleFileUpload}
        />
        
        <p className="text-[10px] text-neutral-medium text-center">
          HealthBot may make mistakes. Consult a doctor for serious issues.
        </p>
      </div>
    </div>
  );
}