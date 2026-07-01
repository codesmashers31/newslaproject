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

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

  // Statistics and charts data
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Determine active view based on path
  const isDashboard = location.pathname === '/trainer' || location.pathname === '/trainer/';
  const isAttendance = location.pathname === '/trainer/attendance';
  const isGrading = location.pathname === '/trainer/scores';

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

  // Load analytics statistics
  const loadStats = async (batchId) => {
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
    if (selectedBatchId) {
      loadStats(selectedBatchId);
    }
  }, [selectedBatchId, location.pathname]);

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
      loadStats(selectedBatchId);
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

  // Calculate grading card stats
  const totalStudentsCount = students.length;
  const totalGradedScores = students.reduce((acc, s) => acc + (s.scores?.length || 0), 0);
  const avgGradeScore = totalGradedScores > 0 
    ? (students.reduce((acc, s) => acc + (s.scores?.reduce((sum, sc) => sum + sc.marks, 0) || 0), 0) / totalGradedScores).toFixed(1)
    : '0.0';
  const completedModulesCount = students.reduce((acc, s) => acc + (s.scores?.filter(sc => sc.status === 'Completed').length || 0), 0);

  // Filter & Paginate Student List for Mark Attendance
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

  // Filter & Paginate Grading List for Grade Scorecard
  const filteredGradingStudents = batchStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        `STU-${s._id.slice(-5)}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });
  const gradingTotalPages = Math.ceil(filteredGradingStudents.length / itemsPerPage);
  const gradingIndexOfLastItem = currentPage * itemsPerPage;
  const gradingIndexOfFirstItem = gradingIndexOfLastItem - itemsPerPage;
  const paginatedGradingStudents = filteredGradingStudents.slice(gradingIndexOfFirstItem, gradingIndexOfLastItem);

  // Renders loading skeletons
  if (statsLoading && isDashboard) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* ----------------- HEADER SECTION ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
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

          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-150 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
            <Calendar size={14} className="text-[#4F46E5]" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 border border-gray-150 dark:border-gray-855 rounded-xl bg-white dark:bg-gray-900">
            <div className="h-6 w-6 bg-gradient-to-br from-[#4F46E5] to-purple-600 rounded-lg flex items-center justify-center font-black text-white text-[10px]">
              {user?.name?.charAt(0)}
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* ----------------- 1. DASHBOARD PAGE VIEW ----------------- */}
      {isDashboard && (
        <div className="space-y-6">
          {/* KPI CARDS (3 Gradient Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* KPI 1: Total Students */}
            <motion.div
              whileHover={{ y: -4, scale: 1.015 }}
              className="bg-gradient-to-br from-indigo-50 to-[#4F46E5]/10 text-gray-800 dark:text-white border border-[#4F46E5]/20 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden"
            >
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">Total Students</span>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.totalStudents ?? students.length}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-450 font-semibold">Students assigned to selected trainer</p>
              </div>
              <div className="p-3.5 bg-[#4F46E5]/20 text-[#4F46E5] rounded-xl z-10">
                <Users size={22} />
              </div>
            </motion.div>

            {/* KPI 2: Total Batches */}
            <motion.div
              whileHover={{ y: -4, scale: 1.015 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-100/30 text-gray-800 dark:text-white border border-purple-500/20 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden"
            >
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Batches</span>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.totalBatches ?? batches.length}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-455 font-semibold">Assigned batches directory</p>
              </div>
              <div className="p-3.5 bg-purple-55/20 text-purple-600 rounded-xl z-10">
                <BookOpen size={22} />
              </div>
            </motion.div>

            {/* KPI 3: Overall Attendance % */}
            <motion.div
              whileHover={{ y: -4, scale: 1.015 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-100/30 text-gray-800 dark:text-white border border-emerald-500/20 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden"
            >
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Overall Attendance Rate</span>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats?.cards?.attendancePercentage ?? 92}%</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-455 font-semibold">Aggregate roll calls performance</p>
              </div>
              <div className="relative h-14 w-14 flex items-center justify-center bg-white dark:bg-[#12131a] border border-emerald-300 rounded-full z-10 shadow-inner">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="18" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="3" fill="transparent" />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="18" 
                    stroke="#10B981" 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray="113.1"
                    strokeDashoffset={113.1 - (113.1 * (stats?.cards?.attendancePercentage ?? 92)) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[9px] font-black text-emerald-600">{stats?.cards?.attendancePercentage ?? 92}%</span>
              </div>
            </motion.div>
          </div>

          {/* ATTENDANCE OVERVIEW SECTION */}
          <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-md font-bold text-gray-800 dark:text-white">Attendance Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Comprehensive analytics of class logs and trends</p>
            </div>

            {/* Attendance Status Summary list */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-850">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Checked Students</span>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{batchStudents.length}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Present Today</span>
                <p className="text-xl font-bold text-emerald-600">{stats?.cards?.presentToday ?? 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Absent Today</span>
                <p className="text-xl font-bold text-rose-600">{stats?.cards?.absentToday ?? 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Late Today</span>
                <p className="text-xl font-bold text-orange-550">{stats?.cards?.lateToday ?? 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Attendance Rate</span>
                <p className="text-xl font-bold text-[#4F46E5]">{stats?.cards?.attendancePercentage ?? 92}%</p>
              </div>
            </div>

            {/* Recharts Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Weekly bar chart */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weekly Attendance Trend</h4>
                <div className="h-64">
                  {stats?.weeklyAttendance?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.weeklyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.015)' }} />
                        <Bar dataKey="Present" fill="#10B981" radius={[3, 3, 0, 0]} barSize={8} />
                        <Bar dataKey="Late" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={8} />
                        <Bar dataKey="Absent" fill="#EF4444" radius={[3, 3, 0, 0]} barSize={8} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">No weekly records logged.</div>
                  )}
                </div>
              </div>

              {/* Monthly line chart */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Attendance Rate</h4>
                <div className="h-64">
                  {stats?.monthlyAttendance?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.monthlyAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Present" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Late" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Absent" stroke="#EF4444" strokeWidth={1.5} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">No monthly records logged.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 2. MARK ATTENDANCE PAGE VIEW ----------------- */}
      {isAttendance && (
        <div className="space-y-8">
          
          {/* Table 1: Batch List */}
          <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-md font-bold text-gray-800 dark:text-white">Assigned Batches List</h2>
              <p className="text-xs text-gray-500 mt-0.5">Select a batch to open and mark its daily student attendance register</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-555 text-[10px] font-bold uppercase bg-gray-50/50">
                    <th className="px-6 py-3.5">Batch ID</th>
                    <th className="px-6 py-3.5">Batch Name</th>
                    <th className="px-6 py-3.5">Course</th>
                    <th className="px-6 py-3.5">Trainer</th>
                    <th className="px-6 py-3.5 text-center">Total Students</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-850 text-xs">
                  {batches.map(b => {
                    const totalStudents = students.filter(s => s.batches.some(sb => sb._id === b._id)).length;
                    const isSelected = selectedBatchId === b._id;
                    return (
                      <tr key={b._id} className={`transition-colors ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : 'hover:bg-gray-50/25'}`}>
                        <td className="px-6 py-3.5 font-semibold text-gray-550 uppercase">B-{b._id.slice(-4).toUpperCase()}</td>
                        <td className="px-6 py-3.5 font-bold text-gray-800 dark:text-white">{b.name}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-500">{b.course || 'Communication'}</td>
                        <td className="px-6 py-3.5 text-gray-650 dark:text-gray-400 font-semibold">{user?.name}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-gray-800 dark:text-gray-200">{totalStudents}</td>
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
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {isSelected ? 'Opened' : 'Open Attendance'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Student List */}
          <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-md font-bold text-gray-800 dark:text-white">Daily Attendance Roll Call</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mark daily checklist for: <span className="font-bold text-[#4F46E5]">{batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}</span>
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
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
                    className="pl-9 pr-4 py-1.5 border border-gray-255 dark:border-gray-805 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full sm:w-48"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-1 border border-gray-255 dark:border-gray-805 rounded-xl px-2.5 py-1.5 bg-transparent text-xs text-gray-500">
                  <Filter size={12} />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent focus:outline-none text-[11px] font-semibold cursor-pointer text-gray-655 dark:text-gray-400"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>

                {/* Datepicker */}
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-xs focus:outline-none font-bold text-gray-600 dark:text-gray-400"
                />

                <button
                  onClick={submitAttendance}
                  className="bg-[#4F46E5] hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Submit Roll Call
                </button>
              </div>
            </div>

            {/* Student table with Sticky Header */}
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-[#12131a] z-10">
                  <tr className="border-b border-gray-150 dark:border-gray-850 text-gray-555 text-[10px] font-bold uppercase bg-gray-50/80 backdrop-blur-sm">
                    <th className="px-6 py-3.5">Student ID</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Batch</th>
                    <th className="px-6 py-3.5">Attendance Status</th>
                    <th className="px-6 py-3.5">Check In Time</th>
                    <th className="px-6 py-3.5">Remarks</th>
                    <th className="px-6 py-3.5 text-right">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-850 text-xs">
                  {paginatedAttendanceStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-gray-400 italic">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendanceStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-555">STU-{student._id.slice(-5).toUpperCase()}</td>
                        <td className="px-6 py-4 font-bold text-gray-850 dark:text-white text-sm">{student.name}</td>
                        <td className="px-6 py-4 text-gray-550 font-medium">
                          {batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            attendanceState[student._id] === 'Present'
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/25 dark:border-emerald-900'
                              : attendanceState[student._id] === 'Late'
                              ? 'bg-orange-50 border-orange-250 text-orange-700 dark:bg-orange-950/25 dark:border-orange-900'
                              : 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/25 dark:border-rose-900'
                          }`}>
                            {attendanceState[student._id] || 'Present'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={checkInTimes[student._id] || '09:00 AM'}
                            onChange={(e) => setCheckInTimes(prev => ({ ...prev, [student._id]: e.target.value }))}
                            className="px-2 py-1 border rounded-lg bg-transparent text-[11px] focus:outline-none w-20 text-center font-bold"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Enter remarks..."
                            value={attendanceRemarks[student._id] || ''}
                            onChange={(e) => setAttendanceRemarks(prev => ({ ...prev, [student._id]: e.target.value }))}
                            className="px-2.5 py-1.5 border border-gray-250 dark:border-gray-800 bg-transparent rounded-xl text-xs w-full focus:outline-none max-w-[150px]"
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
                                    : 'border-gray-200 text-gray-400 dark:border-gray-800 hover:bg-gray-50'
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

            {/* Pagination Controls */}
            {filteredAttendanceStudents.length > itemsPerPage && (
              <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-850 pt-4 text-[10px] text-gray-500 font-semibold">
                <span>
                  Showing {attendanceIndexOfFirstItem + 1} to {Math.min(attendanceIndexOfLastItem, filteredAttendanceStudents.length)} of {filteredAttendanceStudents.length} student records
                </span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-gray-250 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, attendanceTotalPages))}
                    disabled={currentPage === attendanceTotalPages}
                    className="p-1 border border-gray-250 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- 3. GRADE SCORECARD PAGE VIEW ----------------- */}
      {isGrading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Students</span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalStudentsCount}</h3>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] rounded-xl">
                <Users size={20} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Grade</span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {getLetterGrade(Math.round(parseFloat(avgGradeScore))).letter} <span className="text-xs font-normal text-gray-500">({avgGradeScore}/10)</span>
                </h3>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-xl">
                <Award size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Attendance</span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats?.cards?.attendancePercentage ?? 92}%</h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed Modules</span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{completedModulesCount}</h3>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-[#453015]/30 text-orange-600 rounded-xl">
                <BookOpenCheck size={20} />
              </div>
            </div>
          </div>

          {/* DAILY ATTENDANCE & GRADE TABLE */}
          <div className="bg-white dark:bg-[#12131a] p-6 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
            
            {/* Table Filters & Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-md font-bold text-gray-800 dark:text-white">Daily Attendance & Grade</h2>
                <p className="text-xs text-gray-500 mt-0.5">Evaluate modules progress, update attendance, and grade students</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-gray-255 dark:border-gray-855 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] w-full sm:w-44"
                  />
                </div>

                {/* Module Selector Filter */}
                <div className="flex items-center space-x-1 border border-gray-255 dark:border-gray-805 rounded-xl px-2.5 py-1.5 bg-transparent text-xs text-gray-550">
                  <Filter size={12} />
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="bg-transparent focus:outline-none text-[11px] font-bold cursor-pointer text-gray-655 dark:text-gray-400"
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
                        'Daily Attendance': attendanceState[s._id] || 'Present',
                        'Module': selectedModule,
                        'Grade': grade.letter,
                        'Marks': score.marks || 0,
                        'Remarks': score.remarks || ''
                      };
                    });
                    downloadCSV(data, `Grades_Report_${selectedModule}.csv`, ['Student ID', 'Student Name', 'Batch', 'Daily Attendance', 'Module', 'Grade', 'Marks', 'Remarks']);
                  }}
                  className="p-2 border border-gray-255 dark:border-gray-805 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-emerald-600 transition-colors cursor-pointer"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={15} />
                </button>

                {/* PDF Export Button */}
                <button
                  onClick={() => {
                    const headers = ['Student ID', 'Student Name', 'Batch', 'Attendance', 'Grade', 'Remarks'];
                    const rows = batchStudents.map(s => {
                      const score = s.scores?.find(sc => sc.moduleName === selectedModule) || {};
                      const grade = getLetterGrade(score.marks || 0);
                      return [
                        `STU-${s._id.slice(-5).toUpperCase()}`,
                        s.name,
                        batches.find(b => b._id === selectedBatchId)?.name || 'N/A',
                        attendanceState[s._id] || 'Present',
                        `${grade.letter} (${score.marks || 0}/10)`,
                        score.remarks || ''
                      ];
                    });
                    downloadPDF(`Grades Report - ${selectedModule}`, headers, rows, `Grades_Report_${selectedModule}.pdf`);
                  }}
                  className="p-2 border border-gray-255 dark:border-gray-805 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-rose-600 transition-colors cursor-pointer"
                  title="Export to PDF"
                >
                  <FileDown size={15} />
                </button>

              </div>
            </div>

            {/* Grading Table with Sticky Header */}
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-[#12131a] z-10">
                  <tr className="border-b border-gray-150 dark:border-gray-855 text-gray-555 text-[10px] font-bold uppercase bg-gray-50/80 backdrop-blur-sm">
                    <th className="px-6 py-3.5">Student ID</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Batch</th>
                    <th className="px-6 py-3.5">Daily Attendance</th>
                    <th className="px-6 py-3.5">Module</th>
                    <th className="px-6 py-3.5 text-center">Grade</th>
                    <th className="px-6 py-3.5">Trainer Remarks</th>
                    <th className="px-6 py-3.5">Last Updated</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-850 text-xs">
                  {paginatedGradingStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-gray-400 italic">
                        No students found matching search.
                      </td>
                    </tr>
                  ) : (
                    paginatedGradingStudents.map(student => {
                      const score = student.scores?.find(sc => sc.moduleName === selectedModule) || {};
                      const grade = getLetterGrade(score.marks || 0);
                      const updatedDate = score.updatedAt 
                        ? new Date(score.updatedAt).toLocaleDateString()
                        : '—';
                      return (
                        <tr key={student._id} className="hover:bg-gray-50/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-555">STU-{student._id.slice(-5).toUpperCase()}</td>
                          <td className="px-6 py-4 font-bold text-gray-855 dark:text-white text-sm">{student.name}</td>
                          <td className="px-6 py-4 text-gray-500 font-medium">
                            {batches.find(b => b._id === selectedBatchId)?.name || 'N/A'}
                          </td>
                          {/* Interactive Attendance Dropdown to Update Attendance directly! */}
                          <td className="px-6 py-4">
                            <select
                              value={attendanceState[student._id] || 'Present'}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                handleAttendanceChange(student._id, newStatus);
                                try {
                                  await API.post('/trainer/attendance', {
                                    batchId: selectedBatchId,
                                    date: attendanceDate,
                                    records: [{
                                      studentId: student._id,
                                      status: newStatus,
                                      remarks: attendanceRemarks[student._id] || '',
                                      timeIn: checkInTimes[student._id] || '09:00 AM'
                                    }]
                                  });
                                  toast.success(`Attendance updated to ${newStatus}`);
                                  loadStats(selectedBatchId);
                                } catch (error) {
                                  toast.error('Failed to update attendance');
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border bg-white dark:bg-gray-900 cursor-pointer ${
                                (attendanceState[student._id] || 'Present') === 'Present'
                                  ? 'border-emerald-300 text-emerald-700'
                                  : (attendanceState[student._id] || 'Present') === 'Late'
                                  ? 'border-orange-300 text-orange-700'
                                  : 'border-rose-300 text-rose-700'
                              }`}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">{selectedModule}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${grade.color}`}>
                              {score.marks !== undefined ? grade.letter : 'N/A'}
                            </span>
                            {score.marks !== undefined ? (
                              <p className="text-[9px] text-gray-400 mt-0.5 font-bold">Marks: {score.marks}/10</p>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-gray-500 italic max-w-[150px] truncate" title={score.remarks}>
                            {score.remarks || '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-500">{updatedDate}</td>
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
              <div className="flex items-center justify-between border-t border-gray-150 dark:border-gray-855 pt-4 text-[10px] text-gray-500 font-semibold">
                <span>
                  Showing {gradingIndexOfFirstItem + 1} to {Math.min(gradingIndexOfLastItem, filteredGradingStudents.length)} of {filteredGradingStudents.length} student records
                </span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-gray-250 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, gradingTotalPages))}
                    disabled={currentPage === gradingTotalPages}
                    className="p-1 border border-gray-250 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* ----------------- GRADING MODAL PANEL ----------------- */}
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
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-855">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Grade Student Evaluation</h3>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate max-w-[240px]" title={`${selectedStudent.name} - ${selectedModule}`}>
                    {selectedStudent.name} • {selectedModule}
                  </p>
                </div>
                <button onClick={() => setGradingModalOpen(false)} className="text-gray-455 hover:text-gray-655 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitGrade} className="space-y-4">
                {/* Status selector */}
                <div>
                  <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Module Status</label>
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

                {/* Score slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block">Assigned Score (0-10)</label>
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

                {/* Remarks */}
                <div>
                  <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1.5">Trainer Observations</label>
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
};

export default TrainerDashboard;
