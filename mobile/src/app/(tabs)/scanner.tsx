import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import API from '../../services/api';
import {
  Camera as CameraIcon,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  HelpCircle
} from 'lucide-react-native';

export default function QRScannerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primary = '#7C3AED';

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [zoom, setZoom] = useState(0);

  const loadDashboardData = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      setDashboardData(data);
    } catch (e) {
      console.log('Failed to fetch dashboard data in scanner', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const handleMarkAttendance = async (tokenString: string) => {
    if (!tokenString) return;
    setLoading(true);
    setScanResult(null);
    setCameraActive(false);

    try {
      const { data } = await API.post('/student/attendance/scan', { token: tokenString });
      setScanResult({
        success: true,
        message: data.message || 'Attendance marked successfully!',
        details: data.attendance
      });
      loadDashboardData(); // Refresh history
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to mark attendance. Expired or invalid code.';
      setScanResult({
        success: false,
        message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    handleMarkAttendance(data);
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] items-center justify-center px-8">
        <StatusBar barStyle="dark-content" />
        <View className="w-16 h-16 bg-white border border-slate-200 rounded-3xl items-center justify-center mb-6 shadow-sm">
          <CameraIcon size={28} color={primary} />
        </View>
        <Text className="text-xl font-extrabold text-[#0F172A] text-center mb-2">Camera Access Required</Text>
        <Text className="text-xs text-[#64748B] text-center mb-6 leading-[18px]">
          We need your permission to use the camera. This is required to scan the class session QR codes projected by your trainer.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="px-6 py-3.5 bg-[#6366F1] rounded-xl shadow-sm"
        >
          <Text className="text-white font-bold text-xs uppercase tracking-wider">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Active Cohort Mapping
  const activeBatch = dashboardData?.batch;
  const trainerName = activeBatch?.trainers && activeBatch.trainers.length > 0 
    ? activeBatch.trainers[0].name 
    : 'Auto-Assigned';

  // Today's Attendance logs check
  const todayRecords = dashboardData?.attendance?.todayRecords || [];
  const hasCheckedInToday = todayRecords.length > 0;
  const lastRecord = hasCheckedInToday ? todayRecords[0] : null;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center gap-3.5">
        <View className="p-2.5 bg-violet-50 rounded-2xl border border-violet-100/50">
          <CameraIcon size={20} color="#7C3AED" />
        </View>
        <View>
          <Text className="text-2xl font-black text-[#0F172A]">Scan Attendance</Text>
          <Text className="text-xs text-[#64748B] mt-0.5">Point camera at the trainer's session QR code</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 py-6 justify-between">

          {/* 1. Camera Viewport Panel */}
          <View className="items-center justify-center my-6">
            {cameraActive && !scanResult && !loading ? (
              <View className="w-80 h-80 bg-[#0F0C20] rounded-[32px] overflow-hidden relative shadow-lg shadow-purple-500/5 border border-slate-200">
                <CameraView
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  zoom={zoom}
                  style={{ flex: 1 }}
                />
                <View pointerEvents="none" className="absolute top-5 left-5 w-6 h-6 border-t-[3px] border-l-[3px] border-[#7C3AED] rounded-tl-lg" />
                <View pointerEvents="none" className="absolute top-5 right-5 w-6 h-6 border-t-[3px] border-r-[3px] border-[#7C3AED] rounded-tr-lg" />
                <View pointerEvents="none" className="absolute bottom-5 left-5 w-6 h-6 border-b-[3px] border-l-[3px] border-[#7C3AED] rounded-bl-lg" />
                <View pointerEvents="none" className="absolute bottom-5 right-5 w-6 h-6 border-b-[3px] border-r-[3px] border-[#7C3AED] rounded-br-lg" />

                <View className="absolute top-1/2 left-4 right-4 h-1 bg-[#7C3AED] opacity-80 shadow-md shadow-purple-500" />
              </View>
            ) : (
              <View className="w-80 h-80 bg-white border border-slate-200 rounded-[32px] items-center justify-center p-6 shadow-sm">
                {loading ? (
                  <View className="items-center">
                    <ActivityIndicator size="large" color={primary} />
                    <Text className="text-xs font-semibold mt-3 text-[#7C3AED]">Verifying code with server...</Text>
                  </View>
                ) : scanResult ? (
                  <View className="items-center w-full">
                    <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-slate-50 border border-slate-100">
                      {scanResult.success ? (
                        <CheckCircle2 size={32} color="#16A34A" />
                      ) : (
                        <AlertCircle size={32} color="#DC2626" />
                      )}
                    </View>
                    <Text className="text-base font-extrabold text-[#0F172A] text-center">
                      {scanResult.success ? 'Success' : 'Scan Failed'}
                    </Text>
                    <Text className="text-[10px] text-[#64748B] text-center mt-1 px-4 leading-[16px]">
                      {scanResult.message}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setScanResult(null);
                        setCameraActive(true);
                      }}
                      className="px-5 py-2.5 bg-[#7C3AED] rounded-xl mt-4"
                    >
                      <Text className="text-white font-bold text-xs">Scan Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="items-center w-full">
                    <TouchableOpacity
                      onPress={() => setCameraActive(true)}
                      className="w-16 h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl items-center justify-center mb-4"
                    >
                      <CameraIcon size={24} color={primary} />
                    </TouchableOpacity>
                    <Text className="text-sm font-bold text-[#0F172A]">Camera Idle</Text>
                    <TouchableOpacity
                      onPress={() => setCameraActive(true)}
                      className="px-5 py-2.5 bg-[#7C3AED] rounded-xl mt-3"
                    >
                      <Text className="text-white font-bold text-xs">Start Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Zoom Controls */}
            {cameraActive && !scanResult && !loading && (
              <View className="flex-row items-center justify-center gap-4 mt-5 bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl shadow-sm">
                <TouchableOpacity
                  onPress={() => setZoom(Math.max(0, zoom - 0.05))}
                  className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full items-center justify-center"
                >
                  <Text className="text-xl font-black text-[#7C3AED]">-</Text>
                </TouchableOpacity>

                <View className="items-center min-w-[70px]">
                  <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Zoom</Text>
                  <Text className="text-sm font-black text-[#0F172A] mt-0.5">{(zoom * 10 + 1).toFixed(1)}x</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setZoom(Math.min(1.0, zoom + 0.05))}
                  className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full items-center justify-center"
                >
                  <Text className="text-xl font-black text-[#7C3AED]">+</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scanning Status Pill */}
            <View className="bg-[#F3E8FF] px-6 py-2.5 rounded-full mt-4 shadow-sm border border-[#E9D5FF]/30">
              <Text className="text-[#6B21A8] text-[11px] font-black tracking-wide">
                {loading ? 'Verifying QR code...' : scanResult ? 'Ready for next scan' : 'Scanning for QR code...'}
              </Text>
            </View>
          </View>

          {/* Bottom Session Card and Scan Result Banner */}
          <View className="mt-4 gap-4">
            {/* 2. Web Development Session Info Card */}
            <View className="bg-white border border-[#E2E8F0] p-4 rounded-3xl flex-row items-center gap-3.5 shadow-sm">
              <View className="p-3 bg-[#F3E8FF] rounded-2xl">
                <BookOpen size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-sm">
                  {activeBatch ? activeBatch.name : 'No Active Batch'}
                </Text>
                <Text className="text-[11px] text-[#64748B] mt-0.5">
                  {activeBatch ? `${activeBatch.course} • Trainer: ${trainerName}` : 'Please contact administrator'}
                </Text>
              </View>
            </View>

            {/* 3. Last check-in pill success banner */}
            {hasCheckedInToday && lastRecord ? (
              <View className="bg-[#DCFCE7] border border-[#BBF7D0]/40 py-3 px-4 rounded-2xl flex-row items-center gap-3">
                <View className="w-5 h-5 bg-[#22C55E] rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-black">✓</Text>
                </View>
                <Text className="text-xs font-black text-[#15803D]">
                  Last check-in: Today {new Date(lastRecord.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {lastRecord.status}
                </Text>
              </View>
            ) : (
              <View className="bg-amber-50 border border-amber-100 py-3 px-4 rounded-2xl flex-row items-center gap-3">
                <View className="w-5 h-5 bg-amber-500 rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-black">!</Text>
                </View>
                <Text className="text-xs font-black text-amber-700">
                  No check-ins logged today
                </Text>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
