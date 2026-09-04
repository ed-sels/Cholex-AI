import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the backend API Base URL based on the runtime environment.
 *
 * Important: `localhost` is not valid for a physical iPhone or iPad because it points to the
 * device itself rather than the machine running the backend. For native Expo apps we prefer
 * the Metro runtime host URI, and allow an explicit override via EXPO_PUBLIC_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  // Explicit override should win for physical devices and remote previews.
  const configApiUrl =
    Constants.expoConfig?.extra?.apiBaseUrl ||
    (Constants as any).manifest?.extra?.apiBaseUrl ||
    (Constants as any).manifest2?.extra?.apiBaseUrl;

  const envApiUrl =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
    configApiUrl;

  if (envApiUrl) {
    return envApiUrl.replace(/\/$/, '');
  }

  // Web browser runtime
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    if (window.location.port === '3000') {
      return '';
    }
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:3000`;
  }

  // Expo runtime on Native (iOS/Android)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0') {
      return `http://${host}:3000`;
    }
  }

  // Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // iOS Simulator fallback only. For physical devices, set EXPO_PUBLIC_API_BASE_URL to the
  // machine's LAN IP (for example http://192.168.1.50:3000).
  return 'http://127.0.0.1:3000';
}

export const API_BASE_URL = getApiBaseUrl();

