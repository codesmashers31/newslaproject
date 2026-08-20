import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { CalendarRange } from 'lucide-react';
import { PageSkeleton } from '../../components/ui/primitives';

const StudentHistory = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('All');

  const loadHistoryData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, []);

  if (loading) {
    return <PageSkeleton variant="list" />;
  }

  const attendance = data?.attendance || { percentage: 0, totalClasses: 0, presentCount: 0, records: [] };
  const records = attendance.records || [];

  const groupRecordsByDate = (recordsList) => {
    const groups = {};
    recordsList.forEach(rec => {
      if (!rec.date) return;
      const dateObj = new Date(rec.date);
      const dateString = dateObj.toLocaleDateString(undefined, { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      });
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(rec);
    });
    return groups;
  };

  const groupedRecords = groupRecordsByDate(records);
  const totalPresent = attendance.presentCount ?? 0;
  const totalClasses = attendance.totalClasses ?? 0;
  const totalAbsent = Math.max(0, totalClasses - totalPresent);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20">
        <h1 className="text-xl font-black text-[#0F172A]">Attendance Logs</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">View check-in times and rolling stats</p>
      </div>

      <div className="p-5 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* 1. Roll Summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[9px] text-[#64748B] font-black uppercase tracking-wider">Attendance Rate</p>
              <p className="text-3xl font-black text-[#0F172A] mt-1">{attendance.percentage}%</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 border border-blue-100/50 rounded-xl flex items-center justify-center">
              <CalendarRange size={20} className="text-[#2563EB]" />
            </div>
          </div>

          <div className="h-2 rounded-full bg-slate-100 mb-5 overflow-hidden">
            <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${attendance.percentage}%` }} />
          </div>

          <div className="flex gap-3 pt-3.5 border-t border-[#F1F5F9]">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-sm font-black text-[#0F172A]">{totalPresent}</span>
              <span className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Days Present</span>
            </div>
            <div className="flex-1 flex flex-col items-center border-x border-[#F1F5F9]">
              <span className="text-sm font-black text-[#0F172A]">{totalClasses}</span>
              <span className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Total Classes</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-sm font-black text-rose-600">{totalAbsent}</span>
              <span className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Days Absent</span>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-[#64748B] font-black uppercase tracking-wider">Filter by Date</span>
          <div className="flex overflow-x-auto gap-2.5 pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedDate('All')}
              className={`whitespace-nowrap px-4 py-2 rounded-full border text-xs font-black transition-colors ${
                selectedDate === 'All' ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              All Days
            </button>
            {Object.keys(groupedRecords).map(dateStr => (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`whitespace-nowrap px-4 py-2 rounded-full border text-xs font-black transition-colors ${
                  selectedDate === dateStr ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-white border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {dateStr}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] text-[#64748B] font-black uppercase tracking-wider">
            {selectedDate === 'All' ? 'Day-Wise Attendance History' : `Attendance for ${selectedDate}`}
          </span>
          
          {Object.keys(groupedRecords).length > 0 ? (
            Object.keys(groupedRecords)
              .filter(dateStr => selectedDate === 'All' || dateStr === selectedDate)
              .map(dateStr => (
                <div key={dateStr} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
                  <h3 className="font-black text-xs text-[#0F172A] mb-3 pb-2.5 border-b border-[#F1F5F9]">
                    {dateStr}
                  </h3>
                  
                  <div className="flex flex-col gap-3.5">
                    {groupedRecords[dateStr].map((rec) => {
                      const dateObj = new Date(rec.date);
                      const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={rec._id} className="flex justify-between items-center py-1">
                          <div className="flex flex-col pr-4">
                            <span className="font-black text-xs text-[#0F172A]">{rec.subject || 'Session Check-in'}</span>
                            <span className="text-[10px] text-[#64748B] font-semibold mt-0.5">Scan time: {formattedTime}</span>
                            {rec.remarks && (
                              <span className="text-[9px] text-amber-600 font-semibold italic mt-0.5">Note: {rec.remarks}</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : rec.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          ) : (
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-3xl p-8 flex items-center justify-center shadow-sm">
              <span className="text-xs text-[#64748B] italic font-semibold">No attendance records stored yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
