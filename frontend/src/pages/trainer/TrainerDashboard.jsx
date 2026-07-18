import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Calendar, 
  Award, 
  Edit3, 
  X, 
  BookOpen, 
  CheckCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bell,
  CalendarCheck,
  FileSpreadsheet,
  AlertCircle,
  FileDown,
  BookOpenCheck,
  Plus,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCommunicationTrainer = ['Communication Trainer', 'Aptitude Trainer', 'Technical Trainer', 'Admin', 'Super Admin'].includes(user?.role);

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Add Batch & Add Student Modal States
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({ name: '', course: '', schedule: 'Mon-Fri (09:00 AM - 12:00 PM)' });
  const [creatingBatch, setCreatingBatch] = useState(false);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', mobile: '', batchId: '', technicalTrainer: '' });
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Mock Evaluation Modal States & Handlers (70% Attendance Eligibility Rule)
  const [showMockModal, setShowMockModal] = useState(false);
  const [selectedMockStudent, setSelectedMockStudent] = useState(null);
  const [mockForm, setMockForm] = useState({ status: 'Excellent', remarks: '', marks: 10 });
  const [savingMock, setSavingMock] = useState(false);

  const openMockModal = (student) => {
    const attPct = student.attendancePct !== undefined ? student.attendancePct : 85;
    if (attPct < 70) {
      toast.error(`Not eligible for mock evaluation! Student has ${attPct}% attendance (Minimum 70% required).`);
      return;
    }
    const existingScore = student.scores?.find(sc => sc.moduleName === 'Mock Evaluation') || {};
    setSelectedMockStudent(student);
    setMockForm({
      status: existingScore.mockStatus || existingScore.status || 'Excellent',
      remarks: existingScore.remarks || '',
      marks: existingScore.marks !== undefined ? existingScore.marks : 10
    });
    setShowMockModal(true);
  };

  const handleSaveMockEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedMockStudent) return;
    setSavingMock(true);
    try {
      await API.post('/trainer/score', {
        studentId: selectedMockStudent._id,
        moduleName: 'Mock Evaluation',
        status: mockForm.status,
        mockStatus: mockForm.status,
        marks: mockForm.marks,
        remarks: mockForm.remarks
      });
      toast.success('Mock evaluation updated successfully!');
      setShowMockModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update mock evaluation');
    } finally {
      setSavingMock(false);
    }
  };

  const renderMockEvaluationModal = () => {
    if (!showMockModal || !selectedMockStudent) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Update Spoken Mock Details</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedMockStudent.name} ({selectedMockStudent.slaeId || `SLA-${selectedMockStudent._id.slice(-5).toUpperCase()}`})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMockModal(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Eligibility & Attendance Badge */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="text-emerald-600 dark:text-emerald-400 h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Attendance Requirement Met</p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Student has {(selectedMockStudent.attendancePct !== undefined ? selectedMockStudent.attendancePct : 85)}% attendance (≥ 70% required)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Mock Performance Status *
              </label>
              <select
                value={mockForm.status}
                onChange={(e) => setMockForm({ ...mockForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
                <option value="Not Attended">Not Attended</option>
                <option value="Not Qualified">Not Qualified</option>
                <option value="Not Required">Not Required</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Spoken Mock Score (0 - 10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={mockForm.marks}
                onChange={(e) => setMockForm({ ...mockForm, marks: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Trainer Remarks & Spoken Feedback
              </label>
              <textarea
                rows={3}
                placeholder="Enter detailed spoken feedback (fluency, grammar, confidence, vocabulary)..."
                value={mockForm.remarks}
                onChange={(e) => setMockForm({ ...mockForm, remarks: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowMockModal(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingMock}
              onClick={handleSaveMockEvaluation}
              className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-500/25 cursor-pointer disabled:opacity-50"
            >
              {savingMock ? 'Saving...' : 'Save Mock Details'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const courseType = newBatchForm.course.trim() || (user?.role === 'Communication Trainer' ? 'Communication Skills' : user?.role === 'Aptitude Trainer' ? 'Aptitude & Reasoning' : 'Technical Training');
    if (!newBatchForm.name.trim()) {
      toast.error('Please enter a batch name');
      return;
    }
    setCreatingBatch(true);
    try {
      const res = await API.post('/trainer/batches', {
        name: newBatchForm.name.trim(),
        course: courseType,
        schedule: newBatchForm.schedule
      });
      toast.success('Batch created successfully!');
      setBatches(prev => [...prev, res.data]);
      setSelectedBatchId(res.data._id);
      setShowAddBatchModal(false);
      setNewBatchForm({ name: '', course: '', schedule: 'Mon-Fri (09:00 AM - 12:00 PM)' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim() || !newStudentForm.batchId) {
      toast.error('Student Name, Email, and Batch selection are required');
      return;
    }
    setCreatingStudent(true);
    try {
      await API.post('/trainer/students', newStudentForm);
      toast.success('Student added and enrolled successfully!');
      setShowAddStudentModal(false);
      setNewStudentForm({ name: '', email: '', mobile: '', batchId: '', technicalTrainer: '' });
      // Refresh students
      const res = await API.get('/trainer/students');
      setStudents(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setCreatingStudent(false);
    }
  };

  // Statistics and charts data (for Communication Trainer)
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Determine active view based on path (for Communication Trainer)
  const isDashboard = location.pathname === '/trainer' || location.pathname === '/trainer/';
  const isAttendance = location.pathname === '/trainer/attendance';
  const isGrading = location.pathname === '/trainer/scores';

  // Fallback mode state (for other trainers)
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname === '/trainer/scores') return 'grading';
    return 'attendance';
  });

  useEffect(() => {
    if (location.pathname === '/trainer/scores') {
      setActiveTab('grading');
    } else if (location.pathname === '/trainer/attendance' || location.pathname === '/trainer') {
      setActiveTab('attendance');
    }
  }, [location.pathname]);

  // Attendance Checklist states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [attendanceRemarks, setAttendanceRemarks] = useState({}); // { studentId: string }
  const [checkInTimes, setCheckInTimes] = useState({}); // { studentId: string }
  const [checkOutTimes, setCheckOutTimes] = useState({}); // { studentId: string }
  const [todayRecords, setTodayRecords] = useState([]);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('All');
  const [gradingStatusFilter, setGradingStatusFilter] = useState('All');

  // Grading states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedModule, setSelectedModule] = useState('Communication Foundations');
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingForm, setGradingForm] = useState({
    status: 'Not Started',
    marks: 0,
    remarks: '',
  });

  // Search, Filter, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [detailStudent, setDetailStudent] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Modules list based on trainer type
  const getModulesList = () => {
    if (user?.role === 'Aptitude Trainer') {
      return [
        'Vedic Math / Simplification', 'Ratio and Proportion', 'Percentage', 'Ages / Average',
        'Time and Work', 'Time Speed Distance', 'Trains and Boats', 'Directions',
        'Coding & Decoding', 'Syllogism', 'Blood Relations', 'Seating Arrangement',
        'Profit and Loss', 'Simple Interest', 'Compound Interest', 'Probability'
      ];
    }
    if (user?.role === 'Communication Trainer' || user?.role === 'Admin') {
      return [
        'Communication Foundations', 'English Fundamentals', 'Soft Skills Development',
        'Public Speaking', 'Business Communication', 'Interview Preparation',
        'Pronunciation & Accent Enhancement', 'Technical Presentation', 'Corporate Behaviour',
        'Digital Etiquette', 'Global Communication'
      ];
    }
    if (user?.role === 'Technical Trainer') {
      return [
        'HTML', 'CSS', 'JavaScript', 'Bootstrap', 'React', 'Node.js', 'Express.js',
        'MongoDB', 'Git', 'REST API', 'Mini Project', 'Major Project', 'Mock Interview', 'Technical Interview'
      ];
    }
    return [];
  };

  // Load students and batches
  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/trainer/students');
      const { data: batchData } = await API.get('/trainer/batches');

      let relevantBatches = batchData || [];
      let relevantStudents = data || [];

      setAllBatches(batchData || []);

      // Collect all unique batches the loaded relevantStudents belong to
      const studentBatchNamesAndIds = new Set();
      relevantStudents.forEach(s => {
        if (s.communicationBatch) {
          s.communicationBatch.split(',').forEach(part => studentBatchNamesAndIds.add(part.trim().toLowerCase()));
        }
        if (s.technicalBatch) {
          s.technicalBatch.split(',').forEach(part => studentBatchNamesAndIds.add(part.trim().toLowerCase()));
        }
        if (s.aptitudeBatch) {
          s.aptitudeBatch.split(',').forEach(part => studentBatchNamesAndIds.add(part.trim().toLowerCase()));
        }
        if (s.batch) {
          s.batch.split(',').forEach(part => studentBatchNamesAndIds.add(part.trim().toLowerCase()));
        }
        if (Array.isArray(s.batches)) {
          s.batches.forEach(b => {
            if (b?._id) studentBatchNamesAndIds.add(String(b._id));
            if (b?.name) studentBatchNamesAndIds.add(b.name.trim().toLowerCase());
            if (typeof b === 'string') studentBatchNamesAndIds.add(b.trim().toLowerCase());
          });
        }
      });

      relevantBatches = relevantBatches.filter(b => {
        // Direct assignment check
        const isAssigned = b.trainers?.some(t => {
          const tId = typeof t === 'object' ? t?._id : t;
          return String(tId) === String(user?._id);
        }) || b.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());

        // Student presence check
        const hasStudents = studentBatchNamesAndIds.has(String(b._id)) || 
                            studentBatchNamesAndIds.has(b.name?.trim()?.toLowerCase());

        return isAssigned || hasStudents;
      });

      setStudents(relevantStudents);
      setBatches(relevantBatches);
      
      if (!selectedBatchId) {
        setSelectedBatchId('all');
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Load analytics statistics (only for Communication Trainer)
  const loadStats = async (batchId) => {
    if (!isCommunicationTrainer) return;
    setStatsLoading(true);
    try {
      const url = batchId ? `/trainer/dashboard-stats?batchId=${batchId}` : '/trainer/dashboard-stats';
      const { data } = await API.get(url);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatchId && isCommunicationTrainer) {
      loadStats(selectedBatchId);
    }
  }, [selectedBatchId, location.pathname, isCommunicationTrainer]);

  const selectedBatchObj = batches.find(b => String(b._id) === String(selectedBatchId) || String(b.name) === String(selectedBatchId));

  const batchStudents = (!selectedBatchId || selectedBatchId === 'all')
    ? students
    : students.filter(s => {
        const selId = String(selectedBatchId);
        const selName = selectedBatchObj?.name?.trim()?.toLowerCase();

        const inBatchesArray = s.batches?.some(b => 
          String(b?._id || b) === selId ||
          (selName && String(b?.name || b).trim().toLowerCase() === selName)
        );

        const matchesDomainBatch = Boolean(selName && (
          String(s.communicationBatch || '').toLowerCase().split(',').map(item => item.trim()).includes(selName) ||
          String(s.technicalBatch || '').toLowerCase().split(',').map(item => item.trim()).includes(selName) ||
          String(s.aptitudeBatch || '').toLowerCase().split(',').map(item => item.trim()).includes(selName) ||
          String(s.batch || '').toLowerCase().split(',').map(item => item.trim()).includes(selName)
        ));

        return inBatchesArray || matchesDomainBatch;
      });

  // Fetch existing attendance logs and initialize state
  useEffect(() => {
    const fetchAndInitializeAttendance = async () => {
      try {
        const { data: existingRecords } = await API.get(`/trainer/attendance?date=${attendanceDate}`);
        setTodayRecords(existingRecords);
        
        const nextState = {};
        const nextRemarks = {};
        const nextTimes = {};
        const nextOutTimes = {};

        existingRecords.forEach(record => {
          const sId = record.student?._id || record.student;
          const bId = record.batch?._id || record.batch;
          if (sId && bId) {
            const key = `${sId}_${bId}`;
            nextState[key] = record.status;
            nextRemarks[key] = record.remarks || '';
            nextTimes[key] = record.timeIn || '09:00 AM';
            nextOutTimes[key] = record.timeOut || '05:00 PM';
          }
        });

        setAttendanceState(nextState);
        setAttendanceRemarks(nextRemarks);
        setCheckInTimes(nextTimes);
        setCheckOutTimes(nextOutTimes);
      } catch (error) {
        console.error('Failed to load today\'s attendance logs', error);
      }
    };

    fetchAndInitializeAttendance();
  }, [attendanceDate, students]);

  const handleAttendanceChange = async (studentId, batchId, status) => {
    if (!batchId) {
      toast.error('Student is not assigned to a batch for this subject');
      return;
    }

    const key = `${studentId}_${batchId}`;

    // 1. Instantly update UI state for responsive click feel
    setAttendanceState(prev => ({ ...prev, [key]: status }));

    // 2. Make API call in background
    try {
      await API.post('/trainer/attendance', {
        batchId: batchId,
        date: attendanceDate,
        records: [{
          studentId,
          status,
          remarks: attendanceRemarks[key] || '',
          timeIn: checkInTimes[key] || '09:00 AM'
        }]
      });
      toast.success(`Marked ${status} successfully`);
      
      // Refresh todayRecords to update UI check-in timestamps
      const { data: existingRecords } = await API.get(`/trainer/attendance?date=${attendanceDate}`);
      setTodayRecords(existingRecords);
      
      if (isCommunicationTrainer) {
        loadStats(selectedBatchId);
      }
    } catch (error) {
      toast.error('Failed to save attendance automatically');
    }
  };

  const getBatchIdByName = (batchName) => {
    if (!batchName) return null;
    const b = allBatches.find(x => x.name.toLowerCase() === batchName.toLowerCase());
    return b ? b._id : null;
  };

  const getColumnsConfig = (role) => {
    const techCol = {
      key: 'technical',
      header: 'Technical Training',
      isInteractive: role === 'Technical Trainer' || role === 'Super Admin' || role === 'Admin'
    };
    const commCol = {
      key: 'communication',
      header: 'Communication Skills',
      isInteractive: role === 'Communication Trainer' || role === 'Super Admin' || role === 'Admin'
    };
    const aptiCol = {
      key: 'aptitude',
      header: 'Aptitude & Reasoning',
      isInteractive: role === 'Aptitude Trainer' || role === 'Super Admin' || role === 'Admin'
    };

    if (role === 'Communication Trainer') {
      return [commCol, techCol, aptiCol];
    } else if (role === 'Aptitude Trainer') {
      return [aptiCol, techCol, commCol];
    } else {
      return [techCol, commCol, aptiCol];
    }
  };

  const renderSubjectCell = (student, batchName, batchId, trainerName, isInteractive, isGuestValue = false) => {
    const record = isGuestValue
      ? student.guestRecord
      : todayRecords?.find(r => 
          String(r?.student?._id || r?.student) === String(student?._id) &&
          String(r?.batch?._id || r?.batch) === String(batchId)
        );

    const currentStatus = record ? record.status : (attendanceState[`${student._id}_${batchId}`] || 'Absent');

    return (
      <div className="space-y-2">
        {/* Trainer and Batch Info */}
        <div>
          <div className="font-extrabold text-slate-800 dark:text-slate-200">
            {isGuestValue ? (
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">Guest Scan</span>
            ) : (
              trainerName || <span className="text-slate-400 dark:text-slate-500 italic font-normal">Unassigned</span>
            )}
          </div>
          <div className="text-[10px] text-indigo-650 dark:text-violet-400 font-bold mt-0.5">
            {batchName || 'No Batch'}
          </div>
        </div>

        {/* Attendance Status (Interactive or Static) */}
        {batchId ? (
          isInteractive ? (
            <div className="flex items-center gap-1">
              {['Present', 'Absent', 'Late'].map(st => {
                const isSelected = currentStatus === st;
                const baseStyle = st === 'Present'
                  ? isSelected ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/70'
                  : st === 'Absent'
                  ? isSelected ? 'bg-rose-600 text-white shadow-sm font-black' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100/70'
                  : isSelected ? 'bg-amber-500 text-white shadow-sm font-black' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70';

                return (
                  <button
                    key={st}
                    onClick={() => handleAttendanceChange(student._id, batchId, st)}
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-all cursor-pointer ${baseStyle}`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="w-fit">
              {record ? (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  currentStatus === 'Present'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                    : currentStatus === 'Late'
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/15'
                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/15'
                }`}>
                  {currentStatus}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Not Checked In</span>
              )}
            </div>
          )
        ) : (
          <div className="text-[9px] text-slate-400 italic">No Batch Configured</div>
        )}

        {/* Scan Details */}
        {record && (
          <div className="text-[9px] text-slate-450 dark:text-slate-400 flex flex-wrap items-center gap-1 font-mono">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span>
              {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            {record.scannedBatch && (
              <span className="ml-1 text-[8px] font-black text-violet-800 bg-violet-50/50 dark:bg-violet-950/20 px-1 py-0.5 rounded border border-violet-500/10 uppercase tracking-wide">
                Scanned: {record.scannedBatch.name || record.scannedBatch}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Submit attendance from Checklist view
  const submitAttendance = async () => {
    const targetStudents = batchStudents.length > 0 ? batchStudents : students;
    const records = targetStudents.map(student => ({
      studentId: student._id,
      status: attendanceState[student._id] || 'Present',
      remarks: attendanceRemarks[student._id] || '',
      timeIn: checkInTimes[student._id] || '09:00 AM'
    }));

    if (records.length === 0) {
      toast.error('No students found to save attendance');
      return;
    }

    try {
      const { data } = await API.post('/trainer/attendance', {
        batchId: selectedBatchId,
        date: attendanceDate,
        records
      });
      toast.success(data?.message || 'Attendance submitted successfully!');
      if (isCommunicationTrainer) {
        loadStats(selectedBatchId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit attendance');
    }
  };

  const openGradingPanel = (student, moduleName) => {
    setSelectedStudent(student);
    setSelectedModule(moduleName);
    
    const existingScore = student.scores?.find(s => s.moduleName === moduleName) || {};
    setGradingForm({
      status: existingScore.status || 'Not Started',
      marks: existingScore.marks || 0,
      remarks: existingScore.remarks || '',
    });
    setGradingModalOpen(true);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    try {
      await API.post('/trainer/score', {
        studentId: selectedStudent._id,
        moduleName: selectedModule,
        status: gradingForm.status,
        marks: gradingForm.marks,
        remarks: gradingForm.remarks
      });
      toast.success('Score updated successfully!');
      setGradingModalOpen(false);
      loadData(); // reload student details
    } catch (error) {
      toast.error('Failed to save score');
    }
  };

  // Excel Exporter for daily attendance logs
  const exportAttendanceToExcel = () => {
    if (filteredAttendanceStudents.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    const dataToExport = filteredAttendanceStudents.map(student => {
      const isGuest = student.isGuest;
      const record = isGuest 
        ? student.guestRecord 
        : todayRecords?.find(r => String(r?.student?._id || r?.student) === String(student?._id));
      const currentStatus = isGuest
        ? student.guestRecord.status
        : (attendanceState[student._id] || 'Absent');

      let commBatch = isGuest ? (student.guestRecord.batch?.name || 'Unassigned') : (student.communicationBatch || 'Unassigned');
      let techBatch = student.technicalBatch || 'Unassigned';
      let aptiBatch = student.aptitudeBatch || 'Unassigned';

      return {
        'SLAEID': student.slaeId || `SLA-${student._id.slice(-5).toUpperCase()}`,
        'Student Name': student.name,
        'Student Email': student.email,
        'Technical Trainer': student.technicalTrainer || 'Unassigned',
        'Technical Batch': techBatch,
        'Communication Trainer': isGuest ? 'Guest Scan' : (student.communicationTrainer || 'Unassigned'),
        'Communication Batch': commBatch,
        'Aptitude Trainer': student.aptitudeTrainer || 'Unassigned',
        'Aptitude Batch': aptiBatch,
        'Status': currentStatus,
        'Time': record ? new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        'Date': record ? new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A',
        'Scanned Batch': record?.scannedBatch?.name || (record?.scannedBatch ? 'Yes' : 'N/A'),
        'Type': isGuest ? 'Guest (Cross-Attend)' : 'Regular'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Attendance');
    
    // Auto-fit column widths
    worksheet['!cols'] = Object.keys(dataToExport[0]).map(() => ({ wch: 22 }));

    XLSX.writeFile(workbook, `Attendance_Report_${attendanceDate}.xlsx`);
    toast.success("Attendance Excel report downloaded successfully!");
  };

  // CSV Exporter helper
  const downloadCSV = (data, filename, headers) => {
    const rows = data.map(r => Object.values(r));
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully!");
  };

  // PDF Exporter helper
  const downloadPDF = (title, headers, rows, filename) => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 14, 20);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 26);

    let y = 35;
    const colWidths = [30, 45, 30, 25, 20, 40];
    
    // Draw header row
    doc.setFillColor(79, 70, 229);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    
    let currentX = 16;
    headers.forEach((h, i) => {
      doc.text(h, currentX, y + 6);
      currentX += colWidths[i] || 25;
    });

    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');

    rows.forEach((row, rowIndex) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, 182, 8, 'F');
      }
      
      currentX = 16;
      row.forEach((cell, cellIndex) => {
        doc.text(String(cell), currentX, y + 6);
        currentX += colWidths[cellIndex] || 25;
      });
      y += 8;
    });

    doc.save(filename);
    toast.success("PDF report downloaded successfully!");
  };

  // Convert marks to letter grades
  const getLetterGrade = (marks) => {
    if (marks >= 9) return { letter: 'A+', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900' };
    if (marks === 8) return { letter: 'A', color: 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900' };
    if (marks === 7) return { letter: 'B+', color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900' };
    if (marks === 6) return { letter: 'B', color: 'bg-violet-50 border-violet-200 text-violet-900 dark:bg-violet-950/20 dark:border-violet-950' };
    if (marks === 5) return { letter: 'C', color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900' };
    return { letter: 'Fail', color: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900' };
  };

  // Badge styles for Mock Evaluation Performance
  const getMockBadgeStyle = (status) => {
    switch (status) {
      case 'Excellent':
        return 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Good':
        return 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'Average':
        return 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
      case 'Poor':
        return 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
      case 'Not Attended':
        return 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'Not Qualified':
        return 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'Not Required':
        return 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  // Calculate grading card stats (for Communication Trainer view)
  const totalStudentsCount = students.length;
  const totalGradedScores = students.reduce((acc, s) => acc + (s.scores?.length || 0), 0);
  const avgGradeScore = totalGradedScores > 0 
    ? (students.reduce((acc, s) => acc + (s.scores?.reduce((sum, sc) => sum + sc.marks, 0) || 0), 0) / totalGradedScores).toFixed(1)
    : '0.0';
  const completedModulesCount = students.reduce((acc, s) => acc + (s.scores?.filter(sc => sc.status === 'Completed').length || 0), 0);

  // Filters for Communication Trainer views (including cross-attendance guest scans)
  const getFilteredAttendanceStudents = () => {
    const list = batchStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          `STU-${s._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = attendanceStatusFilter === 'All' || (attendanceState[s._id] || 'Absent') === attendanceStatusFilter;
      return matchSearch && matchStatus;
    });

    if (selectedBatchId && selectedBatchId !== 'all') {
      todayRecords?.forEach(record => {
        const scannedId = record.scannedBatch?._id || record.scannedBatch;
        if (scannedId && String(scannedId) === String(selectedBatchId)) {
          const isEnrolledInCurrent = batchStudents.some(s => String(s._id) === String(record.student?._id || record.student));
          if (!isEnrolledInCurrent && record.student) {
            const studentObj = typeof record.student === 'object' ? record.student : { _id: record.student, name: 'Unknown Student' };
            const matchesSearch = studentObj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 `STU-${studentObj._id?.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = attendanceStatusFilter === 'All' || record.status === attendanceStatusFilter;
            
            if (matchesSearch && matchesStatus) {
              list.push({
                ...studentObj,
                isGuest: true,
                guestRecord: record
              });
            }
          }
        }
      });
    }

    return list;
  };

  const filteredAttendanceStudents = getFilteredAttendanceStudents();
  const attendanceTotalPages = Math.ceil(filteredAttendanceStudents.length / itemsPerPage);
  const attendanceIndexOfLastItem = currentPage * itemsPerPage;
  const attendanceIndexOfFirstItem = attendanceIndexOfLastItem - itemsPerPage;
  const paginatedAttendanceStudents = filteredAttendanceStudents.slice(attendanceIndexOfFirstItem, attendanceIndexOfLastItem);

  const filteredGradingStudents = batchStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        `STU-${s._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });
  const gradingTotalPages = Math.ceil(filteredGradingStudents.length / itemsPerPage);
  const gradingIndexOfLastItem = currentPage * itemsPerPage;
  const gradingIndexOfFirstItem = gradingIndexOfLastItem - itemsPerPage;
  const paginatedGradingStudents = filteredGradingStudents.slice(gradingIndexOfFirstItem, gradingIndexOfLastItem);

  // Single Clean Table View for Mock Evaluation (/trainer/scores)
  const renderMockScoresSection = () => {
    const totalStudents = batchStudents.length;
    const eligibleStudents = batchStudents.filter(s => (s.attendancePct !== undefined ? s.attendancePct : 85) >= 70).length;
    const evaluatedStudents = batchStudents.filter(s => {
      const score = s.scores?.find(sc => sc.moduleName === 'Mock Evaluation') || s.scores?.[0];
      return score && (score.mockStatus || score.status) && (score.mockStatus !== 'Not Evaluated' && score.status !== 'Not Evaluated');
    }).length;

    return (
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#12131a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Batch Students</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalStudents}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Students enrolled across selection</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-[#4F46E5] rounded-xl">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#12131a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Eligible (≥ 70% Attendance)</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{eligibleStudents}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Qualified for spoken mock evaluation</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#12131a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Evaluated Mocks</span>
              <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{evaluatedStudents}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Mock evaluation statuses updated</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Award size={22} />
            </div>
          </div>
        </div>

        {/* Single Unified Table Card */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Top Filter & Search Bar */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white font-sans">Spoken Mock Performance Evaluation</h2>
              <p className="text-xs text-gray-500 mt-0.5">Single table view for spoken mock grading. Requires at least 70% attendance to update.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student or SLAEID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-gray-700 dark:text-gray-200 font-medium"
                />
              </div>
              <div className="flex items-center space-x-1.5 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 text-xs">
                <Filter size={13} className="text-gray-400" />
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="bg-transparent focus:outline-none text-xs font-bold cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">SLAEID</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Technical Trainer</th>
                  <th className="px-5 py-3.5">Batch Status</th>
                  <th className="px-5 py-3.5">Attendance %</th>
                  <th className="px-5 py-3.5">Mock Status</th>
                  <th className="px-5 py-3.5">Remarks</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                {filteredGradingStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400 italic">
                      No students found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredGradingStudents.map(student => {
                    const displaySlaeId = student.slaeId || `SLA-${student._id.slice(-5).toUpperCase()}`;
                    const attPct = student.attendancePct !== undefined ? student.attendancePct : 85;
                    const isEligible = attPct >= 70;
                    const mockScore = student.scores?.find(sc => sc.moduleName === 'Mock Evaluation') || {};
                    const currentMockStatus = mockScore.mockStatus || mockScore.status || 'Not Evaluated';

                    return (
                      <tr key={student._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/40 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                          {displaySlaeId}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-gray-900 dark:text-white text-sm">{student.name}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{student.email}</div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                          {batches.find(b => b._id === selectedBatchId)?.name || student.batches?.[0]?.name || 'Communication'}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-600 dark:text-gray-300">
                          {student.technicalTrainer || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            student.status === 'Active' || student.status === 'Enrolled'
                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : student.status === 'Completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {student.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-gray-800 dark:text-gray-200">{attPct}%</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isEligible
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              {isEligible ? 'Eligible' : '< 70%'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${getMockBadgeStyle(currentMockStatus)}`}>
                            {currentMockStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {mockScore.remarks || '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openMockModal(student)}
                            title={isEligible ? "Update Spoken Mock Evaluation" : `Not eligible (${attPct}% attendance < 70%)`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                              isEligible
                                ? 'bg-[#4F46E5] hover:bg-violet-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                          >
                            <Edit3 size={13} />
                            <span>Update Mock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Fallback views calculations (for other trainers)
  const originalPresentCount = batchStudents.filter(s => attendanceState[s._id] === 'Present').length;
  const originalLateCount = batchStudents.filter(s => attendanceState[s._id] === 'Late').length;
  const originalAbsentCount = batchStudents.filter(s => attendanceState[s._id] === 'Absent').length;
  const originalTotalCount = batchStudents.length;
  const originalTodayPercentage = originalTotalCount > 0
    ? Math.round(((originalPresentCount + originalLateCount) / originalTotalCount) * 100)
    : 100;

  // -------------------------------------------------------------
  // LOADING SKELETONS & EMPTY STATES
  // -------------------------------------------------------------
  const renderSkeleton = () => {
    if (isDashboard) {
      return (
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="h-20 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800" />
          
          {/* 3 KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800" />
            ))}
          </div>

          {/* Attendance Overview Skeleton */}
          <div className="p-6 bg-white dark:bg-[#12131a] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/40 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="h-64 bg-gray-100 dark:bg-gray-800/40 rounded-xl" />
              <div className="h-64 bg-gray-100 dark:bg-gray-800/40 rounded-xl" />
            </div>
          </div>
        </div>
      );
    }
    
    if (isAttendance) {
      return (
        <div className="space-y-6">
          {/* Header Bar Skeleton */}
          <div className="h-16 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse" />
          
          {/* Single Table Skeleton */}
          <div className="p-6 bg-white dark:bg-[#12131a] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm animate-pulse">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-10 bg-gray-100 dark:bg-gray-800/40 rounded-xl" />
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 dark:bg-gray-900/30 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (isGrading) {
      return (
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="h-20 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800" />
          
          {/* 4 Summary Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
          
          {/* Table Skeleton */}
          <div className="p-6 bg-white dark:bg-[#12131a] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800/30 rounded-xl" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-gray-800/30 rounded-xl" />
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Render loading skeleton for Communication Trainer Dashboard
  if (isCommunicationTrainer && (loading || (isDashboard && statsLoading))) {
    return (
      <div className="space-y-6 font-sans p-6">
        {renderSkeleton()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING LOGIC FOR COMMUNICATION TRAINER
  // -------------------------------------------------------------
  if (isCommunicationTrainer) {
    // -------------------------------------------------------------
    // CALCULATING LIVE BATCH STATS FOR CARDS
    // -------------------------------------------------------------
    const totalStudentsInBatch = batchStudents.length;
    const totalBatchesCount = batches.length;
    
    // Calculate live attendance average for batch checklist
    const presentCount = batchStudents.filter(s => attendanceState[s._id] === 'Present').length;
    const lateCount = batchStudents.filter(s => attendanceState[s._id] === 'Late').length;
    const batchAttendancePct = totalStudentsInBatch > 0
      ? Math.round(((presentCount + lateCount) / totalStudentsInBatch) * 100)
      : 100;

    // Calculate completed grades for batch grading scorecard
    const activeModuleScores = batchStudents.map(s => s.scores?.find(sc => sc.moduleName === selectedModule) || {});
    const completedGradedCount = activeModuleScores.filter(sc => sc.status === 'Completed').length;
    
    // Average score calculation
    const completedScoresWithMarks = activeModuleScores.filter(sc => sc.status === 'Completed' && sc.marks !== undefined);
    const avgScoreGrading = completedScoresWithMarks.length > 0
      ? (completedScoresWithMarks.reduce((sum, sc) => sum + sc.marks, 0) / completedScoresWithMarks.length).toFixed(1)
      : '0.0';

    // Pending grades count (where assignment is not Completed yet)
    const pendingGradesCount = totalStudentsInBatch - completedGradedCount;

    // -------------------------------------------------------------
    // FILTERED & PAGINATED STUDENTS FOR TABLES
    // -------------------------------------------------------------
    // Tab 1 & Checklist: Attendance filtering
    const filteredAttendanceStudents = batchStudents.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = `stu-${student._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
      const searchMatch = searchQuery === '' || nameMatch || idMatch;

      const currentStatus = attendanceState[student._id] || 'Present';
      const statusMatch = attendanceStatusFilter === 'All' || currentStatus.toLowerCase() === attendanceStatusFilter.toLowerCase();

      return searchMatch && statusMatch;
    });

    const attIndexOfLastItem = currentPage * itemsPerPage;
    const attIndexOfFirstItem = attIndexOfLastItem - itemsPerPage;
    const paginatedAttendanceStudents = filteredAttendanceStudents.slice(attIndexOfFirstItem, attIndexOfLastItem);
    const attTotalPages = Math.ceil(filteredAttendanceStudents.length / itemsPerPage);

    // Tab 2 & Ledger: Grading filtering
    const filteredGradingStudents = batchStudents.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = `stu-${student._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
      const searchMatch = searchQuery === '' || nameMatch || idMatch;

      const score = student.scores?.find(sc => sc.moduleName === selectedModule) || {};
      const currentStatus = score.status || 'Not Started';
      const statusMatch = gradingStatusFilter === 'All' || currentStatus.toLowerCase() === gradingStatusFilter.toLowerCase();

      return searchMatch && statusMatch;
    });

    const gradIndexOfLastItem = currentPage * itemsPerPage;
    const gradIndexOfFirstItem = gradIndexOfLastItem - itemsPerPage;
    const paginatedGradingStudents = filteredGradingStudents.slice(gradIndexOfFirstItem, gradIndexOfLastItem);
    const gradTotalPages = Math.ceil(filteredGradingStudents.length / itemsPerPage);

    return (
      <div className="space-y-6 font-sans pb-10">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#12131a] p-6 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {isDashboard ? `${user?.role || 'Trainer'} Hub` : isAttendance ? 'Mark Attendance' : 'Grade Scorecard'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isDashboard 
                ? 'Institutional Overview: Monitor student directories, batches list, and daily attendance records.' 
                : isAttendance 
                ? 'Record and update daily roll call sheets. Filter by active batches directory.' 
                : 'Evaluate student scorecards, record comments, and export performance indices.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isDashboard && (
              <>
                <select
                  value={selectedBatchId || 'all'}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-gray-700 dark:text-gray-300 transition-all cursor-pointer shadow-sm"
                >
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </>
            )}

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
              <Calendar size={14} className="text-[#4F46E5]" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* 1. DASHBOARD PAGE VIEW */}
        {isDashboard && (
          <div className="space-y-6">
            {/* 3 KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Total Students */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-6 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Students</span>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalStudentsInBatch}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Active enrollments in batch</p>
                </div>
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-[#4F46E5] rounded-xl">
                  <Users size={20} />
                </div>
              </motion.div>

              {/* Card 2: Total Batches */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-6 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Batches</span>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalBatchesCount}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Assigned training batches</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-xl">
                  <BookOpen size={20} />
                </div>
              </motion.div>

              {/* Card 3: Overall Attendance */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-6 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Overall Attendance</span>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{batchAttendancePct}%</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Average student check-in rate</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                  <CheckCircle size={20} />
                </div>
              </motion.div>
            </div>

            {/* Spacious welcome guide panel */}
            <div className="bg-white dark:bg-[#12131a] p-8 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm text-center space-y-4">
              <BookOpen className="h-10 w-10 text-[#4F46E5] mx-auto animate-pulse" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white font-sans font-extrabold">Welcome to {user?.role || 'Trainer'} Hub</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Use the sidebar or links to record daily attendance, search cohorts database, grade scores across multiple modules, or generate QR scanners.
              </p>
            </div>
          </div>
        )}

        {/* 2. SINGLE ADVANCED STUDENT ATTENDANCE PORTAL */}
        {isAttendance && (
          <div className="space-y-6">
            {/* Single Advanced Table Card */}
            <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Table Toolbar */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name, ID..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-56 text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Batch Dropdown */}
                  <select
                    value={selectedBatchId || 'all'}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="all">All Batches</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>

                  {/* Date Selector */}
                  <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-violet-800 dark:text-violet-400">
                    <Calendar size={13} />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    {['All', 'Present', 'Absent', 'Late'].map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          setAttendanceStatusFilter(st);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          attendanceStatusFilter === st
                            ? 'bg-white dark:bg-slate-700 text-violet-800 dark:text-violet-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={exportAttendanceToExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 cursor-pointer transition select-none self-end lg:self-auto shrink-0"
                >
                  <FileSpreadsheet size={14} />
                  <span>Export Excel</span>
                </button>
              </div>

              {/* Advanced Single Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-4">SLAEID</th>
                      <th className="px-5 py-4">Student Details</th>
                      {getColumnsConfig(user?.role).map(c => (
                        <th key={c.key} className="px-5 py-4">{c.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {paginatedAttendanceStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                          No students found matching your search or batch selection.
                        </td>
                      </tr>
                    ) : (
                      paginatedAttendanceStudents.map(student => {
                        const isGuest = student.isGuest;
                        const displaySlaeId = student.slaeId || `SLA-${student._id.slice(-5).toUpperCase()}`;
                        const cols = getColumnsConfig(user?.role);
                        
                        return (
                          <tr key={student._id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${isGuest ? 'bg-amber-500/5 dark:bg-amber-500/[0.02]' : ''}`}>
                            <td className="px-5 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {displaySlaeId}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="font-extrabold text-slate-800 dark:text-white text-sm">{student.name}</div>
                                {isGuest && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Cross-Attend
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{student.email}</div>
                            </td>
                            {cols.map(c => {
                              if (c.key === 'technical') {
                                return (
                                  <td key={c.key} className="px-5 py-4">
                                    {renderSubjectCell(
                                      student, 
                                      student.technicalBatch, 
                                      getBatchIdByName(student.technicalBatch), 
                                      student.technicalTrainer, 
                                      c.isInteractive
                                    )}
                                  </td>
                                );
                              } else if (c.key === 'communication') {
                                return (
                                  <td key={c.key} className="px-5 py-4">
                                    {renderSubjectCell(
                                      student, 
                                      isGuest ? (student.guestRecord.batch?.name || 'Unassigned') : student.communicationBatch, 
                                      isGuest ? student.guestRecord.batch?._id : getBatchIdByName(student.communicationBatch), 
                                      student.communicationTrainer, 
                                      c.isInteractive,
                                      isGuest
                                    )}
                                  </td>
                                );
                              } else {
                                return (
                                  <td key={c.key} className="px-5 py-4">
                                    {renderSubjectCell(
                                      student, 
                                      student.aptitudeBatch, 
                                      getBatchIdByName(student.aptitudeBatch), 
                                      student.aptitudeTrainer, 
                                      c.isInteractive
                                    )}
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              {filteredAttendanceStudents.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/30">
                  <div className="text-xs text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-700 dark:text-slate-300">{attIndexOfFirstItem + 1}</span> to{' '}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {Math.min(attIndexOfLastItem, filteredAttendanceStudents.length)}
                    </span>{' '}
                    of <span className="font-bold text-slate-700 dark:text-slate-300">{filteredAttendanceStudents.length}</span> students
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-slate-600 dark:text-slate-300"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <span className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-800 dark:text-violet-400 text-xs font-extrabold">
                      Page {currentPage} of {attTotalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, attTotalPages))}
                      disabled={currentPage === attTotalPages || attTotalPages === 0}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 text-slate-600 dark:text-slate-300"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. GRADE SCORECARD PAGE VIEW (/trainer/scores) */}
        {isGrading && renderMockScoresSection()}

        {/* DETAILS POPUP / MODAL */}
        <AnimatePresence>
          {detailsModalOpen && detailStudent && (
            <>
              <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40" onClick={() => setDetailsModalOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white font-sans">Student Academic Dossier</h3>
                    <p className="text-[10px] text-gray-500 font-sans">Full contact and score log records</p>
                  </div>
                  <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5 bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Full Name</span>
                      <span className="font-extrabold text-gray-800 dark:text-white">{detailStudent.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Student ID</span>
                      <span className="font-bold text-gray-600 dark:text-gray-400">STU-{detailStudent._id.slice(-5).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Mobile Number</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{detailStudent.mobile || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Active Batches</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 truncate block" title={detailStudent.batches?.map(b => b.name).join(', ')}>
                        {detailStudent.batches?.map(b => b.name).join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 font-sans">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Module Score Records</h4>
                    <div className="max-h-[160px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800">
                      {getModulesList().map((mod, idx) => {
                        const score = detailStudent.scores?.find(sc => sc.moduleName === mod) || {};
                        const grade = getLetterGrade(score.marks || 0);
                        return (
                          <div key={idx} className="flex justify-between items-center p-2.5 hover:bg-gray-50/30">
                            <span className="font-semibold text-gray-600 dark:text-gray-400 max-w-[180px] truncate">{mod}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${grade.color}`}>
                                {score.marks !== undefined ? grade.letter : 'N/A'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">
                                {score.marks !== undefined ? `${score.marks}/10` : '—/10'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setDetailsModalOpen(false)}
                    className="px-4 py-2 bg-gray-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* GRADING MODAL PANEL */}
        <AnimatePresence>
          {gradingModalOpen && selectedStudent && (
            <>
              <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40" onClick={() => setGradingModalOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="fixed inset-0 m-auto max-w-sm h-fit bg-white dark:bg-[#12131a] rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white font-sans">Grade Student Assessment</h3>
                    <p className="text-[10px] text-gray-500 font-sans">Student: {selectedStudent.name} ({selectedModule})</p>
                  </div>
                  <button onClick={() => setGradingModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={submitGrade} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Module Status</label>
                    <select
                      value={gradingForm.status}
                      onChange={(e) => setGradingForm({ ...gradingForm, status: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Score (0-10)</label>
                      <span className="text-xs font-black text-[#4F46E5]">{gradingForm.marks}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={gradingForm.marks}
                      onChange={(e) => setGradingForm({ ...gradingForm, marks: Number(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 px-0.5 mt-1 font-semibold">
                      <span>0 (Poor)</span>
                      <span>5</span>
                      <span>10 (Excellent)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Trainer Observations</label>
                    <textarea
                      value={gradingForm.remarks}
                      onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-xs focus:outline-none h-16 text-gray-700 dark:text-gray-300"
                      placeholder="Enter notes on performance..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 mt-2 bg-[#4F46E5] hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Save Evaluation
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {renderMockEvaluationModal()}
      </div>
    );
  }

  const isFallbackDashboard = location.pathname === '/trainer' || location.pathname === '/trainer/';
  const isFallbackAttendance = location.pathname === '/trainer/attendance';
  const isFallbackScores = location.pathname === '/trainer/scores';

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-905 dark:text-white font-sans">
            {isFallbackDashboard ? `${user?.role || 'Trainer'} Dashboard` : isFallbackAttendance ? 'Mark Attendance' : 'Grade Scorecard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-sans">
            {isFallbackDashboard 
              ? 'Institutional Overview: Monitor student counts, assigned batches, and attendance logs.' 
              : isFallbackAttendance 
              ? 'Record and update daily roll call sheets.' 
              : 'Evaluate student progress indices, update grading scorecards, and check attendance logs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isFallbackDashboard && (
            <>
              <button
                onClick={() => setShowAddBatchModal(true)}
                className="px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/70 dark:bg-violet-950/40 text-violet-900 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Add Batch</span>
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserPlus size={14} />
                <span>Add Student</span>
              </button>

              <select
                value={selectedBatchId || 'all'}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="px-3.5 py-2.5 border border-[#c7c4d7] rounded-xl bg-white text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4648d4] text-gray-700 dark:text-gray-300 dark:bg-[#12131a] dark:border-gray-800 shadow-sm cursor-pointer"
              >
                <option value="all">All Batches</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name} ({b.course})</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* 1. DASHBOARD VIEW: Show Stats Cards & welcome panel */}
      {isFallbackDashboard && (
        <div className="space-y-6">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {/* Card 1: Total Students */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-500/20 dark:border-violet-950/30 p-6 rounded-[20px] shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 h-32"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4648d4]">Total Students</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{originalTotalCount}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Active enrollments</p>
              </div>
              <div className="p-3.5 bg-violet-500/25 dark:bg-violet-950/40 text-[#4648d4] rounded-2xl">
                <Users size={24} />
              </div>
            </motion.div>

            {/* Card 2: Total Batches */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-500/20 dark:border-purple-900/30 p-6 rounded-[20px] shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 h-32"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Batches</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{batches.length}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Assigned batches</p>
              </div>
              <div className="p-3.5 bg-purple-500/25 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                <BookOpen size={24} />
              </div>
            </motion.div>

            {/* Card 3: Today's Attendance */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-500/20 dark:border-emerald-900/30 p-6 rounded-[20px] shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 h-32"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Today's Attendance</span>
                <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                  <p>Present: <span className="text-emerald-600">{originalPresentCount}</span></p>
                  <p>Absent: <span className="text-rose-600">{originalAbsentCount}</span> • Late: <span className="text-amber-500">{originalLateCount}</span></p>
                </div>
              </div>
              <div className="relative h-14 w-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-emerald-100 dark:text-emerald-950/30" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="22" 
                    stroke="#10B981" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                    strokeDasharray="138.2"
                    strokeDashoffset={138.2 - (138.2 * originalTodayPercentage) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">{originalTodayPercentage}%</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Spacious panel */}
          <div className="bg-white dark:bg-[#12131a] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm text-center space-y-4">
            <Sparkles className="h-10 w-10 text-[#4648d4] mx-auto animate-pulse" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white font-sans">Welcome back, {user?.name || 'Trainer'}!</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Use the sidebar to mark daily class attendance checklists or evaluate grade scorecards. Your dashboard cards represent the live state across all active cohorts.
            </p>
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE VIEW: Show only checklist */}
      {isFallbackAttendance && (
        <div className="space-y-6">
          {loading ? (
            <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-800 border-t-transparent"></div>
            </div>
          ) : batchStudents.length === 0 ? (
            <div className="text-center py-10 bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
              No students currently enrolled in this batch.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={18} className="text-[#4648d4]" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Class Roll Call Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 border dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="bg-white/60 dark:bg-[#12131a]/60 border border-[#c7c4d7] dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/30">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4">Batches</th>
                      <th className="px-6 py-4 text-center">Status Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                    {batchStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.mobile || '—'}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {student.batches?.map(b => b.name).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center space-x-2">
                            {['Present', 'Absent', 'Late'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student._id, status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                  attendanceState[student._id] === status
                                    ? status === 'Present'
                                      ? 'bg-emerald-55/15 border-emerald-300 text-emerald-600 dark:bg-emerald-950/25 dark:border-emerald-900'
                                      : status === 'Late'
                                      ? 'bg-orange-55/15 border-orange-300 text-orange-600 dark:bg-orange-950/25 dark:border-orange-900'
                                      : 'bg-rose-55/15 border-rose-300 text-rose-600 dark:bg-rose-950/25 dark:border-rose-900'
                                    : 'border-gray-200 text-gray-400 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* GRADING MODAL PANEL */}
      <AnimatePresence>
        {gradingModalOpen && selectedStudent && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setGradingModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Grade: {selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500 max-w-[280px] truncate">Module: {selectedModule}</p>
                </div>
                <button onClick={() => setGradingModalOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitGrade} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Module Progress Status</label>
                  <select
                    value={gradingForm.status}
                    onChange={(e) => setGradingForm({ ...gradingForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-800 text-sm focus:outline-none cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Assigned Marks (0-10)</label>
                    <span className="text-sm font-extrabold text-[#4648d4]">{gradingForm.marks}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={gradingForm.marks}
                    onChange={(e) => setGradingForm({ ...gradingForm, marks: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#4648d4]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-0.5 font-bold">
                    <span>0 (Poor)</span>
                    <span>5</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Trainer Remarks</label>
                  <textarea
                    value={gradingForm.remarks}
                    onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-sm focus:outline-none h-20 text-gray-700 dark:text-gray-300"
                    placeholder="Enter grading observations..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-[#4648d4] hover:bg-[#393bb3] text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/10 cursor-pointer transition-colors"
                >
                  Save Evaluation
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD BATCH MODAL */}
      <AnimatePresence>
        {showAddBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Create New Batch</h3>
                    <p className="text-xs text-slate-500">Add a new training batch for your domain</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddBatchModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Batch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Communication Batch 2, Aptitude Batch A"
                    value={newBatchForm.name}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Course / Module *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Communication Skills, Aptitude & Reasoning"
                    value={newBatchForm.course}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon-Fri (09:00 AM - 12:00 PM)"
                    value={newBatchForm.schedule}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, schedule: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBatchModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBatch}
                    className="px-5 py-2 rounded-xl bg-violet-800 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {creatingBatch ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD STUDENT MODAL */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Add & Enroll Student</h3>
                    <p className="text-xs text-slate-500">Enroll a student directly into your batch</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={newStudentForm.mobile}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Assign to Batch *</label>
                  <select
                    required
                    value={newStudentForm.batchId}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, batchId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Select a Batch...</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.course})</option>
                    ))}
                  </select>
                </div>


                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStudent}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {creatingStudent ? 'Adding...' : 'Add & Enroll'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE SPOKEN MOCK EVALUATION MODAL */}
      {renderMockEvaluationModal()}
    </div>
  );
};

export default TrainerDashboard;
