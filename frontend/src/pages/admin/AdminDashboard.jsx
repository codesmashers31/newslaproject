import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  School, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  Briefcase, 
  LayoutDashboard,
  Layers,
  Users,
  User,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#f43f5e', '#eab308', '#6366f1'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAllocations, setRecentAllocations] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch dashboard stats
      const statsRes = await API.get('/reports/dashboard-stats');
      setStats(statsRes.data);

      // 2. Fetch today's allocations
      const todayStr = new Date().toISOString().split('T')[0];
      const allocsRes = await API.get('/allocations', {
        params: { date: todayStr }
      });
      setRecentAllocations(allocsRes.data || []);

      // 3. Fetch past week utilization for chart
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const startStr = start.toISOString().split('T')[0];
      const endStr = new Date().toISOString().split('T')[0];
      
      const utilRes = await API.get('/reports/utilization', {
        params: { startDate: startStr, endDate: endStr }
      });
      setUtilizationData(utilRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard stats', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl lg:col-span-8" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  // Fallback defaults
  const dashboardStats = stats || {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    todayAllocationsCount: 0,
    currentRunningClasses: [],
    upcomingClasses: []
  };

  const availabilitySummaryData = [
    { name: 'Available', value: dashboardStats.availableRooms },
    { name: 'Occupied', value: dashboardStats.occupiedRooms }
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" />
            Super Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Real-time classroom occupancy, current running lectures, and booking logs
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/allocations')}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all select-none"
        >
          <Plus size={16} />
          Book Classroom
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Rooms */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#12131a]/80 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Classrooms</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{dashboardStats.totalRooms}</h3>
            <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">Spaces Configured</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
            <School size={26} />
          </div>
        </motion.div>

        {/* Card 2: Available Rooms */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#12131a]/80 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Rooms</span>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{dashboardStats.availableRooms}</h3>
            <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">Vacant Right Now</span>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner">
            <CheckCircle size={26} />
          </div>
        </motion.div>

        {/* Card 3: Occupied Rooms */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#12131a]/80 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Occupied Rooms</span>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-450">{dashboardStats.occupiedRooms}</h3>
            <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">Active Lectures</span>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl shadow-inner">
            <XCircle size={26} />
          </div>
        </motion.div>

        {/* Card 4: Today's Allocations */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#12131a]/80 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Today's bookings</span>
            <h3 className="text-3xl font-black text-indigo-900 dark:text-white">{dashboardStats.todayAllocationsCount}</h3>
            <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">Total slots today</span>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
            <Calendar size={26} />
          </div>
        </motion.div>
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Occupancy Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm lg:col-span-8 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            Classroom Utilization Chart (Past 7 Days)
          </h3>
          
          <div className="h-80 w-full text-xs">
            {utilizationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-450">No utilization data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData}>
                  <XAxis dataKey="roomNumber" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }} />
                  <Bar dataKey="utilizationRate" name="Utilization Rate (%)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column (Availability Summary Breakdowns) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm lg:col-span-4 flex flex-col justify-between max-h-[400px] overflow-y-auto">
          <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-2 mb-4">
            <Clock size={16} className="text-indigo-600" />
            Running & Upcoming Classes
          </h3>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Running Classes */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Running Lectures ({dashboardStats.currentRunningClasses.length})</span>
              {dashboardStats.currentRunningClasses.length === 0 ? (
                <p className="text-[11px] font-semibold text-slate-450 italic">No classes running right now.</p>
              ) : (
                dashboardStats.currentRunningClasses.map((c, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-500/10 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-450">
                    <p className="font-extrabold">{c.batchName}</p>
                    <p className="text-[10px] text-rose-600/80 mt-0.5">Room {c.roomNumber} ({c.roomName}) • {c.timeSlot}</p>
                  </div>
                ))
              )}
            </div>

            {/* Upcoming Classes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Upcoming Classes Today ({dashboardStats.upcomingClasses.length})</span>
              {dashboardStats.upcomingClasses.length === 0 ? (
                <p className="text-[11px] font-semibold text-slate-450 italic">No more classes scheduled today.</p>
              ) : (
                dashboardStats.upcomingClasses.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                    <p className="font-extrabold">{c.batchName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Room {c.roomNumber} • {c.timeSlot}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Today's Allocations Listing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-2">
          <Calendar size={16} className="text-indigo-600" />
          Today's Scheduled Classrooms ({recentAllocations.length})
        </h3>
        
        {recentAllocations.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-6">No classroom allocations scheduled for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-500 font-semibold">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAllocations.map((alloc) => (
                  <tr key={alloc._id} className="border-b border-slate-100 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">{alloc.room?.name}</td>
                    <td className="py-3 px-4">{alloc.room?.roomNumber}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{alloc.batch?.name}</td>
                    <td className="py-3 px-4">{alloc.trainer?.name}</td>
                    <td className="py-3 px-4">{alloc.startTime} - {alloc.endTime}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/10">
                        {alloc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
