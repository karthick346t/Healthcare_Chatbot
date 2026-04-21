import { API_BASE_URL } from './apiConfig';

const API_BASE = `${API_BASE_URL}/api/auth`;

interface AuthResponse {
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
        googleId?: string;
        phone?: string;
        gender?: string;
        dateOfBirth?: string;
        bloodGroup?: string;
        address?: string;
    };
    token: string;
}

async function handleResponse(res: Response): Promise<any> {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }
    return data;
}

export async function apiRegister(
    name: string,
    email: string,
    password: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "omit", // usually credentials omit for register
    });
    return handleResponse(res);
}

export async function apiLogin(
    email: string,
    password: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "omit",
    });
    return handleResponse(res);
}

export async function apiGoogleLogin(idToken: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "omit",
    });
    return handleResponse(res);
}

export async function apiLogout(): Promise<void> {
    await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
    });
}

/**
 * Enhanced fetch wrapper that intercepts 401s and automatically asks the backend for a new
 * access token using the httpOnly refresh token cookie, then retries the original request.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("healthbot_token");
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Ensure URL is absolute if it starts with /api
    const absoluteUrl = url.startsWith('/') && !url.startsWith('http') 
        ? `${API_BASE_URL}${url}` 
        : url;

    let response = await fetch(absoluteUrl, { 
        credentials: "include", 
        ...options, 
        headers 
    });

    // Intercept 401 Expired Access Token
    if (response.status === 401) {
        try {
            const refreshRes = await fetch(`${API_BASE}/refresh`, {
                method: "POST",
                credentials: "include", // Required to send the httpOnly cookie securely
            });

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newToken = refreshData.token;
                localStorage.setItem("healthbot_token", newToken);
                
                // Retry requested fetch
                headers.set("Authorization", `Bearer ${newToken}`);
                response = await fetch(url, { 
                    credentials: "include", 
                    ...options, 
                    headers 
                });
            } else {
                // If the refresh token itself is expired or invalid, log them out.
                localStorage.removeItem("healthbot_token");
            }
        } catch (error) {
            console.error("Token refresh failed", error);
        }
    }

    return response;
}

export async function apiGetMe(): Promise<{ user: AuthResponse["user"] }> {
    const res = await fetchWithAuth(`${API_BASE}/me`);
    const user = await handleResponse(res);
    return { user };
}

export async function apiUpdateProfile(updates: Partial<AuthResponse["user"]>): Promise<{ user: AuthResponse["user"] }> {
    const res = await fetchWithAuth(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    });
    const user = await handleResponse(res);
    return { user };
}
