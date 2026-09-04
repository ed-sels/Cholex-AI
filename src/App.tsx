import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import MobileDeviceFrame, { DeviceMode } from "./components/MobileDeviceFrame";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) return savedTheme === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [language, setLanguage] = useState<"tw" | "en">(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("language");
      return savedLang === "en" || savedLang === "tw" ? savedLang : "tw";
    }
    return "tw";
  });

  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "full-mobile";
    }
    return "ios";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLanguageChange = (lang: "tw" | "en") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-natural-text antialiased transition-colors duration-200" id="app-root">
      <MobileDeviceFrame
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        language={language}
      >
        <ChatWindow 
          language={language} 
          onLanguageChange={handleLanguageChange} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />
      </MobileDeviceFrame>
    </div>
  );
}

