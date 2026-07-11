import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  Users, 
  GraduationCap, 
  FolderGit, 
  Briefcase, 
  TrendingUp, 
  CheckCircle,
  FileSpreadsheet,
  CalendarCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#f43f5e', '#eab308', '#10b981'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/admin/stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  const { cards, charts } = stats || {
    cards: { totalStudents: 0, totalTrainers: 0, totalBatches: 0, placedCount: 0, attendancePercentage: 0, avgMarks: 0, completedModules: 0, pendingModules: 0 },
    charts: { monthlyAttendance: [], placementChartData: [], moduleProgressStats: { completed: 0, inProgress: 0, notStarted: 0 } }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Overview Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Real-time stats and metrics of training batches</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Students */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-1 duration-300 transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Students</span>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{cards.totalStudents}</h3>
            <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">Active Enrolled</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
            <Users size={26} />
          </div>
        </motion.div>

        {/* Card 2: Trainers */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:shadow-purple-500/5 hover:-translate-y-1 duration-300 transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Trainers</span>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{cards.totalTrainers}</h3>
            <span className="inline-block text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full">All Departments</span>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-405 rounded-2xl shadow-inner">
            <GraduationCap size={26} />
          </div>
        </motion.div>

        {/* Card 3: Batches */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-1 duration-300 transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Batches</span>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{cards.totalBatches}</h3>
            <span className="inline-block text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">Live Classes</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
            <FolderGit size={26} />
          </div>
        </motion.div>

        {/* Card 4: Placed count */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:shadow-rose-500/5 hover:-translate-y-1 duration-300 transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Placed Count</span>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{cards.placedCount}</h3>
            <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">Offers Received</span>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl shadow-inner">
            <Briefcase size={26} />
          </div>
        </motion.div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 p-6 rounded-[24px] shadow-sm">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <CalendarCheck size={18} className="text-indigo-500" />
            Monthly Attendance Activity
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyAttendance}>
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(229, 231, 235, 0.4)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Late" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Placement Pie Chart */}
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 p-6 rounded-[24px] shadow-sm">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            Placement Milestones Distribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.placementChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.placementChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid rgba(229, 231, 235, 0.4)', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="space-y-3.5 pr-2">
              {charts.placementChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extra Row: Attendance % and average marks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 p-6 rounded-[24px] flex flex-col justify-between shadow-sm hover:shadow-md duration-300">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{cards.attendancePercentage}%</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Average Present</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${cards.attendancePercentage}%` }} />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 p-6 rounded-[24px] flex flex-col justify-between shadow-sm hover:shadow-md duration-300">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Test Score</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{cards.avgMarks}</span>
            <span className="text-xs text-gray-400 font-medium">out of 10</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${cards.avgMarks * 10}%` }} />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 p-6 rounded-[24px] flex flex-col justify-between shadow-sm hover:shadow-md duration-300">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modules Completed</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-black text-gray-900 dark:text-white">{cards.completedModules}</span>
            <span className="text-xs text-gray-400 font-medium">graded Completed</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((cards.completedModules / 41) * 100, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
