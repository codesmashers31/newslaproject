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
  BookOpen,
  ArrowLeft,
  UserMinus,
  Upload,
  Share2,
  Users,
  Check,
  AlertCircle
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

const TrainerBatchesPage = () => {
  const { user } = useAuth();
  
  // Batches directory states
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

  // Selected Batch student sub-page state
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Assignment Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState([]);
  const [searchingAllStudents, setSearchingAllStudents] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);

  // Transfer Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [destBatchId, setDestBatchId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Bulk Import Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importing, setImporting] = useState(false);

  // Add / Edit batch states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    name: '',
    course: '',
    trainerName: '',
    startTime: '09:00',
    endTime: '11:00',
    days: 'Mon - Fri',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editFormData, setEditFormData] = useState({
    batchId: '',
    name: '',
    course: '',
    trainerName: '',
    startTime: '09:00',
    endTime: '11:00',
    days: 'Mon - Fri',
    status: 'Active'
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === 'Communication Trainer') setDomainFilter('Communication');
    else if (user?.role === 'Aptitude Trainer') setDomainFilter('Aptitude');
    else if (user?.role === 'Technical Trainer') setDomainFilter('Technical');
  }, [user?.role]);

  const getDefaultCourse = () => {
    if (user?.role === 'Communication Trainer') return 'Communication Skills';
    if (user?.role === 'Aptitude Trainer') return 'Aptitude & Reasoning';
    return 'Technical Training';
  };

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

  // LOAD STUDENTS FOR CHOSEN BATCH
  const handleViewStudents = async (batch) => {
    setSelectedBatchForStudents(batch);
    setLoadingStudents(true);
    setSelectedStudentIds([]);
    try {
      const res = await API.get(`/trainer/batches/${batch._id}/students`);
      setBatchStudents(res.data || []);
    } catch (error) {
      toast.error('Failed to load batch students list');
    } finally {
      setLoadingStudents(false);
    }
  };

  // SEARCH ALL STUDENTS FOR ADDITION
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!assignSearchQuery.trim()) {
        setAssignSearchResults([]);
        return;
      }
      setSearchingAllStudents(true);
      try {
        const res = await API.get(`/trainer/students/search?query=${encodeURIComponent(assignSearchQuery)}`);
        setAssignSearchResults(res.data || []);
      } catch (error) {
        toast.error('Failed to search student registry');
      } finally {
        setSearchingAllStudents(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [assignSearchQuery]);

  // ASSIGN SINGLE STUDENT
  const handleAssignStudent = async (student) => {
    if (!selectedBatchForStudents) return;
    setAssigningStudent(true);
    try {
      await API.post(`/trainer/batches/${selectedBatchForStudents._id}/students`, {
        slaeId: student.slaeId
      });
      toast.success(`${student.name} assigned successfully!`);
      // Reload students
      handleViewStudents(selectedBatchForStudents);
      setShowAssignModal(false);
      setAssignSearchQuery('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign student');
    } finally {
      setAssigningStudent(false);
    }
  };

  // REMOVE STUDENT FROM BATCH
  const handleRemoveStudent = async (studentId, studentName) => {
    if (!selectedBatchForStudents) return;
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this batch?`)) {
      return;
    }

    try {
      await API.delete(`/trainer/batches/${selectedBatchForStudents._id}/students/${studentId}`);
      toast.success(`${studentName} removed from batch successfully.`);
      setBatchStudents(prev => prev.filter(s => s._id !== studentId));
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  // TRANSFER STUDENTS
  const handleTransferStudents = async (e) => {
    e.preventDefault();
    if (!destBatchId) {
      toast.error('Please select a destination batch');
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error('No students selected for transfer');
      return;
    }

    setTransferring(true);
    try {
      await API.post('/trainer/batches/transfer', {
        sourceBatchId: selectedBatchForStudents._id,
        destBatchId,
        studentIds: selectedStudentIds
      });
      toast.success('Selected students transferred successfully!');
      setShowTransferModal(false);
      setDestBatchId('');
      // Reload students
      handleViewStudents(selectedBatchForStudents);
    } catch (error) {
      toast.error('Failed to transfer students');
    } finally {
      setTransferring(false);
    }
  };

  // BULK EXCEL UPLOAD
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an Excel sheet (.xlsx, .xls)');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', importFile);

    setImporting(true);
    setImportStats(null);
    try {
      const res = await API.post(`/trainer/batches/${selectedBatchForStudents._id}/students/import`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportStats(res.data);
      toast.success('Bulk import completed!');
      handleViewStudents(selectedBatchForStudents);
    } catch (error) {
      toast.error('Bulk import failed. Please verify sheet columns.');
    } finally {
      setImporting(false);
    }
  };

  // CREATE BATCH
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Batch Name is required');
      return;
    }

    const formattedSchedule = `${formatTime12Hour(formData.startTime)} - ${formatTime12Hour(formData.endTime)} (${formData.days})`;
    const chosenCourse = formData.course || getDefaultCourse();

    setSubmitting(true);
    try {
      const res = await API.post('/trainer/batches', {
        batchId: formData.batchId.trim() || `BATCH-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        course: chosenCourse,
        trainerName: formData.trainerName.trim() || user?.name || `${chosenCourse.split(' ')[0]} Trainer`,
        schedule: formattedSchedule,
        status: formData.status
      });
      toast.success('Batch created successfully!');
      setBatches(prev => [res.data, ...prev]);
      setShowAddModal(false);
      setFormData({
        batchId: '',
        name: '',
        course: '',
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

  // FILTERED BATCH LIST
  const filteredBatches = batches.filter(batch => {
    const isAssigned = batch.trainers?.some(t => {
      const tId = typeof t === 'object' ? t?._id : t;
      return String(tId) === String(user?._id);
    }) || batch.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());

    if (user?.role === 'Communication Trainer') {
      const isComm = batch.course?.includes('Communication') || isAssigned;
      if (!isComm) return false;
    } else if (user?.role === 'Aptitude Trainer') {
      const isApti = batch.course?.includes('Aptitude') || isAssigned;
      if (!isApti) return false;
    } else if (user?.role === 'Technical Trainer') {
      const isTech = batch.course === 'Technical Training' || (!batch.course?.includes('Communication') && !batch.course?.includes('Aptitude')) || isAssigned;
      if (!isTech) return false;
    }

    const matchesSearch =
      batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.trainerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain =
      domainFilter === 'All' ||
      isAssigned ||
      (domainFilter === 'Technical' && (batch.course === 'Technical Training' || (!batch.course?.includes('Comm') && !batch.course?.includes('Apti')))) ||
      (domainFilter === 'Communication' && batch.course?.includes('Communication')) ||
      (domainFilter === 'Aptitude' && batch.course?.includes('Aptitude'));

    return matchesSearch && matchesDomain;
  });

  const getDomainText = (course) => {
    if (course?.includes('Communication')) return 'Communication';
    if (course?.includes('Aptitude')) return 'Aptitude';
    return 'Technical';
  };

  const otherDomainBatches = batches.filter(b => {
    if (!selectedBatchForStudents) return false;
    // Must be same course domain
    const isSameDomain = getDomainText(b.course) === getDomainText(selectedBatchForStudents.course);
    // Exclude source batch itself
    return isSameDomain && String(b._id) !== String(selectedBatchForStudents._id);
  });

  // LOCAL STUDENT SEARCH IN BATCH
  const filteredStudentsInBatch = batchStudents.filter(s => {
    const term = studentSearchText.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.mobile?.toLowerCase().includes(term) ||
      s.slaeId?.toLowerCase().includes(term)
    );
  });

  const handleSelectStudentToggle = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedStudentIds.length === filteredStudentsInBatch.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudentsInBatch.map(s => s._id));
    }
  };

  // --- RENDER BATCH STUDENT ALLOCATION SUB-VIEW ---
  if (selectedBatchForStudents) {
    return (
      <div className="space-y-6">
        {/* Sub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedBatchForStudents(null)}
              className="p-2 rounded-xl bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:border-indigo-500 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                  {selectedBatchForStudents.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-[#4648d4] text-[10px] font-extrabold uppercase">
                  {getDomainText(selectedBatchForStudents.course)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                Batch ID: <span className="font-bold font-mono text-indigo-600">{selectedBatchForStudents.batchId}</span> • {selectedBatchForStudents.schedule}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Student</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} />
              <span>Bulk Excel Import</span>
            </button>
            <button
              disabled={selectedStudentIds.length === 0}
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={14} />
              <span>Transfer ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>

        {/* Local Search Toolbar */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, EID, or Mobile..."
              value={studentSearchText}
              onChange={(e) => setStudentSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-slate-800 dark:text-white"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Total active students in batch: <span className="font-bold text-indigo-600 dark:text-indigo-400">{batchStudents.length}</span>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={filteredStudentsInBatch.length > 0 && selectedStudentIds.length === filteredStudentsInBatch.length}
                      onChange={handleSelectAllToggle}
                    />
                  </th>
                  <th className="px-6 py-4">EID / SlaeID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {loadingStudents ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                      Loading batch allocations...
                    </td>
                  </tr>
                ) : filteredStudentsInBatch.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                      No students actively assigned to this batch.
                    </td>
                  </tr>
                ) : (
                  filteredStudentsInBatch.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={selectedStudentIds.includes(student._id)}
                          onChange={() => handleSelectStudentToggle(student._id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {student.slaeId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">
                        {student.mobile || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student._id, student.name)}
                          title="Remove from Batch"
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                        >
                          <UserMinus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- ASSIGN STUDENT SEARCH MODAL --- */}
        <AnimatePresence>
          {showAssignModal && (
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
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Add Student to Batch</h3>
                      <p className="text-xs text-slate-500">Search student registry by Name, EID, or Mobile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignSearchQuery('');
                      setAssignSearchResults([]);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type name, EID (e.g. 5810), or mobile number..."
                      value={assignSearchQuery}
                      onChange={(e) => setAssignSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-slate-800 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {searchingAllStudents ? (
                      <div className="text-center text-slate-400 text-xs py-4">Searching student database...</div>
                    ) : assignSearchQuery.trim() && assignSearchResults.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs py-4 italic">No matching students found.</div>
                    ) : (
                      assignSearchResults.map(student => (
                        <div key={student._id} className="pt-2 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors">
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 dark:text-white">{student.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">EID: {student.slaeId || 'N/A'} • {student.mobile || 'N/A'}</div>
                          </div>
                          <button
                            onClick={() => handleAssignStudent(student)}
                            disabled={assigningStudent}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/60 text-[#4648d4] text-[10px] font-extrabold transition cursor-pointer"
                          >
                            Assign
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- TRANSFER MODAL --- */}
        <AnimatePresence>
          {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                      <Share2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Transfer Students</h3>
                      <p className="text-xs text-slate-500">Move selected students to a different batch</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleTransferStudents} className="mt-4 space-y-4">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex gap-2">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      You are transferring <span className="font-bold">{selectedStudentIds.length}</span> students. Their old enrollment will be marked as Completed, and new active enrollments will be created in the destination batch.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Destination Batch *
                    </label>
                    <select
                      required
                      value={destBatchId}
                      onChange={(e) => setDestBatchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">Select destination batch...</option>
                      {otherDomainBatches.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.batchId})
                        </option>
                      ))}
                    </select>
                    {otherDomainBatches.length === 0 && (
                      <p className="text-[10px] text-rose-500 font-medium mt-1.5">
                        No other active batches found in your course domain. Please create a destination batch first.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTransferModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={transferring || otherDomainBatches.length === 0}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                    >
                      {transferring ? 'Transferring...' : 'Execute Transfer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- BULK EXCEL IMPORT MODAL --- */}
        <AnimatePresence>
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400">
                      <Upload size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Bulk Excel Import</h3>
                      <p className="text-xs text-slate-500">Assign students to batch via EID list</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportStats(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleBulkImport} className="mt-4 space-y-4">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer relative transition">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {importFile ? importFile.name : 'Click or Drag Excel File Here'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports column header: EID</p>
                  </div>

                  {importStats && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white">Import Summary:</h5>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <div className="font-extrabold">{importStats.successCount}</div>
                          <div className="text-[9px] uppercase font-bold mt-0.5">Success</div>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
                          <div className="font-extrabold">{importStats.skippedCount}</div>
                          <div className="text-[9px] uppercase font-bold mt-0.5">Skipped</div>
                        </div>
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
                          <div className="font-extrabold">{importStats.failedCount}</div>
                          <div className="text-[9px] uppercase font-bold mt-0.5">Failed</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportStats(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                    >
                      {importing ? 'Processing...' : 'Upload & Process'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- STANDARD BATCH DIRECTORY VIEW ---
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            My Batches
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Manage your batches, enroll students directly, perform transfers, and import cohort rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              batchId: '',
              name: '',
              course: getDefaultCourse(),
              trainerName: user?.name || '',
              startTime: '09:00',
              endTime: '11:00',
              days: 'Mon - Fri',
              status: 'Active'
            });
            setShowAddModal(true);
          }}
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
              placeholder="Search by Batch ID, Name, Course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-slate-800 dark:text-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredBatches.length}</span> active batch(es)
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Batch ID</th>
                <th className="px-6 py-4">Batch Name & Course</th>
                <th className="px-6 py-4">Trainer</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4 text-center">Student Count</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Loading batches...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                    No batches found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch, idx) => {
                  const displayId = batch.batchId || `BATCH-${(idx + 1).toString().padStart(3, '0')}`;
                  const displayTime = batch.schedule || '09:00 AM - 11:00 AM (Mon - Fri)';
                  const displayStatus = batch.status || 'Active';
                  const domainBadge = batch.course || 'Technical Training';
                  const studentCount = batch.students?.length || 0;

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
                        <div className="flex flex-col gap-1 font-bold text-slate-700 dark:text-slate-300">
                          {batch.trainers && batch.trainers.length > 0 ? (
                            batch.trainers.map((t, idx) => (
                              <div key={t._id || idx} className="flex items-center gap-1.5">
                                <UserCheck size={14} className="text-indigo-500" />
                                <span>{t.name} <span className="text-[10px] text-gray-400 font-normal">({t.role})</span></span>
                              </div>
                            ))
                          ) : batch.trainerName ? (
                            <div className="flex items-center gap-1.5">
                              <UserCheck size={14} className="text-indigo-500" />
                              <span>{batch.trainerName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-450 font-normal italic">
                              No trainers assigned
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{displayTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {studentCount}
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
                            onClick={() => handleViewStudents(batch)}
                            title="Manage Students"
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                          >
                            <Users size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            title="Edit Batch"
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
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
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Create Batch</h3>
                    <p className="text-xs text-slate-500">Configure new cohort under your domain department</p>
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
                      Batch ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SLATC-01"
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Technical Batch A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Course / Domain *
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {user?.role === 'Communication Trainer' && <option value="Communication Skills">Communication Skills</option>}
                      {user?.role === 'Aptitude Trainer' && <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>}
                      {user?.role === 'Technical Trainer' && <option value="Technical Training">Technical Training</option>}
                      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <>
                          <option value="Technical Training">Technical Training</option>
                          <option value="Communication Skills">Communication Skills</option>
                          <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Trainer Name"
                      value={formData.trainerName}
                      onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-sans"
                    />
                  </div>
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
                    {submitting ? 'Creating...' : 'Create Batch'}
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
                    <FolderGit size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Edit Batch Settings</h3>
                    <p className="text-xs text-slate-500">Update cohort metadata and status</p>
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
                      Batch ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.batchId}
                      onChange={(e) => setEditFormData({ ...editFormData, batchId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Course / Domain *
                    </label>
                    <select
                      value={editFormData.course}
                      onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Technical Training">Technical Training</option>
                      <option value="Communication Skills">Communication Skills</option>
                      <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Trainer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Trainer Name"
                      value={editFormData.trainerName}
                      onChange={(e) => setEditFormData({ ...editFormData, trainerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-sans"
                    />
                  </div>
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
