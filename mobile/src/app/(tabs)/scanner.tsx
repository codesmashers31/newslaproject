import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { router, useFocusEffect } from 'expo-router';
import API from '../../services/api';
import { 
  Camera as CameraIcon,
  AlertCircle,
  CheckCircle,
  Key,
  Info,
  ArrowLeft,
  ZoomIn,
  ZoomOut
} from 'lucide-react-native';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [baseZoom, setBaseZoom] = useState(0);

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setBaseZoom(zoom);
    }
  };

  const onPinchGestureEvent = (event: any) => {
    const scale = event.nativeEvent.scale;
    let newZoom = baseZoom + (scale - 1) * 0.1;
    newZoom = Math.min(Math.max(newZoom, 0), 1);
    setZoom(newZoom);
  };

  useFocusEffect(
    useCallback(() => {
      if (permission?.granted) {
        setCameraActive(true);
      }
      return () => {
        setCameraActive(false);
      };
    }, [permission])
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
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionIconBg}>
          <CameraIcon size={28} color="#818cf8" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need your permission to use the camera. This is required to scan the class session QR codes projected by your trainer.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionBtn}
        >
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.replace('/(tabs)')}
              style={styles.backButton}
            >
              <ArrowLeft size={16} color="#cbd5e1" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>QR Code Scanner</Text>
              <Text style={styles.headerSub}>Scan classroom slides to verify daily roll</Text>
            </View>
          </View>

          {/* 1. Camera Viewport Panel */}
          {cameraActive && !scanResult && !loading ? (
            <View style={styles.cameraViewport}>
              <PinchGestureHandler
                onGestureEvent={onPinchGestureEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <View style={styles.cameraFeed} collapsable={false}>
                  <CameraView
                    zoom={zoom}
                    facing="back"
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.cameraOverlay}>
                    <Text style={styles.cameraOverlayText}>
                      Align QR Code inside camera feed. Pinch to zoom.
                    </Text>
                  </View>
                </View>
              </PinchGestureHandler>
            </View>
          ) : (
            <View style={styles.standbyContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Verifying code with server...</Text>
                </View>
              ) : scanResult ? (
                <View style={styles.resultContainer}>
                  <View style={styles.resultIconBg}>
                    {scanResult.success ? (
                      <CheckCircle size={32} color="#34d399" />
                    ) : (
                      <AlertCircle size={32} color="#f43f5e" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.resultTitle}>
                      {scanResult.success ? 'Attendance Success' : 'Scan Failed'}
                    </Text>
                    <Text style={styles.resultMessage}>
                      {scanResult.message}
                    </Text>
                  </View>

                  {scanResult.success && scanResult.details && (
                    <View style={styles.detailsCard}>
                      <View>
                        <Text style={styles.detailsLabel}>Status</Text>
                        <Text style={styles.detailsValueStatus}>{scanResult.details.status}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.detailsLabel}>Marked Date</Text>
                        <Text style={styles.detailsValue}>
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
                    style={styles.scanButton}
                  >
                    <Text style={styles.scanButtonText}>Scan New QR Code</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.resultContainer}>
                  <TouchableOpacity
                    onPress={() => setCameraActive(true)}
                    style={styles.cameraStartIconBg}
                  >
                    <CameraIcon size={24} color="#818cf8" />
                  </TouchableOpacity>
                  <Text style={styles.standbyTitle}>Camera Feed Idle</Text>
                  <Text style={styles.standbySubText}>Start camera scanner to check in</Text>
                  <TouchableOpacity
                    onPress={() => setCameraActive(true)}
                    style={styles.scanButton}
                  >
                    <Text style={styles.scanButtonText}>Start Camera Scanner</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 
          2. Developer Sandbox Token Fallback 
          <View style={styles.sandboxSection}>
            ...
          </View>
          */}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionIconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cameraViewport: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    position: 'relative',
  },
  cameraFeed: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
  },
  cameraOverlayText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(79, 70, 229, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  zoomBtn: {
    padding: 8,
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  standbyContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
    marginTop: 12,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  resultIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderColor: '#1e293b',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  detailsLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsValue: {
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginTop: 2,
    fontSize: 11,
  },
  detailsValueStatus: {
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 2,
    fontSize: 11,
  },
  scanButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 16,
  },
  scanButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cameraStartIconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  standbyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  standbySubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  sandboxSection: {
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    paddingTop: 24,
    marginTop: 24,
    width: '100%',
  },
  sandboxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  sandboxBannerText: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
