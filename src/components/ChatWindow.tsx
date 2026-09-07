import React, { useState, useRef, useEffect } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import AudioRecorder from "./AudioRecorder";
import Disclaimer from "./Disclaimer";
import DailyNotificationModal, { HEALTH_TIPS } from "./DailyNotificationModal";
import ReactNativeExporter from "./ReactNativeExporter";

import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  MessageSquare, 
  AlertTriangle, 
  Search, 
  Bell, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Paperclip, 
  Activity, 
  Flame, 
  Check, 
  X, 
  Plus, 
  Minus, 
  Volume2, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  ShieldCheck,
  Calendar, 
  Droplet, 
  Thermometer, 
  Heart, 
  HelpCircle, 
  Layers, 
  User, 
  TrendingUp, 
  PhoneCall, 
  FileText, 
  Grid,
  Sun,
  Moon,
  LogOut,
  Smartphone,
  PanelLeft,
  PanelLeftClose,
  BrainCircuit,
  Cpu,
  Menu
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  getKhayaAudioSettings,
  warmKhayaAudioCache,
  playKhayaAudio,
  speakWithBrowserVoice,
  setKhayaAudioSettings,
  stopKhayaAudio,
  subscribeToKhayaAudioSettings,
  type KhayaAudioSettings,
  type KhayaSpeaker,
} from "../audio/khayaAudio";

interface ChatWindowProps {
  language: "tw" | "en";
  onLanguageChange: (lang: "tw" | "en") => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}

// Stored Log interface for the Symptom Tracker (My Projects tab)
interface SymptomLog {
  id: string;
  date: string;
  waterIntake: number; // in cups
  stoolFrequency: number;
  temperature: string; // in Celsius
  notes: string;
}

