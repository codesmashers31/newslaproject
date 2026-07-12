import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const getBaseURL = () => {
  const isEmulator = !Device.isDevice;
  
  if (isEmulator && __DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  let url = process.env.EXPO_PUBLIC_API_URL || '';
  
  // Replace localhost/127.0.0.1 or previous static IP with current active bundler host IP
  let activeHost = '';
  if (Constants.expoConfig?.hostUri) {
    activeHost = Constants.expoConfig.hostUri.split(':')[0];
  }

  if (activeHost && url) {
    url = url.replace('localhost', activeHost)
             .replace('127.0.0.1', activeHost)
             .replace('172.17.1.232', activeHost);
  }
  
  if (url) {
    return url;
  }
  
  const host = activeHost || '172.17.1.232';
  return `http://${host}:5000/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Interceptor to add student token to headers
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('student_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
