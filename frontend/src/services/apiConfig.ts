/**
 * Centralized API configuration to standardise backend URL handling
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export const API_URL = `${API_BASE_URL}/api`;
