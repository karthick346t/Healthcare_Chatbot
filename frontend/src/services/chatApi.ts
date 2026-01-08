// 1. Define the base URL dynamically
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// New Type for the History Sidebar
export type ChatSessionSummary = {
  sessionId: string;
  title: string;
  date: string;
};

/* ---------- CHAT & UPLOAD FUNCTIONS ---------- */

export async function sendChatMessage({
  message,
  conversationHistory = [],
  locale = "en",
  sessionId,
}: {
  message: string;
  conversationHistory?: Message[];
  locale?: string;
  sessionId: string;
}): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        locale,
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); 
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
}

export async function uploadFile({
  file,
  conversationHistory = [],
  locale = "en",
  sessionId,
}: {
  file: File;
  conversationHistory?: Message[];
  locale?: string;
  sessionId: string;
}): Promise<{ message: string; isHealthRelated: boolean }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversationHistory", JSON.stringify(conversationHistory)); 
  formData.append("locale", locale);
  formData.append("sessionId", sessionId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "File upload failed");
    }

    const data = await response.json();
    return {
      message: data.message,
      isHealthRelated: data.isHealthRelated ?? true
    };
  } catch (error) {
    console.error("Upload API Error:", error);
    throw error;
  }
}

/* ---------- HISTORY FUNCTIONS (NEW) ---------- */

// 1. Fetch the list of past conversations (for the sidebar)
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get Sessions Error:", error);
    throw error;
  }
}

// 2. Fetch the specific messages for one session (when clicking a history item)
export async function getSessionHistory(sessionId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get History Error:", error);
    throw error;
  }
}