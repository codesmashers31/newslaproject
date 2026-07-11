import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseURL = () => {
  let url = process.env.EXPO_PUBLIC_API_URL || '';
  
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    let host = '10.0.2.2'; // Fallback for Android emulator
    if (Constants.expoConfig?.hostUri) {
      host = Constants.expoConfig.hostUri.split(':')[0];
    }
    url = url.replace('localhost', host).replace('127.0.0.1', host);
  }
  
  if (url) {
    return url;
  }
  
  let host = '172.17.1.232'; // Default LAN IP fallback
  if (Constants.expoConfig?.hostUri) {
    host = Constants.expoConfig.hostUri.split(':')[0];
  }
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
