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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrToken)}`
    : '';

  const selectedBatchObj = batches.find(b => b._id === selectedBatch);
  
  const filteredBatches = batches.filter(b => 
    b.name?.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
    (b.batchId && b.batchId.toLowerCase().includes(batchSearchQuery.toLowerCase())) ||
    b.course?.toLowerCase().includes(batchSearchQuery.toLowerCase())
  );

  return (
    <div className="w-full py-8 px-4 space-y-8">
      {/* Header section with sparkles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 flex items-center gap-2">
            <Sparkles className="text-indigo-500 animate-pulse shrink-0" size={28} />
            Smart Dynamic QR Session
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Start a live class session with rotating, anti-spoofing dynamic QR codes to register attendance
          </p>
        </div>
      </div>

      {!activeSession ? (
        // Advanced Config Form Card
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-[#12131a]/85 border border-gray-200 dark:border-gray-800 rounded-[28px] p-8 backdrop-blur-md shadow-xl w-full"
        >
          <div className="flex items-center gap-3 border-b border-gray-150 dark:border-gray-800 pb-5 mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <Camera size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Class Session Setup</h2>
              <p className="text-xs text-gray-450 dark:text-gray-400 mt-0.5">Define subject parameters, select active batches, and generate secure tokens</p>
            </div>
          </div>

          <form onSubmit={handleStartSession} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Searchable Batch Select Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                  <Users size={14} className="text-indigo-500" />
                  Select Class Batch *
                </label>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0c0d12]/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer flex items-center justify-between font-semibold text-gray-900 dark:text-white"
                >
                  <span className={selectedBatchObj ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {selectedBatchObj ? `${selectedBatchObj.name} (${selectedBatchObj.batchId || 'Active'})` : '-- Choose Batch --'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-[#12131a] border border-gray-205 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                        <input
                          type="text"
                          placeholder="Search batch name or ID..."
                          value={batchSearchQuery}
                          onChange={(e) => setBatchSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#0c0d12]/50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
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
                              className={`p-3.5 text-xs font-semibold cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors flex flex-col gap-0.5 ${
                                selectedBatch === b._id 
                                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' 
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

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer text-sm"
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
      ) : (
        // Active Session Display
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* QR Code Container */}
          <div className="lg:col-span-3 bg-white/70 dark:bg-[#12131a]/85 border border-gray-200 dark:border-gray-800 rounded-[28px] p-8 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Active Class QR
              </span>
            </div>

            <div className="relative p-8 bg-white dark:bg-[#0c0d12] border border-gray-200 dark:border-gray-800 rounded-[36px] shadow-inner w-full max-w-md mx-auto flex items-center justify-center">
              {qrLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#0c0d12]/90 flex items-center justify-center rounded-[36px] z-10">
                  <RefreshCw className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
              )}
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Rotating QR Code" className="w-96 h-96 select-none rounded-2xl" />
              ) : (
                <div className="w-96 h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
                  Initializing token...
                </div>
              )}
            </div>

            <div className="mt-6 w-full max-w-md mx-auto">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <span>Rotating QR Token</span>
                <span>{countdown}s remaining</span>
              </div>
              <div className="w-full bg-gray-205 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-655 dark:bg-indigo-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2.5 text-xs text-rose-500 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-2xl border border-rose-200/50 dark:border-rose-900/20 w-full max-w-md mx-auto justify-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Screenshots or shared copies expire automatically within 15 seconds.</span>
            </div>
          </div>

          {/* Session Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/70 dark:bg-[#12131a]/85 border border-gray-200 dark:border-gray-800 rounded-[28px] p-6 backdrop-blur-md shadow-xl space-y-5">
              <h3 className="font-black text-lg border-b border-gray-150 dark:border-gray-800 pb-3">Class Details</h3>
              <div className="space-y-4">
                
                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subject</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-250 mt-0.5">{activeSession.subject}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enrolled Batch</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-250 mt-0.5">
                      {batches.find(b => b._id === activeSession.batch)?.name || 'Active Batch'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-250 mt-0.5">
                      Room {activeSession.roomNumber}, Floor {activeSession.floorNumber}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Started At</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-250 mt-0.5">
                      {new Date(activeSession.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <button
              onClick={handleCloseSession}
              className="w-full py-4 rounded-2xl font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer text-sm"
            >
              <XCircle className="w-5 h-5" />
              End Attendance Session
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QRClassSession;
