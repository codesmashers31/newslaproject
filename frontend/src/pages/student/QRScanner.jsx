import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Key,
  BookOpen,
  Video,
  VideoOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardHeader, SectionLabel, Pill, PRIMARY } from '../../components/ui/primitives';

/**
 * Web counterpart of mobile/src/app/(tabs)/scanner.tsx.
 * Same layout: framed camera viewport, status pill, active-session card and
 * today's check-in pills. The camera itself is html5-qrcode rather than
 * expo-camera, and the pasted-token fallback is web-only.
 */
const QRScanner = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const html5QrcodeRef = useRef(null);

  const loadDashboardData = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      setDashboardData(data);
    } catch (e) {
      console.log('Failed to fetch dashboard data in scanner', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleMarkAttendance = async (tokenString) => {
    if (!tokenString) {
      toast.error('Scan token is missing');
      return;
    }
    setLoading(true);
    setScanResult(null);
    try {
      const { data } = await API.post('/student/attendance/scan', { token: tokenString });
      setScanResult({
        success: true,
        message: data.message || 'Attendance marked successfully!',
        details: data.attendance
      });
      toast.success('Attendance marked successfully!');
      loadDashboardData(); // Refresh today's check-ins
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to mark attendance. Expired or invalid code.';
      setScanResult({ success: false, message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMockSubmit = (e) => {
    e.preventDefault();
    handleMarkAttendance(tokenInput);
  };

  const startScanning = async () => {
    setCameraPermissionError(null);
    setScanResult(null);
    setCameraActive(true);

    // Wait a brief tick for the container to render
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode('reader');
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' }, // Target back camera
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            toast.success('QR Code detected!');
            stopScanning();
            handleMarkAttendance(decodedText);
          },
          () => {
            // Per-frame decode failures are expected; stay silent.
          }
        );
      } catch (err) {
        console.error('Camera startup error:', err);
        setCameraPermissionError(
          'Could not access camera. Ensure you have granted camera permissions or paste the token below.'
        );
        setCameraActive(false);
      }
    }, 150);
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
      } catch (err) {
        console.error('Failed to stop scanning:', err);
      }
      html5QrcodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error('Cleanup error:', err));
      }
    };
  }, []);

  // Active cohort mapping, same as the mobile screen
  const activeBatch = dashboardData?.batch;
  const trainerName = activeBatch?.trainers && activeBatch.trainers.length > 0
    ? activeBatch.trainers[0].name
    : 'Auto-Assigned';

  const todayRecords = dashboardData?.attendance?.todayRecords || [];
  const hasCheckedInToday = todayRecords.length > 0;

  const statusText = loading
    ? 'Verifying QR code...'
    : scanResult
      ? 'Ready for next scan'
      : cameraActive
        ? 'Scanning for QR code...'
        : 'Camera idle';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header — mirrors the mobile scanner header */}
      <Card className="p-5">
        <CardHeader
          icon={Camera}
          title="Scan Attendance"
          subtitle="Point camera at the trainer's session QR code"
        />
      </Card>

      {/* 1. Camera viewport panel */}
      <div className="flex flex-col items-center">
        {cameraActive && !scanResult && !loading ? (
          <div className="relative w-80 h-80 bg-[#0F0C20] rounded-[32px] overflow-hidden border border-slate-200 dark:border-[#1e2330] shadow-lg">
            <div id="reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

            {/* Corner brackets */}
            <span className="pointer-events-none absolute top-5 left-5 w-6 h-6 border-t-[3px] border-l-[3px] border-[#7C3AED] rounded-tl-lg" />
            <span className="pointer-events-none absolute top-5 right-5 w-6 h-6 border-t-[3px] border-r-[3px] border-[#7C3AED] rounded-tr-lg" />
            <span className="pointer-events-none absolute bottom-5 left-5 w-6 h-6 border-b-[3px] border-l-[3px] border-[#7C3AED] rounded-bl-lg" />
            <span className="pointer-events-none absolute bottom-5 right-5 w-6 h-6 border-b-[3px] border-r-[3px] border-[#7C3AED] rounded-br-lg" />

            {/* Sweep line */}
            <span className="pointer-events-none scanning-line left-0" />
          </div>
        ) : (
          <div className="w-80 h-80 m-card rounded-[32px] flex items-center justify-center p-6 text-center">
            {loading ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-9 h-9 animate-spin" style={{ color: PRIMARY }} />
                <p className="text-xs font-semibold mt-3 text-[#7C3AED] dark:text-violet-400">
                  Verifying code with server...
                </p>
              </div>
            ) : scanResult ? (
              <div className="flex flex-col items-center w-full">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-slate-50 dark:bg-[#181922] border border-slate-100 dark:border-[#1e2330]">
                  {scanResult.success
                    ? <CheckCircle2 size={32} className="text-emerald-600" />
                    : <AlertCircle size={32} className="text-rose-600" />}
                </div>
                <p className="text-base font-extrabold text-[#0F172A] dark:text-white">
                  {scanResult.success ? 'Success' : 'Scan Failed'}
                </p>
                <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 px-4 leading-4">
                  {scanResult.message}
                </p>
                {scanResult.success && scanResult.details && (
                  <div className="mt-3 flex items-center gap-2">
                    <Pill tone="success">{scanResult.details.status}</Pill>
                    <span className="text-[10px] text-[#64748B]">
                      {new Date(scanResult.details.date).toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanning();
                  }}
                  className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl mt-4 font-bold text-xs cursor-pointer transition-colors"
                >
                  Scan Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <button
                  onClick={startScanning}
                  className="w-16 h-16 bg-[#F8FAFC] dark:bg-[#181922] border border-slate-100 dark:border-[#1e2330] rounded-2xl flex items-center justify-center mb-4 cursor-pointer"
                >
                  <Camera size={24} style={{ color: PRIMARY }} />
                </button>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">Camera Idle</p>
                <button
                  onClick={startScanning}
                  className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl mt-3 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Video size={14} />
                  Start Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stop control while live */}
        {cameraActive && !scanResult && !loading && (
          <button
            onClick={stopScanning}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 border border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <VideoOff size={14} />
            <span>Turn Camera Off</span>
          </button>
        )}

        {/* Scanning status pill */}
        <div className="bg-[#F3E8FF] dark:bg-violet-950/30 border border-[#E9D5FF]/40 dark:border-violet-900/40 px-6 py-2.5 rounded-full mt-4 shadow-sm">
          <span className="text-[#6B21A8] dark:text-violet-300 text-[11px] font-black tracking-wide">
            {statusText}
          </span>
        </div>

        {cameraPermissionError && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/10 px-4 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/20 max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraPermissionError}</span>
          </div>
        )}
      </div>

      {/* 2. Active session card */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="p-3 bg-[#F3E8FF] dark:bg-violet-950/30 rounded-2xl shrink-0">
          <BookOpen size={20} className="text-violet-500" />
        </div>
        <div className="min-w-0">
          <p className="text-[#0F172A] dark:text-white font-extrabold text-sm truncate">
            {activeBatch ? activeBatch.name : 'No Active Batch'}
          </p>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
            {activeBatch ? `${activeBatch.course} • Trainer: ${trainerName}` : 'Please contact administrator'}
          </p>
        </div>
      </Card>

      {/* 3. Today's check-in pills */}
      {hasCheckedInToday ? (
        <div className="space-y-2.5">
          <SectionLabel>Today's Check-ins</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {todayRecords.map((rec, idx) => (
              <Pill key={idx} tone="success" icon={CheckCircle2}>
                {rec.subject || 'Session'}: {new Date(rec.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Pill>
            ))}
          </div>
        </div>
      ) : (
        <Pill tone="warning" icon={AlertCircle}>No check-ins logged today</Pill>
      )}

      {/* Web-only fallback: paste the rotating token directly */}
      <Card className="p-5 space-y-4">
        <SectionLabel>Paste token manually</SectionLabel>
        <form onSubmit={handleMockSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Paste the session token from the trainer's screen..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#1e2330] bg-transparent text-sm font-mono"
              required
            />
            <Key className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
          </div>

          <button type="submit" disabled={loading} className="m-btn-primary">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Marking Attendance...
              </>
            ) : (
              'Submit Scan Code'
            )}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default QRScanner;