export default function ChatWindow({ language, onLanguageChange, darkMode, setDarkMode }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  
  // Tab control: "chat" | "templates" | "projects" | "statistics" | "react-native" | "settings" | "updates" | "notifications"
  const [activeTab, setActiveTab] = useState<"chat" | "templates" | "projects" | "statistics" | "react-native" | "settings" | "updates" | "notifications">("chat");

  // Dynamic Chat Font Size state: "small" | "medium" | "large"
  const [chatFontSize, setChatFontSize] = useState<"small" | "medium" | "large">(() => {
    return (localStorage.getItem("chat_font_size") as "small" | "medium" | "large") || "small";
  });
  const [audioSettings, setAudioSettings] = useState<KhayaAudioSettings>(getKhayaAudioSettings());
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Filter query for search bar
  const [searchQuery, setSearchQuery] = useState("");

  // History panel collapse state
  const [showHistory, setShowHistory] = useState(false);

  // Sidebar retraction state for desktop (closed by default)
  const [sidebarRetracted, setSidebarRetracted] = useState(true);

  // Mobile drawer overlay state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation Items configuration
  const navItems = [
    {
      id: "chat" as const,
      labelEn: "AI Chat Advisor",
      labelTw: "AI Chat Advisor",
      icon: MessageSquare,
      badge: null,
      badgeClass: "",
    },
    {
      id: "notifications" as const,
      labelEn: "Notifications",
      labelTw: "Kɔkɔbɔ Nsɛm",
      icon: Bell,
      badge: "ALERT",
      badgeClass: "bg-red-500/20 text-red-500 border-red-500/30",
    },
    {
      id: "templates" as const,
      labelEn: "Symptom Templates",
      labelTw: "Symptom Checklists",
      icon: FileText,
      badge: "PRO",
      badgeClass: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    },
    {
      id: "projects" as const,
      labelEn: "Personal Tracker",
      labelTw: "Symptom Tracker",
      icon: Calendar,
      badge: "PRO",
      badgeClass: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    },
    {
      id: "statistics" as const,
      labelEn: "Outbreak Statistics",
      labelTw: "Outbreak Statistics",
      icon: TrendingUp,
      badge: "PRO",
      badgeClass: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    },
    {
      id: "updates" as const,
      labelEn: "FAQs & Updates",
      labelTw: "Nsɛmbisa ne Nyansahyɛ",
      icon: HelpCircle,
      badge: null,
      badgeClass: "",
    },
    {
      id: "settings" as const,
      labelEn: "Portal Settings",
      labelTw: "Portal Settings",
      icon: SettingsIcon,
      badge: null,
      badgeClass: "",
    },
  ];


  // Daily Prevention Advisory Notification Modal state (triggers every time app opens)
  const [showDailyModal, setShowDailyModal] = useState(true);

  // Medical Disclaimer modal overlay state (triggers after daily notification modal is closed)
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Splash Screen modal overlay state
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  // Notification bell popover state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Symptom Diagnostic Checklist states (Templates tab)
  const [checklist, setChecklist] = useState({
    wateryDiarrhea: false,
    vomiting: false,
    muscleCramps: false,
    sunkenEyes: false,
    dryMouth: false,
  });

  // Personal Tracker states (My Projects tab)
  const [waterIntake, setWaterIntake] = useState(0);
  const [stoolFrequency, setStoolFrequency] = useState(0);
  const [temperature, setTemperature] = useState("37.0");
  const [notes, setNotes] = useState("");
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isEnglish = language === "en";

  // Preloaded history/knowledge base topics
  const historyTopics = isEnglish ? [
    { 
      title: "Water Safety Guide", 
      desc: "How to treat borehole and river water...", 
      query: "What is the best way to make drinking water safe?" 
    },
    { 
      title: "ORS Preparation Steps", 
      desc: "Exact salt and sugar measurements...", 
      query: "Give me the exact recipe to prepare ORS." 
    },
    { 
      title: "First-Aid for Dehydration", 
      desc: "Severe vomiting and oral rehydration...", 
      query: "What first-aid should I give to a severely dehydrated child?" 
    },
    { 
      title: "Symptom Identification", 
      desc: "Cholera vs standard food poisoning...", 
      query: "How do I know if my diarrhea is cholera or just food poisoning?" 
    },
    { 
      title: "Sanitation Guidelines", 
      desc: "Rules for bathroom hygiene during outbreak...", 
      query: "What are the rules for latrine sanitation during an outbreak?" 
    }
  ] : [
    { 
      title: "Nsuo ho Banbɔ Afutu", 
      desc: "Sɛnea yɛnoa nsuo ma ɛho tew...", 
      query: "Sɛn na mɛyɛ na nsuo a menom ho atew?" 
    },
    { 
      title: "ORS Nsuo Noa", 
      desc: "Samina ne nsuo hyehyɛdeɛ...", 
      query: "Sɛn na yɛyɛ ORS nsuo wo fie?" 
    },
    { 
      title: "Ayamtuo Ano Aduru", 
      desc: "Mmoa a wobɛtumi de ama abofra...", 
      query: "Dɛn mmoa na mɛtumi de ama abofra a ɔwɔ ayamtuo a ɛyɛ hu?" 
    },
    { 
      title: "Cholera Nsenkyerɛne", 
      desc: "Hunu nsonsonoeɛ a ɛwɔ mu...", 
      query: "Sɛn na mɛyɛ ahu sɛ me ayamtuo yi yɛ cholera anaa aduanebɔne?" 
    },
    { 
      title: "Tiafi Ho Ahotew", 
      desc: "Ɔkwan a yɛbɔ ho ban afiri yareɛ ho...", 
      query: "Dɛn na ɛsɛ sɛ yɛyɛ wɔ tiafi ho ahotew mu wɔ cholera berɛ mu?" 
    }
  ];

  // Rich notifications list for full page view
  const notificationsList = [
    {
      id: "note-1",
      badge: "HIGH ALERT",
      badgeClass: "bg-red-500/10 text-red-500 border-red-500/30",
      time: isEnglish ? "Today, 08:30 AM" : "Ndɛ, 08:30 AM",
      titleEn: "Outbreak Surveillance Alert: Greater Accra",
      titleTw: "Yareɛ ho Kɔkɔbɔ: Greater Accra Mantam",
      descEn: "3 new cholera cases reported in Accra Metro & Ga South. Disease surveillance teams from Ghana Health Service have been deployed.",
      descTw: "Yɛahu ayamtuo yarefuo foforɔ mmeae3 wɔ Accra Metro ne Ga South. GHS health teams akɔ hɔ dedaw."
    },
    {
      id: "note-2",
      badge: "DAILY ADVISORY",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      time: isEnglish ? "Today, 07:00 AM" : "Ndɛ, 07:00 AM",
      titleEn: "Water Boiling & Purification Safety",
      titleTw: "Nsuo Noa ho Kɔkɔbɔ Afutu",
      descEn: "Boil all untreated borehole, well, and river water for at least 1-2 minutes before drinking or preparing food.",
      descTw: "Noa asubɔnten anaa abura nsuo kosi sɛ ɛbɛhye paa mu da gyedɔgyedɔ ansa na woanom anaa woanoa aduane."
    },
    {
      id: "note-3",
      badge: "HYGIENE REMINDER",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      time: isEnglish ? "Yesterday" : "Enora",
      titleEn: "Handwashing & Sanitation Drive",
      titleTw: "Nsa Hohorɔ ne Ahotew Afutu",
      descEn: "Wash hands with soap under clean running water for 20 seconds after using latrines, before meals, and after caregiving.",
      descTw: "Hohoro wo nsa ho yie de samina gu nsuo a ɛsen mu mprepren sɛ wufiri tiafi ansa na wodi aduane."
    },
    {
      id: "note-4",
      badge: "FREE ORS DRIVE",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      time: isEnglish ? "2 days ago" : "Nnansa ni",
      titleEn: "Oral Rehydration Salts (ORS) Distribution",
      titleTw: "ORS Nsuo Aduru Wɔ Hɔ Kwataa",
      descEn: "Free ORS sachets are available at all government polyclinics and community health posts (CHPS compounds).",
      descTw: "ORS aduru nsuo wɔ hɔ kwa wɔ amansan ayaresabea ne CHPS compound biara mu ma obiara."
    }
  ];

  // Load symptom logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem("symptom_logs");
    if (savedLogs) {
      try {
        setSymptomLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error(e);
      }
    }

    // Set initial notifications
    setNotifications(isEnglish ? [
      "Daily Health Alert: Make sure to boil drinking water today.",
      "Outbreak Alert: 3 new cases reported in Greater Accra region.",
      "Health Reminder: Wash hands with soap under running water for 20 seconds."
    ] : [
      "Ahotew Kɔkɔbɔ: Noa wo nsuo ansa na wanom nnɛ.",
      "Yareɛ ho Kɔkɔbɔ: Yɛahu ayamtuo foforɔ mmeae mmeae wɔ Greater Accra.",
      "Nkaebɔ: Hohoro wo nsa ho yie de samina gu nsuo mu mprepren."
    ]);
  }, [language]);

  useEffect(() => {
    void warmKhayaAudioCache([
      "Mema wo akwaaba! Me ne Cholera Twi Chatbot a metumi abua wo nsɛmmisa afiri cholera ho.",
      "Mema wo akwaaba! Eyi ne nne a Khaya AI de rekasa ama wo.",
      ...HEALTH_TIPS.map((tip) => tip.twi),
    ], "tw");
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToKhayaAudioSettings(setAudioSettings);
    return () => {
      unsubscribe();
      stopKhayaAudio(previewAudioRef.current);
      previewAudioRef.current = null;
    };
  }, []);

  // Generate session ID on load
  useEffect(() => {
    const generatedSession = "twi-cholera-session-" + Math.random().toString(36).substring(2, 15);
    setSessionId(generatedSession);

    // Initial bot welcome message
    const welcomeMsg: Message = {
      id: "welcome-message",
      sender: "bot",
      text: "Mema wo akwaaba! Me ne Cholera Twi Chatbot a metumi abua wo nsɛmmisa afiri cholera ho.\n\nSɛ wopɛ sɛ wubisa ho nsenkyerɛne (symptoms), sɛnea ɛfata (transmission), ho banbɔ (prevention), anaa ano aduru (treatment/ORS) a, wobɛtumi abisa me wo Twi kasa mu mprepren. Mebua wo ntɛm ara!",
      english: "Welcome! I am the Cholera Twi Chatbot and I can answer your questions about cholera. If you want to ask about symptoms, transmission, prevention, or treatment/ORS, you can ask me in English or Twi. I will answer you immediately!",
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePreviewAudio = async () => {
    if (isTestingAudio) {
      stopKhayaAudio(previewAudioRef.current);
      previewAudioRef.current = null;
      setIsTestingAudio(false);
      return;
    }

    setIsTestingAudio(true);
    try {
      previewAudioRef.current = await playKhayaAudio(
        language === "tw"
          ? "Mema wo akwaaba! Eyi ne nne a Khaya AI de rekasa ama wo."
          : "Welcome! This is a preview of the Khaya AI voice for Cholex.",
        language,
        () => {
          previewAudioRef.current = null;
          setIsTestingAudio(false);
        },
      );
    } catch (error) {
      if (language === "en") {
        console.warn("Khaya English preview unavailable; using offline browser speech", error);
        speakWithBrowserVoice(
          "Welcome! This is a preview of the Khaya AI voice for Cholex.",
          "en",
          () => setIsTestingAudio(false),
        );
      } else {
        console.error("This Twi preview has not been cached for offline Khaya playback:", error);
      }
      setIsTestingAudio(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Switch to Chat tab automatically if sending a message from elsewhere
    setActiveTab("chat");

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        message: textToSend,
        session_id: sessionId,
        language: language
      });

      const { response: botText, english_translation, intent, confidence } = response.data;

      const botMsg: Message = {
        id: "msg-bot-" + Date.now(),
        sender: "bot",
        text: botText,
        english: english_translation,
        intent: intent,
        confidence: confidence,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Failed to fetch bot response:", err);
      
      const errorMsg: Message = {
        id: "msg-error-" + Date.now(),
        sender: "bot",
        text: "Mepa wo kyɛw, mfantom mfomsoɔ bi baeɛ wɔ mmerɛ a merebua wo asɛm no. Meserɛ wo checki wo connection na kɔ bio.",
        english: "I am sorry, an error occurred while processing your message. Please check your internet connection and try again.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const confirmText = isEnglish
      ? "Are you sure you want to reset the chat?"
      : "Sɛ wopɛ sɛ wufiri nkɔmmɔbɔ yi ase bio a? (Are you sure you want to reset the chat?)";

    if (window.confirm(confirmText)) {
      const generatedSession = "twi-cholera-session-" + Math.random().toString(36).substring(2, 15);
      setSessionId(generatedSession);
      const welcomeMsg: Message = {
        id: "welcome-message-" + Date.now(),
        sender: "bot",
        text: "Mema wo akwaaba! Nkɔmmɔbɔ foforɔ asɔ. Bisa me cholera ho nsɛm wo Twi kasa mu.",
        english: "Welcome! A new conversation has started. Ask me about cholera in English or Twi.",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      setActiveTab("chat");
    }
  };

  // Preload a specific scenario/topic when clicked from the right history panel
  const handleHistoryClick = async (query: string) => {
    handleSendMessage(query);
  };

  // Checklist risk computation (Templates tab)
  const getCheckedCount = () => {
    return Object.values(checklist).filter(Boolean).length;
  };

  const getRiskLevel = () => {
    const count = getCheckedCount();
    if (count === 0) return { level: isEnglish ? "None" : "Yareɛ biara nni hɔ", color: "text-zinc-500", desc: isEnglish ? "No dehydration symptoms selected." : "Wansese nsenkyerɛne biara." };
    if (count <= 1) return { level: isEnglish ? "Low Risk" : "Mmerɛwa (Mild)", color: "text-emerald-600 dark:text-emerald-400", desc: isEnglish ? "Mild hydration loss. Drink plenty of clean water and monitor." : "Yareɛ ho kwan su kɛseɛ nni hɔ. Nnom nsuo pii na hwɛ wo ho yie." };
    if (count <= 3) return { level: isEnglish ? "Moderate Risk" : "Mfantom (Moderate)", color: "text-amber-600 dark:text-amber-400", desc: isEnglish ? "Prepare and drink Oral Rehydration Salts (ORS) immediately. Seek guidance if symptoms persist." : "Yɛ ORS nsuo noa ntɛm ara na nom na sɔ hwɛ. Sɛ ammra fam a kɔ ayaresabea." };
    return { level: isEnglish ? "HIGH DANGER - CRITICAL" : "ƆHAFOƆ - HU PAAPA", color: "text-red-600 dark:text-red-400 animate-pulse", desc: isEnglish ? "Severe dehydration signs! Administer ORS immediately and proceed to the nearest clinic/hospital now." : "Nsuo asa wo mu kɛseɛ! Nom ORS nsuo mprepren na kɔ ayaresabea a ɛbɛn wo ntɛm ara." };
  };

  // Tracker logic (My Projects tab)
  const handleSaveSymptomLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: SymptomLog = {
      id: "log-" + Date.now(),
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      waterIntake,
      stoolFrequency,
      temperature,
      notes
    };
    const updated = [newLog, ...symptomLogs];
    setSymptomLogs(updated);
    localStorage.setItem("symptom_logs", JSON.stringify(updated));
    
    // reset input form
    setNotes("");
    alert(isEnglish ? "Symptom log successfully saved!" : "Yɛasiesie wo yareɛ ho nkyerɛkee asie yie!");
  };

  const handleDeleteLog = (id: string) => {
    const updated = symptomLogs.filter(log => log.id !== id);
    setSymptomLogs(updated);
    localStorage.setItem("symptom_logs", JSON.stringify(updated));
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim() === "" 
    ? messages 
    : messages.filter(m => {
        const textToSearch = `${m.text} ${m.english || ""}`.toLowerCase();
        return textToSearch.includes(searchQuery.toLowerCase());
      });

  return (
    <div className="relative flex h-full w-full bg-[#f1f3f7] dark:bg-[#121214] font-sans overflow-hidden transition-colors duration-200">
      
      {/* SPLASH SCREEN OVERLAY */}
      <AnimatePresence>
        {showSplashScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white p-4 sm:p-8 overflow-y-auto"
          >
            {/* Ambient Background Glow Effects */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#FF5A36]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-70 sm:w-80 h-70 sm:h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-5 my-auto py-6">
              {/* Animated Brand Badge */}
              <motion.div 
                initial={{ scale: 0.8, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <div className="p-5 bg-gradient-to-br from-[#FF5A36] to-[#D93D1A] rounded-3xl shadow-2xl shadow-[#FF5A36]/40 flex items-center justify-center ring-4 ring-[#FF5A36]/20">
                  <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-pulse" />
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-zinc-900 border border-[#FF5A36]/50 text-[#FF5A36] text-[10px] font-extrabold uppercase tracking-widest rounded-full whitespace-nowrap shadow-md">
                  GHANA HEALTH NLP
                </span>
              </motion.div>

              {/* Title & Description */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2 pt-2"
              >
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-300">
                  Cholex AI
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-xs mx-auto">
                  {isEnglish 
                    ? "Asante Twi & English AI Cholera Health Assistant" 
                    : "Asante Twi ne Brɔfo Health AI ma Cholera"}
                </p>
              </motion.div>

              {/* Language Toggle in Splash Screen */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold w-full max-w-xs"
              >
                <button
                  type="button"
                  onClick={() => onLanguageChange("tw")}
                  className={`flex-1 py-1.5 px-3 rounded-full transition-all touch-manipulation cursor-pointer ${
                    language === "tw" 
                      ? "bg-[#FF5A36] text-white shadow-xs" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                   Asante Twi
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange("en")}
                  className={`flex-1 py-1.5 px-3 rounded-full transition-all touch-manipulation cursor-pointer ${
                    language === "en" 
                      ? "bg-[#FF5A36] text-white shadow-xs" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                 English
                </button>
              </motion.div>

              {/* Launch Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                type="button"
                onClick={() => setShowSplashScreen(false)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#E04724] hover:from-[#E54E2E] hover:to-[#C83B1B] text-white font-bold text-sm shadow-xl shadow-[#FF5A36]/30 active:scale-95 transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-2 group"
              >
                <span>{isEnglish ? "Launch Cholex AI" : "Firi Aseɛ / Start Cholex AI"}</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* MOBILE DRAWER OVERLAY & SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 bg-[#181A20] text-zinc-300 z-50 flex flex-col h-full shadow-2xl border-r border-zinc-800 md:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FF5A36] text-white rounded-xl shadow-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#FF5A36] uppercase tracking-widest block">
                      GHANA HEALTH NLP
                    </span>
                    <h1 className="text-sm font-bold text-white tracking-tight leading-none mt-1">
                      Cholex AI
                    </h1>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Messages Bar in Mobile Sidebar */}
              <div className="px-3 py-2.5 border-b border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder={isEnglish ? "Search messages..." : "Hwehwɛ nkɔmmɔbɔ..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeTab !== "chat" && e.target.value.trim()) {
                        setActiveTab("chat");
                      }
                    }}
                    className="pl-8 pr-7 py-2 w-full text-base sm:text-xs bg-zinc-900 border border-zinc-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF5A36] focus:border-[#FF5A36] text-zinc-200 placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white cursor-pointer touch-manipulation"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-zinc-800 text-white shadow-md border-l-4 border-[#FF5A36]"
                        : "hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4.5 w-4.5 ${activeTab === item.id ? "text-[#FF5A36]" : ""}`} />
                      <span>{isEnglish ? item.labelEn : item.labelTw}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-widest border ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#FF5A36] to-[#E04724] text-white space-y-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  <h4 className="text-xs font-bold tracking-wide uppercase">National Helpline</h4>
                </div>
                <p className="text-[11px] leading-snug text-white/90">
                  {isEnglish ? "Call 112 for immediate cholera emergency help." : "Frɛ 112 ntɛm ara ma mmoa."}
                </p>
                <a 
                  href="tel:112"
                  className="block text-center text-xs font-bold bg-white text-[#FF5A36] py-2 rounded-xl shadow-sm"
                >
                  {isEnglish ? "Call Helpline 112" : "Frɛ 112 Seesei"}
                </a>
              </div>

              <div className="p-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => {
                    handleResetChat();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-500 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isEnglish ? "Reset & Clear" : "Sesa nkɔmmɔbɔ"}</span>
                </button>
                <span className="text-[10px] text-zinc-600 font-mono">v1.4.0</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (Dark Premium Retractable Desktop Sidebar) */}
      <aside 
        className={`bg-[#181A20] dark:bg-[#0c0d10] text-zinc-300 flex flex-col h-full shrink-0 z-30 transition-all duration-300 hidden md:flex ${
          sidebarRetracted ? "w-0 p-0 opacity-0 overflow-hidden border-r-0" : "w-64 border-r border-zinc-800 opacity-100"
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-zinc-800 shrink-0 min-h-[61px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-[#FF5A36] text-white rounded-xl shadow-lg shrink-0">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#FF5A36] uppercase tracking-widest block truncate">
                GHANA HEALTH NLP
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none mt-1 truncate">
                Cholex AI
              </h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarRetracted(true)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer ml-1 shrink-0"
            title={isEnglish ? "Hide Sidebar" : "Fie Menu"}
          >
            <PanelLeftClose className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search Messages Bar in Desktop Sidebar */}
        <div className="px-3 py-2.5 border-b border-zinc-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder={isEnglish ? "Search messages..." : "Hwehwɛ nkɔmmɔbɔ..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "chat" && e.target.value.trim()) {
                  setActiveTab("chat");
                }
              }}
              className="pl-8 pr-7 py-2 w-full text-base sm:text-xs bg-zinc-900 border border-zinc-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF5A36] focus:border-[#FF5A36] text-zinc-200 placeholder-zinc-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white cursor-pointer touch-manipulation"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarRetracted(true);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-zinc-800 text-white shadow-md border-l-4 border-[#FF5A36]"
                  : "hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${activeTab === item.id ? "text-[#FF5A36]" : ""}`} />
                <span className="truncate">{isEnglish ? item.labelEn : item.labelTw}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-widest border ${item.badgeClass}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* National Helpline Banner */}
        <div className="p-3.5 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#FF5A36] to-[#E04724] text-white space-y-2 shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 shrink-0" />
            <h4 className="text-xs font-bold tracking-wide uppercase truncate">National Helpline</h4>
          </div>
          <p className="text-[11px] leading-snug text-white/90">
            {isEnglish 
              ? "Call 112 or 0302-661-122 for immediate help." 
              : "Frɛ 112 ntɛm ara na yenya mmoa."}
          </p>
          <a 
            href="tel:112"
            className="block text-center text-xs font-bold bg-white text-[#FF5A36] hover:bg-zinc-50 py-1.5 rounded-xl transition-all shadow-sm"
          >
            {isEnglish ? "Call 112 Now" : "Frɛ Helpline Seesei"}
          </a>
        </div>

        {/* Log Out / Exit Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <button 
            onClick={handleResetChat}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Reset & Clear Chat"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{isEnglish ? "Reset & Clear" : "Sesa nkɔmmɔbɔ"}</span>
          </button>
          <span className="text-[10px] text-zinc-600 font-mono">v1.4.0</span>
        </div>

      </aside>

      {/* MIDDLE CONTAINER (Main Dashboard Area with Card Panel) */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Rounded nested workspace card wrapper */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1C1C1F] shadow-md border border-zinc-200/80 dark:border-zinc-800 m-3 md:m-4 rounded-2xl overflow-hidden transition-colors duration-200">
          
          {/* Main card nested toolbar header */}
          <header className="bg-zinc-50/80 dark:bg-zinc-900/60 px-3.5 sm:px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-2 sm:gap-4 shrink-0 transition-colors duration-200">
            
            {/* Active module title & Sidebar Toggles */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Desktop Show/Hide Sidebar Button */}
              {sidebarRetracted ? (
                <button
                  onClick={() => setSidebarRetracted(false)}
                  className="hidden md:flex p-2 bg-[#FF5A36] text-white hover:bg-[#E54E2E] rounded-xl transition-all shadow-md cursor-pointer shrink-0 active:scale-95"
                  title={isEnglish ? "Show Navigation Sidebar" : "Kyerɛ Navigation Menu"}
                >
                  <PanelLeft className="h-5 w-5 text-white" />
                </button>
              ) : (
                <button
                  onClick={() => setSidebarRetracted(true)}
                  className="hidden md:flex p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer shrink-0"
                  title={isEnglish ? "Hide Sidebar" : "Fie Menu"}
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              )}

              {/* Mobile Drawer Open Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="h-5 w-5 text-[#FF5A36]" />
              </button>

              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-zinc-800 dark:text-zinc-100 font-sans tracking-tight truncate">
                {activeTab === "chat" && (isEnglish ? "AI Chat Helper" : "AI Chat Helper")}
                {activeTab === "notifications" && (isEnglish ? "Health Notifications & Advisories" : "Kɔkɔbɔ Nsɛm ne Afutu")}
                {activeTab === "templates" && (isEnglish ? "Diagnostic Guides & Assessment" : "Yareɛ Nsenkyerɛne Sɔhwɛ")}
                {activeTab === "projects" && (isEnglish ? "Personal Hydration & Symptom Tracker" : "Ahotew ne Yareɛ Tracker")}
                {activeTab === "statistics" && (isEnglish ? "Cholera Epidemic Statistics" : "Cholera Yareɛ ho Akontabuo")}
                {activeTab === "settings" && (isEnglish ? "System Settings" : "Siedie Nsɛm")}
                {activeTab === "updates" && (isEnglish ? "Bilingual FAQs & Advisories" : "Afutu ne Nyansahyɛ")}
              </h2>
            </div>

            {/* Utility Tools Header Right */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Notifications Tab Button in Header */}
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  activeTab === "notifications" 
                    ? "border-[#FF5A36] bg-[#FF5A36]/10 text-[#FF5A36]" 
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750"
                }`}
                title={isEnglish ? "Health Notifications & Advisories" : "Kɔkɔbɔ Nsɛm ne Afutu"}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#FF5A36] ring-2 ring-white dark:ring-zinc-900 animate-pulse"></span>
              </button>

              {/* Knowledge Base panel toggle button */}
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showHistory 
                    ? "border-[#FF5A36] bg-[#FF5A36]/10 text-[#FF5A36]" 
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750"
                }`}
                title={showHistory ? "Close Knowledge Base" : "Open Knowledge Base"}
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Vertical border spacer */}
              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800"></div>

              {/* Theme Toggle & Language selector in main dashboard header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all cursor-pointer"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
                </button>

                <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => onLanguageChange("tw")}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      language === "tw"
                        ? "bg-[#FF5A36] text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    Twi
                  </button>
                  <button
                    onClick={() => onLanguageChange("en")}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      language === "en"
                        ? "bg-[#FF5A36] text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    ENG
                  </button>
                </div>
              </div>

            </div>

          </header>

          {/* TAB LAYOUT VIEWS VIEWPORT */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-zinc-50/50 dark:bg-zinc-900/10">

            {/* TAB 1: ACTIVE CHAT log VIEW */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                
                {/* Scrollable messages box */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col space-y-4">
                  
                  {/* Banner inside chat window if search is active */}
                  {searchQuery && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 px-4 py-2.5 rounded-xl text-xs border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <span>
                        {isEnglish 
                          ? `Showing search results for "${searchQuery}" (${filteredMessages.length} found)`
                          : `Merekyerɛ search nsɛm afiri "${searchQuery}" mu (Yɛahu ${filteredMessages.length})`}
                      </span>
                      <button onClick={() => setSearchQuery("")} className="font-bold underline text-xs cursor-pointer">{isEnglish ? "Clear Search" : "Popae"}</button>
                    </div>
                  )}

                  {filteredMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} language={language} chatFontSize={chatFontSize} />
                  ))}

                  {/* AI waiting response skeleton screen */}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex flex-col mb-4 self-start items-start max-w-[85%] sm:max-w-[75%] w-full"
                    >
                      {/* Bot Header Badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#FF5A36] font-sans flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A36] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A36]"></span>
                          </span>
                          HealthMerge AI Bot
                        </span>
                        <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/50 animate-pulse">
                          {isEnglish ? "Synthesizing response..." : "Yɛre siesie mmuaeɛ..."}
                        </span>
                      </div>

                      {/* Skeleton Card Body */}
                      <div className="w-full bg-white dark:bg-zinc-800/90 p-4 rounded-2xl rounded-tl-none border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
                        {/* Intent skeleton badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 w-28 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/60 dark:to-zinc-800 rounded-full animate-pulse"></div>
                          <div className="h-4 w-16 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/60 dark:to-zinc-800 rounded-full animate-pulse delay-75"></div>
                        </div>

                        {/* Shimmering Text Lines */}
                        <div className="space-y-2.5 py-1">
                          <div className="h-3.5 w-[92%] bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/60 dark:to-zinc-800 rounded-md animate-pulse"></div>
                          <div className="h-3.5 w-[100%] bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/60 dark:to-zinc-800 rounded-md animate-pulse delay-100"></div>
                          <div className="h-3.5 w-[75%] bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/60 dark:to-zinc-800 rounded-md animate-pulse delay-150"></div>
                        </div>

                        {/* Secondary block skeleton for audio / translation controls */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-28 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/50 dark:to-zinc-800 rounded-full animate-pulse delay-200"></div>
                            <div className="h-6 w-20 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700/50 dark:to-zinc-800 rounded-full animate-pulse delay-300"></div>
                          </div>
                          <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick suggestions tags dock */}
                <div className="px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-white dark:bg-[#1C1C1F]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1.5">
                    {isEnglish ? "Quick Actions:" : "Nsɛmmisa:"}
                  </span>
                  {historyTopics.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(item.query)}
                      className="shrink-0 text-xs bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 py-1.5 px-3.5 rounded-full transition-all cursor-pointer font-serif shadow-sm active:scale-95"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>

                {/* Bottom User text and speech inputs panel */}
                <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 flex flex-col gap-4 shrink-0 transition-colors duration-200">
                  <div className="flex items-center gap-2 max-w-4xl w-full mx-auto relative">
                    
                    {/* Attach File simulation button inside pill bar */}
                    <button
                      onClick={() => {
                        alert(isEnglish 
                          ? "Medical Document upload is in beta. Upload medical reports or water purity tests here to receive immediate Bilingual AI Summaries [Coming Soon]." 
                          : "Mfoni ne prescription log yɛ beta. Ɛbɛboa wo ma woanya dynamic Translation mprepren [Coming Soon]."
                        );
                      }}
                      className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl transition-all cursor-pointer"
                      title={isEnglish ? "Attach Medical File" : "Fa aduane/prescriptions ho mfoni gu mu"}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    {/* Styled Chat Keyboard input */}
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputMessage)}
                      disabled={isLoading}
                      placeholder={isEnglish ? "Type clinical inquiry or message here..." : "Bisa me cholera ho asɛm biara wo Twi mu... (Type question in Twi...)"}
                      className="flex-1 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-base md:text-base px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#FF5A36] focus:border-[#FF5A36] transition-all shadow-inner placeholder-zinc-400 font-serif"
                      id="chat-input-text"
                    />

                    {/* Coral Orange sleek Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSendMessage(inputMessage)}
                      disabled={isLoading || !inputMessage.trim()}
                      className={`p-3 rounded-2xl shadow-md font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center min-w-[48px] h-[48px] touch-manipulation ${
                        isLoading || !inputMessage.trim()
                          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800 cursor-not-allowed opacity-70"
                          : "bg-[#FF5A36] text-white hover:bg-[#E54E2E] shadow-lg shadow-[#FF5A36]/30"
                      }`}
                      title={isEnglish ? "Send Message" : "Soma (Send)"}
                      id="send-msg-btn"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Speech input option */}
                  <div className="max-w-4xl w-full mx-auto flex flex-col items-center shrink-0">
                    <div className="w-full border-t border-zinc-200/40 dark:border-zinc-800/40 my-1"></div>
                    <div className="text-center mb-1">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                        {isEnglish ? "Or, speak to me in English" : "Anaa, kasa wo Twi kasa mu (Or, speak to me in Asante Twi)"}
                      </span>
                    </div>
                    <AudioRecorder
                      onTranscriptionComplete={(text) => handleSendMessage(text)}
                      disabled={isLoading}
                      language={language}
                    />
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: DIAGNOSTIC symptom TEMPLATES VIEW (PRO) */}
            {activeTab === "templates" && (
              <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6">
                
                {/* Header overview banner */}
                <div className="bg-[#FF5A36]/10 text-zinc-800 dark:text-zinc-100 p-4 sm:p-5 rounded-2xl border border-[#FF5A36]/20">
                  <h3 className="font-bold text-base font-sans flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-[#FF5A36] shrink-0" />
                    <span>{isEnglish ? "Bilingual Symptom Assessment Checklist" : "Yareɛ Nsenkyerɛne Sɔhwɛ"}</span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                    {isEnglish 
                      ? "Select the symptoms being experienced below. Our system will evaluate the dehydration risk hazard based on clinical criteria and guide you immediately."
                      : "Sesa nsenkyerɛne a woahu wɔ ho nnɛ. System yi bɛhwɛ sɛnea nsuo firi wo mu kɔ na ama wo afutu a ɛfata ntɛm ara."}
                  </p>
                </div>

                {/* 1. DANGER SCORE EVALUATION PANEL AT THE TOP */}
                <div className="bg-white dark:bg-zinc-800/60 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-zinc-100 dark:border-zinc-700/60 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                      {isEnglish ? "Dehydration Danger Score" : "Nsuo-Asadie Hazard Nsenkyerɛne"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl sm:text-5xl font-extrabold font-display text-[#FF5A36]">
                        {getCheckedCount()} <span className="text-xl sm:text-2xl text-zinc-400 font-normal">/ 5</span>
                      </span>
                      <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700 ${getRiskLevel().color}`}>
                        {getRiskLevel().level}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {getRiskLevel().desc}
                    </p>
                  </div>

                  <div className="pt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        const query = isEnglish 
                          ? `I have checked ${getCheckedCount()} symptoms of dehydration (Watery diarrhea: ${checklist.wateryDiarrhea ? "yes" : "no"}, Vomiting: ${checklist.vomiting ? "yes" : "no"}). What should I do?`
                          : `Mahwehwɛ nsenkyerɛne biara (Ayamtuo: ${checklist.wateryDiarrhea ? "yes" : "no"}, Afefeɔ: ${checklist.vomiting ? "yes" : "no"}). Mmoa dɛn na mɛnya?`;
                        handleSendMessage(query);
                      }}
                      disabled={getCheckedCount() === 0}
                      className={`w-full py-3 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
                        getCheckedCount() === 0
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-70"
                          : "bg-[#FF5A36] text-white hover:bg-[#E54E2E] shadow-md shadow-[#FF5A36]/20 active:scale-95"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{isEnglish ? "Send Symptom Report to AI" : "Soma diagnostic afutu yi kɔ AI ho"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. SYMPTOMS CHECKLIST BELOW */}
                <div className="bg-white dark:bg-zinc-800/60 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-700/60 pb-3 flex items-center justify-between">
                    <span>{isEnglish ? "Select Experienced Symptoms:" : "Yi Nsenkyerɛne a woahu:"}</span>
                    <span className="text-xs text-zinc-400 font-normal">
                      {getCheckedCount()} {isEnglish ? "selected" : "ayi"}
                    </span>
                  </h4>

                  <div className="flex flex-col space-y-3">
                    {/* Symptom 1 */}
                    <label className="flex items-start gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation">
                      <input 
                        type="checkbox"
                        checked={checklist.wateryDiarrhea}
                        onChange={(e) => setChecklist({ ...checklist, wateryDiarrhea: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                          {isEnglish ? "Profuse Watery Diarrhea ('Rice-Water Stool')" : "Ayamtuo a ɛbɔ nsuo gyegyegye"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {isEnglish ? "Sudden onset of massive painless loose stool." : "Ayamtuo a ɛba ntɛm ara a enni yaa biara."}
                        </span>
                      </div>
                    </label>

                    {/* Symptom 2 */}
                    <label className="flex items-start gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation">
                      <input 
                        type="checkbox"
                        checked={checklist.vomiting}
                        onChange={(e) => setChecklist({ ...checklist, vomiting: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                          {isEnglish ? "Severe Vomiting" : "Afefeɔ (Severe Vomiting)"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {isEnglish ? "Inability to keep liquids down." : "Aduane anaa nsuo biara ntumi ntena wo mu."}
                        </span>
                      </div>
                    </label>

                    {/* Symptom 3 */}
                    <label className="flex items-start gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation">
                      <input 
                        type="checkbox"
                        checked={checklist.muscleCramps}
                        onChange={(e) => setChecklist({ ...checklist, muscleCramps: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                          {isEnglish ? "Severe Muscle Cramps" : "Ntini a ɛtwe (Severe Muscle Cramps)"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {isEnglish ? "Caused by rapid depletion of salts and minerals." : "Efi nkyene ne nsuo pii a afiri wo mu kɔ no."}
                        </span>
                      </div>
                    </label>

                    {/* Symptom 4 */}
                    <label className="flex items-start gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation">
                      <input 
                        type="checkbox"
                        checked={checklist.sunkenEyes}
                        onChange={(e) => setChecklist({ ...checklist, sunkenEyes: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                          {isEnglish ? "Sunken Eyes" : "Aniwa a akɔ mu kɔnkɔn (Sunken Eyes)"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {isEnglish ? "A major visual indicator of moderate-to-severe dehydration." : "Hunu sɛ aniwa akɔmu firi nsuo-asadi no mu."}
                        </span>
                      </div>
                    </label>

                    {/* Symptom 5 */}
                    <label className="flex items-start gap-3.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all touch-manipulation">
                      <input 
                        type="checkbox"
                        checked={checklist.dryMouth}
                        onChange={(e) => setChecklist({ ...checklist, dryMouth: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                          {isEnglish ? "Dry Mouth or Sticky Tongue" : "Anofafa anaa tɛkrɛma a awo"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          {isEnglish ? "Little or no saliva production." : "Ntasuo koraa nni mu firi dɔɔso-nsuo asae ho."}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: PERSONAL TRACKER & Symptom Log VIEW (PRO) */}
            {activeTab === "projects" && (
              <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-6">
                
                {/* Tracker Overview */}
                <div className="bg-emerald-500/10 text-zinc-800 dark:text-zinc-100 p-5 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                    <Heart className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-base font-sans">
                      {isEnglish ? "Daily Hydration & Symptom Log" : "Ahotew ne Yareɛ Tracker"}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      {isEnglish 
                        ? "Log your daily fluid intake and bowel movements here. Keep track of clinical signs to check recovery progress or present to a doctor."
                        : "Hwɛ wo nsuo-nom ne wo ayamtuo ho nkyerɛkee asie daa na de kɔkyerɛ dɔkota wɔ ayaresabea mprepren."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-6">
                  
                  {/* Log Input Form (Record Today's Log ABOVE) */}
                  <form onSubmit={handleSaveSymptomLog} className="bg-white dark:bg-zinc-800/40 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700/60 pb-2">
                      {isEnglish ? "Record Today's Log" : "Kyere Da ho Nsɛm"}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Water intake cups counter */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Droplet className="h-3.5 w-3.5 text-blue-500" />
                          {isEnglish ? "Water Intake (Cups):" : "Nsuo a woanom (Cups):"}
                        </label>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
                            className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-base font-bold font-mono text-zinc-800 dark:text-zinc-100 w-8 text-center">{waterIntake}</span>
                          <button 
                            type="button" 
                            onClick={() => setWaterIntake(waterIntake + 1)}
                            className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Stool frequency counter */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-amber-500" />
                          {isEnglish ? "Bowel Stool Count:" : "Ayamtuo dodoɔ ndɛn:"}
                        </label>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => setStoolFrequency(Math.max(0, stoolFrequency - 1))}
                            className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-base font-bold font-mono text-zinc-800 dark:text-zinc-100 w-8 text-center">{stoolFrequency}</span>
                          <button 
                            type="button" 
                            onClick={() => setStoolFrequency(stoolFrequency + 1)}
                            className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Body Temperature input */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Thermometer className="h-3.5 w-3.5 text-red-500" />
                          {isEnglish ? "Body Temp (°C):" : "Wo Temp (°C):"}
                        </label>
                        <input 
                          type="text" 
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5A36] text-zinc-800 dark:text-zinc-100 font-mono"
                          placeholder="37.0"
                          required
                        />
                      </div>
                    </div>

                    {/* Notes field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        {isEnglish ? "Clinical Notes / Comments:" : "Nkyerɛkyerɛ Foforɔ:"}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF5A36] text-zinc-800 dark:text-zinc-100 min-h-[70px]"
                        placeholder={isEnglish ? "e.g. Took ORS, felt less dizzy..." : "Nkyerɛkee foforɔ..."}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full sm:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      {isEnglish ? "Save Entry Log" : "Siesie Log No Asie"}
                    </button>
                  </form>

                  {/* Stored logs output list (Logged Entries AT THE BOTTOM) */}
                  <div className="bg-white dark:bg-zinc-800/40 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-700/60 pb-2">
                      {isEnglish ? "Logged Entries" : "Yareɛ Nkyerɛkee Log"}
                    </h4>

                    <div className="space-y-3">
                      {symptomLogs.length === 0 ? (
                        <div className="text-center py-10 text-zinc-400 flex flex-col items-center justify-center gap-2">
                          <Calendar className="h-8 w-8 text-zinc-300" />
                          <span className="text-xs">{isEnglish ? "No logs recorded yet. Start tracking above!" : "Wo nkyerɛkee log biara nni hɔ da. Hyɛ aseɛ mprepren."}</span>
                        </div>
                      ) : (
                        symptomLogs.map((log) => (
                          <div key={log.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-150 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{log.date}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                                <span className="flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Water: <strong>{log.waterIntake}</strong> cups</span>
                                <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Stools: <strong>{log.stoolFrequency}</strong> times</span>
                                <span className="flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5 text-red-500 shrink-0" /> Temp: <strong>{log.temperature}°C</strong></span>
                              </div>
                              {log.notes && (
                                <p className="text-xs text-zinc-600 dark:text-zinc-300 italic mt-1 font-serif">
                                  "{log.notes}"
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors self-end sm:self-center cursor-pointer shrink-0"
                              title="Delete log entry"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 4: EPIDEMIOLOGICAL OUTBREAK STATISTICS (PRO) */}
            {activeTab === "statistics" && (
              <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto space-y-5 sm:space-y-6 min-w-0">
                
                {/* Outbreak Statistics Live Header Banner */}
                <div className="flex flex-col gap-3.5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white p-4 sm:p-5 md:p-6 rounded-2xl border border-zinc-800 shadow-md min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold truncate">
                        {isEnglish ? "GHS Live Surveillance Feed" : "GHS Akwahosan Akwankyerɛ Live"}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-white font-sans break-words">
                      {isEnglish ? "Epidemiological Outbreak Statistics" : "Ayaresabea & Akwahosan Kɔkɔbɔ Nsɛm"}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed break-words">
                      {isEnglish 
                        ? "Real-time cholera surveillance data, regional clinic cases, recovery rates, and water sanitation indicators across Ghana."
                        : "Ghana cholera yareɛ ho nsɛm, nkuro ne mmɔntene so case kyerɛkyerɛ ne ahotew ho nsɛm mprepren."}
                    </p>
                  </div>
                  {/* Sync status badge placed below epidemiological information */}
                  <div className="pt-0.5 flex items-center min-w-0">
                    <span className="text-[10px] font-mono bg-zinc-800/90 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {isEnglish ? "Sync: Today, 18:00 GMT" : "Foforɔ: Ɛnnɛ, 18:00 GMT"}
                    </span>
                  </div>
                </div>

                {/* 2-Column Grid for Statistical Metric Overview Values */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 min-w-0">
                  
                  {/* Stat Card 1: Recovery Rate */}
                  <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 min-w-0 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                        {isEnglish ? "Recovery Rate" : "Ayaresa Ntenten"}
                      </span>
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">98.4%</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 font-mono shrink-0">+1.2% {isEnglish ? "wk" : "dapɛn"}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[98.4%] rounded-full"></div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 block font-mono truncate">12,250 {isEnglish ? "discharges" : "asa"}</span>
                  </div>

                  {/* Stat Card 2: ORS Sachets */}
                  <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 min-w-0 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                        {isEnglish ? "ORS Sachets Sent" : "ORS Nsuo Aduru"}
                      </span>
                      <span className="p-1.5 rounded-lg bg-[#FF5A36]/10 text-[#FF5A36] shrink-0">
                        <Droplet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FF5A36] truncate">12,450+</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 font-mono shrink-0">{isEnglish ? "Sent" : "Wakyɛ"}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#FF5A36] h-full w-[82%] rounded-full"></div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 block font-mono truncate">{isEnglish ? "Direct health post supply" : "Akwahosan gyinabea"}</span>
                  </div>

                  {/* Stat Card 3: Active Monitored Cases */}
                  <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 min-w-0 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                        {isEnglish ? "Active Cases" : "Yarefuo Dodow"}
                      </span>
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                        <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-500 truncate">142</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 font-mono shrink-0">-18 {isEnglish ? "vs last wk" : "vs twam"}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[35%] rounded-full"></div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 block font-mono truncate">{isEnglish ? "Clinical care" : "Dokota nhwehwɛmu"}</span>
                  </div>

                  {/* Stat Card 4: Hotspot Surveillance Zones */}
                  <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 min-w-0 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                        {isEnglish ? "Surveillance Zones" : "Mpeaepaeɔ Dodoɔ"}
                      </span>
                      <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                        <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-red-500 truncate">4</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-red-500 font-mono uppercase shrink-0">{isEnglish ? "Watch" : "Monitor"}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full w-[60%] rounded-full"></div>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 block font-mono truncate">Accra, Kasoa, Cape Coast, Kumasi</span>
                  </div>

                </div>

                {/* 1-Column Grid for Data Below Statistical Values */}
                <div className="grid grid-cols-1 gap-5 sm:gap-6 min-w-0">
                    
                  {/* Weekly Clinic Admissions Chart Box */}
                  <div className="bg-white dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 min-w-0">
                    <div className="border-b border-zinc-100 dark:border-zinc-700/60 pb-3 space-y-2 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 min-w-0">
                        <TrendingUp className="h-4 w-4 text-[#FF5A36] shrink-0" />
                        <span className="break-words">{isEnglish ? "Weekly Clinic Outbreak Admission Trend (Accra Metro)" : "Dapɛn Biara Yarefuo Dodow Trend (Accra)"}</span>
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 pt-0.5">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full bg-[#FF5A36]"></span>
                          {isEnglish ? "Admissions" : "Yarefuo Bɔɔ"}
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {isEnglish ? "Discharges" : "Gyae Kɔ Fea"}
                        </span>
                      </div>
                    </div>

                    {/* Daily Case Bar Listing */}
                    <div className="space-y-3.5 pt-1 min-w-0">
                      
                      {/* Monday */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium gap-1 min-w-0">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{isEnglish ? "Monday" : "Dwoada"}</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">42 {isEnglish ? "cases" : "nsɛm"} • 85% {isEnglish ? "recovered" : "asa"}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-3.5 rounded-lg overflow-hidden flex">
                          <div className="bg-[#FF5A36] h-full rounded-l-lg" style={{ width: "42%" }}></div>
                          <div className="bg-emerald-500/80 h-full rounded-r-lg" style={{ width: "35%" }}></div>
                        </div>
                      </div>

                      {/* Tuesday */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium gap-1 min-w-0">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{isEnglish ? "Tuesday" : "Benada"}</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">35 {isEnglish ? "cases" : "nsɛm"} • 88% {isEnglish ? "recovered" : "asa"}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-3.5 rounded-lg overflow-hidden flex">
                          <div className="bg-[#FF5A36] h-full rounded-l-lg" style={{ width: "35%" }}></div>
                          <div className="bg-emerald-500/80 h-full rounded-r-lg" style={{ width: "30%" }}></div>
                        </div>
                      </div>

                      {/* Wednesday */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium gap-1 min-w-0">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{isEnglish ? "Wednesday" : "Wukuada"}</span>
                          <span className="font-mono text-[#FF5A36] font-bold text-[11px]">55 {isEnglish ? "cases" : "nsɛm"} ({isEnglish ? "Peak Surge Day" : "Peak Da"})</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-3.5 rounded-lg overflow-hidden flex">
                          <div className="bg-[#FF5A36] h-full rounded-l-lg" style={{ width: "55%" }}></div>
                          <div className="bg-emerald-500/80 h-full rounded-r-lg" style={{ width: "45%" }}></div>
                        </div>
                      </div>

                      {/* Thursday */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium gap-1 min-w-0">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{isEnglish ? "Thursday" : "Yawoada"}</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">22 {isEnglish ? "cases" : "nsɛm"} • 92% {isEnglish ? "recovered" : "asa"}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-3.5 rounded-lg overflow-hidden flex">
                          <div className="bg-[#FF5A36] h-full rounded-l-lg" style={{ width: "22%" }}></div>
                          <div className="bg-emerald-500/80 h-full rounded-r-lg" style={{ width: "20%" }}></div>
                        </div>
                      </div>

                      {/* Friday */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium gap-1 min-w-0">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{isEnglish ? "Friday" : "Efiada"}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">15 {isEnglish ? "cases" : "nsɛm"} ({isEnglish ? "Stabilizing" : "Te so"})</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-3.5 rounded-lg overflow-hidden flex">
                          <div className="bg-emerald-500 h-full rounded-lg" style={{ width: "15%" }}></div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Regional Watchlist Table / Cards */}
                  <div className="bg-white dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-700/60 pb-3 flex items-center gap-2 min-w-0">
                      <Flame className="h-4 w-4 text-[#FF5A36] shrink-0" />
                      <span className="break-words">{isEnglish ? "Regional Outbreak Watchlist & Health Post Status" : "Kuro mu Akwahosan Gyinabea Nsɛm"}</span>
                    </h3>

                    <div className="space-y-3 min-w-0">
                      
                      {/* Zone 1 */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-150 dark:border-zinc-800/80 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 break-words">Greater Accra (Accra Metro & Ga South)</span>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md shrink-0 uppercase">HIGH ALERT</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words">
                          68 {isEnglish ? "active cases" : "yarefuo"} • 97.8% {isEnglish ? "recovery rate" : "ayaresa"}
                        </p>
                        <div className="pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-800 px-2.5 py-1 rounded-lg inline-block border border-zinc-300/40 dark:border-zinc-700 whitespace-nowrap">
                            {isEnglish ? "GHS Response Team Active" : "GHS Kuuo Akɔ Hɔ"}
                          </span>
                        </div>
                      </div>

                      {/* Zone 2 */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-150 dark:border-zinc-800/80 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 break-words">Central Region (Kasoa & Awutu Senya)</span>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0 uppercase">MODERATE RISK</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words">
                          44 {isEnglish ? "active cases" : "yarefuo"} • 98.5% {isEnglish ? "recovery rate" : "ayaresa"}
                        </p>
                        <div className="pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-800 px-2.5 py-1 rounded-lg inline-block border border-zinc-300/40 dark:border-zinc-700 whitespace-nowrap">
                            {isEnglish ? "ORS Distribution On" : "ORS Nsuo Wakyɛ"}
                          </span>
                        </div>
                      </div>

                      {/* Zone 3 */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-150 dark:border-zinc-800/80 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 break-words">Ashanti Region (Kumasi Central)</span>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0 uppercase">LOW RISK</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words">
                          18 {isEnglish ? "active cases" : "yarefuo"} • 99.1% {isEnglish ? "recovery rate" : "ayaresa"}
                        </p>
                        <div className="pt-0.5">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-800 px-2.5 py-1 rounded-lg inline-block border border-zinc-300/40 dark:border-zinc-700 whitespace-nowrap">
                            {isEnglish ? "Screening Active" : "Nhwehwɛmu Kɔ So"}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Water Quality Index Card */}
                  <div className="bg-white dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5 min-w-0">
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-700/60 pb-2.5 min-w-0">
                      <Droplet className="h-4 w-4 text-blue-500 shrink-0" />
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider truncate">
                        {isEnglish ? "Water Sanitation Quality Index" : "Nsuo Ahotew Nhwehwɛmu"}
                      </h4>
                    </div>

                    <div className="space-y-3.5 pt-1 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-center text-xs gap-2 min-w-0">
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold truncate">{isEnglish ? "Piped Water Supply" : "Nsuo Bommo"}</span>
                          <span className="font-bold font-mono text-emerald-500 shrink-0 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md">96% Safe</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[96%] rounded-full"></div>
                        </div>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-center text-xs gap-2 min-w-0">
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold truncate">{isEnglish ? "Registered Sachet Water" : "Sachet Nsuo"}</span>
                          <span className="font-bold font-mono text-emerald-500 shrink-0 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md">92% Safe</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[92%] rounded-full"></div>
                        </div>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex justify-between items-center text-xs gap-2 min-w-0">
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold truncate">{isEnglish ? "Borehole & Open Wells" : "Abura Nsuo"}</span>
                          <span className="font-bold font-mono text-amber-500 shrink-0 text-xs bg-amber-500/10 px-2 py-0.5 rounded-md">68% Safe</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-[68%] rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-1 font-serif break-words">
                          {isEnglish ? "Boiling advisory active for borehole sources." : "Kɔ So Noa abura nsuo ansa na woanom."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contacts & Hotlines */}
                  <div className="bg-gradient-to-br from-[#FF5A36]/10 via-zinc-50 to-zinc-100 dark:from-[#FF5A36]/20 dark:via-zinc-850 dark:to-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#FF5A36]/30 shadow-xs space-y-3.5 min-w-0">
                    <div className="flex items-center gap-2 border-b border-[#FF5A36]/20 pb-2.5 min-w-0">
                      <PhoneCall className="h-4 w-4 text-[#FF5A36] shrink-0" />
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider truncate">
                        {isEnglish ? "GHS Emergency Hotlines" : "Akwahosan Telephone Number"}
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs min-w-0">
                      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-1 min-w-0">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100 block text-xs break-words">{isEnglish ? "National Emergency Toll-Free:" : "GHS Toll-Free Number:"}</span>
                        <span className="text-[#FF5A36] font-mono font-extrabold text-xs sm:text-sm block break-all">112 / 0302-662-382</span>
                      </div>

                      <div className="bg-white dark:bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-1 min-w-0">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100 block text-xs break-words">{isEnglish ? "Korle Bu Cholera CTC:" : "Korle Bu Cholera Ayaresabea:"}</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono font-bold text-xs block break-all">0302-673-811</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDailyModal(true);
                      }}
                      className="w-full mt-2 bg-[#FF5A36] hover:bg-[#E04724] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 whitespace-normal text-center"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>{isEnglish ? "View Cholera Prevention Advisory" : "Hwɛ Banbɔ Afutu Mprepren"}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 4.5: HEALTH NOTIFICATIONS & OUTBREAK ADVISORIES PAGE VIEW */}
            {activeTab === "notifications" && (
              <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 min-w-0">
                <div className="max-w-4xl mx-auto space-y-6 min-w-0">
                  
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-[#FF5A36]/15 via-[#FF5A36]/10 to-amber-500/10 p-5 rounded-2xl border border-[#FF5A36]/30 space-y-3.5 min-w-0 shadow-xs">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#FF5A36] text-white rounded-xl shadow-md shrink-0">
                          <Bell className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-zinc-800 dark:text-zinc-100 font-sans truncate">
                          {isEnglish ? "Health Notifications & Outbreak Advisories" : "Kɔkɔbɔ Nsɛm ne Afutu Mprepren"}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {isEnglish 
                          ? "Official disease surveillance alerts, water purity notices, and daily cholera prevention advisories from Ghana Health Service." 
                          : "Akwahosan Kɔkɔbɔ ne Banbɔ Afutu a efi Ghana Health Service ne Cholex AI ho."}
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDailyModal(true)}
                        className="w-full sm:w-auto bg-[#FF5A36] hover:bg-[#E04724] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{isEnglish ? "View Prevention Tip" : "Hwɛ Banbɔ Afutu"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Bulletins Section */}
                  <div className="space-y-3.5 min-w-0">
                    <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#FF5A36]" />
                        <span>{isEnglish ? "Active Health Bulletins" : "Kɔkɔbɔ Nsɛm A Ɛkɔ So"}</span>
                      </h4>
                      <span className="text-zinc-500 font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full font-bold">
                        {notificationsList.length} {isEnglish ? "bulletins" : "kɔkɔbɔ"}
                      </span>
                    </div>

                    <div className="space-y-3.5 min-w-0">
                      {notificationsList.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white dark:bg-zinc-800/60 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 transition-all hover:border-[#FF5A36]/50 min-w-0"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-700/60 pb-2.5 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border shrink-0 ${item.badgeClass}`}>
                                {item.badge}
                              </span>
                              <h5 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                {isEnglish ? item.titleEn : item.titleTw}
                              </h5>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                              {item.time}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words">
                            {isEnglish ? item.descEn : item.descTw}
                          </p>

                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const query = isEnglish
                                  ? `Tell me more about this health alert: ${item.titleEn}`
                                  : `Kyerɛ me nsɛm foforɔ wɔ kɔkɔbɔ yi ho: ${item.titleTw}`;
                                handleSendMessage(query);
                              }}
                              className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{isEnglish ? "Ask AI About This Alert" : "Bisa AI kɔkɔbɔ yi ho"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowDailyModal(true)}
                              className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                            >
                              {isEnglish ? "Read Full Guidance" : "Kenkan Ne Nyinaa"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: FAQ & ADVISORIES UPDATES VIEW */}
            {activeTab === "updates" && (
              <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-700 pb-2 flex items-center gap-2">
                    <Grid className="h-5 w-5 text-[#FF5A36]" />
                    {isEnglish ? "Frequently Asked Questions" : "Nsɛmmisa a Yɛtaa Bisatɛm"}
                  </h3>

                  {/* FAQ 1 */}
                  <div className="p-4 bg-white dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-serif">
                      {isEnglish 
                        ? "What is cholera and how is it treated?" 
                        : "Cholera ne sɛn na sɛn na yɛsa no yare?"}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                      {isEnglish 
                        ? "Cholera is a severe waterborne bacterial infection. Treatment primarily involves aggressive rehydration via Oral Rehydration Salts (ORS) or intravenous fluids in critical clinic cases."
                        : "Cholera yɛ nsuom yareɛ mmoawa ayamtuo a ɛyɛ hu paa. Ano aduru titiriw ne sɛ wode ORS nsuo asiesie nsuo a afiri wo mu kɔ no ntɛm ara."}
                    </p>
                  </div>

                  {/* FAQ 2 */}
                  <div className="p-4 bg-white dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-serif">
                      {isEnglish 
                        ? "How do I make borehole water safe to drink?" 
                        : "Sɛn na yɛbɔ nsuo ban na ama yɛanom safe?"}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                      {isEnglish 
                        ? "Always boil borehole or river water vigorously for at least 1-2 minutes, or add water purification tablets (such as Aquatabs) and let it sit for 30 minutes before drinking."
                        : "Noa asubɔnten anaa abura nsuo kosi sɛ ɛbɛhye paa mu da gyedɔgyedɔ, anaa fa aduru a ɛkasa nsuo teɛ gu mu ansa na woanom."}
                    </p>
                  </div>

                  {/* FAQ 3 */}
                  <div className="p-4 bg-white dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-serif">
                      {isEnglish 
                        ? "When is diarrhea considered a medical emergency?" 
                        : "Berɛ bɛn na ayamtuo gyina sɛ medical emergency?"}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                      {isEnglish 
                        ? "Diarrhea is an emergency if it is painless and watery, occurs multiple times in an hour, is accompanied by persistent vomiting, sunken eyes, or extreme body weakness."
                        : "Sɛ ayamtuo bɔ nsuo gyegyegye pii, na fofeɔ ne mu mmerɛwa ba mu ntɛm ara a, kɔ ayaresabea kɔhunu dɔkota seesei ara."}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 6: SETTINGS VIEW */}
            {activeTab === "settings" && (
              <div className="flex-1 p-5 md:p-8 overflow-y-auto space-y-6">
                
                <div className="bg-white dark:bg-zinc-800/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-xl space-y-5">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-700/60 pb-2">
                    {isEnglish ? "App Preferences" : "Siedie Nsɛm"}
                  </h3>

                  {/* Language setting option */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Interface Language" : "Kasa Nkyerɛaseɛ"}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{isEnglish ? "Select primary reading language" : "Fa twi anaa english yɛ primary"}</span>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 shrink-0 border border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => onLanguageChange("tw")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          language === "tw"
                            ? "bg-[#FF5A36] text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                        }`}
                      >
                        Asante Twi
                      </button>
                      <button
                        onClick={() => onLanguageChange("en")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          language === "en"
                            ? "bg-[#FF5A36] text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Theme Mode Option */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Appearance Theme" : "Ahoɔfɛ Theme"}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{isEnglish ? "Toggle Dark Mode theme preference" : "Sesa dark/light mode"}</span>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer flex items-center gap-2"
                    >
                      {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                      <span>{darkMode ? (isEnglish ? "Light Mode" : "Light Mode") : (isEnglish ? "Dark Mode" : "Dark Mode")}</span>
                    </button>
                  </div>

                  {/* Chat Font Size Option */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Chat Font Size" : "Nkɔmmɔ Kasa Kɛseɛ"}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{isEnglish ? "Adjust reading font size of AI chat bubbles" : "Sesa nkɔmmɔbɔ mfonini nkyerɛwee kɛseɛ"}</span>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 shrink-0 border border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setChatFontSize("small");
                          localStorage.setItem("chat_font_size", "small");
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          chatFontSize === "small"
                            ? "bg-[#FF5A36] text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                        }`}
                      >
                        {isEnglish ? "Small" : "Kumaa"}
                      </button>
                      <button
                        onClick={() => {
                          setChatFontSize("medium");
                          localStorage.setItem("chat_font_size", "medium");
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          chatFontSize === "medium"
                            ? "bg-[#FF5A36] text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                        }`}
                      >
                        {isEnglish ? "Medium" : "Mfinimfini"}
                      </button>
                      <button
                        onClick={() => {
                          setChatFontSize("large");
                          localStorage.setItem("chat_font_size", "large");
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          chatFontSize === "large"
                            ? "bg-[#FF5A36] text-white"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                        }`}
                      >
                        {isEnglish ? "Large" : "Kɛseɛ"}
                      </button>
                    </div>
                  </div>

                  {/* Chat Font Size Live Preview */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/90 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 italic font-serif transition-all">
                    <span className="text-[10px] font-sans font-bold text-[#FF5A36] not-italic block mb-1 uppercase tracking-wider">
                      {isEnglish ? "Chat Font Size Preview:" : "Nkɔmmɔ Nkyerɛwee Nhwɛsoɔ:"}
                    </span>
                    <p className={`transition-all ${
                      chatFontSize === "small" 
                        ? "text-xs sm:text-sm" 
                        : chatFontSize === "medium" 
                        ? "text-sm sm:text-base" 
                        : "text-base sm:text-lg"
                    }`}>
                      {isEnglish 
                        ? "Cholex AI: Always boil drinking water and practice good hand hygiene." 
                        : "Cholex AI: Ma nsuo a wo bɛnom no nye hye paa ansa na woanom."}
                    </p>
                  </div>

                  {/* Khaya AI Audio Settings */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                        {isEnglish ? "Khaya AI Audio" : "Khaya AI Nnyigyei"}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {isEnglish ? "Choose a voice and playback speed. Downloaded clips remain available offline." : "Paw nne ne ntɛm a wobɛte nne no. Audio a wɔanya no bɛyɛ adwuma offline."}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {([
                        ["female", isEnglish ? "Female" : "Ɔbaa"],
                        ["male_low", isEnglish ? "Male (Deep)" : "Ɔbarima (Low)"],
                        ["male_high", isEnglish ? "Male (High)" : "Ɔbarima (High)"],
                      ] as [KhayaSpeaker, string][]).map(([speaker, label]) => (
                        <button
                          key={speaker}
                          onClick={() => setKhayaAudioSettings({ speaker })}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                            audioSettings.speaker === speaker
                              ? "bg-[#FF5A36] text-white border-[#FF5A36]"
                              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-[#FF5A36]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Speaking Speed" : "Kasa Ntɛmntɛm"}</span>
                        <span className="text-[10px] text-zinc-400">{audioSettings.speakingRate.toFixed(1)}x</span>
                      </div>
                      <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                        {[0.8, 1.0, 1.2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setKhayaAudioSettings({ speakingRate: rate })}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                              audioSettings.speakingRate === rate
                                ? "bg-[#FF5A36] text-white"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                            }`}
                          >
                            {rate.toFixed(1)}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => void handlePreviewAudio()}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A36] text-white hover:bg-[#E54E2E] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      {isTestingAudio ? (isEnglish ? "Stop Preview" : "Gyae Nhwɛsoɔ") : (isEnglish ? "Test Khaya Voice" : "Sɔ Khaya Nne")}
                    </button>
                  </div>


                  {/* View Disclaimer Option */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Medical Disclaimer" : "Kɔkɔbɔ ne Nkyerɛkyerɛ"}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{isEnglish ? "View health info advisory notice" : "Hwɛ apɔwmuden kɔkɔbɔ gye"}</span>
                    </div>
                    <button
                      onClick={() => setShowDisclaimer(true)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>{isEnglish ? "View Advisory" : "Hwɛ Kɔkɔbɔ"}</span>
                    </button>
                  </div>

                  {/* Clear session storage control */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">{isEnglish ? "Clear Logged Data" : "Pae Log No"}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{isEnglish ? "Clear stored symptom tracker and local storage" : "Popae trackers ne logs nyinaa"}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(isEnglish ? "Clear all logs and reset cache?" : "Sɛ wobɛpopae logs ne tracker logs nyinaa?")) {
                          localStorage.clear();
                          setSymptomLogs([]);
                          alert("Cleared!");
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 transition-colors cursor-pointer"
                    >
                      {isEnglish ? "Clear All" : "Popae Nyinaa"}
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>


          {/* DAILY HEALTH PREVENTION ADVISORY NOTIFICATION MODAL */}
          <DailyNotificationModal 
            isOpen={showDailyModal && !showSplashScreen} 
            onClose={() => {
              setShowDailyModal(false);
              setShowDisclaimer(true);
            }} 
            language={language} 
          />

          {/* MEDICAL DISCLAIMER OVERLAY MODAL */}
          <Disclaimer 
            isOpen={showDisclaimer && !showSplashScreen && !showDailyModal} 
            onClose={() => setShowDisclaimer(false)} 
            language={language} 
          />

          {/* NATIVE MOBILE BOTTOM NAVIGATION TAB BAR */}
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#181A20] px-2 py-1.5 flex items-center justify-around z-40 shrink-0 text-zinc-500 dark:text-zinc-400">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                activeTab === "chat" ? "text-[#FF5A36] font-bold" : "hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px]">{isEnglish ? "Chat" : "Chat"}</span>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                activeTab === "templates" ? "text-[#FF5A36] font-bold" : "hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="text-[10px]">{isEnglish ? "Checkup" : "Sɔhwɛ"}</span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                activeTab === "projects" ? "text-[#FF5A36] font-bold" : "hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-[10px]">{isEnglish ? "Tracker" : "Tracker"}</span>
            </button>

            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                activeTab === "statistics" ? "text-[#FF5A36] font-bold" : "hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px]">{isEnglish ? "Stats" : "Stats"}</span>
            </button>
          </div>

        </div>

      </main>

      {/* RIGHT SIDEBAR (Collapsible Knowledge History sidebar) */}
      <aside 
        className={`bg-white dark:bg-[#1C1C1F] h-full shrink-0 z-30 transition-all duration-300 border-l border-zinc-200/80 dark:border-zinc-800 flex flex-col ${
          showHistory 
            ? "w-72 xl:w-80 absolute xl:relative right-0 top-0 bottom-0 shadow-2xl xl:shadow-none" 
            : "w-0 overflow-hidden border-l-0"
        }`}
      >
        
        {/* Toggle arrow handle floating between panels */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="absolute -left-3.5 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 shadow-md text-zinc-500 hover:text-[#FF5A36] z-40 cursor-pointer hover:scale-110 transition-all flex items-center justify-center"
          title={showHistory ? "Collapse Knowledge Panel" : "Expand Knowledge Panel"}
        >
          {showHistory ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {showHistory && (
          <div className="flex flex-col h-full w-72 xl:w-80">
            
            {/* Header with limit meter */}
            <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-sans">
                {isEnglish ? "Knowledge Base" : "Knowledge Base"}
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                {historyTopics.length} topics
              </span>
            </div>

            {/* List of scrollable history knowledge logs */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
              
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 font-sans">
                {isEnglish ? "Interactive Questions" : "Interactive Questions"}
              </div>

              {historyTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(topic.query)}
                  className="w-full text-left p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-50 hover:border-[#FF5A36] dark:hover:bg-zinc-800/80 transition-all cursor-pointer block group shadow-sm"
                >
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block group-hover:text-[#FF5A36] transition-colors">
                    {topic.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                    {topic.desc}
                  </span>
                </button>
              ))}

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-[10px] text-zinc-400 leading-relaxed max-w-[220px] mx-auto">
                  {isEnglish 
                    ? "Clicking any topic triggers an automated Bilingual AI consult with Gemini."
                    : "Hwɛ asɛmmisa yi biara na kɔ AI ho mprepren."}
                </p>
              </div>

            </div>

            {/* Clear conversations footer */}
            <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 shrink-0">
              <button
                onClick={handleResetChat}
                className="w-full py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isEnglish ? "Reset Session" : "Mina Sɛsɛm Bio"}</span>
              </button>
            </div>

          </div>
        )}

      </aside>

    </div>
  );
}
