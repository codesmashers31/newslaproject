import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  ShieldAlert, 
  Smartphone, 
  Check, 
  X, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Search, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Clock,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DeviceResetManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state for users to reset manually
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Modals / Comments state
  const [activeRequest, setActiveRequest] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'Approve' | 'Reject' | 'Reset' | 'ToggleLock'
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/device-resets');
      setRequests(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load device reset requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle searching users for direct action
  const handleUserSearch = async (val) => {
    setUserQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Find students & trainers matching query
      const [stuRes, trainerRes] = await Promise.all([
        API.get(`/admin/students?search=${val}`),
        API.get('/admin/trainers')
      ]);

      const matchedStudents = (stuRes.data.students || []).map(s => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        slaeId: s.slaeId,
        role: 'Student',
        deviceId: s.deviceId,
        deviceInfo: s.deviceInfo,
        isDeviceLocked: s.isDeviceLocked
      }));

      const matchedTrainers = (trainerRes.data || [])
        .filter(t => t.name.toLowerCase().includes(val.toLowerCase()) || t.email.toLowerCase().includes(val.toLowerCase()))
        .map(t => ({
          _id: t._id,
          name: t.name,
          email: t.email,
          slaeId: t.slaeId || 'Trainer',
          role: t.role,
          deviceId: t.deviceId,
          deviceInfo: t.deviceInfo,
          isDeviceLocked: t.isDeviceLocked
        }));

      setSearchResults([...matchedStudents, ...matchedTrainers]);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleResolveRequest = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      await API.post(`/admin/device-resets/${activeRequest._id}/resolve`, {
        action: modalAction,
        adminComment
      });
      toast.success(`Request successfully ${modalAction === 'Approve' ? 'approved' : 'rejected'}`);
      fetchRequests();
      setActiveRequest(null);
      setAdminComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectReset = async (user) => {
    if (!window.confirm(`Are you sure you want to release the device registration lock for ${user.name}?`)) return;
    try {
      await API.post(`/admin/users/${user._id}/reset-device`);
      toast.success(`Device registration released for ${user.name}`);
      fetchRequests();
      // Refresh search result info
      handleUserSearch(userQuery);
    } catch (error) {
      toast.error('Failed to reset device registration');
    }
  };

  const handleToggleLock = async (user) => {
    try {
      const { data } = await API.post(`/admin/users/${user._id}/toggle-device-lock`);
      toast.success(data.message);
      fetchRequests();
      // Refresh search result info
      handleUserSearch(userQuery);
    } catch (error) {
      toast.error('Failed to toggle device lock state');
    }
  };

  return (
    <div className="w-full py-8 px-4 space-y-8 select-none">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-800 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400 flex items-center gap-2">
          <ShieldAlert className="text-violet-500" size={28} />
          Single Device Authentication Security
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Manage linked devices, approve reset requests, and lock/unlock credentials to prevent account sharing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Reset Requests (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 dark:bg-[#12131a]/85 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="text-violet-500" size={20} />
              Pending Device Reset Requests
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                <span className="text-xs text-gray-400 font-semibold">Loading safety logs...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <ShieldCheck size={40} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">All Clear! No Pending Resets</h3>
                <p className="text-xs text-slate-400 mt-1">All users are verified and matching their registered device signatures.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {requests.map(req => (
                  <div key={req._id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white">{req.user?.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                          {req.user?.role}
                        </span>
                        <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          {req.user?.slaeId || 'N/A'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold">
                        <span className="text-gray-400">Reason:</span> {req.reason}
                      </p>
                      
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                        <span>Submitted: {new Date(req.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className={`font-bold ${
                          req.status === 'Pending' ? 'text-amber-500' :
                          req.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>{req.status}</span>
                      </div>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setActiveRequest(req);
                            setModalAction('Approve');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check size={14} /> Approve Reset
                        </button>
                        <button
                          onClick={() => {
                            setActiveRequest(req);
                            setModalAction('Reject');
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Manual Search & Reset Controls (1 Column) */}
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-[#12131a]/85 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Smartphone className="text-violet-500" size={20} />
              Quick Device Actions
            </h2>

            {/* Search Box */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search user name or Email..."
                value={userQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c0d12]/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
              />
            </div>

            {/* Results */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {searching ? (
                <div className="text-center py-6 text-xs text-gray-400 italic">Searching security signatures...</div>
              ) : userQuery && searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 italic">No matching users found</div>
              ) : !userQuery ? (
                <div className="text-xs text-center py-6 text-slate-500 dark:text-gray-400 font-semibold bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800 leading-relaxed">
                  Type a user's name or email to view their registered device details, toggle locks, or reset mapping.
                </div>
              ) : (
                searchResults.map(u => (
                  <div key={u._id} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{u.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{u.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-violet-100 dark:bg-violet-950/30 text-indigo-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        {u.role}
                      </span>
                    </div>

                    <div className="text-[10px] space-y-0.5 font-semibold text-slate-500 dark:text-gray-400 bg-white dark:bg-[#0c0d12]/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div><span className="text-gray-400 font-medium">Device:</span> {u.deviceInfo || 'Not Linked'}</div>
                      <div><span className="text-gray-400 font-medium">DeviceID:</span> <span className="font-mono text-[9px]">{u.deviceId || 'None'}</span></div>
                    </div>

                    <div className="flex gap-2">
                      {/* Reset Device Button */}
                      <button
                        onClick={() => handleDirectReset(u)}
                        disabled={!u.deviceId}
                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-95 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                      >
                        <RotateCcw size={13} /> Reset Device
                      </button>

                      {/* Lock Device Button */}
                      <button
                        onClick={() => handleToggleLock(u)}
                        className={`flex-1 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
                          u.isDeviceLocked 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                            : 'bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-700/20'
                        }`}
                      >
                        {u.isDeviceLocked ? (
                          <>
                            <Lock size={13} /> Locked
                          </>
                        ) : (
                          <>
                            <Unlock size={13} /> Lock Device
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMATION & COMMENT MODAL */}
      <AnimatePresence>
        {activeRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {modalAction === 'Approve' ? 'Confirm Device Reset Release' : 'Reject Device Reset Request'}
                </h3>
                <button
                  onClick={() => {
                    setActiveRequest(null);
                    setAdminComment('');
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-gray-400">
                <p>User: <span className="text-slate-800 dark:text-white">{activeRequest.user?.name}</span></p>
                <p>Reason: <span className="text-slate-700 dark:text-gray-300">{activeRequest.reason}</span></p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wide">
                  Admin Resolution Comment
                </label>
                <textarea
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="e.g. Approved user device change request..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#0c0d12]/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setActiveRequest(null);
                    setAdminComment('');
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveRequest}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 ${
                    modalAction === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DeviceResetManagement;
