import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  ShieldAlert,
  Smartphone,
  Laptop,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Image } from 'expo-image';
import API from '../services/api';

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primary = '#5B21B6';
  const danger = '#DC2626';
  const success = '#16A34A';

  // Page view states: 'login' | 'unauthorized_device' | 'device_locked' | 'request_reset' | 'reset_success'
  const [viewState, setViewState] = useState<'login' | 'unauthorized_device' | 'device_locked' | 'request_reset' | 'reset_success'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Blocked device details
  const [blockedDetails, setBlockedDetails] = useState({
    registeredDevice: '',
    lastUsed: '',
  });

  // Reset fields
  const [resetReason, setResetReason] = useState('Upgraded/Changed my Mobile Phone');
  const [resetExplanation, setResetExplanation] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Helper to fetch/generate device ID and info
  const getDeviceCredentials = async () => {
    let devId = await AsyncStorage.getItem('deviceId');
    if (!devId) {
      devId = `DEV-MOB-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`.toUpperCase();
      await AsyncStorage.setItem('deviceId', devId);
    }

    const deviceName = Device.modelName || 'Mobile';
    const osName = Device.osName || 'iOS/Android';
    const osVer = Device.osVersion || '';

    return {
      deviceId: devId,
      deviceInfo: `${deviceName} (${osName} ${osVer})`,
    };
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Details',
        text2: 'Please enter both your email and password.',
      });
      return;
    }
    setLoading(true);
    try {
      const { deviceId, deviceInfo } = await getDeviceCredentials();
      const { data } = await API.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
        deviceId,
        deviceInfo,
      });
      await AsyncStorage.setItem('student_token', data.token);
      await AsyncStorage.setItem('student_profile', JSON.stringify(data));
      router.replace('/(tabs)');
    } catch (error: any) {
      const respData = error?.response?.data;
      if (respData?.code === 'UNAUTHORIZED_DEVICE') {
        setBlockedDetails({
          registeredDevice: respData.registeredDevice || 'Unrecognized computer / laptop',
          lastUsed: respData.lastUsed || '',
        });
        setViewState('unauthorized_device');
      } else if (respData?.code === 'DEVICE_LOCKED') {
        setViewState('device_locked');
      } else {
        const msg = respData?.message || 'Login failed. Please verify your credentials.';
        Toast.show({
          type: 'error',
          text1: 'Login Error',
          text2: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    setResetLoading(true);
    try {
      await API.post('/auth/request-device-reset', {
        emailOrSlaeId: email.trim(),
        reason: resetReason,
        requestedDevice: resetExplanation ? `${resetReason} (${resetExplanation})` : resetReason,
      });
      setViewState('reset_success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit request';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: msg,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <KeyboardAwareScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >

          {/* VIEW 1: LOGIN FORM */}
          {viewState === 'login' && (
            <View className="w-full">
              
              {/* Real Logo Image matching screenshot */}
              <View className="items-center mb-6">
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 24 }}
                  contentFit="contain"
                />
                
                {/* Titles */}
                <Text className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Welcome back</Text>
                <Text className="text-xs text-[#64748B] mt-1.5 font-semibold">Log in to continue your progress</Text>
              </View>

              {/* Email Input Field with Icon */}
              <View className="mb-4">
                <View className="flex-row items-center border border-[#E2E8F0] rounded-2xl bg-white px-4 h-14">
                  <Mail size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 text-base font-semibold text-[#0F172A]"
                    placeholder="student@lcp.edu"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input Field with Icon & Eye Toggle */}
              <View className="mb-2">
                <View className="flex-row items-center border border-[#E2E8F0] rounded-2xl bg-white px-4 h-14">
                  <Lock size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                  <TextInput
                    className="flex-1 text-base font-semibold text-[#0F172A]"
                    placeholder="••••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#94A3B8" />
                    ) : (
                      <Eye size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity 
                onPress={() => setViewState('request_reset')}
                className="align-self-end items-end mb-6"
              >
                <Text className="text-[#5B21B6] text-xs font-black">Forgot password?</Text>
              </TouchableOpacity>

              {/* Login Action Button */}
              <TouchableOpacity
                className="bg-[#5B21B6] rounded-2xl h-14 items-center justify-center mb-6 shadow-sm"
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Text className="text-white text-base font-black mr-2.5">Login to Portal</Text>
                    <ArrowRight size={18} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Policy Disclaimer Card */}
              <View className="bg-white border border-[#E2E8F0] rounded-3xl p-4">
                <Text className="text-xs font-black text-[#0F172A]">Before you continue</Text>
                <Text className="text-[10.5px] text-[#64748B] mt-1.5 leading-[16px] font-semibold">
                  By logging in you agree to mark attendance honestly via session QR codes, keep your profile info accurate, and follow your institute's code of conduct. Contact your trainer for login issues.
                </Text>
              </View>

            </View>
          )}

          {/* VIEW 2: DEVICE BLOCKED ACCESS */}
          {viewState === 'unauthorized_device' && (
            <View className="items-center w-full bg-white">
              <View className="w-[72px] h-[72px] rounded-[36px] bg-red-500/10 border-[1.5px] border-red-500/25 items-center justify-center mb-3">
                <ShieldAlert size={36} color={danger} />
              </View>
              <Text className="text-xl font-black text-[#0F172A] mb-1 text-center">Access Blocked</Text>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-5 text-center" style={{ color: danger }}>BuildX Device Authentication Mismatch</Text>

              {/* Device Info details */}
              <View className="w-full gap-3 mb-5">
                <View className="flex-row items-center bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-sm">
                  <Laptop size={20} color="#64748B" style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className="text-[9px] font-bold text-[#64748B] uppercase">Registered Device</Text>
                    <Text className="text-[13px] font-black text-[#0F172A] mt-0.5">{blockedDetails.registeredDevice}</Text>
                    <Text className="text-[10px] text-[#64748B] mt-0.5">{`Last sync: ${formatDateTime(blockedDetails.lastUsed)}`}</Text>
                  </View>
                </View>

                <View className="flex-row items-center bg-red-500/[0.03] border border-red-500/20 p-3.5 rounded-2xl">
                  <Smartphone size={20} color={danger} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className="text-[9px] font-bold uppercase" style={{ color: danger }}>Current Mobile Device</Text>
                    <Text className="text-[13px] font-black mt-0.5" style={{ color: danger }}>Unregistered Setup</Text>
                    <Text className="text-[10px] text-[#64748B] mt-0.5">Signature mismatch detected</Text>
                  </View>
                </View>
              </View>

              {/* Information Alert Box */}
              <View className="flex-row bg-red-500/5 border border-red-500/15 rounded-2xl p-3.5 mb-6">
                <AlertTriangle size={16} color={danger} style={{ marginRight: 10, marginTop: 2 }} />
                <Text className="flex-1 text-[11px] text-[#64748B] leading-4 font-medium">
                  Your account is restricted to a single hardware setup. Logging in from multiple screens or clearing browser storage triggers device security locks.
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                className="w-full bg-[#5B21B6] rounded-2xl h-12 items-center justify-center mt-2.5"
                onPress={() => setViewState('request_reset')}
                activeOpacity={0.85}
              >
                <View className="flex-row items-center">
                  <RotateCcw size={16} color="#ffffff" style={{ marginRight: 10 }} />
                  <Text className="text-white text-sm font-bold">Request Device Reset</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-12 border border-[#E2E8F0] rounded-2xl items-center justify-center mt-2.5"
                onPress={() => setViewState('login')}
                activeOpacity={0.8}
              >
                <Text className="text-[#0F172A] text-[13px] font-bold">Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 3: DEVICE LOCKED */}
          {viewState === 'device_locked' && (
            <View className="items-center w-full bg-white">
              <View className="w-[72px] h-[72px] rounded-[36px] bg-red-500/10 border-[1.5px] border-red-500/25 items-center justify-center mb-3">
                <ShieldAlert size={36} color={danger} />
              </View>
              <Text className="text-xl font-black text-[#0F172A] mb-1 text-center">Account Locked</Text>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-5 text-center" style={{ color: danger }}>Device Access Locked</Text>

              <Text className="text-xs text-[#64748B] text-center leading-[18px] px-3 mb-5 font-medium">
                Your device authentication access has been locked by security protocols due to multiple unrecognized registration attempts or coordinator policies.
              </Text>

              <View className="bg-white border border-[#E2E8F0] p-3.5 rounded-2xl w-full mb-6">
                <Text className="text-[11px] text-[#0F172A] text-center leading-4 font-semibold">
                  Please contact the SLA operations coordinators or coordinate via your trainer to unlock your session credentials.
                </Text>
              </View>

              <TouchableOpacity
                className="w-full h-12 border border-[#E2E8F0] rounded-2xl items-center justify-center mt-2.5"
                onPress={() => setViewState('login')}
                activeOpacity={0.8}
              >
                <Text className="text-[#0F172A] text-[13px] font-bold">Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 4: REQUEST DEVICE RESET */}
          {viewState === 'request_reset' && (
            <View className="w-full bg-white">
              <Text className="text-xl font-black text-[#0F172A] mb-1 text-center">Request Device Reset</Text>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-5 text-center" style={{ color: danger }}>Submit requests to LCP Administrators</Text>

              {/* Reset Reason Field */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Reason for Device Change</Text>
                <View className="flex-row items-center border border-[#E2E8F0] rounded-2xl bg-white px-3.5 h-12">
                  <TextInput
                    className="flex-1 text-[13px] font-semibold text-[#0F172A]"
                    value={resetReason}
                    onChangeText={setResetReason}
                    placeholder="e.g. Changed my mobile phone"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Details Field */}
              <View className="mb-4">
                <Text className="text-[10px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Brief Explanation</Text>
                <View className="border border-[#E2E8F0] rounded-2xl bg-white px-3.5 h-24 items-start py-2">
                  <TextInput
                    className="flex-1 w-full text-[13px] font-semibold text-[#0F172A]"
                    style={{ textAlignVertical: 'top' }}
                    value={resetExplanation}
                    onChangeText={setResetExplanation}
                    placeholder="Provide additional context (e.g. phone upgraded)"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                className="bg-[#5B21B6] rounded-2xl h-12 items-center justify-center mt-2.5"
                onPress={handleResetSubmit}
                disabled={resetLoading}
                activeOpacity={0.85}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-sm font-bold">Submit Request</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-12 border border-[#E2E8F0] rounded-2xl items-center justify-center mt-2.5"
                onPress={() => setViewState('login')}
                activeOpacity={0.8}
              >
                <Text className="text-[#0F172A] text-[13px] font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 5: SUCCESS SUBMIT */}
          {viewState === 'reset_success' && (
            <View className="items-center w-full bg-white">
              <View className="w-[72px] h-[72px] rounded-[36px] bg-emerald-500/10 border-[1.5px] border-emerald-500/25 items-center justify-center mb-3">
                <CheckCircle2 size={36} color={success} />
              </View>
              <Text className="text-xl font-black text-[#0F172A] mb-1 text-center">Request Logged</Text>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-5 text-center" style={{ color: success }}>Awaiting Admin Review</Text>

              <Text className="text-xs text-[#64748B] text-center leading-[18px] px-3 mb-5 font-medium">
                Your device reset request has been logged successfully. SLA Administrators will review your request and clear the locked device mapping within 1-2 hours.
              </Text>

              <TouchableOpacity
                className="w-full bg-[#5B21B6] rounded-2xl h-12 items-center justify-center mt-2.5"
                onPress={() => setViewState('login')}
                activeOpacity={0.85}
              >
                <Text className="text-white text-sm font-bold">Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
