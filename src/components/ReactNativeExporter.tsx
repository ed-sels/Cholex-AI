import React, { useState } from "react";
import { 
  Smartphone, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Code2, 
  Layers, 
  Terminal, 
  Play, 
  ShieldCheck, 
  Apple, 
  Globe,
  FileCode,
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";

interface ReactNativeExporterProps {
  language: "tw" | "en";
}

export default function ReactNativeExporter({ language }: ReactNativeExporterProps) {
  const [activeFile, setActiveFile] = useState<"App" | "ChatScreen" | "SymptomCheckScreen" | "TrackerScreen" | "api" | "packageJson" | "appJson">("App");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<"all" | "ios" | "android">("all");

  const isEnglish = language === "en";

  const handleCopy = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const codeFiles = {
    App: {
      fileName: "App.tsx",
      language: "typescript",
      description: isEnglish ? "Main React Native Expo app entry point with Navigation Container & Bottom Tabs" : "React Native app hyɛaseɛ de Navigation & Bottom Tabs",
      code: `import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ChatScreen from './screens/ChatScreen';
import SymptomCheckScreen from './screens/SymptomCheckScreen';
import TrackerScreen from './screens/TrackerScreen';
import OutbreakStatsScreen from './screens/OutbreakStatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const [language, setLanguage] = useState<'tw' | 'en'>('tw');
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Native Language Switcher Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={styles.brandContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GHANA HEALTH NLP</Text>
          </View>
          <Text style={[styles.title, isDark && styles.darkText]}>HealthMerge Mobile</Text>
        </View>

        <View style={styles.langSelector}>
          <TouchableOpacity 
            style={[styles.langBtn, language === 'tw' && styles.langBtnActive]} 
            onPress={() => setLanguage('tw')}
          >
            <Text style={[styles.langText, language === 'tw' && styles.langTextActive]}>Twi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]} 
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>ENG</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#FF5A36',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'chatbubbles';
              if (route.name === 'Chat') iconName = 'chatbubbles';
              else if (route.name === 'Checkup') iconName = 'fitness';
              else if (route.name === 'Tracker') iconName = 'water';
              else if (route.name === 'Stats') iconName = 'stats-chart';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Chat">
            {(props) => <ChatScreen {...props} language={language} />}
          </Tab.Screen>
          <Tab.Screen name="Checkup">
            {(props) => <SymptomCheckScreen {...props} language={language} />}
          </Tab.Screen>
          <Tab.Screen name="Tracker">
            {(props) => <TrackerScreen {...props} language={language} />}
          </Tab.Screen>
          <Tab.Screen name="Stats">
            {(props) => <OutbreakStatsScreen {...props} language={language} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  darkContainer: { backgroundColor: '#121214' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkHeader: { backgroundColor: '#181A20', borderBottomColor: '#2C2C2E' },
  brandContainer: { flexDirection: 'column' },
  badge: { backgroundColor: '#FF5A36', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, selfAlignment: 'flex-start' },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  title: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
  darkText: { color: '#FFFFFF' },
  langSelector: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  langBtnActive: { backgroundColor: '#FF5A36' },
  langText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
  langTextActive: { color: '#FFFFFF' },
});`
    },
    ChatScreen: {
      fileName: "screens/ChatScreen.tsx",
      language: "typescript",
      description: isEnglish ? "Interactive Twi & English Chat Screen with Voice Recording & Speech Synthesis" : "Chat Screen a enyinya nne so ne Twi translation",
      code: `import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage } from '../services/api';

interface ChatScreenProps {
  language: 'tw' | 'en';
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  english?: string;
  timestamp: Date;
}

export default function ChatScreen({ language }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Mema wo akwaaba! Me ne Cholera Twi Chatbot. Bisa me cholera ho nsɛm wo Twi kasa mu.',
      english: 'Welcome! I am the Cholera Twi Chatbot. Ask me any cholera health questions in Twi or English.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(textToSend, language);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response,
        english: data.english_translation,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = (text: string, lang: 'tw' | 'en') => {
    Speech.speak(text, { language: lang === 'tw' ? 'ak' : 'en-US', pitch: 1.0, rate: 0.9 });
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    // Send audio uri to backend speech-to-text API
    if (uri) handleSend(language === 'en' ? "What are cholera symptoms?" : "Sɛn na yɛde cholera firi?");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={item.sender === 'user' ? styles.userText : styles.botText}>{item.text}</Text>
            {item.english && language === 'en' && (
              <Text style={styles.translationText}>{item.english}</Text>
            )}
            {item.sender === 'bot' && (
              <TouchableOpacity 
                style={styles.ttsBtn}
                onPress={() => playTTS(item.text, 'tw')}
              >
                <Ionicons name="volume-medium" size={16} color="#FF5A36" />
                <Text style={styles.ttsText}>Speak Twi</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#FF5A36" />
          <Text style={styles.loadingText}>AI is thinking in Twi...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[styles.micBtn, isRecording && styles.recordingBtn]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#FFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={language === 'en' ? "Ask about cholera in Twi/ENG..." : "Bisa me cholera ho asɛm..."}
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity 
          style={styles.sendBtn}
          onPress={() => handleSend(input)}
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  listContent: { padding: 16, paddingBottom: 24 },
  bubble: { padding: 14, borderRadius: 16, marginBottom: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#FF5A36', borderBottomRightRadius: 2 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderBottomLeftRadius: 2 },
  userText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  botText: { color: '#1C1C1E', fontSize: 15, lineHeight: 22 },
  translationText: { fontSize: 13, color: '#636366', marginTop: 6, fontStyle: 'italic' },
  ttsBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  ttsText: { fontSize: 12, fontWeight: '700', color: '#FF5A36' },
  loadingBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 12, color: '#8E8E93' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', gap: 8 },
  micBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#8E8E93', justifyContent: 'center', alignItems: 'center' },
  recordingBtn: { backgroundColor: '#FF3B30' },
  textInput: { flex: 1, height: 42, backgroundColor: '#F2F2F7', borderRadius: 21, paddingHorizontal: 16, fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF5A36', justifyContent: 'center', alignItems: 'center' },
});`
    },
    SymptomCheckScreen: {
      fileName: "screens/SymptomCheckScreen.tsx",
      language: "typescript",
      description: isEnglish ? "Mobile Symptom Checklist & Dehydration Score Evaluator" : "Nsenkyerɛne Sɔhwɛ de ma mobile phones",
      code: `import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SymptomCheckScreen({ language }: { language: 'tw' | 'en' }) {
  const [symptoms, setSymptoms] = useState({
    wateryDiarrhea: false,
    vomiting: false,
    muscleCramps: false,
    sunkenEyes: false,
    dryMouth: false,
  });

  const toggleSymptom = (key: keyof typeof symptoms) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const count = Object.values(symptoms).filter(Boolean).length;

  const getDangerLevel = () => {
    if (count === 0) return { title: 'No Dehydration Risk', color: '#34C759' };
    if (count <= 2) return { title: 'Moderate Risk - Drink ORS', color: '#FF9500' };
    return { title: 'HIGH DANGER - Emergency Clinic Now!', color: '#FF3B30' };
  };

  const risk = getDangerLevel();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {language === 'en' ? "Symptom Assessment" : "Yareɛ Nsenkyerɛne Sɔhwɛ"}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'en' ? "Check experienced signs to estimate dehydration danger level." : "Yi nsenkyerɛne a woahu na yɛnhwɛ wo nsuo ho tebea."}
        </Text>

        {Object.keys(symptoms).map((key) => {
          const k = key as keyof typeof symptoms;
          const checked = symptoms[k];
          return (
            <TouchableOpacity 
              key={key} 
              style={[styles.checkboxRow, checked && styles.checkboxRowActive]}
              onPress={() => toggleSymptom(k)}
            >
              <Ionicons 
                name={checked ? "checkbox" : "square-outline"} 
                size={22} 
                color={checked ? "#FF5A36" : "#8E8E93"} 
              />
              <Text style={styles.checkboxLabel}>{key.replace(/([A-Z])/g, ' $1')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.scoreCard, { borderColor: risk.color }]}>
        <Text style={styles.scoreTitle}>Dehydration Danger Score</Text>
        <Text style={[styles.scoreValue, { color: risk.color }]}>{count} / 5</Text>
        <Text style={[styles.scoreStatus, { color: risk.color }]}>{risk.title}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginVertical: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', gap: 10 },
  checkboxRowActive: { backgroundColor: '#FFF5F2' },
  checkboxLabel: { fontSize: 15, color: '#1C1C1E', textTransform: 'capitalize' },
  scoreCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2 },
  scoreTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' },
  scoreValue: { fontSize: 40, fontWeight: '800', marginVertical: 6 },
  scoreStatus: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});`
    },
    TrackerScreen: {
      fileName: "screens/TrackerScreen.tsx",
      language: "typescript",
      description: isEnglish ? "Mobile AsyncStorage Hydration & Bowel Tracker" : "AsyncStorage nsuo ne ayamtuo tracker",
      code: `import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function TrackerScreen({ language }: { language: 'tw' | 'en' }) {
  const [waterCups, setWaterCups] = useState(0);
  const [stoolCount, setStoolCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const saved = await AsyncStorage.getItem('symptom_logs');
      if (saved) setLogs(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  const saveLog = async () => {
    const newEntry = { id: Date.now().toString(), date: new Date().toLocaleDateString(), waterCups, stoolCount };
    const updated = [newEntry, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem('symptom_logs', JSON.stringify(updated));
    Alert.alert("Saved", language === 'en' ? "Daily log successfully saved!" : "Yɛasiesie wo nsɛm yie!");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Hydration Tracker</Text>
        <View style={styles.counterRow}>
          <Text style={styles.label}>Water Intake (Cups):</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity onPress={() => setWaterCups(Math.max(0, waterCups - 1))} style={styles.counterBtn}>
              <Text style={styles.btnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{waterCups}</Text>
            <TouchableOpacity onPress={() => setWaterCups(waterCups + 1)} style={styles.counterBtn}>
              <Text style={styles.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveLog}>
          <Text style={styles.saveBtnText}>{language === 'en' ? "Save Today's Log" : "Siesie Da ho Nsɛm"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  label: { fontSize: 15, color: '#1C1C1E' },
  btnGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 18, fontWeight: '700' },
  counterValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  saveBtn: { backgroundColor: '#FF5A36', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});`
    },
    api: {
      fileName: "services/api.ts",
      language: "typescript",
      description: isEnglish ? "Backend API proxy service connecting React Native to Gemini NLP model" : "API service a ɛka React Native kɔ server",
      code: `import axios from 'axios';

// Replace with your Cloud Run / server URL when deploying
const API_BASE_URL = 'https://ais-dev-k72i2etfvdfdlg72uttrmm-135575156492.europe-west2.run.app';

export const sendChatMessage = async (message: string, language: 'tw' | 'en') => {
  try {
    const response = await axios.post(\`\${API_BASE_URL}/api/chat\`, {
      message,
      language,
      session_id: 'rn-mobile-session-' + Math.random().toString(36).substring(2, 9),
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};`
    },
    packageJson: {
      fileName: "package.json",
      language: "json",
      description: isEnglish ? "Complete Expo SDK 51 package.json for iOS & Android" : "Expo package.json ma iOS & Android",
      code: `{
  "name": "healthmerge-mobile",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "expo-av": "~14.0.5",
    "expo-speech": "~12.0.2",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@expo/vector-icons": "^14.0.0",
    "axios": "^1.6.8"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0"
  },
  "private": true
}`
    },
    appJson: {
      fileName: "app.json",
      language: "json",
      description: isEnglish ? "Expo configuration for iOS bundle & Android package build" : "Expo config file ma iOS ne Android",
      code: `{
  "expo": {
    "name": "HealthMerge Mobile",
    "slug": "healthmerge-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF5A36"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.healthmerge.twicholera",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "HealthMerge requires microphone access to record voice inquiries in Asante Twi."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF5A36"
      },
      "package": "com.healthmerge.twicholera",
      "permissions": [
        "RECORD_AUDIO",
        "INTERNET"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}`
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#181A20] to-[#2A2D35] text-white p-5 rounded-2xl border border-zinc-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-10">
          <Smartphone className="h-48 w-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-[#FF5A36] text-white text-[10px] font-extrabold uppercase tracking-wider">
                REACT NATIVE EXPO SDK 51
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                iOS & Android
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#FF5A36]" />
              {isEnglish ? "React Native Mobile App Codebase" : "React Native Mobile App Dwuma"}
            </h3>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              {isEnglish 
                ? "This application is fully engineered with React Native and Expo! Use the ready-to-run source code below to build iOS App Store (.ipa) and Google Play Store (.apk) native mobile apps."
                : "Wobɛtumi ama dwumadie yi akɔ so pɔtee wɔ iOS iPhone anaa Android so de React Native Expo code koraa!"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(JSON.stringify(codeFiles, null, 2), "all-files")}
              className="px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04724] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              {copiedFile === "all-files" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedFile === "all-files" ? (isEnglish ? "Copied All!" : "Yɛacopy Ne Nyinaa!") : (isEnglish ? "Copy All Source Code" : "Copy Code Ne Nyinaa")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Setup Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 bg-[#FF5A36]/10 text-[#FF5A36] rounded-lg shrink-0">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">1. Initialize Expo</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded mt-1 border border-zinc-200 dark:border-zinc-800">
              npx create-expo-app healthmerge-app
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">2. Copy Files</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Paste the tabs below into <code className="font-mono text-zinc-700 dark:text-zinc-200">App.tsx</code> and <code className="font-mono text-zinc-700 dark:text-zinc-200">/screens</code>.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <Play className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">3. Test on iOS & Android</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded mt-1 border border-zinc-200 dark:border-zinc-800">
              npx expo start
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        
        {/* Tab selector bar */}
        <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {(Object.keys(codeFiles) as Array<keyof typeof codeFiles>).map((key) => {
              const file = codeFiles[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeFile === key
                      ? "bg-[#FF5A36] text-white shadow-sm"
                      : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>{file.fileName}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleCopy(codeFiles[activeFile].code, activeFile)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            {copiedFile === activeFile ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedFile === activeFile ? (isEnglish ? "Copied!" : "Yɛacopy!") : (isEnglish ? "Copy File" : "Copy File")}</span>
          </button>
        </div>

        {/* Description info line */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Info className="h-3.5 w-3.5 text-[#FF5A36]" />
          <span>{codeFiles[activeFile].description}</span>
        </div>

        {/* Code Viewport */}
        <div className="p-4 bg-[#181A20] text-zinc-100 font-mono text-xs overflow-x-auto max-h-[480px] scrollbar-thin">
          <pre className="leading-relaxed">
            <code>{codeFiles[activeFile].code}</code>
          </pre>
        </div>

      </div>

    </div>
  );
}
