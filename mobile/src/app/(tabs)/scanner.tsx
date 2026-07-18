import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import API from '../../services/api';
import {
  Camera as CameraIcon,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ZoomIn,
  ZoomOut
} from 'lucide-react-native';

export default function QRScannerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const muted = isDark ? '#A79AC2' : '#6B6478';
  const primary = '#5B21B6';

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [zoom, setZoom] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0));

  useEffect(() => {
    if (permission?.granted) {
      setCameraActive(true);
    }
    return () => {
      setCameraActive(false);
    };
  }, [permission]);

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
      <View className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center px-8">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="w-16 h-16 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-2xl items-center justify-center mb-6">
          <CameraIcon size={28} color={primary} />
        </View>
        <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC] text-center mb-2">Camera Access Required</Text>
        <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2] text-center mb-6 leading-[18px]">
          We need your permission to use the camera. This is required to scan the class session QR codes projected by your trainer.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="px-6 py-3.5 bg-[#5B21B6] rounded-xl shadow-md shadow-[#5B21B6]/25"
        >
          <Text className="text-white font-bold text-xs uppercase tracking-wider">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-6">

          {/* Header */}
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              className="p-2 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-xl mr-3"
            >
              <ArrowLeft size={16} color={muted} />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC]">Scan Attendance</Text>
              <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2] mt-0.5">Point your camera at the trainer's session QR code</Text>
            </View>
          </View>

          {/* 1. Camera Viewport Panel */}
          {cameraActive && !scanResult && !loading ? (
            <View className="w-full aspect-square bg-[#0A0712] rounded-3xl overflow-hidden border border-[#5B21B6]/20 relative mt-4">
              <CameraView
                zoom={zoom}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                style={{ flex: 1 }}
              />
              {/* Corner brackets */}
              <View pointerEvents="none" className="absolute top-5 left-5 w-8 h-8 border-t-[3px] border-l-[3px] border-[#5B21B6] rounded-tl-lg" />
              <View pointerEvents="none" className="absolute top-5 right-5 w-8 h-8 border-t-[3px] border-r-[3px] border-[#5B21B6] rounded-tr-lg" />
              <View pointerEvents="none" className="absolute bottom-5 left-5 w-8 h-8 border-b-[3px] border-l-[3px] border-[#5B21B6] rounded-bl-lg" />
              <View pointerEvents="none" className="absolute bottom-5 right-5 w-8 h-8 border-b-[3px] border-r-[3px] border-[#5B21B6] rounded-br-lg" />

              <View className="absolute left-0 right-0 bottom-4 items-center">
                <Text className="text-[10px] text-white font-bold tracking-widest bg-[#5B21B6]/80 px-3 py-1.5 rounded-full">
                  Align QR Code inside camera feed
                </Text>
              </View>
              <View className="absolute right-4 bottom-6 items-center bg-black/40 rounded-full py-2 px-1">
                <TouchableOpacity onPress={handleZoomOut} className="p-2">
                  <ZoomOut size={20} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white text-xs font-bold my-1">{Math.round(zoom * 10)}x</Text>
                <TouchableOpacity onPress={handleZoomIn} className="p-2">
                  <ZoomIn size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="w-full aspect-square bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl items-center justify-center p-6 mt-4">
              {loading ? (
                <View className="items-center">
                  <ActivityIndicator size="large" color={primary} />
                  <Text className="text-xs font-semibold mt-3" style={{ color: primary }}>Verifying code with server...</Text>
                </View>
              ) : scanResult ? (
                <View className="items-center w-full">
                  <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-[#5B21B6]/10">
                    {scanResult.success ? (
                      <CheckCircle size={32} color={isDark ? '#34D399' : '#16A34A'} />
                    ) : (
                      <AlertCircle size={32} color={isDark ? '#F87171' : '#DC2626'} />
                    )}
                  </View>
                  <View>
                    <Text className="text-lg font-black text-[#1A1325] dark:text-[#F6F3FC] text-center">
                      {scanResult.success ? 'Attendance Success' : 'Scan Failed'}
                    </Text>
                    <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2] text-center mt-1.5 px-4 leading-[18px]">
                      {scanResult.message}
                    </Text>
                  </View>

                  {scanResult.success && scanResult.details && (
                    <View className="bg-[#F1EBFB] dark:bg-[#251C3D] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] p-3 rounded-2xl w-full flex-row justify-between mt-4 px-4">
                      <View>
                        <Text className="text-[9px] text-[#6B6478] dark:text-[#A79AC2] uppercase tracking-wider">Status</Text>
                        <Text className="font-bold mt-0.5 text-xs" style={{ color: isDark ? '#34D399' : '#16A34A' }}>{scanResult.details.status}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-[9px] text-[#6B6478] dark:text-[#A79AC2] uppercase tracking-wider">Marked Date</Text>
                        <Text className="font-bold text-[#1A1325] dark:text-[#F6F3FC] mt-0.5 text-xs">
                          {new Date(scanResult.details.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setScanResult(null);
                      setCameraActive(true);
                    }}
                    className="px-6 py-3 bg-[#5B21B6] rounded-xl shadow-md shadow-[#5B21B6]/25 mt-4"
                  >
                    <Text className="text-white font-bold text-xs">Scan New QR Code</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center w-full">
                  <TouchableOpacity
                    onPress={() => setCameraActive(true)}
                    className="w-16 h-16 bg-[#F8F6FC] dark:bg-[#0E0A18] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-2xl items-center justify-center mb-4"
                  >
                    <CameraIcon size={24} color={primary} />
                  </TouchableOpacity>
                  <Text className="text-sm font-bold text-[#1A1325] dark:text-[#F6F3FC]">Camera Feed Idle</Text>
                  <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] mt-1 mb-4">Start camera scanner to check in</Text>
                  <TouchableOpacity
                    onPress={() => setCameraActive(true)}
                    className="px-6 py-3 bg-[#5B21B6] rounded-xl shadow-md shadow-[#5B21B6]/25"
                  >
                    <Text className="text-white font-bold text-xs">Start Camera Scanner</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
