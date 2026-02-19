// 1. Define the base URL dynamically
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "");

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

// Helper to get token
const getToken = () => localStorage.getItem('healthbot_token');

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
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
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
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers,
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
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Unauthorized to fetch sessions");
        return []; // Return empty if not logged in
      }
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
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`, { headers });

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

// 3. Delete a chat session
export async function deleteChatSession(sessionId: string): Promise<void> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
    method: "DELETE",
    headers
  });
}