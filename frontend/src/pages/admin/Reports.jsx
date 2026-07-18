import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  TrendingUp, 
  School,
  Clock,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
  const [reportType, setReportType] = useState('utilization'); // 'utilization', 'daily', 'monthly', 'trainers'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'utilization') {
        const { data } = await API.get('/reports/utilization', {
          params: { startDate, endDate }
        });
        setReportData(data);
      } else if (reportType === 'daily') {
        const { data } = await API.get('/reports/daily', {
          params: { date: selectedDate }
        });
        setReportData(data);
      } else if (reportType === 'monthly') {
        const { data } = await API.get('/reports/monthly', {
          params: { year, month }
        });
        setReportData(data.dailyStats || []);
      } else if (reportType === 'trainers') {
        const { data } = await API.get('/reports/trainers', {
          params: { date: selectedDate }
        });
        setReportData(data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, selectedDate, year, month]);

  // Export to Excel Sheet Handler
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      let dataToExport = [];
      let filename = 'report';

      if (reportType === 'utilization') {
        dataToExport = reportData.map(r => ({
          'Room Name': r.roomName,
          'Room Number': r.roomNumber,
          'Floor': r.floor,
          'Capacity': r.capacity,
          'Allocations Count': r.totalAllocations,
          'Allocated Hours': r.allocatedHours,
          'Operational Hours': r.operationalHours,
          'Utilization Rate (%)': r.utilizationRate
        }));
        filename = `Room_Utilization_${startDate}_to_${endDate}`;
      } else if (reportType === 'daily') {
        dataToExport = reportData.flatMap(r => 
          r.scheduleList.map(s => ({
            'Room Name': r.roomName,
            'Room Number': r.roomNumber,
            'Capacity': r.capacity,
            'Batch Scheduled': s.batchName,
            'Trainer': s.trainerName,
            'Time Slot': s.timeSlot,
            'Duration (Hrs)': s.duration
          }))
        );
        filename = `Daily_Usage_${selectedDate}`;
      } else if (reportType === 'monthly') {
        dataToExport = reportData.map(r => ({
          'Day': r.day,
          'Allocations Count': r.totalAllocations,
          'Total Hours Allocated': r.totalHours
        }));
        filename = `Monthly_Usage_Report_${year}_Month_${month + 1}`;
      } else if (reportType === 'trainers') {
        dataToExport = reportData.map(r => ({
          'Trainer Name': r.trainerName,
          'Role': r.trainerRole,
          'Status': r.status,
          'Allocated Hours Today': r.totalHoursUsed,
          'Availability Shift Slots': r.availabilitySlots,
          'Scheduled Classes Today': r.scheduleList.map(s => `${s.timeSlot} [Room ${s.roomNumber}: ${s.batchName}]`).join('; ')
        }));
        filename = `Trainer_Availability_Report_${selectedDate}`;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success('Excel spreadsheet downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Excel export failed');
    }
  };

  // Export to PDF Document Handler
  const handleExportPDF = () => {
    if (reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      const doc = new jsPDF();
      let title = '';
      let headers = [];
      let rows = [];
      let filename = 'report';

      if (reportType === 'utilization') {
        title = `Room Utilization Report (${startDate} to ${endDate})`;
        headers = ['Room', 'Room #', 'Capacity', 'Allocations', 'Hours', 'Util %'];
        rows = reportData.map(r => [
          r.roomName,
          r.roomNumber,
          r.capacity,
          r.totalAllocations,
          r.allocatedHours,
          `${r.utilizationRate}%`
        ]);
        filename = `Room_Utilization_Report`;
      } else if (reportType === 'daily') {
        title = `Daily Classroom Usage Summary (${selectedDate})`;
        headers = ['Room #', 'Batch', 'Trainer', 'Time Slot', 'Duration'];
        rows = reportData.flatMap(r => 
          r.scheduleList.map(s => [
            r.roomNumber,
            s.batchName,
            s.trainerName,
            s.timeSlot,
            `${s.duration} hrs`
          ])
        );
        filename = `Daily_Classroom_Usage`;
      } else if (reportType === 'monthly') {
        title = `Monthly Classroom Allocations (${month + 1}/${year})`;
        headers = ['Day', 'Allocations', 'Hours Allocated'];
        rows = reportData.map(r => [
          r.day,
          r.totalAllocations,
          `${r.totalHours} hrs`
        ]);
        filename = `Monthly_Classroom_Allocations`;
      } else if (reportType === 'trainers') {
        title = `Trainer Availability & Schedules (${selectedDate})`;
        headers = ['Trainer Name', 'Role', 'Status', 'Allocated Hours', 'Availability'];
        rows = reportData.map(r => [
          r.trainerName,
          r.trainerRole,
          r.status,
          `${r.totalHoursUsed} hrs`,
          r.availabilitySlots
        ]);
        filename = `Trainer_Schedules_Report`;
      }

      // Draw custom beautiful PDF header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 14, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
      
      let y = 35;
      
      // Draw Table Header Background
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(14, y, 180, 8, 'F');
      
      // Print Headers
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => {
        doc.text(h, 16 + i * 30, y + 6);
      });

      // Print Rows
      y += 8;
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      rows.forEach((row, idx) => {
        // Zebra striping
        if (idx % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, y, 180, 8, 'F');
        }
        row.forEach((cell, colIdx) => {
          doc.text(String(cell), 16 + colIdx * 30, y + 6);
        });
        y += 8;
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`${filename}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed');
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-violet-800 dark:text-violet-400" />
            Classroom Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Monitor classroom space efficiency, compile daily logs, and export analytics
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-755 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all select-none cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-violet-800 hover:bg-indigo-755 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all select-none cursor-pointer"
          >
            <FileText size={15} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Select Report Type */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={12} />
              Report Category
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="utilization">Room Space Utilization</option>
              <option value="daily">Daily Usage Summary</option>
              <option value="monthly">Monthly Usage Trends</option>
              <option value="trainers">Trainer Availability & Utilization</option>
            </select>
          </div>

          {/* Conditional Query Filters */}
          {reportType === 'utilization' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </>
          )}

          {(reportType === 'daily' || reportType === 'trainers') && (
            <div className="space-y-1.5 col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} />
                Selected Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((mName, idx) => (
                    <option key={idx} value={idx}>{mName}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Block */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-800 border-t-transparent"></div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-16 text-center shadow-sm">
          <BarChart3 size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Report Data Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Choose a different date range or category to view trends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm lg:col-span-8">
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-800" />
              Usage Visualization
            </h3>
            
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'utilization' ? (
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="roomNumber" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }} />
                    <Legend />
                    <Bar dataKey="utilizationRate" name="Utilization Rate (%)" fill="#5b21b6" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                ) : reportType === 'monthly' ? (
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalHours" name="Allocated Hours" stroke="#5b21b6" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : reportType === 'trainers' ? (
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="trainerName" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Hours Allocated Today', angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }} />
                    <Legend />
                    <Bar dataKey="totalHoursUsed" name="Hours Allocated" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                ) : (
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="roomNumber" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }} />
                    <Legend />
                    <Bar dataKey="totalHoursUsed" name="Hours Allocated" fill="#5b21b6" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Summary Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm lg:col-span-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-violet-800" />
              Summary Table
            </h3>

            <div className="space-y-3">
              {reportType === 'utilization' && reportData.map((r, idx) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800/50 rounded-xl flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h4 className="font-bold text-slate-855 dark:text-slate-250">{r.roomName}</h4>
                    <span className="text-[10px] text-slate-400">Room {r.roomNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-950 dark:text-white block">{r.utilizationRate}%</span>
                    <span className="text-[10px] text-slate-400">{r.allocatedHours} / {r.operationalHours} hrs</span>
                  </div>
                </div>
              ))}

              {reportType === 'daily' && reportData.map((r, idx) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800/50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-855 dark:text-slate-250">{r.roomName} ({r.roomNumber})</h4>
                    <span className="bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-400 font-bold px-2 py-0.5 rounded text-[10px]">
                      {r.totalClassesToday} classes
                    </span>
                  </div>
                  {r.scheduleList.map((s, sIdx) => (
                    <div key={sIdx} className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal">
                      <p>{s.timeSlot} • {s.batchName}</p>
                      <p className="text-slate-400 mt-0.5 font-medium">Trainer: {s.trainerName}</p>
                    </div>
                  ))}
                </div>
              ))}

              {reportType === 'monthly' && reportData.map((r, idx) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800/50 rounded-xl flex justify-between items-center text-xs font-semibold">
                  <span>Day {r.day}</span>
                  <div className="text-right font-bold">
                    <span className="text-slate-955 dark:text-white block">{r.totalAllocations} Classes</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{r.totalHours} hrs allocated</span>
                  </div>
                </div>
              ))}

              {reportType === 'trainers' && reportData.map((r, idx) => (
                <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800/50 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-250">{r.trainerName}</h4>
                      <span className="text-[10px] text-slate-400">{r.trainerRole}</span>
                    </div>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                      r.status === 'Free / No Class'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl space-y-1 text-[10px] font-bold text-slate-500">
                    <p>Shift: <strong className="text-slate-700 dark:text-slate-300">{r.availabilitySlots}</strong></p>
                    <p>Booked: <strong className="text-indigo-650 dark:text-violet-400">{r.totalHoursUsed} hrs</strong></p>
                  </div>
                  {r.scheduleList.map((s, sIdx) => (
                    <div key={sIdx} className="bg-violet-50/20 dark:bg-violet-950/5 p-2 rounded-lg text-[9px] font-bold text-slate-500 dark:text-slate-400 border-l-2 border-violet-500 leading-normal">
                      <p>{s.timeSlot} • Room {s.roomNumber} ({s.roomName})</p>
                      <p className="text-slate-400 font-medium mt-0.5">Batch: {s.batchName}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
