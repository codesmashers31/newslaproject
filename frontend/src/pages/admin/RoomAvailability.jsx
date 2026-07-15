import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  SlidersHorizontal, 
  MapPin, 
  Users, 
  School,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const RoomAvailability = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Set default time slot (e.g. current hour)
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:00`;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    return `${String(Math.min(23, now.getHours() + 2)).padStart(2, '0')}:00`;
  });

  const [floor, setFloor] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAvailability = async () => {
    if (!date || !startTime || !endTime) return;
    setLoading(true);
    try {
      const payload = {
        date,
        startTime,
        endTime,
        floor: floor !== '' ? Number(floor) : undefined,
        capacity: minCapacity !== '' ? Number(minCapacity) : undefined
      };

      const { data } = await API.post('/allocations/check-availability', payload);
      
      // Combine suggested, available, alternative and conflict rooms to display a unified dashboard
      const list = [];
      if (data.suggestedRoom) list.push(data.suggestedRoom);
      
      data.availableRooms?.forEach(r => {
        if (!list.find(x => x._id === r._id)) list.push(r);
      });
      
      data.alternativeRooms?.forEach(r => {
        if (!list.find(x => x._id === r._id)) list.push(r);
      });
      
      data.conflictRooms?.forEach(r => {
        if (!list.find(x => x._id === r._id)) {
          list.push({
            ...r,
            liveStatus: 'Occupied',
            color: 'Red'
          });
        }
      });

      // Sort list by room number
      list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      setRooms(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load live room status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [date, startTime, endTime, floor, minCapacity]);

  // Filter list locally for search query
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(search.toLowerCase()) ||
    room.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="text-indigo-600 dark:text-indigo-400" />
            Live Room Availability
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Monitor real-time classroom occupancy, current running lectures, and booking logs
          </p>
        </div>
      </div>

      {/* Control Panel (Filters) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} />
              Selected Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Time slot start */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Time slot end */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search size={12} />
              Quick search
            </label>
            <input
              type="text"
              placeholder="Search name or room #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          {/* Extra Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floor:</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
              >
                <option value="">All Floors</option>
                <option value="0">Ground Floor</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3">3rd Floor</option>
                <option value="4">4th Floor</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity:</label>
              <input
                type="number"
                min="0"
                placeholder="Min students"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Color Guide Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Reserved (Other Hours)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Occupied (Now)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of rooms availability status */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-16 text-center shadow-sm">
          <School size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Classrooms Available</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search query or floor filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isFree = room.color === 'Green';
            const isReserved = room.color === 'Orange';
            const isOccupied = room.color === 'Red';
            
            return (
              <div 
                key={room._id}
                className={`bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm relative overflow-hidden transition-all flex flex-col justify-between ${
                  isFree ? 'border-slate-200/85 dark:border-slate-800/85' : 
                  isReserved ? 'border-amber-300/40 dark:border-amber-900/20 shadow-amber-50/20' : 
                  'border-rose-300/40 dark:border-rose-900/20 shadow-rose-50/20'
                }`}
              >
                {/* Visual Accent Bar */}
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isFree ? 'bg-emerald-500' : isReserved ? 'bg-amber-500' : 'bg-rose-500'
                }`} />

                <div className="pl-2">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {room.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
                        Room {room.roomNumber}
                      </span>
                    </div>
                    
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isFree ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10' :
                      isReserved ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10' :
                      'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10'
                    }`}>
                      {room.liveStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/50 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} className="text-slate-400" />
                      <span>Floor {room.floor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-slate-400" />
                      <span>Cap: {room.capacity}</span>
                    </div>
                  </div>

                  {/* Render conflict detail if occupied */}
                  {isOccupied && room.conflictDetails && (
                    <div className="mt-2 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-500/10 p-3 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-400">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-500 mb-1">
                        <XCircle size={12} />
                        Current Running Lecture
                      </div>
                      <p>Batch: {room.conflictDetails.batchName}</p>
                      <p className="mt-0.5 font-semibold text-rose-700/80">Trainer: {room.conflictDetails.trainerName}</p>
                      <p className="mt-0.5 font-semibold text-rose-700/80">Time: {room.conflictDetails.timeSlot}</p>
                    </div>
                  )}

                  {/* Render other allocations list if reserved */}
                  {room.allocationsToday && room.allocationsToday.length > 0 && !isOccupied && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Scheduled Today ({room.allocationsToday.length})</span>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {room.allocationsToday.map((a, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
                            {a.timeSlot} - {a.batch}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isFree && (
                    <div className="mt-2 bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-500/10 p-3 rounded-xl text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Ready for bookings in this timeslot</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomAvailability;
