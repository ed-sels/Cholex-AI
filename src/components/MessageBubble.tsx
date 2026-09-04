import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Eye, EyeOff, Loader2, Play, Square } from "lucide-react";
import { motion } from "motion/react";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  english?: string;
  intent?: string;
  confidence?: number;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  language: "tw" | "en";
  chatFontSize?: "small" | "medium" | "large";
  key?: string;
}

export default function MessageBubble({ message, language, chatFontSize = "small" }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState<"tw" | "en" | false>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<"tw" | "en" | false>(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      speechRef.current = null;
    };
  }, []);

  const playTTS = async (speakLanguage: "tw" | "en") => {
    if (isPlaying === speakLanguage) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
      setIsPlaying(false);
    }

    setIsLoadingAudio(speakLanguage);

    try {
      const isEnglish = speakLanguage === "en";
      const textToSpeak = isEnglish ? (message.english || message.text) : message.text;

      if (!("speechSynthesis" in window)) {
        throw new Error("Local speech is unavailable in this browser");
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = speakLanguage === "en" ? "en-US" : "ak-GH";
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        console.error("Local speech playback error");
      };
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(speakLanguage);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      const isEnglishLang = language === "en";
      alert(
        isEnglishLang
          ? "Could not load audio speech. Please read the text instead."
          : "Nsa gu ogya mu. Wo ntumi nnye nsenkyerɛne nnyigyei mprepren. (Could not load audio speech. Please read the text instead.)"
      );
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const isUser = message.sender === "user";
  const isEnglish = language === "en";

  // Swap primary and translation representation based on selected language
  const hasTranslation = !!message.english;
  const primaryText = (isEnglish && hasTranslation) ? message.english : message.text;
  const translationText = (isEnglish && hasTranslation) ? message.text : message.english;
  const translationLabel = isEnglish ? "Twi Translation:" : "English Translation:";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex flex-col mb-4 max-w-[85%] ${
        isUser ? "self-end items-end" : "self-start items-start"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`text-xs font-bold ${isUser ? "text-natural-brown" : "text-natural-olive"}`}>
          {isUser ? (isEnglish ? "You" : "Wo (You)") : "Cholera Bot"}
        </span>
        <span className="text-[10px] text-natural-muted font-mono">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {message.intent && !isUser && (
          <span className="text-[10px] bg-natural-panel text-natural-olive font-medium px-2 py-0.5 rounded-full border border-natural-border uppercase tracking-wider font-sans">
            {message.intent} ({(message.confidence! * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      <div
        className={`relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-sm border transition-colors ${
          isUser
            ? "bg-natural-cream text-natural-text border-natural-sand rounded-tr-none"
            : "bg-natural-bubble text-natural-text border-natural-border rounded-tl-none"
        }`}
      >
        <p className={`leading-relaxed break-words whitespace-pre-line font-serif text-natural-text transition-all ${
          chatFontSize === "small" 
            ? "text-xs sm:text-sm" 
            : chatFontSize === "medium" 
            ? "text-sm sm:text-base" 
            : "text-base sm:text-lg"
        }`}>
          {primaryText}
        </p>

        {/* Translation View */}
        {translationText && showTranslation && (
          <div className={`mt-2.5 pt-2.5 border-t border-natural-border/60 text-natural-muted italic font-normal font-sans transition-all ${
            chatFontSize === "small"
              ? "text-[11px] sm:text-xs"
              : chatFontSize === "medium"
              ? "text-xs sm:text-sm"
              : "text-sm sm:text-base"
          }`}>
            <span className="block text-[10px] font-bold text-natural-olive uppercase tracking-wider not-italic mb-0.5">
              {translationLabel}
            </span>
            {translationText}
          </div>
        )}

        {/* Bot Controls */}
        {!isUser && (
          <div className="mt-3 pt-2 border-t border-natural-border/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Twi Speech Button */}
              <button
                onClick={() => playTTS("tw")}
                disabled={isLoadingAudio !== false}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  isPlaying === "tw"
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                    : "bg-transparent border border-natural-olive text-natural-olive hover:bg-natural-olive hover:text-white"
                }`}
                id={`tts-btn-tw-${message.id}`}
              >
                {isLoadingAudio === "tw" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-natural-olive" />
                    <span className="font-sans font-medium">
                      {isEnglish ? "Preparing Twi..." : "Yɛre siesie Twi..."}
                    </span>
                  </>
                ) : isPlaying === "tw" ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                    <span className="font-sans">{isEnglish ? "Stop Twi" : "Gyae Twi"}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="font-sans">{isEnglish ? "Speak Twi" : "Kenkan Twi"}</span>
                  </>
                )}
              </button>

              {/* English Speech Button */}
              {message.english && (
                <button
                  onClick={() => playTTS("en")}
                  disabled={isLoadingAudio !== false}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    isPlaying === "en"
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                      : "bg-transparent border border-natural-olive text-natural-olive hover:bg-natural-olive hover:text-white"
                  }`}
                  id={`tts-btn-en-${message.id}`}
                >
                  {isLoadingAudio === "en" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-natural-olive" />
                      <span className="font-sans font-medium">
                        {isEnglish ? "Preparing English..." : "Yɛre siesie English..."}
                      </span>
                    </>
                  ) : isPlaying === "en" ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                      <span className="font-sans">{isEnglish ? "Stop English" : "Gyae English"}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="font-sans">{isEnglish ? "Speak English" : "Kenkan English"}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* English/Twi Translation Toggle */}
            {hasTranslation && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="flex items-center gap-1.5 text-xs text-natural-muted hover:text-natural-olive font-bold px-2.5 py-1.5 rounded-full hover:bg-natural-panel border border-transparent hover:border-natural-border transition-all cursor-pointer font-sans"
                id={`translate-btn-${message.id}`}
              >
                {showTranslation ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>{isEnglish ? "Hide Twi" : "Kata English"}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isEnglish ? "Show Twi" : "Hunu English"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* User Controls */}
        {isUser && (
          <div className="mt-2 pt-1.5 border-t border-natural-border/20 flex justify-end">
            <button
              onClick={() => playTTS(language)}
              disabled={isLoadingAudio !== false}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                isPlaying === language
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                  : "bg-transparent border border-natural-olive/60 text-natural-olive/80 hover:bg-natural-olive hover:text-white"
              }`}
              id={`tts-btn-user-${message.id}`}
            >
              {isLoadingAudio === language ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-natural-olive" />
                  <span className="font-sans font-medium">...</span>
                </>
              ) : isPlaying === language ? (
                <>
                  <VolumeX className="h-3 w-3 animate-pulse" />
                  <span className="font-sans">{isEnglish ? "Stop" : "Gyae"}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" />
                  <span className="font-sans">{isEnglish ? "Speak" : "Kenkan"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
