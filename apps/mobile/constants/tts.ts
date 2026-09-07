import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import type { TtsModelConfig } from '@siteed/sherpa-onnx.rn';
import { API_BASE_URL } from './api';
import { bootstrapTtsModels } from '../utils/bootstrapTts';

import { getKhayaAudioSettings, type KhayaSpeaker } from './audioSettings';

export type SpeechLanguage = 'tw' | 'en';

type SherpaOnnxModule = typeof import('@siteed/sherpa-onnx.rn').default;

function getSherpaOnnx(): SherpaOnnxModule | null {
  try {
    const module = require('@siteed/sherpa-onnx.rn');
    return module.default ?? module;
  } catch {
    return null;
  }
}

const LOCAL_TTS_ROOT = `${FileSystem.documentDirectory}models/tts/`;
let activeLocalTtsLanguage: SpeechLanguage | null = null;
const offlineVoiceByLanguage: Partial<Record<SpeechLanguage, string | null>> = {};

function speakerToLocalId(speaker: KhayaSpeaker): number {
  switch (speaker) {
    case 'female':
      return 0;
    case 'male_low':
      return 1;
    case 'male_high':
      return 2;
    default:
      return 0;
  }
}

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
  await bootstrapTtsModels();
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
  const sherpaOnnx = getSherpaOnnx();
  if (!sherpaOnnx) return false;
  if (activeLocalTtsLanguage === language) return true;
  if (!(await localModelExists(language))) return false;

  await sherpaOnnx.TTS.initialize(localTtsConfigs[language]);
  activeLocalTtsLanguage = language;
  return true;
}

async function getOfflineVoice(language: SpeechLanguage): Promise<string | undefined> {
  if (language in offlineVoiceByLanguage) {
    return offlineVoiceByLanguage[language] ?? undefined;
  }

  const voices = await Speech.getAvailableVoicesAsync();
  const languageCode = language === 'tw' ? 'ak' : 'en';
  const rankedVoice = voices
    .filter((voice) => {
      const voiceLanguage = voice.language.toLowerCase();
      return language === 'tw'
        ? voiceLanguage === 'ak-gh'
          || voiceLanguage === 'ak'
          || voiceLanguage === 'twi'
          || voiceLanguage.startsWith('ak-')
        : voiceLanguage === 'en-gh' || voiceLanguage === 'en-us' || voiceLanguage.startsWith('en-');
    })
    .sort((left, right) => {
      const leftLanguage = left.language.toLowerCase();
      const rightLanguage = right.language.toLowerCase();
      const leftScore = leftLanguage === (language === 'tw' ? 'ak-gh' : 'en-gh')
        ? 0
        : leftLanguage === languageCode
          ? 1
          : 2;
      const rightScore = rightLanguage === (language === 'tw' ? 'ak-gh' : 'en-gh')
        ? 0
        : rightLanguage === languageCode
          ? 1
          : 2;
      return leftScore - rightScore;
    })[0];

  offlineVoiceByLanguage[language] = rankedVoice?.identifier ?? null;
  return rankedVoice?.identifier;
}

export async function speakLocalSpeech(
  text: string,
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) return null;

  if (!(await initializeLocalTts(language))) return null;
  const sherpaOnnx = getSherpaOnnx();
  if (!sherpaOnnx) return null;

  const settings = getKhayaAudioSettings();
  const speakerId = speakerToLocalId(settings.speaker);
  const speakingRate = settings.speakingRate || 1.0;

  const result = await sherpaOnnx.TTS.generateSpeech(cleanedText, {
    speakerId,
    speakingRate,
    noiseScale: 0.667,
    noiseScaleW: 0.8,
    lengthScale: 1.0 / speakingRate,
    playAudio: false,
  });
  if (!result.success || !result.filePath) return null;

  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer({ uri: result.filePath });
  player.setPlaybackRate(speakingRate);
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      player.remove();
      onDone();
    }
  });
  player.play();
  return player;
}

function cleanTextForSpeech(input: string): string {
  return input
    .replace(/[*#_~`>]/g, '') // Remove markdown format characters
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
    .replace(/\s+/g, ' ')
    .trim();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function convertIeeeFloatToPcm16ArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
  if (buffer.byteLength < 44) return buffer;
  const view = new DataView(buffer);

  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || wave !== 'WAVE') return buffer;

  let offset = 12;
  let audioFormat = 0;
  let numChannels = 1;
  let sampleRate = 16000;
  let dataOffset = 0;
  let dataLength = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === 'fmt ' && offset + 8 + chunkSize <= buffer.byteLength) {
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataLength = Math.min(chunkSize, buffer.byteLength - dataOffset);
      break;
    }
    offset += 8 + chunkSize;
  }

  if (audioFormat !== 3 || dataOffset === 0 || dataLength === 0) {
    return buffer;
  }

  const numSamples = Math.floor(dataLength / 4);
  const pcm16Length = numSamples * 2;
  const outBuffer = new ArrayBuffer(44 + pcm16Length);
  const outView = new DataView(outBuffer);

  // RIFF header
  outView.setUint8(0, 0x52); // R
  outView.setUint8(1, 0x49); // I
  outView.setUint8(2, 0x46); // F
  outView.setUint8(3, 0x46); // F
  outView.setUint32(4, 36 + pcm16Length, true);
  outView.setUint8(8, 0x57);  // W
  outView.setUint8(9, 0x41);  // A
  outView.setUint8(10, 0x56); // V
  outView.setUint8(11, 0x45); // E
  // fmt chunk
  outView.setUint8(12, 0x66); // f
  outView.setUint8(13, 0x6d); // m
  outView.setUint8(14, 0x74); // t
  outView.setUint8(15, 0x20); // ' '
  outView.setUint32(16, 16, true);
  outView.setUint16(20, 1, true); // PCM format 1
  outView.setUint16(22, numChannels, true);
  outView.setUint32(24, sampleRate, true);
  outView.setUint32(28, sampleRate * numChannels * 2, true);
  outView.setUint16(32, numChannels * 2, true);
  outView.setUint16(34, 16, true);
  // data chunk
  outView.setUint8(36, 0x64); // d
  outView.setUint8(37, 0x61); // a
  outView.setUint8(38, 0x74); // t
  outView.setUint8(39, 0x61); // a
  outView.setUint32(40, pcm16Length, true);

  for (let i = 0; i < numSamples; i++) {
    const floatSample = view.getFloat32(dataOffset + i * 4, true);
    const clamped = Math.max(-1, Math.min(1, floatSample));
    const intSample = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
    outView.setInt16(44 + i * 2, intSample, true);
  }

  return outBuffer;
}

