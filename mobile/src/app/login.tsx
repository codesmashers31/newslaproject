import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', {
        email: email.trim(),
        password: password,
      });
      await AsyncStorage.setItem('student_token', data.token);
      await AsyncStorage.setItem('student_profile', JSON.stringify(data));
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed. Please verify your credentials.';
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Sign-In', 'Connecting to Google Student Authentication...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Center Top Circular Icon Badge */}
          <View style={styles.headerContainer}>
            <View style={styles.iconCircle}>
              <GraduationCap size={36} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Login to continue your learning journey
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Mail size={18} color="#6b7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your student email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Lock size={18} color="#6b7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6b7280" />
                  ) : (
                    <Eye size={18} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Login Button matching reference UI */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.primaryButtonContent}>
                  <Text style={styles.primaryButtonText}>Login to Portal</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Bottom Vector Illustration filling the gap */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../../assets/images/loginimage.svg')}
                style={styles.illustrationImage}
                contentFit="contain"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  eyeIcon: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerTextContainer: {
    marginHorizontal: 12,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    height: 50,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ea4335',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  securityBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1e3a8a',
    marginLeft: 10,
    lineHeight: 17,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#4b5563',
  },
  registerLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerHelpText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  footerSupportLink: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  illustrationImage: {
    width: '100%',
    height: 180,
  },
});
