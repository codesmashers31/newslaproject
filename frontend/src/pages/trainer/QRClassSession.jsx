import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { Camera, MapPin, Users, BookOpen, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const QRClassSession = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  
  const [activeSession, setActiveSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(15);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const timerRef = useRef(null);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const { data } = await API.get('/trainer/batches');
        setBatches(data);
      } catch (error) {
        console.error('Error fetching batches', error);
        toast.error('Failed to load active batches');
      }
    };
    fetchBatches();
  }, []);

  // Handle QR token rotation
  const fetchQRToken = async (sessionId) => {
    setQrLoading(true);
    try {
      const { data } = await API.get(`/trainer/session/${sessionId}/qr`);
      setQrToken(data.token);
      setCountdown(15); // Reset 15 seconds countdown
    } catch (error) {
      console.error('Error loading QR code', error);
      toast.error('Failed to rotate QR token');
    } finally {
      setQrLoading(false);
    }
  };

  // Timer loop
  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Trigger token refresh
            fetchQRToken(activeSession._id);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !subject || !floorNumber || !roomNumber) {
      toast.error('Please fill in all session details');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/trainer/session/start', {
        batchId: selectedBatch,
        subject,
        floorNumber,
        roomNumber
      });
      setActiveSession(data);
      toast.success('Attendance session started successfully!');
      fetchQRToken(data._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = () => {
    setActiveSession(null);
    setQrToken('');
    if (timerRef.current) clearInterval(timerRef.current);
    toast.success('Class session closed');
  };

  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Smart Dynamic QR Attendance
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Start a class session to generate a rotating, tamper-proof QR code for dynamic student registration.
        </p>
      </div>

      {!activeSession ? (
        // Start Session Form
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" />
            Class Session Configuration
          </h2>
          <form onSubmit={handleStartSession} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                >
                  <option value="" className="dark:bg-[#12131a]">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id} className="dark:bg-[#12131a]">{b.name} ({b.course})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Subject / Topic Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., React Context API"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Floor Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2nd Floor"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lab 4"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Starting Class Session...' : 'Generate Dynamic QR & Start Class'}
            </button>
          </form>
        </div>
      ) : (
        // Active Session QR Display
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* QR Code Container */}
          <div className="md:col-span-3 bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Active Class QR
              </span>
            </div>

            <div className="relative p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-inner max-w-xs mx-auto">
              {qrLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-2xl z-10">
                  <RefreshCw className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
              )}
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Rotating QR Code" className="w-64 h-64 select-none" />
              ) : (
                <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                  Initializing...
                </div>
              )}
            </div>

            <div className="mt-6 w-full max-w-xs">
              <div className="flex justify-between text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                <span>Rotating QR Token</span>
                <span>{countdown}s remaining</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Screenshots or shared copies expire automatically within 15 seconds.</span>
            </div>
          </div>

          {/* Session Details Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="font-bold text-lg mb-4">Class Details</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <BookOpen className="text-indigo-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Subject</p>
                    <p className="text-sm font-medium">{activeSession.subject}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Users className="text-indigo-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Enrolled Batch</p>
                    <p className="text-sm font-medium">
                      {batches.find(b => b._id === activeSession.batch)?.name || 'Active Batch'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="text-indigo-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Location</p>
                    <p className="text-sm font-medium">
                      Room {activeSession.roomNumber}, Floor {activeSession.floorNumber}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="text-indigo-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Started At</p>
                    <p className="text-sm font-medium">
                      {new Date(activeSession.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseSession}
              className="w-full py-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
            >
              <XCircle className="w-5 h-5" />
              End Attendance Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRClassSession;
