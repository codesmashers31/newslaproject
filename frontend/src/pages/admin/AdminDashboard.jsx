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
  Cell, 
  LineChart, 
  Line,
  AreaChart,
  Area
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

  // Convert modules progress for chart
  const moduleProgressData = [
    { name: 'Completed', value: charts.moduleProgressStats.completed },
    { name: 'In Progress', value: charts.moduleProgressStats.inProgress },
    { name: 'Not Started', value: charts.moduleProgressStats.notStarted }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Overview Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time stats and metrics of training batches</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Students */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Students</span>
            <h3 className="text-3xl font-extrabold">{cards.totalStudents}</h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full font-medium">Active Enrolled</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Users size={28} />
          </div>
        </motion.div>

        {/* Card 2: Trainers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Trainers</span>
            <h3 className="text-3xl font-extrabold">{cards.totalTrainers}</h3>
            <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full font-medium">All Departments</span>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl">
            <GraduationCap size={28} />
          </div>
        </motion.div>

        {/* Card 3: Batches */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Active Batches</span>
            <h3 className="text-3xl font-extrabold">{cards.totalBatches}</h3>
            <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full font-medium">Live Classes</span>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <FolderGit size={28} />
          </div>
        </motion.div>

        {/* Card 4: Placed count */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Placed Count</span>
            <h3 className="text-3xl font-extrabold">{cards.placedCount}</h3>
            <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full font-medium">Offers Received</span>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Briefcase size={28} />
          </div>
        </motion.div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md shadow-sm">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
            <CalendarCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
            Monthly Attendance Activity
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyAttendance}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Late" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Placement Pie Chart */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md shadow-sm">
          <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
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
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.placementChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="space-y-3.5">
              {charts.placementChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extra Row: Attendance % and average marks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between shadow-sm">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance Rate</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-extrabold">{cards.attendancePercentage}%</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Average Present</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${cards.attendancePercentage}%` }} />
          </div>
        </div>

        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between shadow-sm">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Test Score</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-extrabold">{cards.avgMarks}</span>
            <span className="text-xs text-gray-500">out of 10</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${cards.avgMarks * 10}%` }} />
          </div>
        </div>

        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between shadow-sm">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules Completed</h5>
          <div className="flex items-baseline space-x-2 my-4">
            <span className="text-4xl font-extrabold">{cards.completedModules}</span>
            <span className="text-xs text-gray-500">graded Completed</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            {/* Set completion percentage against total mock modules (41) */}
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((cards.completedModules / 41) * 100, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
