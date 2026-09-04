import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Bell, X, Volume2, Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

export interface HealthTip {
  id: number;
  english: string;
  twi: string;
}

export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 1,
    english: "Drink only safe water. Boil it, chlorinate it, or use bottled water for drinking, brushing teeth, and cooking.",
    twi: "Nnom nsuo a ɛho tew nko ara. Noa wo nsuo, de chlorine gu mu, anaa nnom nsuo a ɛwɔ tumpan mu na mfa hohoro wo se anaa mfa noa aduane."
  },
  {
    id: 2,
    english: "Wash your hands with soap and clean running water frequently, especially before eating or preparing food, and after using the toilet.",
    twi: "Hohoro wo nsa ho dadeɛ kwan so mprepren de samina ne nsuo a ɛteɛ hohoro ho, titiriw ansa na woadi aduane, woanoa aduane, ne nea wofi tiafi."
  },
  {
    id: 3,
    english: "Cook food thoroughly and eat it while hot. Keep all food covered to prevent flies, and avoid raw unpeeled fruits and vegetables.",
    twi: "Noa wo nduane yie na di no hye. Kata so na nwansena ankɔgu so, na kyi nnuaba anaa nneɛma a wontumi mmuane ansa na woadi."
  },
  {
    id: 4,
    english: "Dispose of feces safely. Always use toilets or latrines, and wash your hands immediately after to prevent contamination.",
    twi: "Kɔ tiafi ɛfata. Sɛ wofi tiafi a, hohoro wo nsa ho dadeɛ kwan so ntɛm ara ne samina na woantare yareɛ yi mfa mma afoforɔ."
  },
  {
    id: 5,
    english: "If you develop watery diarrhea, start drinking Oral Rehydration Salts (ORS) immediately and seek professional medical care.",
    twi: "Sɛ wowɔ ayamtuo yareɛ a, hyɛ aseɛ nnom ORS nsuo (ano aduru) ntɛm ara, na kɔ ayaresabea kɔhunu dɔkota ansa na nsuo asa wo mu."
  },
  {
    id: 6,
    english: "Keep your surroundings clean. Clean and disinfect latrines, handwashing stations, and food preparation surfaces regularly.",
    twi: "Ma wo mpɔtam hɔ ho ntew daa. Hohoro na kyere tiafi, nsa-hohoro-mmeae, ne mmeae a wɔnoa aduane ho de dwoodwoo yareɛ mmoawa."
  }
];

interface DailyNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "tw" | "en";
}

export default function DailyNotificationModal({
  isOpen,
  onClose,
  language
}: DailyNotificationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Pick a tip based on day of month so it rotates daily
    const day = new Date().getDate();
    return (day - 1) % HEALTH_TIPS.length;
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isEnglish = language === "en";
  const currentTip = HEALTH_TIPS[currentIndex];
  const tipText = isEnglish ? currentTip.english : currentTip.twi;

  const handleNext = () => {
    stopAudio();
    setCurrentIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
  };

  const handlePrev = () => {
    stopAudio();
    setCurrentIndex((prev) => (prev - 1 + HEALTH_TIPS.length) % HEALTH_TIPS.length);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    speechRef.current = null;
    setIsPlayingAudio(false);
  };

  const handleSpeakTip = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);
    try {
      if (!("speechSynthesis" in window)) {
        throw new Error("Local speech is unavailable in this browser");
      }

      const utterance = new SpeechSynthesisUtterance(tipText);
      utterance.lang = isEnglish ? "en-US" : "ak-GH";
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      utterance.onerror = () => setIsPlayingAudio(false);
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } catch (err) {
      console.error("Failed to speak tip:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1F] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Top Decorative Banner Header */}
          <div className="bg-gradient-to-r from-[#FF5A36] to-[#E04724] p-5 text-white relative">
            <button
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Bell className="h-6 w-6 text-white animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 bg-white/20 px-2 py-0.5 rounded-md inline-block">
                  {isEnglish ? "Daily Health Advisory" : "Daa Nkɔmmɔ Kɔkɔbɔ"}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {isEnglish ? "Cholera & Diarrhea Prevention Tip" : "Cholera ne Ayamtuo Banbɔ Afutu"}
                </h3>
              </div>
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 space-y-5">
            {/* Prevention Badge & Index Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <ShieldCheck className="h-4 w-4" />
                <span>{isEnglish ? `Tip ${currentIndex + 1} of ${HEALTH_TIPS.length}` : `Afutu ${currentIndex + 1} wɔ ${HEALTH_TIPS.length} mu`}</span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400">
                {new Date().toLocaleDateString(isEnglish ? "en-US" : "tw-GH", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>

            {/* Tip Text Area */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <p className="text-base text-zinc-800 dark:text-zinc-100 font-serif leading-relaxed">
                "{tipText}"
              </p>

              {/* TTS Audio Speak Button */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">
                  {isEnglish ? "Listen in audio:" : "Tie wɔ nnyigyei mu:"}
                </span>
                <button
                  onClick={handleSpeakTip}
                  disabled={isLoadingAudio}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isPlayingAudio
                      ? "bg-red-500 text-white border-red-600 shadow-md animate-pulse"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-[#FF5A36] hover:text-[#FF5A36]"
                  }`}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPlayingAudio
                      ? (isEnglish ? "Playing..." : "Erekasa...")
                      : (isEnglish ? "Listen Audio" : "Tie Nnyigyei")}
                  </span>
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer transition-all"
                  title={isEnglish ? "Previous Tip" : "Firi anim kɔ akyiri"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer transition-all"
                  title={isEnglish ? "Next Tip" : "Kɔ anim"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Acknowledge & Dismiss Button */}
              <button
                onClick={() => {
                  stopAudio();
                  onClose();
                }}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FF5A36] hover:bg-[#e04826] active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isEnglish ? "Got It, Continue" : "Mate Aseɛ, Toa So"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
