import { useState, useContext, useRef, useEffect } from "react";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import QuickReplies from "./QuickReplies";
import TyperIndicator from "./TyperIndicator";

import { sendChatMessage, uploadFile, getChatSessions, getSessionHistory, type ChatSessionSummary } from "../services/chatApi";
import { LanguageContext } from "../context/LanguageContext";

import { MdHistory, MdArrowBack, MdAdd, MdChatBubbleOutline } from "react-icons/md"; 
import { useTranslation } from "react-i18next";

import BotLogo from "../assets/logo.png";

type Message = { role: "user" | "assistant"; content: string };
type UIMessage = { sender: "user" | "bot"; text: string; isHealthRelated?: boolean };

export default function Chatbot() {
  const { selectedLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();

  // --- STATE ---
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<UIMessage[]>([{ sender: "bot", text: t("greeting") }]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([{ role: "assistant", content: t("greeting") }]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<ChatSessionSummary[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ---------- AUTO-LOAD LAST CHAT (RESUME) ---------- */
  useEffect(() => {
    async function loadMostRecentChat() {
      try {
        const sessions = await getChatSessions();
        if (sessions.length > 0) {
          const lastSessionId = sessions[0].sessionId;
          if (lastSessionId !== sessionId) {
            console.log("🔄 Auto-resuming last session:", lastSessionId);
            await switchChat(lastSessionId);
          }
        }
      } catch (err) {
        console.error("Could not auto-load last chat", err);
      }
    }
    loadMostRecentChat(); 
  }, []);

  /* ---------- ACTION: NEW CHAT ---------- */
  function handleNewChat() {
    const newId = crypto.randomUUID();
    setSessionId(newId);
    const greeting = t("greeting");
    setMessages([{ sender: "bot", text: greeting }]);
    setConversationHistory([{ role: "assistant", content: greeting }]);
    setShowHistory(false);
    console.log("✨ Started strict new session:", newId);
  }

  /* ---------- ACTION: LOAD HISTORY LIST ---------- */
  async function toggleHistory() {
    if (!showHistory) {
      try {
        const sessions = await getChatSessions();
        setHistoryList(sessions);
      } catch (error) {
        console.error("Could not load history list", error);
      }
    }
    setShowHistory(!showHistory);
  }

  /* ---------- ACTION: SWITCH TO SPECIFIC CHAT ---------- */
  async function switchChat(targetSessionId: string) {
    if (targetSessionId === sessionId && messages.length > 1) {
      setShowHistory(false); 
      return;
    }

    setIsTyping(true);

    try {
      const oldMessages = await getSessionHistory(targetSessionId);
      
      const uiMsgs: UIMessage[] = oldMessages.map((m: Message) => ({
        sender: m.role === 'user' ? 'user' : 'bot',
        text: m.content
      }));

      const historyMsgs: Message[] = oldMessages.map((m: Message) => ({
        role: m.role,
        content: m.content
      }));

      setSessionId(targetSessionId);
      setMessages(uiMsgs);
      setConversationHistory(historyMsgs);
      console.log("📂 Loaded isolated session:", targetSessionId);

    } catch (err) {
      console.error("Failed to load chat session", err);
    } finally {
      setIsTyping(false);
      setShowHistory(false); 
    }
  }

  /* ---------- ACTION: SEND MESSAGE ---------- */
  async function handleUserMessage(text: string) {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    const currentHistory: Message[] = [...conversationHistory, { role: "user", content: text }];
    
    setIsTyping(true);

    try {
      const reply = await sendChatMessage({
        message: text,
        conversationHistory: currentHistory,
        locale: selectedLanguage || "en",
        sessionId: sessionId,
      });

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setConversationHistory([...currentHistory, { role: "assistant", content: reply }]);
    } catch {
      const err = t("error_something_went_wrong");
      setMessages((prev) => [...prev, { sender: "bot", text: err }]);
    } finally {
      setIsTyping(false);
    }
  }

  /* ---------- ACTION: FILE UPLOAD ---------- */
  async function handleFileUpload(file: File) {
    const label = `${file.type.startsWith("image/") ? "🖼️" : "📄"} ${file.name}`;
    setMessages((prev) => [...prev, { sender: "user", text: label }]);
    const currentHistory: Message[] = [...conversationHistory, { role: "user", content: label }];
    setIsTyping(true);

    try {
      const res = await uploadFile({
        file,
        conversationHistory: currentHistory,
        locale: selectedLanguage || undefined,
        sessionId: sessionId,
      });

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.message, isHealthRelated: res.isHealthRelated },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-white text-neutral-dark relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-primary-dark border-b border-primary-darker z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1 rounded-lg">
             <img src={BotLogo} className="h-8 w-8 object-contain" alt="Bot Logo" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{t("HealthBot Assistant")}</div>
            <div className="text-xs text-primary-lighter opacity-90">{t("Always here to help")}</div>
          </div>
        </div>

        {/* --- CHANGED: Buttons are now Grey --- */}
        <div className="flex gap-2">
          {/* History Button */}
          <button
            onClick={toggleHistory}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
              showHistory 
                ? 'bg-white text-primary' 
                : 'bg-white/20 text-gray-700 hover:text-gray-500 hover:bg-white/30'
            }`}
            title={t("Chat History")}
          >
            {showHistory ? <MdArrowBack size={20} /> : <MdHistory size={20} />}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-9 h-9 rounded-full bg-white/20 text-gray-700 hover:text-gray-500 hover:bg-white/30 flex items-center justify-center transition-all duration-300 transform hover:scale-110"
            title={t("New Chat")}
          >
            <MdAdd size={22} />
          </button>
        </div>
      </div>

      {/* --- SIDEBAR --- */}
      <div 
        className={`absolute inset-0 z-10 flex transition-transform duration-300 ease-in-out ${showHistory ? "translate-x-0" : "-translate-x-full"}`}
        style={{ marginTop: '72px' }} 
      >
        <div className="w-64 h-full bg-gray-50 border-r border-gray-200 shadow-lg flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200">
            <button 
                onClick={() => { handleNewChat(); setShowHistory(false); }}
                className="w-full flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
            >
                <MdAdd /> 
                <span className="text-sm font-medium">{t("New Chat")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("History")}
            </p>
            
            {historyList.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    {t("No saved chats yet")}
                </div>
            )}

            {historyList.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => switchChat(session.sessionId)}
                className={`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors ${
                    sessionId === session.sessionId 
                    ? 'bg-white border border-primary/30 shadow-sm' 
                    : 'hover:bg-gray-200 border border-transparent'
                }`}
              >
                <MdChatBubbleOutline className={`mt-0.5 shrink-0 ${sessionId === session.sessionId ? 'text-primary' : 'text-gray-500'}`} />
                <div className="overflow-hidden">
                    <p className={`text-sm truncate font-medium ${sessionId === session.sessionId ? 'text-primary-dark' : 'text-gray-700'}`}>
                        {session.title || "New Chat"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(session.date).toLocaleDateString()}
                    </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowHistory(false)} />
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-4 bg-secondary-light/50">
        {messages.map((m, i) => (
          <ChatBubble key={i} sender={m.sender} text={m.text} isHealthRelated={m.isHealthRelated} />
        ))}
        {isTyping && <TyperIndicator />}
        <div ref={messagesEndRef} className="h-0" />
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-gray-100 bg-white px-4 py-2 shrink-0">
        {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
             <div className="mb-2">
                 <QuickReplies options={[t("Yes"), t("No"), t("Not sure")]} onSelect={handleUserMessage} />
             </div>
        )}
        
        <MessageInput onSend={handleUserMessage} onFileUpload={handleFileUpload} />
        
        <p className="text-[10px] text-neutral-medium text-center mt-1">
          HealthBot may make mistakes. Consult a doctor for serious issues.
        </p>
      </div>
    </div>
  );
}