import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  FolderGit,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursDisplay = hours < 10 ? `0${hours}` : hours;
  return `${hoursDisplay}:${minutes} ${ampm}`;
};

const TrainerBatchesPage = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState(() => {
    if (user?.role === 'Communication Trainer') return 'Communication';
    if (user?.role === 'Aptitude Trainer') return 'Aptitude';
    if (user?.role === 'Technical Trainer') return 'Technical';
    return 'All';
  });

  useEffect(() => {
    if (user?.role === 'Communication Trainer') setDomainFilter('Communication');
    else if (user?.role === 'Aptitude Trainer') setDomainFilter('Aptitude');
    else if (user?.role === 'Technical Trainer') setDomainFilter('Technical');
  }, [user?.role]);

  const getDefaultCourse = () => {
    if (user?.role === 'Communication Trainer') return 'Communication Skills';
    if (user?.role === 'Aptitude Trainer') return 'Aptitude & Reasoning';
    if (user?.role === 'Technical Trainer') return 'Technical Training';
    return 'Technical Training';
  };

  const handleOpenCreate = () => {
    setFormData({
      batchId: '',
      name: '',
      course: getDefaultCourse(),
      trainerName: '',
      startTime: '09:00',
      endTime: '11:00',
      days: 'Mon - Fri',
      status: 'Active'
    });
    setShowAddModal(true);
  };

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    name: '',
    course: getDefaultCourse(),
    trainerName: '',
    startTime: '09:00',
    endTime: '11:00',
    days: 'Mon - Fri',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState({
    batchId: '',
    name: '',
    course: 'Technical Training',
    trainerName: '',
    startTime: '09:00',
    endTime: '11:00',
    days: 'Mon - Fri',
    status: 'Active'
  });
  const [updating, setUpdating] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const [batchesRes, trainersRes] = await Promise.all([
        API.get('/trainer/batches'),
        API.get('/trainer/trainers').catch(() => ({ data: [] }))
      ]);
      setBatches(batchesRes.data || []);
      setTrainers(trainersRes.data || []);
    } catch (error) {
      toast.error('Failed to load batches directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // CREATE BATCH
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Batch Name is required');
      return;
    }

    const formattedSchedule = `${formatTime12Hour(formData.startTime)} - ${formatTime12Hour(formData.endTime)} (${formData.days})`;

    setSubmitting(true);
    try {
      const res = await API.post('/trainer/batches', {
        batchId: formData.batchId.trim() || `BATCH-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        course: formData.course,
        trainerName: formData.trainerName.trim() || `${formData.course.split(' ')[0]} Trainer`,
        schedule: formattedSchedule,
        status: formData.status
      });
      toast.success('Batch created successfully!');
      setBatches(prev => [res.data, ...prev]);
      setShowAddModal(false);
      setFormData({
        batchId: '',
        name: '',
        course: 'Technical Training',
        trainerName: '',
        startTime: '09:00',
        endTime: '11:00',
        days: 'Mon - Fri',
        status: 'Active'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

const parseScheduleToTimes = (scheduleStr) => {
  if (!scheduleStr) return { startTime: '09:00', endTime: '11:00', days: 'Mon - Fri' };
  try {
    const convert12to24 = (time12) => {
      const parts = time12.trim().split(' ');
      if (parts.length < 2) return '09:00';
      const [hm, ampm] = parts;
      let [h, m] = hm.split(':').map(Number);
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
      return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
    };

    const timePart = scheduleStr.split('(')[0].trim();
    const [start12, end12] = timePart.split('-').map(s => s.trim());
    const daysMatch = scheduleStr.match(/\(([^)]+)\)/);
    const days = daysMatch ? daysMatch[1] : 'Mon - Fri';
    return {
      startTime: convert12to24(start12 || '09:00 AM'),
      endTime: convert12to24(end12 || '11:00 AM'),
      days
    };
  } catch (err) {
    return { startTime: '09:00', endTime: '11:00', days: 'Mon - Fri' };
  }
};

  // OPEN EDIT MODAL
  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    const parsed = parseScheduleToTimes(batch.schedule);
    setEditFormData({
      batchId: batch.batchId || '',
      name: batch.name || '',
      course: batch.course || 'Technical Training',
      trainerName: batch.trainerName || '',
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      days: parsed.days,
      status: batch.status || 'Active'
    });
    setShowEditModal(true);
  };

  // UPDATE BATCH
  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;
    if (!editFormData.name.trim()) {
      toast.error('Batch Name is required');
      return;
    }

    const formattedSchedule = `${formatTime12Hour(editFormData.startTime)} - ${formatTime12Hour(editFormData.endTime)} (${editFormData.days})`;

    setUpdating(true);
    try {
      const res = await API.put(`/trainer/batches/${editingBatch._id}`, {
        batchId: editFormData.batchId.trim(),
        name: editFormData.name.trim(),
        course: editFormData.course,
        trainerName: editFormData.trainerName.trim() || `${editFormData.course.split(' ')[0]} Trainer`,
        schedule: formattedSchedule,
        status: editFormData.status
      });
      toast.success('Batch updated successfully!');
      setBatches(prev =>
        prev.map(b => (b._id === editingBatch._id ? res.data : b))
      );
      setShowEditModal(false);
      setEditingBatch(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update batch');
    } finally {
      setUpdating(false);
    }
  };

  // DELETE BATCH
  const handleDeleteBatch = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete batch "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/trainer/batches/${id}`);
      toast.success('Batch deleted successfully!');
      setBatches(prev => prev.filter(b => b._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete batch');
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (user?.role === 'Communication Trainer') {
      const isComm = batch.course?.includes('Communication') || batch.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());
      if (!isComm) return false;
    } else if (user?.role === 'Aptitude Trainer') {
      const isApti = batch.course?.includes('Aptitude') || batch.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());
      if (!isApti) return false;
    } else if (user?.role === 'Technical Trainer') {
      const isTech = batch.course === 'Technical Training' || (!batch.course?.includes('Communication') && !batch.course?.includes('Aptitude')) || batch.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());
      if (!isTech) return false;
    }

    const matchesSearch =
      batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.trainerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain =
      domainFilter === 'All' ||
      (domainFilter === 'Technical' && (batch.course === 'Technical Training' || (!batch.course?.includes('Comm') && !batch.course?.includes('Apti')))) ||
      (domainFilter === 'Communication' && batch.course?.includes('Communication')) ||
      (domainFilter === 'Aptitude' && batch.course?.includes('Aptitude'));

    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Batches & Trainer Allocation
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Map batches to Technical, Communication, and Aptitude trainers with dedicated time slots for multi-batch student enrollment.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
        >
          <Plus size={16} />
          <span>Create Batch</span>
        </button>
      </div>

      {/* Domain Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(user?.role === 'Communication Trainer'
          ? [{ key: 'Communication', label: 'Communication Skills' }]
          : user?.role === 'Aptitude Trainer'
          ? [{ key: 'Aptitude', label: 'Aptitude & Reasoning' }]
          : user?.role === 'Technical Trainer'
          ? [{ key: 'Technical', label: 'Technical Training' }]
          : [
              { key: 'All', label: 'All Domains' },
              { key: 'Technical', label: 'Technical Training' },
              { key: 'Communication', label: 'Communication Skills' },
              { key: 'Aptitude', label: 'Aptitude & Reasoning' },
            ]
        ).map(dom => (
          <button
            key={dom.key}
            onClick={() => setDomainFilter(dom.key)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              domainFilter === dom.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500'
            }`}
          >
            <BookOpen size={13} />
            <span>{dom.label}</span>
          </button>
        ))}
      </div>

      {/* Main Card with Toolbar & Table */}
      <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Batch ID, Name, Domain, Trainer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-slate-800 dark:text-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredBatches.length}</span> mapped batch(es)
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Batch ID</th>
                <th className="px-6 py-4">Batch Name & Domain</th>
                <th className="px-6 py-4">Assigned Trainer</th>
                <th className="px-6 py-4">Dedicated Time Slot</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Loading batches & trainer allocation...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                    No batches found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch, idx) => {
                  const displayId = batch.batchId || `BATCH-${(idx + 1).toString().padStart(3, '0')}`;
                  const displayTime = batch.schedule || '09:00 AM - 11:00 AM (Mon - Fri)';
                  const displayStatus = batch.status || 'Active';
                  const domainBadge = batch.course || 'Technical Training';

                  return (
                    <tr key={batch._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {displayId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800 dark:text-white text-sm">
                          {batch.name}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            domainBadge.includes('Communication')
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : domainBadge.includes('Aptitude')
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            {domainBadge}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <UserCheck size={14} className="text-indigo-500" />
                          <span>{batch.trainerName || `${domainBadge.split(' ')[0]} Trainer`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{displayTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 ${
                          displayStatus === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : displayStatus === 'Completed'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          <CheckCircle2 size={12} />
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            title="Edit Batch"
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch._id, batch.name)}
                            title="Delete Batch"
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <FolderGit size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Create Batch & Allocate Trainer</h3>
                    <p className="text-xs text-slate-500">Assign Domain Module, Trainer, and Schedule</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Batch ID (Custom)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TECH-A1, COMM-B1"
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Domain Module *
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {(user?.role === 'Communication Trainer'
                        ? ['Communication Skills']
                        : user?.role === 'Aptitude Trainer'
                        ? ['Aptitude & Reasoning']
                        : user?.role === 'Technical Trainer'
                        ? ['Technical Training']
                        : ['Technical Training', 'Communication Skills', 'Aptitude & Reasoning']
                      ).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fullstack MERN Cohort 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Assigned Trainer Name *
                  </label>
                  <select
                    required
                    value={formData.trainerName}
                    onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Assigned Trainer --</option>
                    {trainers
                      .filter((t) => {
                        if (user?.role === 'Communication Trainer') return t.role === 'Communication Trainer' || t.name === user?.name;
                        if (user?.role === 'Aptitude Trainer') return t.role === 'Aptitude Trainer' || t.name === user?.name;
                        if (user?.role === 'Technical Trainer') return t.role === 'Technical Trainer' || t.name === user?.name;
                        return true;
                      })
                      .map((t) => (
                        <option key={t._id} value={`${t.name} (${t.role})`}>
                          {t.name} — {t.role} {t.trainerId ? `[${t.trainerId}]` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Days *
                    </label>
                    <select
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Mon - Fri">Mon - Fri</option>
                      <option value="Sat - Sun">Sat - Sun (Weekend)</option>
                      <option value="Mon - Sat">Mon - Sat</option>
                      <option value="Daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create & Allocate Batch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Batch Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Edit Batch & Allocation</h3>
                    <p className="text-xs text-slate-500">Update Domain, Trainer, and Schedule</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Batch ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-101"
                      value={editFormData.batchId}
                      onChange={(e) => setEditFormData({ ...editFormData, batchId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Domain Module *
                    </label>
                    <select
                      value={editFormData.course}
                      onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {(user?.role === 'Communication Trainer'
                        ? ['Communication Skills']
                        : user?.role === 'Aptitude Trainer'
                        ? ['Aptitude & Reasoning']
                        : user?.role === 'Technical Trainer'
                        ? ['Technical Training']
                        : ['Technical Training', 'Communication Skills', 'Aptitude & Reasoning']
                      ).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fullstack MERN Cohort 1"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Assigned Trainer Name *
                  </label>
                  <select
                    required
                    value={editFormData.trainerName}
                    onChange={(e) => setEditFormData({ ...editFormData, trainerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Assigned Trainer --</option>
                    {trainers
                      .filter((t) => {
                        if (user?.role === 'Communication Trainer') return t.role === 'Communication Trainer' || t.name === user?.name;
                        if (user?.role === 'Aptitude Trainer') return t.role === 'Aptitude Trainer' || t.name === user?.name;
                        if (user?.role === 'Technical Trainer') return t.role === 'Technical Trainer' || t.name === user?.name;
                        return true;
                      })
                      .map((t) => (
                        <option key={t._id} value={`${t.name} (${t.role})`}>
                          {t.name} — {t.role} {t.trainerId ? `[${t.trainerId}]` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Days *
                    </label>
                    <select
                      value={editFormData.days}
                      onChange={(e) => setEditFormData({ ...editFormData, days: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Mon - Fri">Mon - Fri</option>
                      <option value="Sat - Sun">Sat - Sun (Weekend)</option>
                      <option value="Mon - Sat">Mon - Sat</option>
                      <option value="Daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Status *
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Allocation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainerBatchesPage;
