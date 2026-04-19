import { API_BASE_URL } from './apiConfig';

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

import { fetchWithAuth } from './authApi';

/* ---------- CHAT & UPLOAD FUNCTIONS ---------- */

export async function sendChatMessage({
  message,
  locale = "en",
  sessionId,
}: {
  message: string;
  locale?: string;
  sessionId: string;
}): Promise<{ message: string; isEmergency?: boolean }> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        locale,
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      message: data.message,
      isEmergency: data.isEmergency ?? false,
    };
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/upload`, {
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/chat/sessions`, {});

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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/chat/session/${sessionId}`, {});

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

export async function deleteChatSession(sessionId: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
    method: "DELETE"
  });
}

// 4. Send chat feedback
export async function sendChatFeedback(sessionId: string, rating: 1 | -1, messageId: string): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetchWithAuth(`${API_BASE_URL}/api/chat/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId, rating, messageId })
  });

  if (!response.ok) {
    console.error("Failed to send feedback", response.status);
  }
}