import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseURL = () => {
  let host = '10.253.37.143'; // Default LAN IP fallback
  if (Constants.expoConfig?.hostUri) {
    const uriHost = Constants.expoConfig.hostUri.split(':')[0];
    // If Expo resolves to a local machine loopback, force the actual LAN IP instead
    if (uriHost && uriHost !== 'localhost' && uriHost !== '127.0.0.1') {
      host = uriHost;
    }
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
