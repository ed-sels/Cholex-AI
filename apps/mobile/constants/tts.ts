import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import SherpaOnnx, { type TtsModelConfig } from '@siteed/sherpa-onnx.rn';
import { API_BASE_URL } from './api';

export type SpeechLanguage = 'tw' | 'en';

const LOCAL_TTS_ROOT = `${FileSystem.documentDirectory}models/tts/`;
let activeLocalTtsLanguage: SpeechLanguage | null = null;

const localTtsConfigs: Record<SpeechLanguage, TtsModelConfig> = {
  en: {
    modelDir: `${LOCAL_TTS_ROOT}en/`,
    ttsModelType: 'kokoro',
    modelFile: 'model.onnx',
    tokensFile: 'tokens.txt',
    voicesFile: 'voices.bin',
    dataDir: `${LOCAL_TTS_ROOT}en/espeak-ng-data/`,
    numThreads: 2,
  },
  tw: {
    modelDir: `${LOCAL_TTS_ROOT}tw/`,
    ttsModelType: 'vits',
    modelFile: 'model.onnx',
    tokensFile: 'tokens.txt',
    lexiconFile: 'lexicon.txt',
    numThreads: 2,
  },
};

async function localModelExists(language: SpeechLanguage): Promise<boolean> {
  const config = localTtsConfigs[language];
  const requiredFiles = [config.modelFile, config.tokensFile];
  if (config.voicesFile) requiredFiles.push(config.voicesFile);
  if (config.lexiconFile) requiredFiles.push(config.lexiconFile);

  const files = await Promise.all(
    requiredFiles.map((file) => FileSystem.getInfoAsync(`${config.modelDir}${file}`)),
  );
  return files.every((file) => file.exists);
}

async function initializeLocalTts(language: SpeechLanguage): Promise<boolean> {
  if (activeLocalTtsLanguage === language) return true;
  if (!(await localModelExists(language))) return false;

  await SherpaOnnx.TTS.initialize(localTtsConfigs[language]);
  activeLocalTtsLanguage = language;
  return true;
}

export async function speakLocalSpeech(
  text: string,
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  if (!(await initializeLocalTts(language))) return null;

  const result = await SherpaOnnx.TTS.generateSpeech(text, {
    speakerId: 0,
    speakingRate: 0.9,
    playAudio: false,
  });
  if (!result.success || !result.filePath) return null;

  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer({ uri: result.filePath });
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      player.remove();
      onDone();
    }
  });
  player.play();
  return player;
}

export async function speakOfflineSpeech(
  text: string,
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  return speakWithDeviceVoice(text, language, onDone);
}

function arrayBufferToDataUri(buffer: ArrayBuffer, contentType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: contentType });
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to prepare synthesized audio'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read synthesized audio'));
    reader.readAsDataURL(blob);
  });
}

export async function fetchAndPlaySpeech(
  text: string,
  language: SpeechLanguage,
  onPlaybackStatusUpdate?: (isPlaying: boolean) => void,
): Promise<AudioPlayer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Speech synthesis failed with status ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'audio/wav';
  const dataUri = await arrayBufferToDataUri(buffer, contentType);
  const cacheUri = `${FileSystem.cacheDirectory}cholex-${Date.now()}.${contentType.includes('mpeg') ? 'mp3' : 'wav'}`;
  const base64Audio = dataUri.substring(dataUri.indexOf(',') + 1);
  await FileSystem.writeAsStringAsync(cacheUri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer({ uri: cacheUri });
  player.addListener('playbackStatusUpdate', (status) => {
    onPlaybackStatusUpdate?.(status.playing);
    if (status.didJustFinish) {
      player.remove();
      void FileSystem.deleteAsync(cacheUri, { idempotent: true });
    }
  });
  player.play();
  return player;
}

export function stopAndUnloadSpeech(player: AudioPlayer | null): void {
  Speech.stop();
  void SherpaOnnx.TTS.stopSpeech().catch(() => undefined);
  if (player) {
    player.pause();
    player.remove();
  }
}

async function speakWithDeviceVoice(
  text: string,
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  Speech.speak(text, {
    language: language === 'en' ? 'en-US' : 'ak',
    rate: 0.9,
    pitch: 1,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
  return null;
}

export async function speakOnDevice(
  text: string,
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  Speech.stop();
  try {
    const localPlayer = await speakLocalSpeech(text, language, onDone);
    if (localPlayer) return localPlayer;
  } catch (error) {
    console.warn(`Local ${language} TTS unavailable; using device voice`, error);
  }
  return speakWithDeviceVoice(text, language, onDone);
}
