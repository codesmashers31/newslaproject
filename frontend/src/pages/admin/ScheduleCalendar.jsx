import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  School, 
  User, 
  FolderGit, 
  Clock, 
  AlertTriangle,
  Move,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';

// Hours definition for Day/Week grids
const CALENDAR_HOURS = [
  { start: '09:00', end: '10:00', label: '09:00 AM' },
  { start: '10:00', end: '11:00', label: '10:00 AM' },
  { start: '11:00', end: '12:00', label: '11:00 AM' },
  { start: '12:00', end: '13:00', label: '12:00 PM' },
  { start: '13:00', end: '14:00', label: '01:00 PM' },
  { start: '14:00', end: '15:00', label: '02:00 PM' },
  { start: '15:00', end: '16:00', label: '03:00 PM' },
  { start: '16:00', end: '17:00', label: '04:00 PM' },
];

const ScheduleCalendar = () => {
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters state
  const [rooms, setRooms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedRoomFilter, setSelectedRoomFilter] = useState('');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');

  // Allocations state
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [roomsRes, trainersRes, batchesRes] = await Promise.all([
          API.get('/rooms'),
          API.get('/admin/trainers'),
          API.get('/admin/batches')
        ]);
        setRooms(roomsRes.data || []);
        setTrainers(trainersRes.data || []);
        setBatches(batchesRes.data || []);
        
        // Auto-select first room as default filter
        if (roomsRes.data && roomsRes.data.length > 0) {
          setSelectedRoomFilter(roomsRes.data[0]._id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load initial scheduling metadata');
      }
    };
    fetchMetadata();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      // Calculate date range depending on current view
      let startDate, endDate;
      const d = new Date(currentDate);

      if (view === 'day') {
        startDate = new Date(d.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(d.setHours(23, 59, 59, 999)).toISOString();
      } else if (view === 'week') {
        // Start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);
        
        startDate = monday.toISOString();
        endDate = sunday.toISOString();
      } else {
        // Month view
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        startDate = firstDay.toISOString();
        endDate = lastDay.toISOString();
      }

      const params = { startDate, endDate };
      if (selectedRoomFilter) params.room = selectedRoomFilter;
      if (selectedTrainerFilter) params.trainer = selectedTrainerFilter;
      if (selectedBatchFilter) params.batch = selectedBatchFilter;

      const { data } = await API.get('/allocations', { params });
      setAllocations(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch scheduled allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [currentDate, view, selectedRoomFilter, selectedTrainerFilter, selectedBatchFilter]);

  // Navigate Date Handler
  const handleNavigate = (direction) => {
    const nextDate = new Date(currentDate);
    if (view === 'day') {
      nextDate.setDate(nextDate.getDate() + direction);
    } else if (view === 'week') {
      nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + direction);
    }
    setCurrentDate(nextDate);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, allocation) => {
    e.dataTransfer.setData('allocationId', allocation._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dateTarget, startTarget, endTarget, roomTarget = null) => {
    e.preventDefault();
    const allocationId = e.dataTransfer.getData('allocationId');
    if (!allocationId) return;

    try {
      const payload = {
        date: dateTarget,
        startTime: startTarget,
        endTime: endTarget
      };
      if (roomTarget) {
        payload.room = roomTarget;
      }

      await API.put(`/allocations/${allocationId}`, payload);
      toast.success('Allocation rescheduled successfully');
      fetchAllocations();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Rescheduling failed due to conflict');
    }
  };

  // Date Formatting Helpers
  const getHeaderLabel = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (view === 'week') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Renders Week View columns (Monday - Saturday)
  const getWeekDates = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const dates = [];
    for (let i = 0; i < 6; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      dates.push(current);
    }
    return dates;
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" />
            Schedule Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Drag-and-drop allocations to reschedule, track trainer workload, and detect classroom double-bookings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filters Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-6 lg:col-span-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter size={14} />
            Filters
          </h3>

          <div className="space-y-4 text-xs font-bold text-slate-500">
            {/* Filter by Room */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wide">
                <School size={12} />
                By Classroom
              </label>
              <select
                value={selectedRoomFilter}
                onChange={(e) => {
                  setSelectedRoomFilter(e.target.value);
                  setSelectedTrainerFilter('');
                  setSelectedBatchFilter('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose room...</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Trainer */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wide">
                <User size={12} />
                By Trainer
              </label>
              <select
                value={selectedTrainerFilter}
                onChange={(e) => {
                  setSelectedTrainerFilter(e.target.value);
                  setSelectedRoomFilter('');
                  setSelectedBatchFilter('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose trainer...</option>
                {trainers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Batch */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wide">
                <FolderGit size={12} />
                By Batch
              </label>
              <select
                value={selectedBatchFilter}
                onChange={(e) => {
                  setSelectedBatchFilter(e.target.value);
                  setSelectedRoomFilter('');
                  setSelectedTrainerFilter('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose batch...</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 text-[10px] font-bold text-slate-400 space-y-2 leading-relaxed">
            <span className="flex items-center gap-1.5 text-indigo-500 uppercase tracking-wider">
              <Move size={12} />
              Drag and Drop
            </span>
            <p>Drag any colored booking card and drop it into a different time slot on the grid to reschedule instantly.</p>
          </div>
        </div>

        {/* Right Calendar Panel */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[700px]">
          {/* Calendar Controller Bar */}
          <div className="border-b border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* View selectors */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/20">
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  view === 'day' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  view === 'week' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  view === 'month' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavigate(-1)}
                className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white min-w-44 text-center">
                {getHeaderLabel()}
              </h2>
              <button
                onClick={() => handleNavigate(1)}
                className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Legend guide */}
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={12} />
              9 AM - 5 PM Slots
            </div>
          </div>

          {/* Calendar Body Grids */}
          <div className="flex-1 overflow-y-auto overflow-x-auto relative min-w-[700px]">
            {loading ? (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 z-10 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : null}

            {/* WEEK VIEW RENDER */}
            {view === 'week' && (
              <table className="w-full table-fixed border-collapse select-none">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/10">
                    <th className="w-20 p-3 text-[10px] font-bold text-slate-400 uppercase text-center border-r border-slate-100 dark:border-slate-800/60">Time</th>
                    {getWeekDates().map((dateTarget, idx) => (
                      <th key={idx} className="p-3 text-[11px] font-extrabold text-slate-700 dark:text-slate-350 text-center border-r border-slate-100 dark:border-slate-800/60">
                        {dateTarget.toLocaleDateString('en-US', { weekday: 'short' })}
                        <span className="block text-[13px] font-black text-slate-900 dark:text-white mt-0.5">{dateTarget.getDate()}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALENDAR_HOURS.map((hour, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-800/60 h-20">
                      {/* Left Hour cell */}
                      <td className="p-2 text-[10px] font-bold text-slate-400 text-center align-top border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/20">
                        {hour.label}
                      </td>
                      
                      {/* 6 Day cells */}
                      {getWeekDates().map((dateTarget, colIdx) => {
                        const cellDateStr = dateTarget.toISOString().split('T')[0];
                        // Filter allocations overlapping this cell date and hour
                        const cellAllocations = allocations.filter(alloc => {
                          const allocDateStr = new Date(alloc.date).toISOString().split('T')[0];
                          return allocDateStr === cellDateStr && (
                            (alloc.startTime >= hour.start && alloc.startTime < hour.end) ||
                            (alloc.endTime > hour.start && alloc.endTime <= hour.end) ||
                            (alloc.startTime <= hour.start && alloc.endTime >= hour.end)
                          );
                        });

                        return (
                          <td 
                            key={colIdx} 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, cellDateStr, hour.start, hour.end)}
                            className="p-1.5 align-top border-r border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors relative"
                          >
                            {cellAllocations.map(alloc => (
                              <div
                                key={alloc._id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, alloc)}
                                className="bg-indigo-50 border border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 p-2 rounded-xl text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 cursor-grab active:cursor-grabbing hover:shadow-xs shadow-indigo-600/5 flex flex-col justify-between h-full transition-all relative overflow-hidden"
                              >
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white truncate block">{alloc.batch?.name || 'Class'}</span>
                                  <span className="text-[9px] text-indigo-500 block mt-0.5 truncate">{alloc.room?.name}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-1">
                                  <span>{alloc.startTime}-{alloc.endTime}</span>
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* DAY VIEW RENDER */}
            {view === 'day' && (
              <table className="w-full table-fixed border-collapse select-none">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/10">
                    <th className="w-24 p-3 text-[10px] font-bold text-slate-400 uppercase text-center border-r border-slate-100 dark:border-slate-800/60">Time</th>
                    {rooms.map(room => (
                      <th key={room._id} className="p-3 text-[11px] font-extrabold text-slate-700 dark:text-slate-350 text-center border-r border-slate-100 dark:border-slate-800/60">
                        {room.name}
                        <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Room {room.roomNumber} (Cap: {room.capacity})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALENDAR_HOURS.map((hour, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-800/60 h-20">
                      {/* Left Hour cell */}
                      <td className="p-2 text-[10px] font-bold text-slate-400 text-center align-top border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/20">
                        {hour.label}
                      </td>
                      
                      {/* Room columns */}
                      {rooms.map((room) => {
                        const cellDateStr = currentDate.toISOString().split('T')[0];
                        // Filter allocations overlapping this room, date, and hour
                        const cellAllocations = allocations.filter(alloc => {
                          const allocDateStr = new Date(alloc.date).toISOString().split('T')[0];
                          return alloc.room?._id.toString() === room._id.toString() &&
                            allocDateStr === cellDateStr && (
                              (alloc.startTime >= hour.start && alloc.startTime < hour.end) ||
                              (alloc.endTime > hour.start && alloc.endTime <= hour.end) ||
                              (alloc.startTime <= hour.start && alloc.endTime >= hour.end)
                            );
                        });

                        return (
                          <td 
                            key={room._id} 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, cellDateStr, hour.start, hour.end, room._id)}
                            className="p-1.5 align-top border-r border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors relative"
                          >
                            {cellAllocations.map(alloc => (
                              <div
                                key={alloc._id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, alloc)}
                                className="bg-indigo-50 border border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 p-2 rounded-xl text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 cursor-grab active:cursor-grabbing hover:shadow-xs shadow-indigo-600/5 flex flex-col justify-between h-full transition-all relative overflow-hidden"
                              >
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white truncate block text-[11px]">{alloc.batch?.name || 'Class'}</span>
                                  <span className="text-[9px] text-indigo-500 block mt-0.5 truncate">Trainer: {alloc.trainer?.name}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-1">
                                  <span>{alloc.startTime}-{alloc.endTime}</span>
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* MONTH VIEW RENDER */}
            {view === 'month' && (
              <div className="grid grid-cols-7 h-full select-none">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="border-r border-b border-slate-100 dark:border-slate-800/60 p-3 text-center text-[10px] font-extrabold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/10">
                    {day}
                  </div>
                ))}
                {/* Construct calendar grid */}
                {(() => {
                  const cells = [];
                  const d = new Date(currentDate);
                  const year = d.getFullYear();
                  const month = d.getMonth();
                  
                  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday
                  const shiftIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Monday
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  // Blank padding cells for previous month
                  for (let i = 0; i < shiftIndex; i++) {
                    cells.push(<div key={`blank-${i}`} className="border-r border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/10 h-28" />);
                  }

                  // Day cells
                  for (let day = 1; day <= daysInMonth; day++) {
                    const cellDateStr = new Date(year, month, day).toISOString().split('T')[0];
                    const dayAllocs = allocations.filter(a => {
                      const ad = new Date(a.date).toISOString().split('T')[0];
                      return ad === cellDateStr;
                    });

                    cells.push(
                      <div 
                        key={day} 
                        className="border-r border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-2.5 h-28 flex flex-col justify-between align-top relative hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <span className="font-extrabold text-slate-500 text-xs block">{day}</span>
                        
                        <div className="space-y-1 overflow-y-auto max-h-16 w-full mt-1.5">
                          {dayAllocs.slice(0, 2).map((alloc, idx) => (
                            <div key={idx} className="bg-indigo-50/80 border border-indigo-200/20 dark:bg-indigo-950/10 dark:border-indigo-900/10 text-[9px] font-bold text-indigo-700 dark:text-indigo-400 p-1 rounded truncate">
                              {alloc.startTime} {alloc.batch?.name}
                            </div>
                          ))}
                          {dayAllocs.length > 2 && (
                            <div className="text-[8px] font-extrabold text-slate-400 uppercase pl-1">
                              + {dayAllocs.length - 2} more classes
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  return cells;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
