import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, UserCheck, ChevronRight, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceDrillDown = ({ logs }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const { data } = await API.get('/admin/batches');
        setBatches(data);
      } catch (err) {
        toast.error('Failed to load drill-down data');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const COURSES = [
    { id: 'Technical', label: 'Technical Training', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50' },
    { id: 'Communication', label: 'Communication Skills', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50' },
    { id: 'Aptitude', label: 'Aptitude & Reasoning', color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50' }
  ];

  const derivedTrainers = useMemo(() => {
    if (!selectedCourse) return [];
    const courseBatches = batches.filter(b => {
      if (selectedCourse === 'Communication') return b.course?.includes('Communication');
      if (selectedCourse === 'Aptitude') return b.course?.includes('Aptitude');
      return b.course === 'Technical Training' || (!b.course?.includes('Communication') && !b.course?.includes('Aptitude'));
    });

    const trainersMap = new Map();
    courseBatches.forEach(b => {
      b.trainers?.forEach(t => {
        if (!trainersMap.has(t._id)) {
          trainersMap.set(t._id, { ...t, batches: [] });
        }
        trainersMap.get(t._id).batches.push(b);
      });
    });
    return Array.from(trainersMap.values());
  }, [selectedCourse, batches]);

  const studentStats = useMemo(() => {
    if (!selectedBatch) return [];
    return selectedBatch.students?.map(student => {
      const studentLogs = logs.filter(l => l.student?._id === student._id && l.batch?._id === selectedBatch._id);
      const total = studentLogs.length;
      const present = studentLogs.filter(l => l.status === 'Present').length;
      const late = studentLogs.filter(l => l.status === 'Late').length;
      const absent = studentLogs.filter(l => l.status === 'Absent' || l.status === 'Excused').length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      
      return { student, total, present, late, absent, percentage };
    }).sort((a, b) => b.percentage - a.percentage) || [];
  }, [selectedBatch, logs]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading Analytics Data...</div>;
  }

  return (
    <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#161720]">
        <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={18} className="text-violet-500" />
          Advanced Drill-Down Analytics
        </h3>
        <p className="text-xs text-gray-500 mt-1 font-medium">Select a path below to investigate specific batch attendance rates.</p>
        
        {/* Breadcrumb / Stepper */}
        <div className="flex items-center gap-2 mt-4 text-xs font-bold">
          <span onClick={() => { setSelectedCourse(null); setSelectedTrainer(null); setSelectedBatch(null); }} className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${!selectedCourse ? 'bg-violet-800 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
            1. Course
          </span>
          <ChevronRight size={14} className="text-gray-400" />
          <span onClick={() => { setSelectedTrainer(null); setSelectedBatch(null); }} className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${selectedCourse && !selectedTrainer ? 'bg-violet-800 text-white' : (selectedTrainer ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800' : 'text-gray-400')}`}>
            2. Trainer
          </span>
          <ChevronRight size={14} className="text-gray-400" />
          <span onClick={() => setSelectedBatch(null)} className={`cursor-pointer px-3 py-1.5 rounded-lg transition-colors ${selectedTrainer && !selectedBatch ? 'bg-violet-800 text-white' : (selectedBatch ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800' : 'text-gray-400')}`}>
            3. Batch
          </span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className={`px-3 py-1.5 rounded-lg transition-colors ${selectedBatch ? 'bg-violet-800 text-white' : 'text-gray-400'}`}>
            4. Students
          </span>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SELECT COURSE */}
          {!selectedCourse && (
            <motion.div key="course" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COURSES.map(course => (
                <div key={course.id} onClick={() => setSelectedCourse(course.id)} className={`p-5 rounded-2xl border cursor-pointer hover:shadow-md transition-all group ${course.color}`}>
                  <BookOpen size={24} className="mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-lg">{course.label}</h4>
                  <p className="text-xs opacity-70 mt-1">Click to view assigned trainers</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* STEP 2: SELECT TRAINER */}
          {selectedCourse && !selectedTrainer && (
            <motion.div key="trainer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {derivedTrainers.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 italic py-4">No trainers found for this course.</div>
                ) : (
                  derivedTrainers.map(trainer => (
                    <div key={trainer._id} onClick={() => setSelectedTrainer(trainer)} className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition-colors flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-800 dark:text-violet-400 font-bold">
                        {trainer.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{trainer.name}</h4>
                        <p className="text-[10px] font-semibold text-gray-500">{trainer.batches.length} Batches Assigned</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SELECT BATCH */}
          {selectedCourse && selectedTrainer && !selectedBatch && (
            <motion.div key="batch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTrainer.batches.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 italic py-4">No batches found for this trainer.</div>
                ) : (
                  selectedTrainer.batches.map(batch => (
                    <div key={batch._id} onClick={() => setSelectedBatch(batch)} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition-colors flex justify-between items-center group">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-violet-800 transition-colors">{batch.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{batch.course}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Users size={12}/> {batch.students?.length || 0} Students</span>
                        <span className="text-[10px] text-violet-500 font-semibold mt-1 flex items-center gap-1">View Analytics <ChevronRight size={10}/></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: STUDENT ANALYTICS TABLE */}
          {selectedBatch && (
            <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#181922] text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800">Student Name</th>
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800 text-center">Total Classes</th>
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800 text-center text-emerald-600">Present</th>
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800 text-center text-amber-600">Late</th>
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800 text-center text-rose-600">Absent</th>
                      <th className="p-4 font-bold border-b border-gray-200 dark:border-gray-800 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {studentStats.length === 0 ? (
                      <tr><td colSpan="6" className="p-6 text-center text-sm text-gray-500">No students enrolled in this batch.</td></tr>
                    ) : (
                      studentStats.map(stat => (
                        <tr key={stat.student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">
                            {stat.student.name}
                            <span className="block text-[10px] text-gray-400 font-medium">{stat.student.email}</span>
                          </td>
                          <td className="p-4 text-sm text-center text-gray-500 font-semibold">{stat.total}</td>
                          <td className="p-4 text-sm text-center text-emerald-600 font-bold">{stat.present}</td>
                          <td className="p-4 text-sm text-center text-amber-600 font-bold">{stat.late}</td>
                          <td className="p-4 text-sm text-center text-rose-600 font-bold">{stat.absent}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-xs font-bold ${stat.percentage >= 80 ? 'text-emerald-500' : stat.percentage >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {stat.percentage}%
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${stat.percentage >= 80 ? 'bg-emerald-500' : stat.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceDrillDown;
