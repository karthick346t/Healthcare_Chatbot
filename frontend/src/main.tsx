import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./context/LanguageProvider";
import { AuthProvider } from "./context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./utils/i18n";
import "./main.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
