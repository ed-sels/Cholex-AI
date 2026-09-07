import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import type { AudioPlayer } from 'expo-audio';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { classifyQueryLocally } from '../constants/localClassifier';
import { speakLocalSpeech, speakOfflineSpeech, stopAndUnloadSpeech, type SpeechLanguage } from '../constants/tts';

type Language = 'tw' | 'en';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  english?: string;
  intent?: string;
  confidence?: number;
  timestamp: Date;
}

interface ChatScreenProps {
  language: Language;
  darkMode?: boolean;
  initialMessages: Message[];
  onMessagesUpdate: (messages: Message[]) => void;
  sessionId: string;
  pendingQuery?: string | null;
  onPendingQueryHandled?: () => void;
}

const historyTopicsEn = [
  { title: 'Water Safety Guide', query: 'What is the best way to make drinking water safe?' },
  { title: 'ORS Preparation', query: 'Give me the exact recipe to prepare ORS.' },
  { title: 'First-Aid Dehydration', query: 'What first-aid should I give to a severely dehydrated child?' },
  { title: 'Symptom ID', query: 'How do I know if my diarrhea is cholera or just food poisoning?' },
  { title: 'Sanitation Rules', query: 'What are the rules for latrine sanitation during an outbreak?' },
];

const historyTopicsTw = [
  { title: 'Nsuo ho Banbɔ', query: 'Sɛn na mɛyɛ na nsuo a menom ho atew?' },
  { title: 'ORS Nsuo Noa', query: 'Sɛn na yɛyɛ ORS nsuo wo fie?' },
  { title: 'Ayamtuo Ano Aduru', query: 'Dɛn mmoa na mɛtumi de ama abofra a ɔwɔ ayamtuo?' },
  { title: 'Cholera Nsenkyerɛne', query: 'Sɛn na mɛyɛ ahu sɛ me ayamtuo yi yɛ cholera?' },
  { title: 'Tiafi ho Ahotew', query: 'Dɛn na ɛsɛ sɛ yɛyɛ wɔ tiafi ho ahotew mu?' },
];

