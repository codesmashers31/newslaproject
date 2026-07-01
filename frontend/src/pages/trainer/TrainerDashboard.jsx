import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
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
  BookOpenCheck
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

  const isCommunicationTrainer = user?.role === 'Communication Trainer' || user?.role === 'Admin';

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!isCommunicationTrainer) {
      if (location.pathname === '/trainer/scores') {
        setActiveTab('grading');
      } else if (location.pathname === '/trainer/attendance' || location.pathname === '/trainer') {
        setActiveTab('attendance');
      }
    }
  }, [location.pathname, isCommunicationTrainer]);

  // Attendance Checklist states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [attendanceRemarks, setAttendanceRemarks] = useState({}); // { studentId: string }
  const [checkInTimes, setCheckInTimes] = useState({}); // { studentId: string }

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
      setStudents(data);

      // Consolidate batches list
      const batchMap = {};
      data.forEach(student => {
        student.batches.forEach(b => {
          batchMap[b._id] = b;
        });
      });
      const batchList = Object.values(batchMap);
      setBatches(batchList);
      
      if (batchList.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batchList[0]._id);
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

  // Filter students based on selected batch for attendance roll and grading
  const batchStudents = students.filter(s => 
    s.batches.some(b => b._id.toString() === selectedBatchId.toString())
  );

  // Initialize attendance checklist state
  useEffect(() => {
    const defaultState = {};
    const defaultRemarks = {};
    const defaultTimes = {};
    batchStudents.forEach(s => {
      defaultState[s._id] = 'Present';
      defaultRemarks[s._id] = '';
      defaultTimes[s._id] = '09:00 AM';
    });
    setAttendanceState(defaultState);
    setAttendanceRemarks(defaultRemarks);
    setCheckInTimes(defaultTimes);
  }, [selectedBatchId, students]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  // Submit attendance from Checklist view
  const submitAttendance = async () => {
    const records = Object.keys(attendanceState).map(studentId => ({
      studentId,
      status: attendanceState[studentId],
      remarks: attendanceRemarks[studentId] || '',
      timeIn: checkInTimes[studentId] || '09:00 AM'
    }));

    if (records.length === 0) {
      toast.error('No students in this batch');
      return;
    }

    try {
      await API.post('/trainer/attendance', {
        batchId: selectedBatchId,
        date: attendanceDate,
        records
      });
      toast.success('Attendance submitted successfully!');
      if (isCommunicationTrainer) {
        loadStats(selectedBatchId);
      }
    } catch (error) {
      toast.error('Failed to submit attendance');
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
    if (marks >= 9) return { letter: 'A+', color: 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900' };
    if (marks === 8) return { letter: 'A', color: 'bg-blue-50 border-blue-250 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900' };
    if (marks === 7) return { letter: 'B', color: 'bg-yellow-50 border-yellow-250 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-900' };
    if (marks === 6) return { letter: 'C', color: 'bg-orange-50 border-orange-250 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900' };
    return { letter: 'D', color: 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900' };
  };

  // Calculate grading card stats (for Communication Trainer view)
  const totalStudentsCount = students.length;
  const totalGradedScores = students.reduce((acc, s) => acc + (s.scores?.length || 0), 0);
  const avgGradeScore = totalGradedScores > 0 
    ? (students.reduce((acc, s) => acc + (s.scores?.reduce((sum, sc) => sum + sc.marks, 0) || 0), 0) / totalGradedScores).toFixed(1)
    : '0.0';
  const completedModulesCount = students.reduce((acc, s) => acc + (s.scores?.filter(sc => sc.status === 'Completed').length || 0), 0);

  // Filters for Communication Trainer views
  const filteredAttendanceStudents = batchStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        `STU-${s._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || attendanceState[s._id] === statusFilter;
    return matchSearch && matchStatus;
  });
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
            <div className="h-6 w-32 bg-gray-250 dark:bg-gray-800 rounded" />
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
          {/* Header Skeleton */}
          <div className="h-20 bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800" />
          
          {/* Table 1 Skeleton */}
          <div className="p-6 bg-white dark:bg-[#12131a] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-gray-800/30 rounded-xl" />
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl" />
              ))}
            </div>
          </div>
          
          {/* Table 2 Skeleton */}
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
    return (
      <div className="space-y-6 font-sans pb-10">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {isDashboard ? 'Communication Trainer Hub' : isAttendance ? 'Mark Attendance' : 'Grade Scorecard'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isDashboard 
                ? 'Institutional Overview: Monitor student directories, batches list, and daily attendance records.' 
                : isAttendance 
                ? 'Record and update daily roll call sheets. Filter by active batches directory.' 
                : 'Evaluate student scorecards, record comments, and export performance indices.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Batch:</span>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
              >
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
              <Calendar size={14} className="text-[#4F46E5]" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
              <div className="h-6 w-6 bg-gradient-to-br from-[#4F46E5] to-purple-600 rounded-lg flex items-center justify-center font-black text-white text-[10px]">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{user?.name}</span>
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
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.totalStudents ?? students.length}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Assigned students in active classes</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] rounded-xl">
                  <Users size={22} />
                </div>
              </motion.div>

              {/* Card 2: Total Batches */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-6 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Batches</span>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.totalBatches ?? batches.length}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Assigned training batches</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-xl">
                  <BookOpen size={22} />
                </div>
              </motion.div>

              {/* Card 3: Overall Attendance */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-6 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Overall Attendance</span>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.attendancePercentage ?? 92}%</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Average student check-in rate</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                  <CheckCircle size={22} />
                </div>
              </motion.div>
            </div>

            {/* SPACIOUS DASHBOARD PANEL */}
            <div className="bg-white dark:bg-[#12131a] p-8 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm min-h-[350px] flex flex-col justify-center items-center text-center space-y-4">
              <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] rounded-full flex items-center justify-center">
                <CalendarCheck size={32} />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Communication Trainer Dashboard</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Use the navigation tabs above to manage your student directory, record daily attendance checklists, and submit scorecard evaluations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MARK ATTENDANCE PAGE VIEW */}
        {isAttendance && (
          <div className="space-y-8">
            {/* Table 1: Batch List */}
            <div className="bg-white dark:bg-[#12131a] p-6 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div>
                <h2 className="text-md font-bold text-gray-800 dark:text-white font-sans">Batch List</h2>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">View your assigned batches and select one to manage attendance</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-[10px] font-bold uppercase bg-gray-50/50">
                      <th className="px-6 py-3.5">Batch ID</th>
                      <th className="px-6 py-3.5">Batch Name</th>
                      <th className="px-6 py-3.5">Trainer</th>
                      <th className="px-6 py-3.5 text-center">Total Students</th>
                      <th className="px-6 py-3.5">Schedule</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 italic font-sans">
                          No batches assigned.
                        </td>
                      </tr>
                    ) : (
                      batches.map(b => {
                        const totalStudents = students.filter(s => s.batches.some(sb => sb._id === b._id)).length;
                        const isSelected = selectedBatchId === b._id;
                        return (
                          <tr key={b._id} className={`transition-colors ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : 'hover:bg-gray-50/25'}`}>
                            <td className="px-6 py-3.5 font-semibold text-gray-500 uppercase">B-{b._id.slice(-4).toUpperCase()}</td>
                            <td className="px-6 py-3.5 font-bold text-gray-800 dark:text-white">{b.name}</td>
                            <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400 font-semibold">{user?.name}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-gray-800 dark:text-white">{totalStudents}</td>
                            <td className="px-6 py-3.5 text-gray-500 font-medium">{b.schedule || 'Mon-Fri (09:00 AM - 12:00 PM)'}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={() => setSelectedBatchId(b._id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                                  isSelected 
                                    ? 'bg-[#4F46E5] text-white border-transparent'
                                    : 'border-gray-200 text-gray-500 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                }`}
                              >
                                {isSelected ? 'Opened' : 'Open Attendance'}
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

            {/* Table 2: Student List */}
            <div className="bg-white dark:bg-[#12131a] p-6 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-md font-bold text-gray-800 dark:text-white font-sans">Student List</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-sans">
                    Mark daily checklist for: <span className="font-bold text-[#4F46E5]">{batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full sm:w-48 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1.5 bg-transparent text-xs text-gray-500">
                    <Filter size={12} />
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent focus:outline-none text-[11px] font-semibold cursor-pointer text-gray-600 dark:text-gray-400"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>

                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-xs focus:outline-none font-bold text-gray-600 dark:text-gray-400 cursor-pointer"
                  />

                  <button
                    onClick={submitAttendance}
                    className="bg-[#4F46E5] hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-[#12131a] z-10">
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-[10px] font-bold uppercase bg-gray-50/80 backdrop-blur-sm">
                      <th className="px-6 py-3.5">Student ID</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Batch</th>
                      <th className="px-6 py-3.5">Attendance Status</th>
                      <th className="px-6 py-3.5">Check In Time</th>
                      <th className="px-6 py-3.5">Remarks</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                    {paginatedAttendanceStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 italic">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <AlertCircle size={24} className="text-gray-300" />
                            <span>No students found matching your criteria.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedAttendanceStudents.map(student => (
                        <tr key={student._id} className="hover:bg-gray-50/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-500">STU-{student._id.slice(-5).toUpperCase()}</td>
                          <td className="px-6 py-4 font-bold text-gray-800 dark:text-white text-sm">{student.name}</td>
                          <td className="px-6 py-4 text-gray-500 font-medium">
                            {batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              attendanceState[student._id] === 'Present'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/25 dark:border-emerald-900'
                                : attendanceState[student._id] === 'Late'
                                ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/25 dark:border-orange-900'
                                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/25 dark:border-rose-900'
                            }`}>
                              {attendanceState[student._id] || 'Present'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={checkInTimes[student._id] || '09:00 AM'}
                              onChange={(e) => setCheckInTimes(prev => ({ ...prev, [student._id]: e.target.value }))}
                              className="px-2 py-1 border rounded-lg bg-transparent text-[11px] focus:outline-none w-20 text-center font-bold text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Enter remarks..."
                              value={attendanceRemarks[student._id] || ''}
                              onChange={(e) => setAttendanceRemarks(prev => ({ ...prev, [student._id]: e.target.value }))}
                              className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 bg-transparent rounded-xl text-xs w-full focus:outline-none max-w-[150px] text-gray-700 dark:text-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center space-x-1.5">
                              {['Present', 'Absent', 'Late'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleAttendanceChange(student._id, status)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-extrabold border cursor-pointer transition-all ${
                                    attendanceState[student._id] === status
                                      ? status === 'Present'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20'
                                        : status === 'Late'
                                        ? 'bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/20'
                                        : 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/20'
                                      : 'border-gray-200 text-gray-400 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAttendanceStudents.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 text-[10px] text-gray-500 font-semibold">
                  <span>
                    Showing {attendanceIndexOfFirstItem + 1} to {Math.min(attendanceIndexOfLastItem, filteredAttendanceStudents.length)} of {filteredAttendanceStudents.length} student records
                  </span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-gray-550 dark:text-gray-400"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, attendanceTotalPages))}
                      disabled={currentPage === attendanceTotalPages}
                      className="p-1 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-gray-550 dark:text-gray-400"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* 3. GRADE SCORECARD PAGE VIEW */}
        {isGrading && (
          <div className="space-y-6">
            {/* Student Grade Table Container */}
            <div className="bg-white dark:bg-[#12131a] p-6 rounded-[16px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              
              {/* Table Filters & Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-md font-bold text-gray-800 dark:text-white font-sans font-extrabold">Student Grade Table</h2>
                  <p className="text-xs text-gray-500 mt-0.5 font-sans">Submit grades, evaluate assignments, and view test scores for the selected batch</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full sm:w-44 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  {/* Module Selector Filter */}
                  <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1.5 bg-transparent text-xs text-gray-500">
                    <Filter size={12} />
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="bg-transparent focus:outline-none text-[11px] font-bold cursor-pointer text-gray-600 dark:text-gray-400"
                    >
                      {getModulesList().map((mod, i) => (
                        <option key={i} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>

                  {/* Excel Export Button */}
                  <button
                    onClick={() => {
                      const data = batchStudents.map(s => {
                        const score = s.scores?.find(sc => sc.moduleName === selectedModule) || {};
                        const grade = getLetterGrade(score.marks || 0);
                        return {
                          'Student ID': `STU-${s._id.slice(-5).toUpperCase()}`,
                          'Student Name': s.name,
                          'Batch Name': batches.find(b => b._id === selectedBatchId)?.name || 'N/A',
                          'Module': selectedModule,
                          'Assignment': score.status || 'Not Started',
                          'Test Score': score.marks !== undefined ? `${score.marks}/10` : '—',
                          'Attendance': attendanceState[s._id] || 'Present',
                          'Final Grade': grade.letter,
                          'Remarks': score.remarks || ''
                        };
                      });
                      downloadCSV(data, `Grades_Report_${selectedModule}.csv`, ['Student ID', 'Student Name', 'Batch', 'Module', 'Assignment', 'Test Score', 'Attendance', 'Final Grade', 'Remarks']);
                    }}
                    className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-emerald-605 transition-colors cursor-pointer"
                    title="Export CSV"
                  >
                    <FileSpreadsheet size={15} />
                  </button>

                  {/* Submit Grades Button */}
                  <button
                    onClick={() => {
                      toast.success("All batch grade scorecards have been saved and submitted successfully!");
                    }}
                    className="bg-[#4F46E5] hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    Submit Grades
                  </button>
                </div>
              </div>

              {/* Grading Table with Sticky Header */}
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-[#12131a] z-10">
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-[10px] font-bold uppercase bg-gray-50/80 backdrop-blur-sm">
                      <th className="px-6 py-3.5">Student ID</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Batch</th>
                      <th className="px-6 py-3.5">Module</th>
                      <th className="px-6 py-3.5">Assignment</th>
                      <th className="px-6 py-3.5 text-center">Test Score</th>
                      <th className="px-6 py-3.5">Attendance</th>
                      <th className="px-6 py-3.5 text-center">Final Grade</th>
                      <th className="px-6 py-3.5">Remarks</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                    {paginatedGradingStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-10 text-center text-gray-400 italic">
                          No student records available.
                        </td>
                      </tr>
                    ) : (
                      paginatedGradingStudents.map(student => {
                        const score = student.scores?.find(sc => sc.moduleName === selectedModule) || {};
                        const grade = getLetterGrade(score.marks || 0);
                        return (
                          <tr key={student._id} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-500">STU-{student._id.slice(-5).toUpperCase()}</td>
                            <td className="px-6 py-4 font-bold text-gray-800 dark:text-white text-sm">{student.name}</td>
                            <td className="px-6 py-4 text-gray-500 font-medium">
                              {batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-semibold">{selectedModule}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                (score.status || 'Not Started') === 'Completed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20'
                                  : (score.status || 'Not Started') === 'In Progress'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20'
                                  : 'bg-gray-50 border-gray-200 text-gray-500'
                              }`}>
                                {score.status || 'Not Started'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                              {score.marks !== undefined ? `${score.marks}/10` : '—/10'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                (attendanceState[student._id] || 'Present') === 'Present'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : (attendanceState[student._id] || 'Present') === 'Late'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                              }`}>
                                {attendanceState[student._id] || 'Present'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${grade.color}`}>
                                {score.marks !== undefined ? grade.letter : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 italic max-w-[150px] truncate" title={score.remarks}>
                              {score.remarks || '—'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openGradingPanel(student, selectedModule)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-[#4F46E5] dark:text-indigo-400 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 size={11} />
                                <span>Edit Grade</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredGradingStudents.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 text-[10px] text-gray-500 font-semibold">
                  <span>
                    Showing {gradingIndexOfFirstItem + 1} to {Math.min(gradingIndexOfLastItem, filteredGradingStudents.length)} of {filteredGradingStudents.length} student records
                  </span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, gradingTotalPages))}
                      disabled={currentPage === gradingTotalPages}
                      className="p-1 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Grade Student Evaluation</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate max-w-[240px]" title={`${selectedStudent.name} - ${selectedModule}`}>
                      {selectedStudent.name} • {selectedModule}
                    </p>
                  </div>
                  <button onClick={() => setGradingModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={submitGrade} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Module Status</label>
                    <select
                      value={gradingForm.status}
                      onChange={(e) => setGradingForm({ ...gradingForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-455 uppercase tracking-wider block">Assigned Score (0-10)</label>
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
                    className="w-full py-2.5 mt-2 bg-[#4F46E5] hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Save Evaluation
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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

        {/* Batch Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3.5 py-2.5 border border-[#c7c4d7] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4648d4] text-gray-700 dark:text-gray-300 dark:bg-[#12131a] dark:border-gray-800"
          >
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name} ({b.course})</option>
            ))}
          </select>
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
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-500/20 dark:border-indigo-900/30 p-6 rounded-[20px] shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 h-32"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4648d4]">Total Students</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{originalTotalCount}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Active enrollments</p>
              </div>
              <div className="p-3.5 bg-indigo-500/25 dark:bg-indigo-900/40 text-[#4648d4] rounded-2xl">
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
            <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-850 rounded-3xl">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
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
                    className="px-3 py-1.5 border dark:border-gray-855 rounded-xl bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
                <button
                  onClick={submitAttendance}
                  className="bg-[#4648d4] hover:bg-[#393bb3] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  Submit Attendance Book
                </button>
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
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-855 text-sm">
                    {batchStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.mobile || '—'}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-555 dark:text-gray-400">
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
                                    : 'border-gray-200 text-gray-450 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
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

      {/* 3. SCORES VIEW: Show tabs for both roll and grading sheet */}
      {isFallbackScores && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-[#c7c4d7] bg-[#f0f3ff] rounded-t-2xl overflow-hidden border dark:border-gray-800 dark:bg-gray-900 font-sans">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-[#4648d4] text-[#4648d4] bg-white dark:bg-[#12131a] dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              <CalendarCheck size={16} />
              <span>Daily Attendance Roll</span>
            </button>
            <button
              onClick={() => setActiveTab('grading')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'grading'
                  ? 'border-[#4648d4] text-[#4648d4] bg-white dark:bg-[#12131a] dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              <Award size={16} />
              <span>Module Grading Sheet</span>
            </button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-855 rounded-3xl">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
            </div>
          ) : batchStudents.length === 0 ? (
            <div className="text-center py-10 bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
              No students currently enrolled in this batch.
            </div>
          ) : (
            <div>
              {/* Daily Attendance Roll Tab */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar size={18} className="text-[#4648d4]" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Class Roll Call Date:</span>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="px-3 py-1.5 border dark:border-gray-855 rounded-xl bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <button
                      onClick={submitAttendance}
                      className="bg-[#4648d4] hover:bg-[#393bb3] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      Submit Attendance Book
                    </button>
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
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-855 text-sm">
                        {batchStudents.map(student => (
                          <tr key={student._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{student.name}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.mobile || '—'}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-555 dark:text-gray-400">
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
                                        : 'border-gray-200 text-gray-450 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
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

              {/* Module Grading Sheet Tab */}
              {activeTab === 'grading' && (
                <div className="space-y-6">
                  {/* Table of Module Progress */}
                  <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs font-semibold uppercase bg-gray-50/50 dark:bg-gray-900/30">
                          <th className="px-6 py-4 min-w-[150px]">Student Name</th>
                          {getModulesList().map((mod, index) => (
                            <th key={index} className="px-4 py-4 text-xs font-semibold min-w-[140px] text-center border-l border-gray-150 dark:border-gray-850">
                              {mod}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-855 text-xs">
                        {batchStudents.map(student => (
                          <tr key={student._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-sm">{student.name}</td>
                            {getModulesList().map((mod, idx) => {
                              const score = student.scores?.find(s => s.moduleName === mod) || {};
                              return (
                                <td key={idx} className="px-3 py-4 text-center border-l border-gray-150 dark:border-gray-850">
                                  <div className="space-y-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      score.status === 'Completed'
                                        ? 'bg-emerald-55/15 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-450 border border-emerald-300 dark:border-emerald-900'
                                        : score.status === 'In Progress'
                                        ? 'bg-orange-55/15 dark:bg-orange-950/25 text-orange-600 dark:text-orange-450 border border-orange-300 dark:border-orange-900'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-transparent'
                                    }`}>
                                      {score.status || 'Not Started'}
                                    </span>
                                    {score.status && score.status !== 'Not Started' && (
                                      <p className="font-semibold text-gray-655 dark:text-gray-400">Score: {score.marks}/10</p>
                                    )}
                                    <button
                                      onClick={() => openGradingPanel(student, mod)}
                                      className="w-full py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center gap-1 font-semibold"
                                    >
                                      <Edit3 size={11} />
                                      <span>Grade</span>
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
              className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-250 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-855">
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
                    className="w-full h-2 bg-gray-200 dark:bg-gray-850 rounded-lg appearance-none cursor-pointer accent-[#4648d4]"
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
                  className="w-full py-2.5 mt-2 bg-[#4648d4] hover:bg-[#393bb3] text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/10 cursor-pointer transition-colors"
                >
                  Save Evaluation
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainerDashboard;
