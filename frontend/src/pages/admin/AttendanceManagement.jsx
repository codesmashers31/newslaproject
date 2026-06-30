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

  // Mock heatmap dataset
  const mockHeatmap = [
    { day: 'Mon', count: 18, rate: 92 },
    { day: 'Tue', count: 22, rate: 96 },
    { day: 'Wed', count: 15, rate: 84 },
    { day: 'Thu', count: 20, rate: 89 },
    { day: 'Fri', count: 24, rate: 98 },
    { day: 'Sat', count: 12, rate: 78 },
    { day: 'Sun', count: 0, rate: 0 }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Attendance Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Review student attendance histories, heatmaps, and batch analytics</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-[#4648d4] hover:bg-[#2f2ebe] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Download size={14} />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Present Rate', value: '88%', sub: 'Avg 44/50 Students', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Late Log Rate', value: '4%', sub: '2 Students Today', icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Absent Rate', value: '8%', sub: '4 Students Today', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Calculated Grade', value: 'Excellent', sub: 'Batches synced', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white border border-[#c7c4d7] p-5 rounded-3xl ambient-shadow flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-2xl font-black mt-1 block">{kpi.value}</span>
                <span className="text-[9px] text-gray-450 mt-1 block">{kpi.sub}</span>
              </div>
              <div className={`p-3.5 rounded-2xl ${kpi.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap and Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="bg-white border border-[#c7c4d7] p-6 rounded-3xl ambient-shadow">
          <h4 className="font-bold text-sm text-[#111c2d] mb-4 flex items-center gap-1.5">
            <Calendar size={16} className="text-[#4648d4]" />
            Weekly Attendance Heatmap
          </h4>
          <div className="flex justify-between items-end h-40 pt-4 px-2">
            {mockHeatmap.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <span className="text-[9px] font-bold text-gray-400">{item.rate}%</span>
                <div 
                  className={`w-8 rounded-t-lg transition-all duration-550 ${
                    item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 80 ? 'bg-indigo-500' : item.rate > 0 ? 'bg-amber-500' : 'bg-gray-100'
                  }`}
                  style={{ height: `${Math.max(item.rate, 8)}px` }}
                />
                <span className="text-xs font-semibold text-gray-700">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Scan Feed */}
        <div className="lg:col-span-2 bg-white border border-[#c7c4d7] p-6 rounded-3xl ambient-shadow flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-[#111c2d] mb-4">Live Check-in Feed</h4>
            <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
              {[
                { name: 'Elena Rodriguez', action: 'scanned QR code at Hall B', time: '2 mins ago', color: 'bg-emerald-50 text-emerald-600' },
                { name: 'Kenji Yamamoto', action: 'marked Present by Trainer Marcus', time: '12 mins ago', color: 'bg-indigo-50 text-indigo-600' },
                { name: 'Sarah Miller', action: 'marked Late - Lecture A', time: '20 mins ago', color: 'bg-amber-50 text-amber-600' }
              ].map((feed, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-gray-50/50 border border-[#c7c4d7] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${feed.color.replace('text', 'bg').split(' ')[0]}`} />
                    <span className="font-bold">{feed.name}</span>
                    <span className="text-gray-500">{feed.action}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{feed.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic text-center border-t border-[#c7c4d7] pt-3 mt-4">
            Live sockets syncing check-ins securely with placement records.
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white border border-[#c7c4d7] p-4 rounded-2xl ambient-shadow flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by student name or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#c7c4d7] bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="text-xs text-gray-500 font-bold bg-[#f0f3ff] px-3.5 py-2 rounded-lg">
          Filtered Records: {filteredLogs.length}
        </div>
      </div>

      {/* Ledger list table */}
      <div className="bg-white border border-[#c7c4d7] rounded-3xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#c7c4d7] text-gray-500 font-semibold uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c7c4d7]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4648d4] border-t-transparent mx-auto"></div>
                    <span className="text-xs text-gray-400 mt-2 block">Loading ledger logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500 text-sm">
                    No attendance logs matching search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{log.student?.name}</p>
                      <p className="text-[10px] text-gray-400">{log.student?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{log.batch?.name}</p>
                      <p className="text-[10px] text-gray-500">{log.batch?.course}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-600'
                          : log.status === 'Late'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-[#4648d4]" />
                        <span>{log.markedBy?.name} ({log.markedBy?.role?.replace(' Trainer', '')})</span>
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
