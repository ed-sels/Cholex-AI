import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DisclaimerProps {
  isOpen?: boolean;
  onClose?: () => void;
  language?: "en" | "tw";
}

export default function Disclaimer({ isOpen = true, onClose, language = "en" }: DisclaimerProps) {
  const isEnglish = language === "en";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="disclaimer-overlay"
        className="absolute inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#181A20] text-zinc-900 dark:text-zinc-100 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-zinc-200/80 dark:border-zinc-800 relative flex flex-col gap-4 overflow-hidden"
        >
          {/* Header Accent */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  {isEnglish ? "IMPORTANT MEDICAL NOTICE" : "AKWAABA KƆKƆBƆ TITIRIƐ"}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {isEnglish ? "Health Disclaimer" : "Kɔkɔbɔ ne Nkyerɛkyerɛ"}
                </h3>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close disclaimer"
                id="dismiss-disclaimer-btn"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content Box */}
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {isEnglish 
                ? "Cholex AI provides public health guidance, water safety advice, and symptom awareness for educational purposes only." 
                : "Cholex AI ma cholera ho nsɛm, nsuo ahotew afutu, ne nkyerɛkyerɛ nko ara a ɛfa amansan apɔwmuden ho."}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {isEnglish
                ? "This service is NOT a substitute for professional clinical advice, medical diagnosis, or emergency hospital treatment. If you or someone you know shows severe symptoms (such as rapid dehydration or persistent vomiting), visit the nearest hospital or health clinic immediately."
                : "Ɛnyɛ dɔkota adwuma anaa ayaresabea mmoa na ɛsi ananmu. Sɛ woayɛ mmerɛ anaa woahu nsenkyerɛne biara a, kɔ ayaresabea anaa clinic a ɛbɛn wo ntɛm ara."}
            </p>
          </div>

          {/* Emergency Alert Banner */}
          <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold px-1">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              {isEnglish 
                ? "In case of severe emergency, call Ghana Emergency Helpline 112." 
                : "Sɛ ntɛmprow anaa cholera ho kɔkɔbɔ bi ba a, frɛ 112."}
            </span>
          </div>

          {/* Accept / Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-1 py-3 px-4 bg-[#FF5A36] hover:bg-[#E54E2E] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <CheckCircle2 className="h-4.5 w-4.5" />
            <span>{isEnglish ? "I Understand & Accept" : "Mateeaseɛ (I Understand)"}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

