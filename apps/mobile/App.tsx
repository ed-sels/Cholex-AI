import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import MainNavigator from './navigation/MainNavigator';
import DailyNotificationModal from './components/DailyNotificationModal';
import { Message } from './screens/ChatScreen';
import { bootstrapTtsModels } from './utils/bootstrapTts';

const { width } = Dimensions.get('window');

type Language = 'tw' | 'en';

export default function App() {
  const [isLaunchScreenVisible, setIsLaunchScreenVisible] = useState(true);
  const [showDailyNotification, setShowDailyNotification] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [textScale, setTextScale] = useState(1);
  const [language, setLanguage] = useState<Language>('en');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  const navigationRef = useRef<any>(null);

  useEffect(() => {
    void bootstrapTtsModels();
  }, []);

  useEffect(() => {
    if (!isLaunchScreenVisible) {
      setShowDailyNotification(true);
    }
  }, [isLaunchScreenVisible]);

  // Initialize session and welcome message
  useEffect(() => {
    const generatedSession = 'twi-cholera-session-' + Math.random().toString(36).substring(2, 15);
    setSessionId(generatedSession);

    const welcomeMsg: Message = {
      id: 'welcome-message',
      sender: 'bot',
      text: 'Mema wo akwaaba! Me ne Cholera Twi Chatbot a metumi abua wo nsɛmmisa afiri cholera ho.\n\nSɛ wopɛ sɛ wubisa ho nsenkyerɛne (symptoms), sɛnea ɛfata (transmission), ho banbɔ (prevention), anaa ano aduru (treatment/ORS) a, wobɛtumi abisa me wo Twi kasa mu mprepren. Mebua wo ntɛm ara!',
      english: 'Welcome! I am the Cholera Twi Chatbot and I can answer your questions about cholera. If you want to ask about symptoms, transmission, prevention, or treatment/ORS, you can ask me in English or Twi. I will answer you immediately!',
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  }, []);

  const handleResetChat = () => {
    const generatedSession = 'twi-cholera-session-' + Math.random().toString(36).substring(2, 15);
    setSessionId(generatedSession);
    const welcomeMsg: Message = {
      id: 'welcome-message-' + Date.now(),
      sender: 'bot',
      text: 'Mema wo akwaaba! Nkɔmmɔbɔ foforɔ asɔ. Bisa me cholera ho nsɛm wo Twi kasa mu.',
      english: 'Welcome! A new conversation has started. Ask me about cholera in English or Twi.',
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    if (navigationRef.current) {
      navigationRef.current.navigate('Chat');
    }
  };

  const handleSendToChat = (query: string) => {
    setPendingQuery(query);
    if (navigationRef.current) {
      navigationRef.current.navigate('Chat');
    }
  };

  // If in main app view, render NavigationContainer + MainNavigator
  if (!isLaunchScreenVisible) {
    return (
      <>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
          <MainNavigator
            language={language}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            textScale={textScale}
            onTextScaleChange={setTextScale}
            onLanguageChange={setLanguage}
            messages={messages}
            onMessagesUpdate={setMessages}
            sessionId={sessionId}
            onResetChat={handleResetChat}
            onSendToChat={handleSendToChat}
            pendingQuery={pendingQuery}
            onPendingQueryHandled={() => setPendingQuery(null)}
          />
        </NavigationContainer>

        {showDailyNotification && (
          <DailyNotificationModal
            language={language}
            onClose={() => setShowDailyNotification(false)}
          />
        )}
      </>
    );
  }

  // Splash Screen view matching desktop landing experience
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Warm radial glow background */}
      <LinearGradient
        colors={['#1a0800', '#2d0f00', '#0d0200']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Central orange glow */}
      <View style={styles.glowCenter} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={['#ff7043', '#e64a19']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Pulse waveform */}
              <View style={styles.pulseContainer}>
                <View style={[styles.pulseLine, { height: 8 }]} />
                <View style={[styles.pulseLine, { height: 22 }]} />
                <View style={[styles.pulseLine, { height: 36 }]} />
                <View style={[styles.pulseLine, { height: 22 }]} />
                <View style={[styles.pulseLine, { height: 8 }]} />
                <View style={[styles.pulseLine, { height: 16 }]} />
                <View style={[styles.pulseLine, { height: 8 }]} />
              </View>
            </LinearGradient>
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GHANA HEALTH NLP</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Cholex AI</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {language === 'en'
              ? 'Asante Twi & English AI Cholera Health\nAssistant'
              : 'Asante Twi ne Pɔtegeese Health AI ma\nCholera'}
          </Text>

          {/* Language Selector */}
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'tw' && styles.langBtnActive,
              ]}
              onPress={() => setLanguage('tw')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.langText,
                language === 'tw' && styles.langTextActive,
              ]}>
                Asante Twi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'en' && styles.langBtnActive,
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.langText,
                language === 'en' && styles.langTextActive,
              ]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* Launch Button */}
          <TouchableOpacity
            style={styles.launchBtn}
            activeOpacity={0.85}
            onPress={() => setIsLaunchScreenVisible(false)}
          >
            <LinearGradient
              colors={['#ff6b35', '#e64a19']}
              style={styles.launchGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.launchText}>
                {language === 'en' ? 'Launch Cholex AI' : 'Firi Aseɛ / Start Cholex AI'}
              </Text>
              <Text style={styles.launchArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0200',
  },
  glowCenter: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#c84b00',
    opacity: 0.18,
    alignSelf: 'center',
    top: '30%',
    shadowColor: '#ff5500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 120,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  // Icon
  iconWrapper: {
    marginBottom: 16,
    shadowColor: '#ff5500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pulseLine: {
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
  // Badge
  badge: {
    backgroundColor: 'rgba(255, 90, 30, 0.2)',
    borderColor: '#ff6b35',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 18,
  },
  badgeText: {
    color: '#ff8c5a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // Title
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  // Subtitle
  subtitle: {
    fontSize: 16,
    color: '#c4b5a5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  // Language selector
  langRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50,
    padding: 4,
    marginBottom: 28,
    width: width - 64,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 50,
  },
  langBtnActive: {
    backgroundColor: '#e64a19',
    shadowColor: '#ff5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  langText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  langTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  // Launch button
  launchBtn: {
    width: width - 64,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#ff4500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  launchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  launchText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  launchArrow: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 22,
  },
});
