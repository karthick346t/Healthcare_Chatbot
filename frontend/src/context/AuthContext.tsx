import { createContext, useContext } from "react";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'patient' | 'admin' | 'staff';
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