function MessageBubble({
  message,
  language,
  darkMode = true,
}: {
  message: Message;
  language: Language;
  darkMode?: boolean;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState<'primary' | 'translation' | false>(false);
  const audioRef = useRef<AudioPlayer | null>(null);
  const ttsRequestRef = useRef(0);

  const isUser = message.sender === 'user';
  const isEnglish = language === 'en';
  const theme = darkMode
    ? {
        bubbleUser: '#2a1f1a',
        bubbleBot: '#1C1C1F',
        text: '#e4e4e7',
        muted: '#71717a',
        border: '#2a2a2e',
        userText: '#e4e4e7',
        surface: '#0f0f11',
        controlBg: '#0f0f11',
        controlText: '#a1a1aa',
      }
    : {
        bubbleUser: '#dbeafe',
        bubbleBot: '#ffffff',
        text: '#18181b',
        muted: '#52525b',
        border: '#e4e4e7',
        userText: '#111827',
        surface: '#f3f4f6',
        controlBg: '#f5f5f5',
        controlText: '#52525b',
      };

  const primaryText = isEnglish && message.english ? message.english : message.text;
  const translationText = isEnglish ? message.text : message.english;

  useEffect(() => {
    return () => {
      void stopAndUnloadSpeech(audioRef.current);
      audioRef.current = null;
    };
  }, []);

  const stopAudio = async () => {
    ttsRequestRef.current += 1;
    stopAndUnloadSpeech(audioRef.current);
    audioRef.current = null;
    setIsPlaying(false);
  };

  const playTTS = async (target: 'primary' | 'translation') => {
    if (isPlaying === target) {
      await stopAudio();
      return;
    }

    await stopAudio();

    const isTargetEnglish = target === 'primary' ? isEnglish : !isEnglish;
    const textToSpeak = target === 'primary' ? primaryText : (translationText || '');

    if (!textToSpeak.trim()) {
      return;
    }

    const requestId = ++ttsRequestRef.current;
    try {
      setIsPlaying(target);
      const speechLanguage: SpeechLanguage = isTargetEnglish ? 'en' : 'tw';
      const player = await speakOfflineSpeech(
        textToSpeak,
        speechLanguage,
        () => {
          if (requestId === ttsRequestRef.current) {
            setIsPlaying(false);
          }
        },
      );

      if (requestId !== ttsRequestRef.current) {
        if (player) stopAndUnloadSpeech(player);
        return;
      }

      audioRef.current = player;
    } catch {
      if (requestId === ttsRequestRef.current) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot]}>
      {/* Sender label */}
      <View style={styles.senderRow}>
        <Text style={[styles.senderName, isUser ? styles.senderUser : styles.senderBot]}>
          {isUser ? (isEnglish ? 'You' : 'Wo (You)') : 'Cholex AI'}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {message.intent && !isUser && (
          <View style={styles.intentBadge}>
            <Text style={styles.intentText}>
              {message.intent} ({((message.confidence ?? 0) * 100).toFixed(0)}%)
            </Text>
          </View>
        )}
      </View>

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.bubbleUser, borderColor: '#3f2920' }
            : { backgroundColor: theme.bubbleBot, borderColor: theme.border },
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={[styles.bubbleText, { color: theme.text }]}>{primaryText}</Text>

        {/* Translation */}
        {translationText && showTranslation && (
          <View style={styles.translationBox}>
            <View style={styles.translationHeaderRow}>
              <Text style={styles.translationLabel}>
                {isEnglish ? 'Twi:' : 'English:'}
              </Text>
              {!isUser && (
                <TouchableOpacity
                  style={[
                styles.miniTtsBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isPlaying === 'translation' && styles.miniTtsBtnActive,
              ]}
                  onPress={() => playTTS('translation')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isPlaying === 'translation' ? 'stop-circle' : 'volume-medium'}
                    size={13}
                    color={isPlaying === 'translation' ? '#FF5A36' : '#a1a1aa'}
                  />
                  <Text style={[styles.miniTtsText, { color: theme.controlText }, isPlaying === 'translation' && styles.miniTtsTextActive]}>
                    {isPlaying === 'translation' ? 'Stop' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.translationText, { color: theme.muted }]}>{translationText}</Text>
          </View>
        )}

        {/* Bot controls: TTS & Translation Toggle */}
        {!isUser && (
          <View style={styles.bubbleControls}>
            {/* Primary TTS Speaker Button */}
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: theme.controlBg, borderColor: theme.border },
                isPlaying === 'primary' && styles.controlBtnActive,
              ]}
              onPress={() => playTTS('primary')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying === 'primary' ? 'stop-circle' : 'volume-high'}
                size={14}
                color={isPlaying === 'primary' ? '#fff' : '#FF5A36'}
              />
              <Text style={[styles.controlBtnText, { color: theme.controlText }, isPlaying === 'primary' && styles.controlBtnTextActive]}>
                {isPlaying === 'primary'
                  ? (isEnglish ? 'Stop Speech' : 'Gyae Kasa')
                  : (isEnglish ? 'Listen (TTS)' : 'Tie Nnyigyei')}
              </Text>
            </TouchableOpacity>

            {/* Translation Toggle */}
            {translationText && (
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.controlBg, borderColor: theme.border }]}
                onPress={() => setShowTranslation(!showTranslation)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showTranslation ? 'eye-off-outline' : 'eye-outline'}
                  size={13}
                  color="#a1a1aa"
                />
                <Text style={[styles.controlBtnText, { color: theme.controlText }]}>
                  {showTranslation
                    ? isEnglish ? 'Hide Twi' : 'Kata English'
                    : isEnglish ? 'Show Twi' : 'Hunu English'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen({
  language,
  darkMode = true,
  initialMessages,
  onMessagesUpdate,
  sessionId,
  pendingQuery,
  onPendingQueryHandled,
}: ChatScreenProps) {
  const isEnglish = language === 'en';
  const theme = darkMode
    ? { safe: '#121214', container: '#121214', subtle: '#1C1C1F', border: '#2a2a2e', input: '#0f0f11', text: '#e4e4e7', muted: '#71717a', secondary: '#a1a1aa', suggestion: '#0f0f11' }
    : { safe: '#f5f5f5', container: '#f5f5f5', subtle: '#ffffff', border: '#e4e4e7', input: '#ffffff', text: '#18181b', muted: '#52525b', secondary: '#52525b', suggestion: '#f3f4f6' };
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modern Expo-Audio Recorder
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingTimerRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef<FlatList>(null);
  const topics = isEnglish ? historyTopicsEn : historyTopicsTw;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Ref to hold the latest sendMessage
  const sendMessageRef = useRef<((text: string) => void) | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    onMessagesUpdate(updated);
    setIsLoading(true);

    try {
      // 1. Send to Backend Chat API
      const res = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: text.trim(),
          session_id: sessionId,
          language,
          conversation_history: messages.slice(-6).map((message) => ({
            role: message.sender === 'user' ? 'user' : 'assistant',
            text: message.text,
            english: message.english,
          })),
        },
        { timeout: 12000 }
      );

      const { response: botText, english_translation, intent, confidence } = res.data;

      const botMsg: Message = {
        id: 'b-' + Date.now(),
        sender: 'bot',
        text: botText,
        english: english_translation,
        intent,
        confidence,
        timestamp: new Date(),
      };

      const final = [...updated, botMsg];
      setMessages(final);
      onMessagesUpdate(final);
    } catch (networkError) {
      try {
        console.warn('Primary backend chat unavailable; trying model-backed dataset route:', networkError);
        const modelResponse = await axios.post(
          `${API_BASE_URL}/api/flask/predict`,
          { text: text.trim() },
          { timeout: 12000 }
        );

        const modelData = modelResponse.data || {};
        const botMsg: Message = {
          id: 'b-model-' + Date.now(),
          sender: 'bot',
          text: modelData.twi_response || modelData.response || 'Mepa wo kyɛw, mfasoa no yie.',
          english: modelData.english_translation || modelData.english || 'I am unable to answer that question right now.',
          intent: modelData.predicted_intent || modelData.intent || 'dataset_model',
          confidence: typeof modelData.confidence === 'number' ? modelData.confidence : 0.7,
          timestamp: new Date(),
        };

        const final = [...updated, botMsg];
        setMessages(final);
        onMessagesUpdate(final);
        return;
      } catch (modelError) {
        console.warn('Dataset-backed model route unavailable; falling back to offline classifier:', modelError);
        const localResult = classifyQueryLocally(text.trim());

        const botMsg: Message = {
          id: 'b-local-' + Date.now(),
          sender: 'bot',
          text: localResult.response,
          english: localResult.english,
          intent: localResult.intent,
          confidence: localResult.confidence,
          timestamp: new Date(),
        };

        const final = [...updated, botMsg];
        setMessages(final);
        onMessagesUpdate(final);
      }
    } finally {
      setIsLoading(false);
    }
  };

  sendMessageRef.current = sendMessage;

  // Auto-send pending query from TemplatesScreen symptom report
  useEffect(() => {
    if (pendingQuery && pendingQuery.trim() && sendMessageRef.current) {
      sendMessageRef.current(pendingQuery);
      onPendingQueryHandled?.();
    }
  }, [pendingQuery]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Pulsing animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Start Voice Recording (ASR)
  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          isEnglish ? 'Microphone Permission Required' : 'Microphone Tumidie Hia',
          isEnglish
            ? 'Please grant microphone access to use voice input.'
            : 'Yɛserɛ wo ma microphone kwan na woatumi akasa wo Twi mu.'
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert(
        isEnglish ? 'Recording Error' : 'Nnyigyei Mfomsoɔ',
        isEnglish ? 'Unable to start microphone recording.' : 'Yɛantumi anhyɛ nnyigyei recording ase.'
      );
    }
  };

  // Cancel Voice Recording
  const cancelRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    try {
      await audioRecorder.stop();
    } catch {}
    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Stop Recording and Transcribe (ASR)
  const stopAndTranscribe = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      await setAudioModeAsync({ allowsRecording: false });

      if (uri) {
        let base64Audio = '';
        try {
          base64Audio = await FileSystemLegacy.readAsStringAsync(uri, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
        } catch (fsErr) {
          console.warn('FileSystem base64 read notice:', fsErr);
        }

        const payload: any = {
          language,
          mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
        };

        if (base64Audio) {
          payload.audioBase64 = base64Audio;
        }

        const res = await axios.post(`${API_BASE_URL}/api/transcribe`, payload, {
          timeout: 15000,
        });

        if (res.data && res.data.transcript && res.data.transcript.trim()) {
          const transcribedText = res.data.transcript.trim();
          sendMessage(transcribedText);
          setIsTranscribing(false);
          return;
        }
      }
    } catch (asrErr: any) {
      console.warn('ASR transcription notice:', asrErr?.response?.data || asrErr?.message);
      
      const isApiKeyMissing = asrErr?.response?.data?.error === 'NO_ASR_KEY';
      if (isApiKeyMissing) {
        Alert.alert(
          isEnglish ? 'AI Speech-to-Text Setup' : 'AI Speech-to-Text Nkyerɛkyerɛ',
          isEnglish
            ? 'Your voice was recorded, but the server ASR key is missing. Copy .env.example to .env and add GEMINI_API_KEY or KHAYA_API_KEY on the backend, then restart the app/server.'
            : 'Yɛate wo nnyigyei, nanso server ASR key nni hɔ. Fa .env.example kɔ .env mu na hyɛ GEMINI_API_KEY anaa KHAYA_API_KEY wɔ backend no mu, na san hyɛ app/server no ase.'
        );
      } else {
        Alert.alert(
          isEnglish ? 'Voice Input' : 'Nnyigyei',
          isEnglish
            ? 'No audible speech detected. Please speak closer to the microphone or type your question.'
            : 'Yɛante kasa biara yie. Meserɛ wo kasa bɛn microphone no anaa kyerɛw wo asɛmmisa.'
        );
      }
    }

    setIsTranscribing(false);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.safe }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} language={language} darkMode={darkMode} />}
          contentContainerStyle={[styles.messageList, { backgroundColor: theme.container }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#FF5A36" />
                <Text style={styles.loadingText}>
                  {isEnglish ? 'Synthesizing medical response...' : 'Yɛre siesie mmuaeɛ...'}
                </Text>
              </View>
            ) : isTranscribing ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.loadingText}>
                  {isEnglish ? 'Transcribing voice input (ASR)...' : 'Yɛre kyerɛ wo kasa ase...'}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Quick suggestions */}
        <View style={[styles.suggestionsBar, { backgroundColor: theme.subtle, borderTopColor: theme.border }]}> 
          <Text style={[styles.suggestionsLabel, { color: theme.muted }]}> 
            {isEnglish ? 'QUICK CLINICAL TOPICS:' : 'NSƐMMISA A ƐTƆ WA:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
            {topics.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionChip, { backgroundColor: theme.suggestion, borderColor: theme.border }]}
                onPress={() => sendMessage(t.query)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, { color: theme.secondary }]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* LIVE VOICE RECORDING ACTIVE BAR */}
        {isRecording ? (
          <View style={[styles.recordingBar, { backgroundColor: theme.subtle, borderTopColor: 'rgba(239, 68, 68, 0.3)' }]}> 
            <View style={styles.recStatusRow}>
              <Animated.View style={[styles.recDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.recLabel}>
                {isEnglish ? 'LISTENING (ASR)' : 'EKYERE WO KASA'}
              </Text>
              <Text style={styles.recTimer}>{formatDuration(recordingDuration)}</Text>
            </View>

            {/* Equalizer Visualizer simulation */}
            <View style={styles.waveformRow}>
              {[12, 24, 32, 18, 28, 36, 20, 14, 26, 34, 18, 10].map((h, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    { height: Math.min(36, Math.max(8, h + ((recordingDuration % 3) * 4))) },
                  ]}
                />
              ))}
            </View>

            {/* Recording Controls */}
            <View style={styles.recActionsRow}>
              <TouchableOpacity
                style={styles.recCancelBtn}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={styles.recCancelText}>{isEnglish ? 'Cancel' : 'Gyae'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.recStopBtn}
                onPress={stopAndTranscribe}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.recStopText}>
                  {isEnglish ? 'Transcribe & Send' : 'Kyerɛ Ase & Soma'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* STANDARD INPUT BAR (WITH TEXT & MIC) */
          <View style={[styles.inputBar, { backgroundColor: theme.subtle, borderTopColor: theme.border }]}> 
            {/* Mic / Voice Recording Button */}
            <TouchableOpacity
              style={[styles.micBtn, isTranscribing && styles.micBtnDisabled]}
              onPress={startRecording}
              disabled={isLoading || isTranscribing}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={20} color="#FF5A36" />
            </TouchableOpacity>

            <TextInput
              style={[styles.textInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={
                isEnglish
                  ? 'Type or speak your cholera inquiry...'
                  : 'Bisa me cholera ho asɛm biara wo Twi mu...'
              }
              placeholderTextColor="#52525b"
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(input)}
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={18}
                color={!input.trim() || isLoading ? '#52525b' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121214' },
  kav: { flex: 1 },

  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },

  // Bubbles
  bubbleWrap: { maxWidth: '88%', gap: 4 },
  bubbleWrapUser: { alignSelf: 'flex-end' },
  bubbleWrapBot: { alignSelf: 'flex-start' },

  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  senderName: { fontSize: 10, fontWeight: '800' },
  senderUser: { color: '#a78bfa' },
  senderBot: { color: '#FF5A36' },
  timestamp: { fontSize: 9, color: '#52525b', fontFamily: 'monospace' },
  intentBadge: {
    backgroundColor: '#1C1C1F',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  intentText: { fontSize: 8, color: '#71717a', fontWeight: '700', textTransform: 'uppercase' },

  bubble: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  bubbleUser: {
    backgroundColor: '#2a1f1a',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#3f2920',
  },
  bubbleBot: {
    backgroundColor: '#1C1C1F',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  bubbleText: { color: '#e4e4e7', fontSize: 13, lineHeight: 20 },

  translationBox: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
    paddingTop: 8,
    gap: 4,
  },
  translationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  translationLabel: { color: '#FF5A36', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  translationText: { color: '#71717a', fontSize: 11, lineHeight: 16, fontStyle: 'italic' },

  miniTtsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f0f11',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  miniTtsBtnActive: { borderColor: '#FF5A36' },
  miniTtsText: { color: '#a1a1aa', fontSize: 9, fontWeight: '600' },
  miniTtsTextActive: { color: '#FF5A36' },

  bubbleControls: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingTop: 2 },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#0f0f11',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  controlBtnActive: {
    backgroundColor: '#FF5A36',
    borderColor: '#FF5A36',
  },
  controlBtnText: { color: '#a1a1aa', fontSize: 10, fontWeight: '600' },
  controlBtnTextActive: { color: '#fff', fontWeight: '700' },

  // Loading
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loadingText: { color: '#71717a', fontSize: 12 },

  // Quick suggestions
  suggestionsBar: {
    backgroundColor: '#1C1C1F',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
    paddingVertical: 8,
    paddingLeft: 12,
    gap: 6,
  },
  suggestionsLabel: {
    color: '#52525b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 2,
  },
  suggestionsScroll: { flexGrow: 0 },
  suggestionChip: {
    backgroundColor: '#0f0f11',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  suggestionText: { color: '#a1a1aa', fontSize: 11, fontWeight: '500' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    backgroundColor: '#1C1C1F',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2a1f1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 54, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnDisabled: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f0f11',
    color: '#e4e4e7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FF5A36',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: { backgroundColor: '#2a2a2e', shadowOpacity: 0 },

  // Recording Bar
  recordingBar: {
    backgroundColor: '#1C1C1F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    gap: 10,
  },
  recStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recLabel: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 6,
    flex: 1,
  },
  recTimer: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    backgroundColor: '#0f0f11',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    backgroundColor: '#0f0f11',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#FF5A36',
    borderRadius: 2,
  },
  recActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  recCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  recCancelText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  recStopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF5A36',
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#FF5A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  recStopText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
