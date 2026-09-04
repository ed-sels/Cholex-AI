import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Monitor, 
  Wifi, 
  Battery, 
  Signal, 
  Apple, 
  Sparkles, 
  ChevronLeft,
  Volume2,
  Lock,
  RotateCw
} from "lucide-react";

export type DeviceMode = "ios" | "android" | "full-mobile" | "desktop";

interface MobileDeviceFrameProps {
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  children: React.ReactNode;
  language: "tw" | "en";
}

export default function MobileDeviceFrame({
  deviceMode,
  onDeviceModeChange,
  children,
  language
}: MobileDeviceFrameProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  const isEnglish = language === "en";

  return (
    <div className="flex flex-col h-full w-full bg-zinc-200 dark:bg-zinc-950 overflow-hidden relative">
      
      {/* TOP DEVICE FRAME CONTROLLER TOOLBAR */}
      <div className="bg-[#181A20] text-white px-4 py-2 border-b border-zinc-800 flex items-center justify-between z-40 shrink-0 text-xs font-sans">
        
        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => onDeviceModeChange("ios")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === "ios"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Simulate iOS iPhone 15 Pro"
          >
            <Apple className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">iOS iPhone 15</span>
          </button>

          <button
            onClick={() => onDeviceModeChange("android")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === "android"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Simulate Android Pixel 8"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Android Pixel</span>
          </button>

          <button
            onClick={() => onDeviceModeChange("full-mobile")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === "full-mobile"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Full Screen Mobile View"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile View</span>
          </button>

          <button
            onClick={() => onDeviceModeChange("desktop")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === "desktop"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Desktop Workspace View"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-zinc-300 font-bold hidden md:inline">
            React Native Expo Runtime Active
          </span>
        </div>

      </div>

      {/* FRAME DISPLAY CONTAINER */}
      <div className="flex-1 flex items-center justify-center p-0 md:p-4 overflow-hidden relative">
        
        {/* VIEW MODE 1: iOS iPHONE 15 PRO MOCKUP FRAME */}
        {deviceMode === "ios" && (
          <div className="relative w-full max-w-[412px] h-full max-h-[850px] bg-black rounded-[48px] p-[10px] shadow-2xl border-4 border-zinc-700/80 ring-1 ring-zinc-900 flex flex-col overflow-hidden transition-all duration-200">
            
            {/* iPhone Side Buttons Simulation */}
            <div className="absolute -left-[14px] top-[100px] w-[4px] h-[30px] bg-zinc-600 rounded-l-md"></div>
            <div className="absolute -left-[14px] top-[145px] w-[4px] h-[50px] bg-zinc-600 rounded-l-md"></div>
            <div className="absolute -left-[14px] top-[205px] w-[4px] h-[50px] bg-zinc-600 rounded-l-md"></div>
            <div className="absolute -right-[14px] top-[150px] w-[4px] h-[70px] bg-zinc-600 rounded-r-md"></div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full bg-white dark:bg-[#121214] rounded-[38px] flex flex-col overflow-hidden relative border border-zinc-800">
              
              {/* iOS Status Bar with Dynamic Island */}
              <div className="h-11 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-6 flex items-center justify-between shrink-0 z-30 font-sans select-none border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-xs font-bold tracking-tight">{currentTime || "09:41"}</span>
                
                {/* Dynamic Island Pill */}
                <div className="w-[100px] h-[24px] bg-black rounded-full flex items-center justify-between px-2 shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Application Main Content inside phone */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                {children}
              </div>

              {/* iOS Bottom Home Swipe Indicator */}
              <div className="h-5 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shrink-0 z-30">
                <div className="w-32 h-1 bg-zinc-400 dark:bg-zinc-600 rounded-full"></div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW MODE 2: ANDROID GOOGLE PIXEL 8 FRAME */}
        {deviceMode === "android" && (
          <div className="relative w-full max-w-[412px] h-full max-h-[850px] bg-zinc-900 rounded-[36px] p-[8px] shadow-2xl border-4 border-zinc-700 ring-1 ring-zinc-800 flex flex-col overflow-hidden transition-all duration-200">
            
            {/* Android Phone Screen */}
            <div className="w-full h-full bg-white dark:bg-[#121214] rounded-[28px] flex flex-col overflow-hidden relative border border-zinc-800">
              
              {/* Android Material Status Bar */}
              <div className="h-9 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 px-5 flex items-center justify-between shrink-0 z-30 font-sans select-none border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono">{currentTime || "10:08"}</span>
                </div>

                {/* Punch Hole Camera */}
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-zinc-800"></div>

                <div className="flex items-center gap-1.5">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>

              {/* Main Content inside phone */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                {children}
              </div>

              {/* Android Material Navigation Gesture Line */}
              <div className="h-4 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 z-30">
                <div className="w-20 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full"></div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW MODE 3 & 4: FULL MOBILE & DESKTOP WORKSPACE */}
        {(deviceMode === "full-mobile" || deviceMode === "desktop") && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            {children}
          </div>
        )}

      </div>

    </div>
  );
}
