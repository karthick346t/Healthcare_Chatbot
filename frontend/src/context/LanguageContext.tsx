import { createContext } from "react";

export type LanguageContextType = {
  selectedLanguage: string | null;
  setLanguage: (code: string | null) => void;
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
};

export const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: null,
  setLanguage: () => {},
  isChatOpen: false,
  setChatOpen: () => {},
});
