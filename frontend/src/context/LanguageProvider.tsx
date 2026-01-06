import React, { useState } from "react";
import { LanguageContext } from "./LanguageContext";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isChatOpen, setChatOpen] = useState(false);

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        setLanguage: setSelectedLanguage,
        isChatOpen,
        setChatOpen,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
