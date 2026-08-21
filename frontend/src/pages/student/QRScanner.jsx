import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, AlertCircle, CheckCircle2, BookOpen, Video, VideoOff, HelpCircle, Zap, ZapOff } from 'lucide-react';

const QRScanner = () => {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);

  const [displayZoom, setDisplayZoom] = useState(1.0); // 1.0x to 30.0x
  const [torch, setTorch] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  
  const [statusText, setStatusText] = useState('Scanning for QR code...');

  const html5QrCode = useRef(null);
  const videoTrackRef = useRef(null);

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
    // Auto-start scanning on mount
    startScanning();
    return () => stopScanning(); // Cleanup on unmount
  }, []);

  const handleMarkAttendance = async (tokenString) => {
    if (!tokenString) return;
    setLoading(true);
    setScanResult(null);
    setStatusText('Processing QR code...');
    
    try {
      const response = await API.post('/student/attendance/scan', { token: tokenString });
      toast.success(response.data.message || 'Attendance marked successfully');
      setScanResult({ success: true, message: response.data.message });
      await loadDashboardData(); // Refresh UI check-ins
      
      // Auto-restart scanning after 3 seconds on success
      setTimeout(() => {
        if (!cameraActive) startScanning();
      }, 3000);

    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(msg);
      setScanResult({ success: false, message: msg });
      setStatusText('Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const stopScanning = () => {
    if (html5QrCode.current) {
      html5QrCode.current.stop().then(() => {
        html5QrCode.current.clear();
        setCameraActive(false);
        videoTrackRef.current = null;
        setCapabilities(null);
      }).catch(err => console.error('Failed to stop scanner.', err));
    } else {
      setCameraActive(false);
    }
  };

  const startScanning = async () => {
    setCameraPermissionError(null);
    setScanResult(null);
    setLoading(false);
    setStatusText('Starting camera...');

    if (!html5QrCode.current) {
      html5QrCode.current = new Html5Qrcode("reader");
    }

    try {
      const config = {
        fps: 10,
        qrbox: 250, // Use a standard 250x250 box for scanning (fixes iOS crop/stretch issues)
        disableFlip: false, 
      };

      // Try environment camera first
      try {
        await html5QrCode.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => handleMarkAttendance(decodedText),
          (errorMessage) => {}
        );
      } catch (envError) {
        // Fallback to front camera
        await html5QrCode.current.start(
          { facingMode: "user" },
          config,
          (decodedText) => handleMarkAttendance(decodedText),
          (errorMessage) => {}
        );
      }
      
      setCameraActive(true);
      setStatusText('Scanning for QR code...');

      // Extract capabilities for Zoom/Torch
      try {
        if (html5QrCode.current.getRunningTrackCapabilities) {
          const track = html5QrCode.current.getRunningTrackCapabilities();
          if (track) setCapabilities(track);
        }
      } catch (e) {
        console.warn('Capabilities error', e);
      }
    } catch (err) {
      console.error('Camera Start Error:', err);
      setCameraPermissionError('Could not start camera. Please ensure permissions are granted and no other app is using it.');
      setCameraActive(false);
      setStatusText('Camera Error');
    }
  };

  // Apply Hardware Zoom 
  useEffect(() => {
    if (cameraActive && html5QrCode.current && html5QrCode.current.applyVideoConstraints) {
      try {
        // We apply constraints via the library's official method
        html5QrCode.current.applyVideoConstraints({
          advanced: [{ zoom: displayZoom }]
        }).catch(err => console.warn('Zoom not supported by this device', err));
      } catch (err) {
        console.warn('Zoom API error', err);
      }
    }
  }, [displayZoom, cameraActive]);

  // Apply Torch
  useEffect(() => {
    if (cameraActive && html5QrCode.current && html5QrCode.current.applyVideoConstraints) {
      if (capabilities && capabilities.torch) {
        try {
          html5QrCode.current.applyVideoConstraints({
            advanced: [{ torch: torch }]
          }).catch(err => console.warn('Torch not supported', err));
        } catch (err) {
          console.warn('Torch API error', err);
        }
      } else if (torch && capabilities && !capabilities.torch) {
        toast('Flashlight (Torch) is not supported on this device.');
      }
    }
  }, [torch, cameraActive, capabilities]);

  const activeBatch = dashboardData?.batch;
  const trainerName = activeBatch?.trainers && activeBatch.trainers.length > 0 ? activeBatch.trainers[0].name : 'Auto-Assigned';
  const todayRecords = dashboardData?.attendance?.todayRecords || [];

  const allBatches = dashboardData?.batches || [];
  const batchStatuses = [];

  if (allBatches.length > 0) {
    allBatches.forEach((b) => {
      const dept = b.department || (b.course?.includes('Communication') ? 'Communication' : b.course?.includes('Aptitude') ? 'Aptitude' : 'Technical');
      const rec = todayRecords.find((r) => {
        const subj = (r.subject || '').toLowerCase();
        const d = dept.toLowerCase();
        return subj.includes(d) || d.includes(subj);
      });

      if (rec) {
        const timeStr = new Date(rec.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        batchStatuses.push({
          key: b._id || dept,
          subject: dept,
          status: 'Completed',
          label: `${dept}: ${timeStr} (Check-in Completed)`
        });
      } else {
        batchStatuses.push({
          key: b._id || dept,
          subject: dept,
          status: 'Pending',
          label: `${dept}: Pending Check-in`
        });
      }
    });

    todayRecords.forEach((rec) => {
      const alreadyMapped = batchStatuses.some((bs) => {
        const subj = (rec.subject || '').toLowerCase();
        const d = bs.subject.toLowerCase();
        return subj.includes(d) || d.includes(subj);
      });
      if (!alreadyMapped) {
        const timeStr = new Date(rec.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        batchStatuses.push({
          key: rec._id || Math.random(),
          subject: rec.subject || 'Session',
          status: 'Completed',
          label: `${rec.subject || 'Session'}: ${timeStr} (Check-in Completed)`
        });
      }
    });
  } else if (todayRecords.length > 0) {
    todayRecords.forEach((rec) => {
      const timeStr = new Date(rec.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      batchStatuses.push({
        key: rec._id,
        subject: rec.subject || 'Session',
        status: 'Completed',
        label: `${rec.subject || 'Session'}: ${timeStr} (Check-in Completed)`
      });
    });
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-10">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">QR Scanner</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Point camera at session QR code</p>
        </div>
        <div className="bg-[#F3E8FF] border border-[#E9D5FF] px-3 py-1.5 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-wider leading-none mb-0.5">Location</span>
          <span className="text-sm font-black text-[#6B21A8] leading-none">SLA</span>
        </div>
      </div>

      <div className="p-5 md:p-8 flex flex-col justify-between max-w-lg mx-auto">
        
        {/* 1. Camera Viewport Panel */}
        <div className="flex flex-col items-center justify-center my-4 w-full">
          <div className="w-full max-w-[320px] min-h-[320px] relative rounded-[32px] overflow-hidden shadow-lg border border-slate-200 bg-white">
            
            {/* The actual HTML5 Qrcode container - Always in DOM to prevent dimension errors */}
            <div id="reader" className="w-full h-full bg-[#0F0C20]"></div>
            
            {cameraActive && !scanResult && !loading && (
              <>
                <button
                  onClick={() => setTorch(!torch)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full z-20 ${
                    torch ? 'bg-amber-400 text-black' : 'bg-black/60 border border-white/20 text-white'
                  }`}
                >
                  {torch ? <Zap size={16} /> : <ZapOff size={16} />}
                </button>
                
                <div className="absolute top-5 left-5 w-6 h-6 border-t-[3px] border-l-[3px] border-[#7C3AED] rounded-tl-lg pointer-events-none z-10" />
                <div className="absolute top-5 right-5 w-6 h-6 border-t-[3px] border-r-[3px] border-[#7C3AED] rounded-tr-lg pointer-events-none z-10" />
                <div className="absolute bottom-5 left-5 w-6 h-6 border-b-[3px] border-l-[3px] border-[#7C3AED] rounded-bl-lg pointer-events-none z-10" />
                <div className="absolute bottom-5 right-5 w-6 h-6 border-b-[3px] border-r-[3px] border-[#7C3AED] rounded-br-lg pointer-events-none z-10" />
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#7C3AED] opacity-80 shadow-md shadow-purple-500 pointer-events-none z-10" />
              </>
            )}

            {/* Overlay for Idle / Loading / Result states */}
            {(!cameraActive || scanResult || loading) && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 z-30">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-xs font-semibold text-[#7C3AED]">Verifying code with server...</span>
                  </div>
                ) : scanResult ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-slate-50 border border-slate-100">
                      {scanResult.success
                        ? <CheckCircle2 size={32} color="#16A34A" />
                        : <AlertCircle size={32} color="#DC2626" />}
                    </div>
                    <p className="text-base font-extrabold text-[#0F172A] text-center">
                      {scanResult.success ? 'Success' : 'Scan Failed'}
                    </p>
                    <p className="text-[10px] text-[#64748B] text-center mt-1 px-4 leading-[16px]">
                      {scanResult.message}
                    </p>
                    <button
                      onClick={() => {
                        setScanResult(null);
                        startScanning();
                      }}
                      className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl mt-4 font-bold text-xs"
                    >
                      Scan Again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <button
                      onClick={startScanning}
                      className="w-16 h-16 bg-[#F8FAFC] border border-slate-100 rounded-2xl flex items-center justify-center mb-4"
                    >
                      <Camera size={24} color="#7C3AED" />
                    </button>
                    <p className="text-sm font-bold text-[#0F172A]">Camera Idle</p>
                    <button
                      onClick={startScanning}
                      className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl mt-3 font-bold text-xs"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 30X Ultra Zoom Controls */}
          {cameraActive && !scanResult && !loading && (
            <div className="w-full max-w-[320px] mt-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center bg-white border border-[#E2E8F0] px-4 py-2 rounded-2xl shadow-sm">
                <button
                  onClick={() => setDisplayZoom(prev => Math.max(1.0, parseFloat((prev - (prev > 10 ? 2 : 1)).toFixed(1))))}
                  className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-xl font-black text-[#7C3AED] active:scale-95 transition-transform"
                >
                  -
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Ultra Zoom</span>
                  <span className="text-base font-black text-[#7C3AED] mt-0.5">{displayZoom.toFixed(1)}x</span>
                </div>
                <button
                  onClick={() => setDisplayZoom(prev => Math.min(30.0, parseFloat((prev + (prev >= 10 ? 2 : 1)).toFixed(1))))}
                  className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-xl font-black text-[#7C3AED] active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex justify-between gap-1.5">
                {[1, 2, 5, 10, 15, 30].map(zVal => (
                  <button
                    key={zVal}
                    onClick={() => setDisplayZoom(zVal)}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center text-[11px] font-black transition-colors ${
                      Math.abs(displayZoom - zVal) < 0.5
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                        : 'bg-white border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {zVal}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scanning Status Pill */}
          <div className="bg-[#F3E8FF] px-6 py-2.5 rounded-full mt-4 shadow-sm border border-[#E9D5FF]/30 text-center">
            <span className="text-[#6B21A8] text-[11px] font-black tracking-wide">
              {loading ? 'Verifying QR code...' : scanResult ? 'Ready for next scan' : statusText}
            </span>
          </div>

          {cameraPermissionError && (
            <div className="mt-4 flex flex-col items-center text-center p-4 bg-rose-50 border border-rose-100 rounded-2xl">
               <AlertCircle size={24} className="text-rose-500 mb-2" />
               <span className="text-xs text-rose-600 font-semibold">{cameraPermissionError}</span>
            </div>
          )}

          {cameraActive && !scanResult && !loading && (
             <button
               onClick={stopScanning}
               className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold"
             >
               <VideoOff size={14} />
               Stop Camera
             </button>
          )}

        </div>

        {/* Bottom Session Card and Scan Result Banner */}
        <div className="mt-6 flex flex-col gap-4">
          
          {/* 2. Web Development Session Info Card */}
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-3xl flex items-center gap-3.5 shadow-sm">
            <div className="p-3 bg-[#F3E8FF] rounded-2xl shrink-0">
              <BookOpen size={20} color="#8B5CF6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#0F172A] font-extrabold text-sm truncate">
                {activeBatch ? activeBatch.name : 'No Active Batch'}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                {activeBatch ? `${activeBatch.course} • Trainer: ${trainerName}` : 'Please contact administrator'}
              </p>
            </div>
          </div>

          {/* 3. Today's Check-in Status Pills */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-0.5">Today's Check-in Status</span>
            
            {batchStatuses.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {batchStatuses.map((item, idx) => {
                  const isDone = item.status === 'Completed';
                  return (
                    <div
                      key={item.key || idx}
                      className={`border px-3 py-1.5 rounded-full flex items-center gap-2 self-start shadow-sm ${
                        isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isDone ? 'bg-[#22C55E]' : 'bg-amber-500'}`}>
                        <span className="text-white text-[8px] font-black">{isDone ? '✓' : '!'}</span>
                      </div>
                      <span className={`text-[10px] font-black ${isDone ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full flex items-center gap-2 self-start shadow-sm">
                <div className="w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">!</span>
                </div>
                <span className="text-[10px] font-black text-amber-700">No check-ins logged today</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default QRScanner;
