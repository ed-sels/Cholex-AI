import * as FileSystem from 'expo-file-system/legacy';

export type KhayaSpeaker = 'female' | 'male_low' | 'male_high';

export interface KhayaAudioSettings {
  speaker: KhayaSpeaker;
  speakingRate: number; // 0.8, 1.0 (Khaya natural), 1.2
  pitch: number;        // 1.0 (natural pitch)
  sampleRate: number;   // 16000 Hz (Khaya AI standard)
}

export const DEFAULT_KHAYA_AUDIO_SETTINGS: KhayaAudioSettings = {
  speaker: 'female',
  speakingRate: 1.0,
  pitch: 1.0,
  sampleRate: 16000,
};

const SETTINGS_FILE_PATH = `${FileSystem.documentDirectory}khaya_audio_settings.json`;

let currentSettings: KhayaAudioSettings = { ...DEFAULT_KHAYA_AUDIO_SETTINGS };
const listeners: Set<(settings: KhayaAudioSettings) => void> = new Set();
let isLoaded = false;

export async function loadKhayaAudioSettings(): Promise<KhayaAudioSettings> {
  if (isLoaded) return currentSettings;
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
      const parsed = JSON.parse(content);
      currentSettings = {
        speaker: parsed.speaker === 'male_low' || parsed.speaker === 'male_high' ? parsed.speaker : 'female',
        speakingRate: typeof parsed.speakingRate === 'number' ? parsed.speakingRate : 1.0,
        pitch: typeof parsed.pitch === 'number' ? parsed.pitch : 1.0,
        sampleRate: 16000,
      };
    }
  } catch (error) {
    console.warn('Failed to load Khaya audio settings from storage:', error);
  } finally {
    isLoaded = true;
  }
  return currentSettings;
}

export function getKhayaAudioSettings(): KhayaAudioSettings {
  return currentSettings;
}

export async function setKhayaAudioSettings(
  partial: Partial<KhayaAudioSettings>,
): Promise<KhayaAudioSettings> {
  currentSettings = {
    ...currentSettings,
    ...partial,
    sampleRate: 16000,
  };

  listeners.forEach((listener) => {
    try {
      listener(currentSettings);
    } catch (error) {
      console.error('Audio settings listener error:', error);
    }
  });

  try {
    await FileSystem.writeAsStringAsync(
      SETTINGS_FILE_PATH,
      JSON.stringify(currentSettings),
    );
  } catch (error) {
    console.warn('Failed to persist Khaya audio settings:', error);
  }

  return currentSettings;
}

export function subscribeToAudioSettings(
  listener: (settings: KhayaAudioSettings) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
