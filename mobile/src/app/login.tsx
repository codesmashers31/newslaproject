import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import API from '../services/api';

export default function LoginScreen() {
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
        text2: 'Please enter both your EID/email and password.',
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
      const { deviceInfo } = await getDeviceCredentials();
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* VIEW 1: LOGIN FORM */}
          {viewState === 'login' && (
            <View style={styles.formContainer}>
              {/* Header */}
              <View style={styles.headerContainer}>
                <View style={styles.iconCircle}>
                  <GraduationCap size={36} color="#6366f1" />
                </View>
                <Text style={styles.title}>LCP Student Portal</Text>
                <Text style={styles.subtitle}>
                  Enter credentials to access your academic cohort dashboard.
                </Text>
              </View>

              {/* Single Device Notice */}
              <View style={styles.shieldNotice}>
                <ShieldCheck size={20} color="#818cf8" style={styles.noticeIcon} />
                <Text style={styles.noticeText}>
                  Protected by BuildX Single Device Authentication. Account is restricted to one hardware setup.
                </Text>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student EID / Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Mail size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter EID (e.g. SLA001) or Email"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="default"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Lock size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748b" />
                    ) : (
                      <Eye size={18} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
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

              {/* Bottom Vector Illustration */}
              <View style={styles.illustrationContainer}>
                <Image
                  source={require('../../assets/images/loginimage.svg')}
                  style={styles.illustrationImage}
                  contentFit="contain"
                />
              </View>
            </View>
          )}

          {/* VIEW 2: DEVICE BLOCKED ACCESS */}
          {viewState === 'unauthorized_device' && (
            <View style={styles.securityContainer}>
              <View style={[styles.iconCircle, styles.roseIconCircle]}>
                <ShieldAlert size={36} color="#f43f5e" />
              </View>
              <Text style={styles.securityTitle}>Access Blocked</Text>
              <Text style={styles.securitySubtitle}>BuildX Device Authentication Mismatch</Text>

              {/* Device Info details */}
              <View style={styles.deviceInfoContainer}>
                <View style={styles.deviceRow}>
                  <Laptop size={20} color="#cbd5e1" style={styles.deviceIcon} />
                  <View style={styles.deviceTextCol}>
                    <Text style={styles.deviceLabel}>Registered Device</Text>
                    <Text style={styles.deviceValue}>{blockedDetails.registeredDevice}</Text>
                    <Text style={styles.deviceSub}>{`Last sync: ${formatDateTime(blockedDetails.lastUsed)}`}</Text>
                  </View>
                </View>

                <View style={[styles.deviceRow, styles.unregisteredDeviceRow]}>
                  <Smartphone size={20} color="#f43f5e" style={styles.deviceIcon} />
                  <View style={styles.deviceTextCol}>
                    <Text style={[styles.deviceLabel, styles.roseText]}>Current Mobile Device</Text>
                    <Text style={[styles.deviceValue, styles.roseText]}>Unregistered Setup</Text>
                    <Text style={styles.deviceSub}>Signature mismatch detected</Text>
                  </View>
                </View>
              </View>

              {/* Information Alert Box */}
              <View style={styles.infoAlert}>
                <AlertTriangle size={16} color="#e11d48" style={styles.infoAlertIcon} />
                <Text style={styles.infoAlertText}>
                  Your account is restricted to a single hardware setup. Logging in from multiple screens or clearing browser storage triggers device security locks.
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setViewState('request_reset')}
                activeOpacity={0.85}
              >
                <View style={styles.primaryButtonContent}>
                  <RotateCcw size={16} color="#ffffff" style={styles.noticeIcon} />
                  <Text style={styles.primaryButtonText}>Request Device Reset</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => setViewState('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 3: DEVICE LOCKED */}
          {viewState === 'device_locked' && (
            <View style={styles.securityContainer}>
              <View style={[styles.iconCircle, styles.roseIconCircle]}>
                <ShieldAlert size={36} color="#f43f5e" />
              </View>
              <Text style={styles.securityTitle}>Account Locked</Text>
              <Text style={styles.securitySubtitle}>Device Access Locked</Text>

              <Text style={styles.descriptionText}>
                Your device authentication access has been locked by security protocols due to multiple unrecognized registration attempts or coordinator policies.
              </Text>

              <View style={styles.supportBox}>
                <Text style={styles.supportBoxText}>
                  Please contact the SLA operations coordinators or coordinate via your trainer to unlock your session credentials.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => setViewState('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 4: REQUEST DEVICE RESET */}
          {viewState === 'request_reset' && (
            <View style={styles.formContainer}>
              <Text style={styles.securityTitle}>Request Device Reset</Text>
              <Text style={styles.securitySubtitle}>Submit change requests to LCP Administrators</Text>

              {/* Reset Reason Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason for Device Change</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={resetReason}
                    onChangeText={setResetReason}
                    placeholder="e.g. Changed my mobile phone"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              {/* Details Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Brief Explanation</Text>
                <View style={[styles.inputWrapper, styles.textareaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={resetExplanation}
                    onChangeText={setResetExplanation}
                    placeholder="Provide additional context (e.g. phone stolen/upgraded)"
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetSubmit}
                disabled={resetLoading}
                activeOpacity={0.85}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => setViewState('unauthorized_device')}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW 5: SUCCESS SUBMIT */}
          {viewState === 'reset_success' && (
            <View style={styles.securityContainer}>
              <View style={[styles.iconCircle, styles.emeraldIconCircle]}>
                <CheckCircle2 size={36} color="#10b981" />
              </View>
              <Text style={styles.securityTitle}>Request Logged</Text>
              <Text style={styles.securitySubtitle}>Awaiting Admin Review</Text>

              <Text style={styles.descriptionText}>
                Your device reset request has been logged successfully. SLA Administrators will review your request and clear the locked device mapping within 1-2 hours.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setViewState('login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Return to Login</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roseIconCircle: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  emeraldIconCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  shieldNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  noticeIcon: {
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    lineHeight: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    height: 50,
  },
  textareaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  textarea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  illustrationImage: {
    width: '100%',
    height: 100,
  },
  
  // Security Styles
  securityContainer: {
    alignItems: 'center',
    width: '100%',
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  securitySubtitle: {
    fontSize: 11,
    color: '#f43f5e',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  deviceInfoContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
  },
  unregisteredDeviceRow: {
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.02)',
  },
  deviceIcon: {
    marginRight: 12,
  },
  deviceTextCol: {
    flex: 1,
  },
  deviceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  deviceValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  deviceSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  roseText: {
    color: '#f43f5e',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
    borderColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  infoAlertIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    fontWeight: '500',
  },
  outlineButton: {
    width: '100%',
    height: 50,
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  outlineButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontWeight: '500',
  },
  supportBox: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
  },
  supportBoxText: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
});
