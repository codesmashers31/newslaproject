import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, UserX, UserCheck, Key, X, GraduationCap, Phone, Mail, FolderGit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Aptitude Trainer',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/trainers');
      setTrainers(data);
    } catch (error) {
      toast.error('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/trainers', formData);
      toast.toast ? toast.toast.success('Trainer created successfully!') : toast.success('Trainer created successfully!');
      setAddModalOpen(false);
      setFormData({ name: '', email: '', mobile: '', password: '', role: 'Aptitude Trainer' });
      loadTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating trainer');
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await API.put(`/admin/trainers/${selectedTrainer._id}/reset-password`, { password: passwordData.password });
      toast.success('Trainer password reset successfully');
      setPassModalOpen(false);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  const toggleTrainerStatus = async (trainer) => {
    const nextStatus = trainer.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await API.put(`/admin/trainers/${trainer._id}/status`, { status: nextStatus });
      toast.success(`Trainer account set to ${nextStatus}`);
      loadTrainers();
    } catch (error) {
      toast.error('Error changing account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Trainer Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage staff credentials and deactivation states</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20"
        >
          <Plus size={16} />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* Grid of Trainers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-10 bg-white/60 dark:bg-[#12131a]/60 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
          No trainers registered. Click Add Trainer to create an account.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={trainer._id}
              className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold rounded-xl flex items-center justify-center">
                    {trainer.name.charAt(0)}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    trainer.status === 'Active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450'
                      : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450'
                  }`}>
                    {trainer.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1">
                  <h4 className="font-bold text-sm">{trainer.name}</h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{trainer.role}</p>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Mail size={13} />
                    <span className="truncate">{trainer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone size={13} />
                    <span>{trainer.mobile}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FolderGit size={13} />
                    <span className="truncate">
                      Batches: {trainer.batches?.length > 0 ? trainer.batches.map(b => b.name).join(', ') : 'None assigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-850 flex gap-2">
                <button
                  onClick={() => toggleTrainerStatus(trainer)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                    trainer.status === 'Active'
                      ? 'border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10'
                      : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-950/20 dark:bg-emerald-950/10'
                  }`}
                >
                  {trainer.status === 'Active' ? (
                    <>
                      <UserX size={13} />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={13} />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedTrainer(trainer);
                    setPassModalOpen(true);
                  }}
                  className="px-3 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center text-gray-500"
                  title="Reset Password"
                >
                  <Key size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD TRAINER MODAL */}
      <AnimatePresence>
        {addModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setAddModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-250 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-850">
                <h3 className="text-lg font-bold">Add Trainer</h3>
                <button onClick={() => setAddModalOpen(false)} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                    placeholder="Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                      placeholder="email@lcp.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Mobile</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                      placeholder="password123"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Department Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-850 text-sm focus:outline-none"
                    >
                      <option value="Aptitude Trainer">Aptitude Trainer</option>
                      <option value="Communication Trainer">Communication Trainer</option>
                      <option value="Technical Trainer">Technical Trainer</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  Create Staff Account
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {passModalOpen && selectedTrainer && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setPassModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-sm h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-250 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-850">
                <h3 className="text-md font-bold">Reset Password: {selectedTrainer.name}</h3>
                <button onClick={() => setPassModalOpen(false)} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/10"
                >
                  Update Credentials
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainerManagement;
