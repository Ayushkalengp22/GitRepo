import {Platform} from 'react-native';
import {NativeModules} from 'react-native';

const PROD = 'https://donation-1-efzw.onrender.com';
const LOCAL_ANDROID = 'http://10.0.2.2:4000';
const LOCAL_IOS = 'http://localhost:4000';

// Detect if running on simulator
const isSimulator =
  Platform.OS === 'ios'
    ? !NativeModules.DeviceInfo || NativeModules.DeviceInfo.isSimulator
    : Platform.OS === 'android'
    ? !NativeModules.DeviceInfo || NativeModules.DeviceInfo.isEmulator
    : false;

export const API_BASE_URL =
  __DEV__ && isSimulator
    ? Platform.OS === 'android'
      ? LOCAL_ANDROID
      : LOCAL_IOS
    : PROD;
