import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone,
  Laptop,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import API from '../services/api';
import logoSla from '../assets/logosla.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Page view states: 'login' | 'unauthorized_device' | 'device_locked' | 'request_reset' | 'reset_success'
  const [viewState, setViewState] = useState('login');
  
  // Fields for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Blocked device details
  const [blockedDetails, setBlockedDetails] = useState({
    registeredDevice: '',
    lastUsed: null
  });

  // Fields for request reset
  const [resetForm, setResetForm] = useState({
    reason: 'Upgraded/Changed my Laptop',
    explanation: ''
  });
  const [resetLoading, setResetLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Logged in successfully!');
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const { role } = JSON.parse(storedUser);
        if (role === 'Admin' || role === 'Super Admin') {
          navigate('/admin');
        } else if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(role)) {
          navigate('/trainer');
        } else {
          navigate('/student');
        }
      }
    } else {
      if (result.code === 'UNAUTHORIZED_DEVICE') {
        setBlockedDetails({
          registeredDevice: result.registeredDevice || 'Unrecognized browser / computer',
          lastUsed: result.lastUsed
        });
        setViewState('unauthorized_device');
      } else if (result.code === 'DEVICE_LOCKED') {
        setViewState('device_locked');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email or SLAEID first');
      setViewState('login');
      return;
    }

    setResetLoading(true);
    try {
      const browserInfo = localStorage.getItem('deviceId') || 'Browser Session';
      await API.post('/auth/request-device-reset', {
        emailOrSlaeId: email,
        reason: resetForm.reason,
        requestedDevice: resetForm.explanation ? `${resetForm.reason} (${resetForm.explanation})` : resetForm.reason
      });
      setViewState('reset_success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reset request');
    } finally {
      setResetLoading(false);
    }
  };

  // Helper to format timestamps
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0c0d12] text-slate-800 dark:text-gray-100 selection:bg-violet-500 selection:text-white p-4 relative overflow-y-auto">
      
      <AnimatePresence mode="wait">
        {/* VIEW 1: NORMAL LOGIN SCREEN */}
        {viewState === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="m-auto w-full max-w-md p-8 py-10 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6"
          >
            {/* Top SLA Logo & Brand Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <img src={logoSla} alt="Softlogic Logo" className="h-16 w-auto object-contain mb-1" />
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Softlogic LCP Portal
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 font-semibold">
                  Student & Career Portal • Login to Continue
                </p>
              </div>
            </div>

            {/* Shield Notice indicating Single Device enforcement */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3 flex items-center space-x-3 text-xs">
              <ShieldCheck className="text-violet-800 dark:text-violet-400 h-5 w-5 shrink-0" />
              <p className="text-slate-600 dark:text-gray-400 font-semibold leading-relaxed">
                Protected by BuildX Single Device Authentication. Each student profile is restricted to one hardware setup.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wide">
                  Email Address / SLAEID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450 dark:text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or SLAE-0001"
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-[#0c0d12]/50 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450 dark:text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-[#0c0d12]/50 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-semibold placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-800 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-md shadow-violet-800/10 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 2: UNAUTHORIZED DEVICE ACCESS BLOCK SCREEN */}
        {viewState === 'unauthorized_device' && (
          <motion.div
            key="unauthorized"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg p-8 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl space-y-6"
          >
            {/* Visual Header */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-450 animate-pulse">
                <ShieldAlert size={36} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Security Block: Device Mismatch</h2>
                <p className="text-xs text-rose-550 dark:text-rose-400 font-bold mt-1 uppercase tracking-wide">BuildX Single Device Access Policy</p>
              </div>
            </div>

            {/* Device Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registered device */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-400 rounded-xl shrink-0 mt-0.5">
                  <Laptop size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Registered Device</span>
                  <span className="text-xs font-black text-gray-800 dark:text-white mt-1 block">{blockedDetails.registeredDevice}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Last Sync: {formatDateTime(blockedDetails.lastUsed)}</span>
                </div>
              </div>

              {/* Current Device blocked */}
              <div className="bg-rose-50/20 dark:bg-rose-950/5 border border-rose-200/30 p-4 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Your Current Device</span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-400 mt-1 block">Unregistered Setup</span>
                  <span className="text-[9px] text-rose-600 dark:text-rose-500 block mt-0.5">Device ID does not match database link</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-gray-400 space-y-2 leading-relaxed bg-slate-50 dark:bg-[#0c0d12]/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
              <p className="font-extrabold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-violet-500" /> Why is my login blocked?
              </p>
              <p>Each SLA student/trainer account is linked to the first hardware device used during verification. Accessing from multiple screens, browsers, or clearing browser tokens triggers a device safety block to protect credential security.</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setViewState('request_reset')}
                className="w-full py-3.5 rounded-xl bg-violet-800 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound size={14} />
                <span>Request Device Reset Request</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewState('login')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Back to Login
                </button>
                <a
                  href="mailto:support@softlogicsla.in?subject=LCP%20Device%20Authentication%20Reset"
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-center text-slate-650 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DEVICE LOCKED STATUS SCREEN */}
        {viewState === 'device_locked' && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="m-auto w-full max-w-md p-8 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl space-y-6 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl flex items-center justify-center text-rose-650 shrink-0 animate-pulse">
              <ShieldAlert size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Account Suspended</h2>
              <p className="text-xs text-rose-500 font-bold uppercase tracking-wider">Device Authentication Access Locked</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-semibold">
              Your device authentication credentials have been locked by security protocols due to multiple unrecognized registration attempts or coordinator policies.
            </p>

            <div className="bg-slate-50 dark:bg-[#0c0d12]/50 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl text-xs font-bold text-slate-600 dark:text-gray-300">
              Please contact the SLA operations coordinators or coordinate via your trainer to unlock your session credentials.
            </div>

            <button
              onClick={() => setViewState('login')}
              className="w-full py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-gray-350 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              Return to Login
            </button>
          </motion.div>
        )}

        {/* VIEW 4: DEVICE RESET REQUEST FORM */}
        {viewState === 'request_reset' && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="m-auto w-full max-w-md p-8 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl space-y-6"
          >
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Request Device Access Reset</h2>
              <p className="text-xs text-slate-400 dark:text-gray-400 mt-1 font-semibold">Submit a request to SLA Admins to release your registered device link</p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* Reason Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wide">
                  Reason for Device Change *
                </label>
                <div className="relative">
                  <select
                    value={resetForm.reason}
                    onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0d12]/50 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold cursor-pointer appearance-none"
                  >
                    <option value="Upgraded/Changed my Laptop">Upgraded/Changed my Laptop</option>
                    <option value="Upgraded/Changed my Mobile Phone">Upgraded/Changed my Mobile Phone</option>
                    <option value="Cleared Browser Cache & Cookies">Cleared Browser Cache & Cookies</option>
                    <option value="Device stolen or lost">Device stolen or lost</option>
                    <option value="Other">Other Reason</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Explanation Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wide">
                  Brief Explanation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resetForm.explanation}
                  onChange={(e) => setResetForm({ ...resetForm, explanation: e.target.value })}
                  placeholder="Explain why you are logging in from a different system..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0d12]/50 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold placeholder-slate-400"
                />
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 rounded-xl bg-violet-800 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Submit Reset Request</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewState('unauthorized_device')}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-bold text-slate-650 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 5: DEVICE RESET REQUEST SUCCESS SCREEN */}
        {viewState === 'reset_success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="m-auto w-full max-w-md p-8 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl space-y-6 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Request Submitted!</h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Awaiting SLA Admin Approval</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-semibold">
              Your device reset request has been logged successfully. SLA Administrators will review your request and clear the locked device mapping within 1-2 hours.
            </p>

            <button
              onClick={() => setViewState('login')}
              className="w-full py-3 bg-violet-800 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-violet-500/20 cursor-pointer"
            >
              Return to Login Page
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
