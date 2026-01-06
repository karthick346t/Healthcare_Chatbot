// 1. Define the base URL dynamically
// If you are using Vite (which you are), use import.meta.env.
// If using Create React App, use process.env.REACT_APP_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

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

    // 2. Read the actual error from the backend if available
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); 
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error; // Re-throw so the UI can show the error state
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
  // Important: Backend must JSON.parse() this field
  formData.append("conversationHistory", JSON.stringify(conversationHistory)); 
  formData.append("locale", locale);
  formData.append("sessionId", sessionId);

  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
      // Note: Do NOT set Content-Type header for FormData; fetch sets it automatically with the boundary
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