async function fetchSpeechFromKhayaDirectly(
  text: string,
  language: SpeechLanguage,
): Promise<string> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_KHAYA_API_KEY) ||
    '';
  if (!apiKey) {
    throw new Error('No EXPO_PUBLIC_KHAYA_API_KEY available for direct synthesis');
  }

  const settings = getKhayaAudioSettings();
  const khayaLang = language === 'en' ? 'en' : 'tw';
  const speakerId = settings.speaker || 'female';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      body: JSON.stringify({
        text,
        language: khayaLang,
        speaker_id: speakerId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Khaya direct API failed with status ${response.status}`);
    }

    const rawBuffer = await response.arrayBuffer();
    const pcm16Buffer = convertIeeeFloatToPcm16ArrayBuffer(rawBuffer);
    return arrayBufferToBase64(pcm16Buffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAndPlaySpeech(
  text: string,
  language: SpeechLanguage,
  onPlaybackStatusUpdate?: (isPlaying: boolean) => void,
  onDone?: () => void,
): Promise<AudioPlayer> {
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) {
    throw new Error('Text to speak is empty');
  }

  const settings = getKhayaAudioSettings();
  const speakerId = settings.speaker || 'female';
  const speakingRate = settings.speakingRate || 1.0;

  let base64Audio: string | null = null;

  // 1. Try local/backend server first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text: cleanedText,
          language,
          speaker_id: speakerId,
          speaking_rate: speakingRate,
          format: 'json',
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.audioContent) {
            base64Audio = data.audioContent;
          }
        } else {
          const rawBuffer = await response.arrayBuffer();
          const pcm16Buffer = convertIeeeFloatToPcm16ArrayBuffer(rawBuffer);
          base64Audio = arrayBufferToBase64(pcm16Buffer);
        }
      } else if (response.status === 503) {
        const data = await response.json().catch(() => null);
        if (data?.offline) {
          throw new Error('Khaya TTS is unavailable; use offline speech');
        }
      } else {
        console.warn(`Backend /api/speak returned status ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.warn('Backend /api/speak unavailable; using offline speech fallback.', err);
  }

  if (!base64Audio) {
    throw new Error('All speech synthesis backends failed');
  }

  const cacheUri = `${FileSystem.cacheDirectory}cholex-tts-${Date.now()}.wav`;
  await FileSystem.writeAsStringAsync(cacheUri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer({ uri: cacheUri });
  player.setPlaybackRate(speakingRate);
  player.addListener('playbackStatusUpdate', (status) => {
    onPlaybackStatusUpdate?.(status.playing);
    if (status.didJustFinish) {
      player.remove();
      void FileSystem.deleteAsync(cacheUri, { idempotent: true });
      onDone?.();
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
  // Khaya is the reference voice. Use it whenever the network is available,
  // then fall through to the bundled local model for offline playback.
  try {
    return await fetchAndPlaySpeech(text, language, undefined, onDone);
  } catch (error) {
    console.warn(`Khaya ${language} TTS unavailable; trying offline voice`, error);
  }

  try {
    const localPlayer = await speakLocalSpeech(text, language, onDone);
    if (localPlayer) return localPlayer;
  } catch (error) {
    console.warn(`Local ${language} TTS unavailable; using device voice`, error);
  }

  return speakWithDeviceVoice(text, language, onDone);
}

export async function previewKhayaVoice(
  language: SpeechLanguage,
  onDone: () => void,
): Promise<AudioPlayer | null> {
  const text = language === 'en'
    ? 'Welcome! This is a preview of the Khaya AI voice for Cholex.'
    : 'Mema wo akwaaba! Eyi ne nne a Khaya AI de rekasa ama wo.';
  return speakOfflineSpeech(text, language, onDone);
}

export function stopAndUnloadSpeech(player: AudioPlayer | null): void {
  Speech.stop();
  const sherpaOnnx = getSherpaOnnx();
  if (sherpaOnnx) void sherpaOnnx.TTS.stopSpeech().catch(() => undefined);
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
  let voice: string | undefined;
  try {
    voice = await getOfflineVoice(language);
  } catch (error) {
    console.warn(`Unable to select an offline ${language} voice`, error);
  }

  const settings = getKhayaAudioSettings();
  Speech.speak(text, {
    language: language === 'en' ? 'en-US' : 'ak',
    voice,
    rate: settings.speakingRate || 1.0,
    pitch: settings.pitch || 1.0,
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
