import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Calendar, Search, ShieldCheck, Download, Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AttendanceManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/attendance');
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    log.batch?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to trigger CSV Export simulation
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const headers = 'Student Name,Email,Batch,Course,Date,Status,Marked By\n';
    const rows = filteredLogs.map(log => 
      `"${log.student?.name}","${log.student?.email}","${log.batch?.name}","${log.batch?.course}","${new Date(log.date).toLocaleDateString()}","${log.status}","${log.markedBy?.name}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `LCP_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report exported successfully!');
  };

  // Calculate Dynamic KPIs
  const calculateKPIs = () => {
    if (!logs || logs.length === 0) {
      return [
        { label: 'Total Records', value: '0', sub: 'No attendance logs', icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
        { label: 'Present Today', value: '0', sub: '0 Students', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
        { label: 'Late Today', value: '0', sub: '0 Students', icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
        { label: 'Absent Today', value: '0', sub: '0 Students', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/20' }
      ];
    }

    const todayStr = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.date).toDateString() === todayStr);
    
    const presentCount = todayLogs.filter(log => log.status === 'Present').length;
    const lateCount = todayLogs.filter(log => log.status === 'Late').length;
    const absentCount = todayLogs.filter(log => log.status === 'Absent').length;

    return [
      { label: 'Total Records', value: logs.length, sub: 'All-time logs', icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
      { label: 'Present Today', value: presentCount, sub: 'Checked in today', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'Late Today', value: lateCount, sub: 'Arrived late today', icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Absent Today', value: absentCount, sub: 'Missed class today', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/20' }
    ];
  };

  const kpis = calculateKPIs();

  const generateHeatmap = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      const dayLogs = logs.filter(log => new Date(log.date).toDateString() === d.toDateString());
      const total = dayLogs.length;
      const present = dayLogs.filter(log => log.status === 'Present' || log.status === 'Late').length;
      
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      heatmap.push({
        day: dayName,
        count: total,
        rate: rate
      });
    }
    return heatmap;
  };
  
  const heatmapData = generateHeatmap();

  const liveFeed = logs.slice(0, 3).map(log => {
    let actionStr = '';
    let color = '';
    
    if (log.status === 'Present') {
      actionStr = `marked Present by ${log.markedBy?.name}`;
      color = 'bg-emerald-50/50 border-emerald-100 dark:border-emerald-950/20 text-emerald-600 dark:text-emerald-400';
    } else if (log.status === 'Late') {
      actionStr = `marked Late by ${log.markedBy?.name}`;
      color = 'bg-amber-50/50 border-amber-100 dark:border-amber-950/20 text-amber-600 dark:text-amber-400';
    } else {
      actionStr = `marked Absent by ${log.markedBy?.name}`;
      color = 'bg-rose-50/50 border-rose-100 dark:border-rose-950/20 text-rose-600 dark:text-rose-500';
    }
    
    const timeDiff = Math.floor((new Date() - new Date(log.createdAt || log.date)) / 60000);
    const timeStr = timeDiff < 60 ? `${timeDiff} mins ago` : `${Math.floor(timeDiff/60)} hrs ago`;
    
    return {
      name: log.student?.name || 'Unknown Student',
      action: actionStr,
      time: timeStr,
      color: color
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Attendance Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Review student attendance histories, heatmaps, and batch analytics</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Download size={14} />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-5 rounded-[24px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">{kpi.value}</span>
                <span className="text-[9px] text-gray-400 mt-1 block font-medium">{kpi.sub}</span>
              </div>
              <div className={`p-3.5 rounded-2xl ${kpi.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap and Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-[24px] shadow-sm">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-4 flex items-center gap-1.5">
            <Calendar size={16} className="text-indigo-500" />
            Weekly Attendance Heatmap
          </h4>
          <div className="flex justify-between items-end h-40 pt-4 px-2">
            {heatmapData.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{item.rate}%</span>
                <div 
                  className={`w-8 rounded-t-lg transition-all duration-550 ${
                    item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 80 ? 'bg-indigo-500' : item.rate > 0 ? 'bg-amber-500' : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                  style={{ height: `${Math.max(item.rate, 8)}px` }}
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-400">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Scan Feed */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-4">Live Check-in Feed</h4>
            <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
              {liveFeed.length > 0 ? liveFeed.map((feed, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-gray-50/50 dark:bg-[#181922] border border-gray-100 dark:border-gray-800/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${feed.color.includes('emerald') ? 'bg-emerald-500' : feed.color.includes('indigo') ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-gray-800 dark:text-gray-200">{feed.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{feed.action}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{feed.time}</span>
                </div>
              )) : (
                <div className="text-center py-4 text-xs text-gray-500">No recent check-ins</div>
              )}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic text-center border-t border-gray-100 dark:border-gray-800 pt-3 mt-4 font-semibold">
            Live sockets syncing check-ins securely with placement records.
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 p-4 rounded-[20px] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by student name or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
          />
        </div>
        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-3.5 py-2 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10">
          Filtered Records: {filteredLogs.length}
        </div>
      </div>

      {/* Ledger list table */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/30">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto font-black"></div>
                    <span className="text-xs text-gray-400 mt-2 block font-semibold">Loading ledger logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                    No attendance logs matching search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-gray-800 dark:text-white">{log.student?.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{log.student?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-gray-800 dark:text-white">{log.batch?.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{log.batch?.course}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-indigo-500" />
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : log.status === 'Late'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold">
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span>{log.markedBy?.name} <span className="text-[10px] text-gray-400 font-medium">({log.markedBy?.role?.replace(' Trainer', '')})</span></span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
