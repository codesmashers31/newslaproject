import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  Calendar, 
  Award, 
  Edit3, 
  Check, 
  X, 
  Sliders, 
  BookOpen, 
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(true);

  // Mode select
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

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }

  // Grading states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedModule, setSelectedModule] = useState('');
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingForm, setGradingForm] = useState({
    status: 'Not Started',
    marks: 0,
    remarks: '',
  });

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
    if (user?.role === 'Communication Trainer') {
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Load trainer students and batches
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

  useEffect(() => {
    loadData();
  }, []);

  // Filter students based on selected batch
  const batchStudents = students.filter(s => 
    s.batches.some(b => b._id.toString() === selectedBatchId.toString())
  );

  // Initialize attendance checklist
  useEffect(() => {
    const defaultState = {};
    batchStudents.forEach(s => {
      defaultState[s._id] = 'Present';
    });
    setAttendanceState(defaultState);
  }, [selectedBatchId, students]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    const records = Object.keys(attendanceState).map(studentId => ({
      studentId,
      status: attendanceState[studentId]
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
      toast.toast ? toast.toast.success('Attendance submitted successfully!') : toast.success('Attendance submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit attendance');
    }
  };

  const openGradingPanel = (student, moduleName) => {
    setSelectedStudent(student);
    setSelectedModule(moduleName);
    
    // Find if score already exists
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
      toast.toast ? toast.toast.success('Score updated successfully!') : toast.success('Score updated successfully!');
      setGradingModalOpen(false);
      loadData(); // reload values
    } catch (error) {
      toast.error('Failed to save score');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Communication Trainer Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Manage class rosters, mark attendance checklists, and submit grades</p>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3.5 py-2.5 border border-[#c7c4d7] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4648d4]"
          >
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name} ({b.course})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditionally render stats cards only on Dashboard path */}
      {(location.pathname === '/trainer' || location.pathname === '/trainer/') && (
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
            className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-500/20 dark:border-blue-900/30 p-6 rounded-[20px] shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 h-32"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Students</span>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">{students.length}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Students assigned to selected trainer</p>
            </div>
            <div className="p-3.5 bg-blue-500/25 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
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
                <p>Present: <span className="text-emerald-600">{PresentCount}</span></p>
                <p>Absent: <span className="text-rose-600">{AbsentCount}</span> • Late: <span className="text-amber-500">{LateCount}</span></p>
              </div>
            </div>
            {/* SVG Circular Progress Loader */}
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
                  strokeDashoffset={138.2 - (138.2 * todayPercentage) / 100}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">{todayPercentage}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#c7c4d7] bg-[#f0f3ff] rounded-t-2xl overflow-hidden border">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-[#4648d4] text-[#4648d4] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          }`}
        >
          <Calendar size={16} />
          <span>Daily Attendance Roll</span>
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'grading'
              ? 'border-[#4648d4] text-[#4648d4] bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
          }`}
        >
          <Award size={16} />
          <span>Module Grading Sheet</span>
        </button>
      </div>

      {/* TABS CONTAINER */}
      {loading ? (
        <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-850 rounded-3xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : batchStudents.length === 0 ? (
        <div className="text-center py-10 bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
          No students currently enrolled in this batch.
        </div>
      ) : (
        <div>
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Datepicker panel */}
              <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Class Roll Call Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 border dark:border-gray-850 rounded-xl bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={submitAttendance}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20"
                >
                  Submit Attendance Book
                </button>
              </div>

              {/* Roster list */}
              <div className="bg-white/60 dark:bg-[#12131a]/60 border border-[#c7c4d7] rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/30">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4">Batches</th>
                      <th className="px-6 py-4 text-center">Status Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-850 text-sm">
                    {batchStudents.map(student => (
                      <tr key={student._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 transition-colors">
                        <td className="px-6 py-4 font-semibold">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{student.mobile}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {student.batches?.map(b => b.name).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center space-x-2">
                            {['Present', 'Absent', 'Late'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleAttendanceChange(student._id, status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  attendanceState[student._id] === status
                                    ? status === 'Present'
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/25 dark:border-emerald-900'
                                      : status === 'Late'
                                      ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/25 dark:border-amber-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/25 dark:border-rose-900'
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

          {/* TAB 2: GRADING */}
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
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-850 text-xs">
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
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450'
                                    : score.status === 'In Progress'
                                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }`}>
                                  {score.status || 'Not Started'}
                                </span>
                                {score.status && score.status !== 'Not Started' && (
                                  <p className="font-semibold text-gray-600 dark:text-gray-400">Score: {score.marks}/10</p>
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
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-850">
                <div>
                  <h3 className="text-md font-bold">Grade: {selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500 max-w-[280px] truncate">Module: {selectedModule}</p>
                </div>
                <button onClick={() => setGradingModalOpen(false)} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitGrade} className="space-y-4">
                {/* Status selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Module Progress Status</label>
                  <select
                    value={gradingForm.status}
                    onChange={(e) => setGradingForm({ ...gradingForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-850 text-sm focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Slider Marks */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Assigned Marks (0-10)</label>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{gradingForm.marks}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={gradingForm.marks}
                    onChange={(e) => setGradingForm({ ...gradingForm, marks: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-850 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-0.5">
                    <span>0 (Poor)</span>
                    <span>5</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Trainer Remarks</label>
                  <textarea
                    value={gradingForm.remarks}
                    onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none h-20"
                    placeholder="Enter grading observations..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/10"
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
