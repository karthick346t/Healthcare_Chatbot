const API_BASE = "http://localhost:4000/api/auth";

interface AuthResponse {
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
        googleId?: string;
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
    });
    return handleResponse(res);
}

export async function apiGoogleLogin(idToken: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });
    return handleResponse(res);
}

export async function apiGetMe(token: string): Promise<{ user: AuthResponse["user"] }> {
    const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
}
