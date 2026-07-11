import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  let host = '10.133.172.143'; // Default LAN IP fallback
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
