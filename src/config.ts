import {Platform} from 'react-native';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:4000' // Android Emulator
    : 'http://localhost:4000' // iOS Simulator
  : 'https://donation-1-efzw.onrender.com'; // Production (Render)
