import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { Camera, AlertCircle, CheckCircle, RefreshCw, Key, Info, Video, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const html5QrcodeRef = useRef(null);

  // Custom mock token handler
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
        message: data.message,
        details: data.attendance
      });
      toast.success('Attendance marked successfully!');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to mark attendance';
      setScanResult({
        success: false,
        message
      });
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
        const html5Qrcode = new Html5Qrcode("reader");
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" }, // Target back camera
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            // Success handler
            toast.success("QR Code detected!");
            stopScanning();
            handleMarkAttendance(decodedText);
          },
          (errorMessage) => {
            // Failure handler (silent to prevent console noise)
          }
        );
      } catch (err) {
        console.error("Camera startup error:", err);
        setCameraPermissionError(
          "Could not access camera. Ensure you have granted camera permissions or try pasting the token below."
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
        console.error("Failed to stop scanning:", err);
      }
      html5QrcodeRef.current = null;
    }
    setCameraActive(false);
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error("Cleanup error:", err));
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-800 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
          Attendance QR Scanner
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Scan the active classroom QR code projected by your trainer to instantly record your attendance.
        </p>
      </div>

      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl space-y-8">
        
        {/* Camera Scanner Section */}
        <div className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-[#181922]">
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/20 text-[#4648d4] dark:text-violet-400 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <Camera className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="font-bold text-base mb-1">Camera Scanner Panel</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            Point your device camera at the rotating QR code on the trainer's screen to verify attendance.
          </p>

          {/* Scanner Viewport */}
          {cameraActive ? (
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-violet-500 bg-black shadow-inner flex flex-col items-center justify-center py-4">
              <div id="reader" className="w-full bg-black"></div>
              <button
                onClick={stopScanning}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 border border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <VideoOff size={14} />
                <span>Turn Camera Off</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Mock View */}
              <div className="relative p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 my-4 w-64 h-64 flex items-center justify-center">
                <div className="w-full h-full bg-gray-50 dark:bg-[#181922] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 p-4 text-center">
                  <Camera className="w-12 h-12 text-[#4648d4] dark:text-violet-400 mb-2 opacity-50" />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase">Camera Inactive</span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">[Click Start Camera to Scan]</span>
                </div>
              </div>

              <button
                onClick={startScanning}
                className="flex items-center gap-1.5 px-6 py-3 bg-violet-800 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-violet-500/20"
              >
                <Video size={14} />
                <span>Open & Start Camera Scanner</span>
              </button>
            </div>
          )}

          {cameraPermissionError && (
            <div className="mt-4 flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/10 px-4 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/20 max-w-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cameraPermissionError}</span>
            </div>
          )}
        </div>

        {/* Developer Fallback Mode */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 px-3.5 py-2.5 rounded-xl border border-violet-100/40 dark:border-violet-950/30 mb-6">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Sandbox Mode: Paste the rotating token generated by the Trainer's screen below.</span>
          </div>

          <form onSubmit={handleMockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Encrypted QR Token String
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste the session token from the trainer's session..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 transition-all font-mono text-gray-900 dark:text-white"
                  required
                />
                <Key className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold bg-violet-800 hover:bg-violet-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Decrypting & Marking Attendance...
                </>
              ) : (
                'Submit Scan Code'
              )}
            </button>
          </form>
        </div>

        {/* Scan Status Results */}
        {scanResult && (
          <div className={`p-6 rounded-2xl border transition-all ${scanResult.success ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/20' : 'bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/20'}`}>
            <div className="flex gap-4.5">
              {scanResult.success ? (
                <CheckCircle className="text-emerald-500 w-8 h-8 flex-shrink-0" />
              ) : (
                <AlertCircle className="text-rose-500 w-8 h-8 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-base mb-1 text-gray-900 dark:text-white">
                  {scanResult.success ? 'Attendance Verified' : 'Attendance Failed'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scanResult.message}
                </p>
                {scanResult.success && scanResult.details && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs bg-white/40 dark:bg-black/10 p-3 rounded-xl text-gray-700 dark:text-gray-300">
                    <div>
                      <span className="text-gray-400 font-semibold block">Designation</span>
                      <span className="font-bold mt-0.5 inline-block px-2 py-0.5 rounded bg-violet-200 dark:bg-violet-950 text-violet-900 dark:text-violet-300">
                        {scanResult.details.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Marked Date</span>
                      <span className="font-medium mt-0.5 inline-block">
                        {new Date(scanResult.details.date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
