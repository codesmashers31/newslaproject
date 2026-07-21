import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { Camera, MapPin, Users, BookOpen, Clock, AlertCircle, RefreshCw, XCircle, School, ChevronDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const QRClassSession = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  
  const [activeSession, setActiveSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(15);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // Search & custom dropdown states for Batch Select
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
    if (!selectedBatch) {
      toast.error('Please select a batch');
      return;
    }

    setLoading(true);
    try {
      const selectedBatchObj = batches.find(b => b._id === selectedBatch);
      const inferredSubject = selectedBatchObj?.course || 'General Class';

      const { data } = await API.post('/trainer/session/start', {
        batchId: selectedBatch,
        subject: inferredSubject,
        floorNumber: 'N/A',
        roomNumber: 'N/A'
      });
      setActiveSession(data);
      toast.success('Attendance session started successfully!');
      fetchQRToken(data._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start class session');
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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=0&data=${encodeURIComponent(qrToken)}`
    : '';

  const selectedBatchObj = batches.find(b => b._id === selectedBatch);
  
  const filteredBatches = batches.filter(b => 
    b.name?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
    (b.batchId && b.batchId.toLowerCase().includes(batchSearchQuery.toLowerCase())) ||
    b.course?.toLowerCase().includes(batchSearchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header section with sparkles */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-800 via-violet-500 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400 flex items-center justify-center gap-2.5">
          <Sparkles className="text-violet-500 animate-pulse shrink-0" size={32} />
          Smart Dynamic QR Session
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto">
          Start a live class session with rotating, anti-spoofing dynamic QR codes to register attendance
        </p>
      </div>

      {!activeSession ? (
        // Advanced Centered Config Form Card (Max Width XL for neat centered setup)
        <div className="max-w-xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl w-full space-y-6"
          >
            <div className="flex items-center justify-center gap-3 border-b border-gray-150 dark:border-gray-800 pb-5 text-center">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400 rounded-2xl shrink-0">
                <Camera size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Class Session Setup</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Define subject parameters, select active batch, and generate secure tokens</p>
              </div>
            </div>

            <form onSubmit={handleStartSession} className="space-y-6">
              {/* Searchable Batch Select Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                  <Users size={15} className="text-violet-500" />
                  Select Class Batch *
                </label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0c0d12]/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer flex items-center justify-between font-semibold text-gray-900 dark:text-white hover:border-violet-300"
                >
                  <span className={selectedBatchObj ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}>
                    {selectedBatchObj ? `${selectedBatchObj.name} (${selectedBatchObj.batchId || 'Active'})` : '-- Choose Batch --'}
                  </span>
                  <ChevronDown size={18} className={`text-gray-400 duration-200 ${isDropdownOpen ? 'rotate-180 text-violet-600' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                        <input
                          type="text"
                          placeholder="Search batch name or ID..."
                          value={batchSearchQuery}
                          onChange={(e) => setBatchSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#0c0d12]/50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto scrollbar-thin">
                        {filteredBatches.length === 0 ? (
                          <div className="p-4 text-xs text-center text-gray-400 italic">No batches found</div>
                        ) : (
                          filteredBatches.map(b => (
                            <div
                              key={b._id}
                              onClick={() => {
                                setSelectedBatch(b._id);
                                setIsDropdownOpen(false);
                                setBatchSearchQuery('');
                              }}
                              className={`p-3.5 text-xs font-semibold cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors flex flex-col gap-0.5 ${
                                selectedBatch === b._id 
                                  ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-400' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="font-bold">{b.name}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{b.course} {b.batchId && `• ID: ${b.batchId}`}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold bg-[#4648d4] hover:bg-[#393bb3] text-white flex items-center justify-center gap-2.5 shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Starting Session & Generating Tokens...</span>
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    <span>Generate Dynamic QR & Start Session</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        // Active Session Display (Wide layout with LARGE high-visibility QR Code)
        <div className="max-w-6xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* BIG QR Code Container (7 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center text-center">
              <div className="mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  ACTIVE CLASS ATTENDANCE QR
                </span>
              </div>

              {/* Large, Bold QR Container */}
              <div className="relative p-4 sm:p-6 bg-white dark:bg-[#0c0d12] border border-gray-200 dark:border-gray-800 rounded-[36px] shadow-inner w-full max-w-[660px] mx-auto flex items-center justify-center">
                {qrLoading && (
                  <div className="absolute inset-0 bg-white/85 dark:bg-[#0c0d12]/92 flex items-center justify-center rounded-[36px] z-10">
                    <RefreshCw className="h-10 w-10 text-violet-800 dark:text-violet-400 animate-spin" />
                  </div>
                )}
                {qrImageUrl ? (
                  <img 
                    src={qrImageUrl} 
                    alt="Rotating Class QR Code" 
                    className="w-full aspect-square max-w-[600px] select-none rounded-2xl object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square max-w-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 font-bold">
                    Initializing token...
                  </div>
                )}
              </div>

              {/* Rotating Timer Bar */}
              <div className="mt-6 w-full max-w-[660px] mx-auto">
                <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  <span>Rotating Security Token</span>
                  <span className="font-extrabold text-violet-600 dark:text-violet-400">{countdown}s remaining</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4648d4] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 15) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 rounded-2xl border border-rose-200/60 dark:border-rose-900/30 w-full max-w-[660px] mx-auto justify-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Anti-spoofing active: Shared screenshots expire in 15s.</span>
              </div>
            </div>

            {/* Session Details Card (5 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 sm:p-7 shadow-xl space-y-5">
                <h3 className="font-black text-lg border-b border-gray-150 dark:border-gray-800 pb-3.5 text-gray-900 dark:text-white">Class Details</h3>
                <div className="space-y-4">
                  
                  <div className="flex gap-3.5 items-center">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl h-11 w-11 flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subject</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{activeSession.subject}</p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 items-center">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl h-11 w-11 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enrolled Batch</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                        {batches.find(b => b._id === activeSession.batch)?.name || 'Active Batch'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 items-center">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl h-11 w-11 flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                        Room {activeSession.roomNumber}, Floor {activeSession.floorNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 items-center">
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl h-11 w-11 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Started At</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                        {new Date(activeSession.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              <button
                onClick={handleCloseSession}
                className="w-full py-4 rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer text-sm"
              >
                <XCircle className="w-5 h-5" />
                End Attendance Session
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QRClassSession;
