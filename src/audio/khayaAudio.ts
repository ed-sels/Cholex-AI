export type KhayaSpeaker = 'female' | 'male_low' | 'male_high';

export interface KhayaAudioSettings {
  speaker: KhayaSpeaker;
  speakingRate: number;
}

const SETTINGS_KEY = 'cholex.khaya-audio-settings';
const AUDIO_CACHE_NAME = 'cholex-khaya-audio-v2';
const DEFAULT_SETTINGS: KhayaAudioSettings = {
  speaker: 'female',
  speakingRate: 1.0,
};

let currentSettings = readSettings();
const listeners = new Set<(settings: KhayaAudioSettings) => void>();

function readSettings(): KhayaAudioSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      speaker: stored.speaker === 'male_low' || stored.speaker === 'male_high'
        ? stored.speaker
        : 'female',
      speakingRate: typeof stored.speakingRate === 'number'
        ? Math.min(1.2, Math.max(0.8, stored.speakingRate))
        : 1.0,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function getKhayaAudioSettings(): KhayaAudioSettings {
  return currentSettings;
}

export function setKhayaAudioSettings(partial: Partial<KhayaAudioSettings>): KhayaAudioSettings {
  currentSettings = {
    ...currentSettings,
    ...partial,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  listeners.forEach((listener) => listener(currentSettings));
  return currentSettings;
}

export function subscribeToKhayaAudioSettings(
  listener: (settings: KhayaAudioSettings) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.port === '3000') return '';
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

function cleanTextForSpeech(text: string, language: 'tw' | 'en' = 'tw'): string {
  const cleaned = text
    .replace(/[*#_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (language !== 'en') return cleaned;

  return cleaned
    .replace(/\bORS\b/gi, 'oral rehydration salts')
    .replace(/\bAI\b/g, 'A I')
    .replace(/\bGHS\b/g, 'G H S')
    .replace(/\bIV\b/g, 'I V')
    .replace(/\bTTS\b/g, 'text to speech');
}

function cacheKey(text: string, language: 'tw' | 'en', settings: KhayaAudioSettings): string {
  const encodedText = encodeURIComponent(cleanTextForSpeech(text, language));
  return `${getApiBaseUrl()}/api/speak?language=${language}&speaker=${settings.speaker}&rate=${settings.speakingRate}&text=${encodedText}`;
}

async function getCachedAudio(key: string): Promise<Blob | null> {
  if (!('caches' in window)) return null;
  const response = await caches.match(key, { cacheName: AUDIO_CACHE_NAME });
  return response ? response.blob() : null;
}

async function cacheAudio(key: string, audio: Blob): Promise<void> {
  if (!('caches' in window)) return;
  const cache = await caches.open(AUDIO_CACHE_NAME);
  await cache.put(key, new Response(audio, { headers: { 'Content-Type': 'audio/wav' } }));
}

async function requestKhayaAudio(
  text: string,
  language: 'tw' | 'en',
  settings: KhayaAudioSettings,
): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}/api/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleanTextForSpeech(text, language),
      language,
      speaker_id: settings.speaker,
      speaking_rate: settings.speakingRate,
    }),
  });
  if (!response.ok) throw new Error(`Khaya audio request failed: ${response.status}`);
  return response.blob();
}

export async function cacheKhayaAudio(
  text: string,
  language: 'tw' | 'en',
): Promise<void> {
  const cleanedText = cleanTextForSpeech(text, language);
  if (!cleanedText || !navigator.onLine) return;

  const settings = getKhayaAudioSettings();
  const key = cacheKey(cleanedText, language, settings);
  if (await getCachedAudio(key)) return;

  const audioBlob = await requestKhayaAudio(cleanedText, language, settings);
  await cacheAudio(key, audioBlob);
}

export async function warmKhayaAudioCache(
  texts: string[],
  language: 'tw' | 'en',
): Promise<void> {
  for (const text of texts) {
    try {
      await cacheKhayaAudio(text, language);
    } catch (error) {
      console.warn(`Unable to pre-cache ${language} Khaya audio`, error);
    }
  }
}

export async function playKhayaAudio(
  text: string,
  language: 'tw' | 'en',
  onDone: () => void,
): Promise<HTMLAudioElement> {
  const cleanedText = cleanTextForSpeech(text, language);
  if (!cleanedText) throw new Error('Text to speak is empty');

  const settings = getKhayaAudioSettings();
  const key = cacheKey(cleanedText, language, settings);
  let audioBlob = await getCachedAudio(key);

  if (!audioBlob) {
    try {
      audioBlob = await requestKhayaAudio(cleanedText, language, settings);
      await cacheAudio(key, audioBlob);
    } catch (error) {
      throw new Error(`Khaya audio is unavailable and no offline clip exists: ${String(error)}`);
    }
  }

  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.playbackRate = settings.speakingRate;
  audio.onended = () => {
    URL.revokeObjectURL(audio.src);
    onDone();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(audio.src);
    onDone();
  };
  await audio.play();
  return audio;
}

export function speakWithBrowserVoice(
  text: string,
  language: 'tw' | 'en',
  onDone: () => void,
): void {
  if (!('speechSynthesis' in window)) throw new Error('Speech synthesis is unavailable');
  const settings = getKhayaAudioSettings();
  const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text, language));
  utterance.lang = language === 'tw' ? 'ak-GH' : 'en-US';
  const voices = window.speechSynthesis.getVoices();
  if (language === 'en') {
    utterance.voice = voices.find((voice) => /en-(GB|AU|GH)/i.test(voice.lang))
      || voices.find((voice) => /^en-/i.test(voice.lang))
      || null;
  }
  utterance.rate = settings.speakingRate;
  utterance.pitch = 1;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
}

export function stopKhayaAudio(audio: HTMLAudioElement | null): void {
  window.speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    URL.revokeObjectURL(audio.src);
    audio.src = '';
  }
}
