import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Layers,
  Sparkles,
  UserCheck,
  Upload,
  FileSpreadsheet,
  Clock,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_STACKS = [
  'MERN Stack',
  'Java Full Stack',
  'Python & Data Science',
  'Cloud & DevOps (AWS/Azure)',
  'Business Communication Mastery',
  'Verbal & Soft Skills',
  'Quantitative Aptitude',
  'Logical Reasoning & Puzzles'
];

const AVAILABLE_SKILLS = [
  'React.js',
  'Node.js',
  'MongoDB',
  'Express.js',
  'Java',
  'Spring Boot',
  'Python',
  'SQL & Database Design',
  'Public Speaking',
  'Group Discussion Training',
  'Quantitative Analysis',
  'Logical Puzzle Solving',
  'Resume & Interview Preparation'
];

const TrainerManagement = () => {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'EMPID': 'EMP001',
        'Name': 'John Doe',
        'Mobile': '9876543210',
        'Email': 'johndoe@lcp.com'
      },
      {
        'EMPID': 'EMP002',
        'Name': 'Jane Smith',
        'Mobile': '9876543211',
        'Email': 'janesmith@lcp.com'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Trainer_Import_Template.xlsx');
    toast.success('Template downloaded successfully!');
  };

  const [importingExcel, setImportingExcel] = useState(false);

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select a file first');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', excelFile);

    setImportingExcel(true);
    try {
      const { data } = await API.post('/admin/trainers/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Imported trainers successfully!');
      setImportModalOpen(false);
      setExcelFile(null);
      fetchTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error importing Excel sheet');
    } finally {
      setImportingExcel(false);
    }
  };

  const [formData, setFormData] = useState({
    trainerId: '',
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Technical Trainer',
    stacks: ['MERN Stack'],
    skills: ['React.js', 'Node.js'],
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    trainerId: '',
    name: '',
    email: '',
    mobile: '',
    role: 'Technical Trainer',
    stacks: [],
    skills: [],
    status: 'Active'
  });
  const [updating, setUpdating] = useState(false);

  // Shift Time Availability Modal State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedTrainerForAvailability, setSelectedTrainerForAvailability] = useState(null);
  const [tempAvailability, setTempAvailability] = useState([]);
  const [newDay, setNewDay] = useState('Monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [savingAvailability, setSavingAvailability] = useState(false);

  const openAvailabilityModal = (trainer) => {
    setSelectedTrainerForAvailability(trainer);
    setTempAvailability(trainer.trainerAvailability || []);
    setShowAvailabilityModal(true);
  };

  const handleAddSlot = () => {
    if (newStart >= newEnd) {
      toast.error('End time must be after start time');
      return;
    }
    if (newDay === 'All Days (Mon - Sun)') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else if (newDay === 'Weekdays (Mon - Fri)') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else if (newDay === 'Weekends (Sat - Sun)') {
      const days = ['Saturday', 'Sunday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else {
      setTempAvailability([...tempAvailability, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }]);
    }
  };

  const handleRemoveSlot = (idx) => {
    setTempAvailability(tempAvailability.filter((_, i) => i !== idx));
  };

  const handleSaveAvailability = async () => {
    if (!selectedTrainerForAvailability) return;
    setSavingAvailability(true);
    try {
      await API.put(`/admin/trainers/${selectedTrainerForAvailability._id}/availability`, {
        availability: tempAvailability
      });
      toast.success('Trainer Shift/Availability Times updated!');
      // Update local state
      setTrainers(trainers.map(t => t._id === selectedTrainerForAvailability._id ? { ...t, trainerAvailability: tempAvailability } : t));
      setShowAvailabilityModal(false);
      setSelectedTrainerForAvailability(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save trainer availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/trainer/trainers');
      setTrainers(res.data || []);
    } catch (error) {
      toast.error('Failed to load trainers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  // MULTI-SELECT TOGGLE HELPER
  const toggleSelection = (list, item) => {
    return list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
  };

  // CREATE TRAINER
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      toast.error('Name, Email, and Mobile are required');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/trainer/trainers', {
        trainerId: formData.trainerId.trim() || `TR-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password || 'trainer123',
        role: formData.role,
        stacks: formData.stacks,
        skills: formData.skills
      });
      toast.success('Trainer created successfully!');
      setShowAddModal(false);
      setFormData({
        trainerId: '',
        name: '',
        email: '',
        mobile: '',
        password: '',
        role: 'Technical Trainer',
        stacks: ['MERN Stack'],
        skills: ['React.js', 'Node.js'],
        status: 'Active'
      });
      fetchTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add trainer');
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEdit = (trainer) => {
    setEditingTrainer(trainer);
    setEditFormData({
      trainerId: trainer.trainerId || '',
      name: trainer.name || '',
      email: trainer.email || '',
      mobile: trainer.mobile || '',
      role: trainer.role || 'Technical Trainer',
      stacks: Array.isArray(trainer.stacks) ? trainer.stacks : [],
      skills: Array.isArray(trainer.skills) ? trainer.skills : [],
      status: trainer.status || 'Active'
    });
    setShowEditModal(true);
  };

  // UPDATE TRAINER
  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    if (!editingTrainer) return;
    if (!editFormData.name.trim() || !editFormData.email.trim() || !editFormData.mobile.trim()) {
      toast.error('Name, Email, and Mobile are required');
      return;
    }

    setUpdating(true);
    try {
      await API.put(`/trainer/trainers/${editingTrainer._id}`, editFormData);
      toast.success('Trainer updated successfully!');
      setShowEditModal(false);
      setEditingTrainer(null);
      fetchTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update trainer');
    } finally {
      setUpdating(false);
    }
  };

  // DELETE TRAINER
  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete trainer "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/trainer/trainers/${id}`);
      toast.success('Trainer deleted successfully!');
      setTrainers(prev => prev.filter(t => t._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete trainer');
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch =
      trainer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.trainerId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || trainer.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Trainers Directory & Domain Mapping
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Manage Technical, Communication, and Aptitude trainers with Trainer ID, Contact, Multi-select Stacks, and Skills.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-800 hover:bg-violet-500 text-white text-xs font-extrabold shadow-md shadow-violet-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <Plus size={16} />
            <span>Add New Trainer</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <Upload size={16} />
            <span>Import Excel</span>
          </button>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'All', label: 'All Trainers' },
          { key: 'Technical Trainer', label: 'Technical Trainers' },
          { key: 'Communication Trainer', label: 'Communication Trainers' },
          { key: 'Aptitude Trainer', label: 'Aptitude Trainers' },
        ].map(r => (
          <button
            key={r.key}
            onClick={() => setRoleFilter(r.key)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              roleFilter === r.key
                ? 'bg-violet-800 text-white shadow-md shadow-violet-500/20'
                : 'bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-500'
            }`}
          >
            <GraduationCap size={14} />
            <span>{r.label}</span>
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
              placeholder="Search by Trainer ID, Name, Email, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 w-full text-slate-800 dark:text-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-bold text-violet-800 dark:text-violet-400">{filteredTrainers.length}</span> trainer(s)
          </div>
        </div>

        {/* Trainers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Trainer ID</th>
                <th className="px-6 py-4">Trainer Name & Domain</th>
                <th className="px-6 py-4">Mobile & Email</th>
                <th className="px-6 py-4">Assigned Stacks</th>
                <th className="px-6 py-4">Skills Expertise</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Loading trainers directory...
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                    No trainers found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer, idx) => {
                  const displayId = trainer.trainerId || `TR-${(idx + 1).toString().padStart(3, '0')}`;
                  const stacksList = Array.isArray(trainer.stacks) && trainer.stacks.length > 0 ? trainer.stacks : ['General Domain'];
                  const skillsList = Array.isArray(trainer.skills) && trainer.skills.length > 0 ? trainer.skills : ['Core Training'];

                  return (
                    <tr key={trainer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-violet-800 dark:text-violet-400">
                        {displayId}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800 dark:text-white text-sm">
                          {trainer.name}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            trainer.role === 'Communication Trainer'
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : trainer.role === 'Aptitude Trainer'
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              : 'bg-violet-100 dark:bg-violet-950/50 text-violet-900 dark:text-violet-300'
                          }`}>
                            {trainer.role}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                          <Phone size={12} className="text-slate-400" />
                          <span>{trainer.mobile || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <Mail size={12} className="text-slate-400" />
                          <span>{trainer.email}</span>
                        </div>
                      </td>

                      {/* Stacks Badges */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {stacksList.map((stk, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800/50"
                            >
                              {stk}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Skills Chips */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {skillsList.map((sk, skIdx) => (
                            <span
                              key={skIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={12} />
                          {trainer.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === 'Super Admin' && (
                            <button
                              onClick={() => openAvailabilityModal(trainer)}
                              title="Shift & Availability Hours"
                              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(trainer)}
                            title="Edit Trainer"
                            className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrainer(trainer._id, trainer.name)}
                            title="Delete Trainer"
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
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

      {/* Add Trainer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Add New Trainer</h3>
                    <p className="text-xs text-slate-500">Record Trainer ID, Contact, Role, Multi-select Stacks & Skills</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTrainer} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer ID (Optional / Custom)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TR-101, SLA-TR-01"
                      value={formData.trainerId}
                      onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Role / Domain *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="Technical Trainer">Technical Trainer</option>
                      <option value="Communication Trainer">Communication Trainer</option>
                      <option value="Aptitude Trainer">Aptitude Trainer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="trainer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Multiple Select Stacks */}
                <div className="pt-2">
                  <label className="block text-xs font-extrabold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>Select Stacks (Multiple Select)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    {AVAILABLE_STACKS.map(stk => {
                      const isSelected = formData.stacks.includes(stk);
                      return (
                        <button
                          type="button"
                          key={stk}
                          onClick={() => setFormData({ ...formData, stacks: toggleSelection(formData.stacks, stk) })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {stk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multiple Select Skills */}
                <div>
                  <label className="block text-xs font-extrabold text-violet-800 dark:text-violet-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Select Expertise Skills (Multiple Select)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
                    {AVAILABLE_SKILLS.map(sk => {
                      const isSelected = formData.skills.includes(sk);
                      return (
                        <button
                          type="button"
                          key={sk}
                          onClick={() => setFormData({ ...formData, skills: toggleSelection(formData.skills, sk) })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-violet-800 text-white border-violet-800 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {sk}
                        </button>
                      );
                    })}
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
                    className="px-5 py-2 rounded-xl bg-violet-800 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Trainer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Trainer Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Edit Trainer Profile</h3>
                    <p className="text-xs text-slate-500">Update Trainer ID, Contact, Role, Multi-select Stacks & Skills</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateTrainer} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TR-101"
                      value={editFormData.trainerId}
                      onChange={(e) => setEditFormData({ ...editFormData, trainerId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Role / Domain *
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="Technical Trainer">Technical Trainer</option>
                      <option value="Communication Trainer">Communication Trainer</option>
                      <option value="Aptitude Trainer">Aptitude Trainer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="trainer@example.com"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Multiple Select Stacks */}
                <div className="pt-2">
                  <label className="block text-xs font-extrabold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>Select Stacks (Multiple Select)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    {AVAILABLE_STACKS.map(stk => {
                      const isSelected = editFormData.stacks.includes(stk);
                      return (
                        <button
                          type="button"
                          key={stk}
                          onClick={() => setEditFormData({ ...editFormData, stacks: toggleSelection(editFormData.stacks, stk) })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {stk}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multiple Select Skills */}
                <div>
                  <label className="block text-xs font-extrabold text-violet-800 dark:text-violet-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Select Expertise Skills (Multiple Select)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
                    {AVAILABLE_SKILLS.map(sk => {
                      const isSelected = editFormData.skills.includes(sk);
                      return (
                        <button
                          type="button"
                          key={sk}
                          onClick={() => setEditFormData({ ...editFormData, skills: toggleSelection(editFormData.skills, sk) })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-violet-800 text-white border-violet-800 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {sk}
                        </button>
                      );
                    })}
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
                    className="px-5 py-2 rounded-xl bg-violet-800 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT FROM EXCEL MODAL */}
      {importModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/55 z-40" onClick={() => setImportModalOpen(false)} />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold">Import Trainers from Excel</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExcelImport} className="space-y-4">
              {/* Excel Template Download Card */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800/80">
                <div className="pr-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Excel Template</p>
                  <p className="text-[10px] text-gray-400">Minimal required columns template</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <FileSpreadsheet size={13} />
                  <span>Download Model</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-violet-50/10 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-400 rounded-xl flex items-center justify-center mx-auto">
                    <FileSpreadsheet size={24} />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {excelFile ? excelFile.name : 'Click or Drag Excel sheet here'}
                  </p>
                  <p className="text-[10px] text-gray-400">Supported files: .xlsx or .xls (Columns: EMPID, Name, Mobile, Email)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!excelFile || importingExcel}
                className="w-full py-2.5 bg-violet-800 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2"
              >
                {importingExcel ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Upload & Import</span>
                )}
              </button>
            </form>
          </div>
        </>
      )}
      {/* Trainer Shift / Availability Modal */}
      <AnimatePresence>
        {showAvailabilityModal && selectedTrainerForAvailability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvailabilityModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-sans">
                    Configure Shift Times
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Define shift hours & availability slots for <strong>{selectedTrainerForAvailability.name}</strong>
                  </p>
                </div>
                <button onClick={() => setShowAvailabilityModal(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350">
                  <X size={18} />
                </button>
              </div>

              {/* Add New Slot form */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                  <Plus size={14} className="text-indigo-655" />
                  Add Availability Slot
                </h4>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="All Days (Mon - Sun)">All Days (Mon - Sun)</option>
                      <option value="Weekdays (Mon - Fri)">Weekdays (Mon - Fri)</option>
                      <option value="Weekends (Sat - Sun)">Weekends (Sat - Sun)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Time</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSlot}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 dark:bg-violet-800 dark:hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md transition-all select-none"
                >
                  Add Timeslot
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured Shift Slots</h4>
                  {tempAvailability.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove all configured shift slots?')) {
                          setTempAvailability([]);
                        }
                      }}
                      className="text-[10px] text-rose-600 dark:text-rose-450 hover:underline font-bold flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Remove All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {tempAvailability.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No Shift Slots configured. Defaults to 24/7 availability.</p>
                  ) : (
                    tempAvailability.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                        <span>{slot.dayOfWeek} • {slot.startTime} - {slot.endTime}</span>
                        <button 
                          onClick={() => handleRemoveSlot(idx)}
                          className="text-rose-500 hover:text-rose-700 transition-all p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Save / Close buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all select-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                  className="flex-1 py-3 bg-violet-800 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-650/20 transition-all select-none flex items-center justify-center"
                >
                  {savingAvailability ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Save Shift Times'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainerManagement;
