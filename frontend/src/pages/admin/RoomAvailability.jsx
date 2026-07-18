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
  HelpCircle,
  User,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

const RoomAvailability = () => {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'trainers'
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
  
  const [trainers, setTrainers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Helper to check time overlap (HH:MM strings)
  const isTimeOverlapping = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  const fetchAvailability = async () => {
    if (!date || !startTime || !endTime) return;
    setLoading(true);
    try {
      if (activeTab === 'rooms') {
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
      } else {
        // Fetch trainers and raw allocations for calculating availability locally
        const [trainersRes, allocsRes] = await Promise.all([
          API.get('/admin/trainers'),
          API.get('/allocations', { params: { date } })
        ]);
        setTrainers(trainersRes.data || []);
        setAllocations(allocsRes.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [activeTab, date, startTime, endTime, floor, minCapacity]);

  // Filter lists locally for search query
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(search.toLowerCase()) ||
    room.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getTrainerLiveStatus = (trainer) => {
    // 1. Check if trainer has an overlapping allocation in current time slot
    const overlap = allocations.find(a => 
      a.trainer?._id.toString() === trainer._id.toString() &&
      isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
    );

    if (overlap) {
      const formatBatchNames = (batchField) => {
        if (!batchField) return 'Unknown Batch';
        if (Array.isArray(batchField)) {
          return batchField.map(b => b.name).filter(Boolean).join(', ');
        }
        return batchField.name || 'Unknown Batch';
      };

      return {
        status: 'Occupied',
        color: 'Red',
        details: `Teaching Batch "${formatBatchNames(overlap.batch)}" in Room "${overlap.room?.name || 'Classroom'}" (${overlap.startTime} - ${overlap.endTime})`
      };
    }

    // 2. Check if selected time slot fits into trainer availability shifts
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[new Date(date).getDay()];
    const slots = trainer.trainerAvailability?.filter(s => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()) || [];

    if (slots.length === 0) {
      // If no shifts are configured, default to available 24/7
      return {
        status: 'Available',
        color: 'Green',
        details: '24/7 Available (No shift constraints)'
      };
    }

    const fitsShift = slots.some(s => startTime >= s.startTime && endTime <= s.endTime);
    if (fitsShift) {
      return {
        status: 'Available',
        color: 'Green',
        details: 'Available during shift hours'
      };
    }

    const slotsText = slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
    return {
      status: 'Outside Shift',
      color: 'Orange',
      details: `Outside configured shift hours for ${dayOfWeek} (Preferred slots: ${slotsText})`
    };
  };

  const filteredTrainers = trainers.filter(trainer => 
    trainer.name?.toLowerCase().includes(search.toLowerCase()) ||
    trainer.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="text-violet-800 dark:text-violet-400" />
            Live Availability Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Monitor real-time classroom occupancy, trainer availability shifts, and current schedules
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => {
            setActiveTab('rooms');
            setSearch('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-violet-800 text-white shadow-md shadow-violet-500/10'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <School size={14} />
          Classroom Availability
        </button>
        <button
          onClick={() => {
            setActiveTab('trainers');
            setSearch('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-2 ${
            activeTab === 'trainers'
              ? 'bg-violet-800 text-white shadow-md shadow-violet-500/10'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <User size={14} />
          Trainer Availability
        </button>
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Time slot start */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              Slot Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Time slot end */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              Slot End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              placeholder={activeTab === 'rooms' ? "Search name or room #..." : "Search trainer name or role..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          {/* Extra Filters for Rooms only */}
          {activeTab === 'rooms' ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floor:</label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none cursor-pointer"
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
          ) : (
            <div className="text-[11px] text-slate-405 font-bold">
              Showing trainers availability schedule filters
            </div>
          )}

          {/* Color Guide Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>{activeTab === 'rooms' ? 'Reserved (Other Hours)' : 'Outside Shift Hours'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Occupied / Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live status Grid display */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-800 border-t-transparent"></div>
        </div>
      ) : activeTab === 'rooms' ? (
        /* Classroom availability cards */
        filteredRooms.length === 0 ? (
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

                    {isOccupied && room.conflictDetails && (
                      <div className="mt-2 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-500/10 p-3 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-405">
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-500 mb-1">
                          <XCircle size={12} />
                          Current Running Lecture
                        </div>
                        <p>Batch: {room.conflictDetails.batchName}</p>
                        <p className="mt-0.5 font-semibold text-rose-700/80">Trainer: {room.conflictDetails.trainerName}</p>
                        <p className="mt-0.5 font-semibold text-rose-700/80">Time: {room.conflictDetails.timeSlot}</p>
                      </div>
                    )}

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
        )
      ) : (
        /* Trainer availability cards */
        filteredTrainers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-16 text-center shadow-sm">
            <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Trainers Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your trainer name or role query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map((trainer) => {
              const live = getTrainerLiveStatus(trainer);
              const isFree = live.color === 'Green';
              const isOutsideShift = live.color === 'Orange';
              const isOccupied = live.color === 'Red';

              // Get all allocations for this trainer today
              const trainerDayAllocs = allocations.filter(a => a.trainer?._id.toString() === trainer._id.toString());

              return (
                <div 
                  key={trainer._id}
                  className={`bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm relative overflow-hidden transition-all flex flex-col justify-between ${
                    isFree ? 'border-slate-200/85 dark:border-slate-800/85' : 
                    isOutsideShift ? 'border-amber-300/40 dark:border-amber-900/20 shadow-amber-50/20' : 
                    'border-rose-300/40 dark:border-rose-900/20 shadow-rose-50/20'
                  }`}
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isFree ? 'bg-emerald-500' : isOutsideShift ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />

                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {trainer.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
                          {trainer.role}
                        </span>
                      </div>
                      
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isFree ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10' :
                        isOutsideShift ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10' :
                        'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10'
                      }`}>
                        {isFree ? 'Available' : isOutsideShift ? 'Outside Shift' : 'Occupied'}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/50 py-2.5 text-xs font-semibold text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>Shift Status: <strong className="text-slate-700 dark:text-slate-350">{live.details}</strong></span>
                      </p>
                    </div>

                    {isOccupied && (
                      <div className="mt-2 bg-rose-50/50 dark:bg-rose-950/5 border border-rose-500/10 p-3 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-455">
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-500 mb-1">
                          <XCircle size={12} />
                          Active Booking Overlap
                        </div>
                        <p>{live.details}</p>
                      </div>
                    )}

                    {trainerDayAllocs.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">All Schedule Today ({trainerDayAllocs.length})</span>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {trainerDayAllocs.map((a, idx) => {
                            const formatBatchNames = (batchField) => {
                              if (!batchField) return 'Unknown Batch';
                              if (Array.isArray(batchField)) {
                                return batchField.map(b => b.name).filter(Boolean).join(', ');
                              }
                              return batchField.name || 'Unknown Batch';
                            };
                            return (
                              <div key={idx} className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[10px] font-bold text-slate-650 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50 leading-relaxed">
                                <p className="text-slate-700 dark:text-slate-300">{a.startTime} - {a.endTime} • Room {a.room?.roomNumber}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">Batch: {formatBatchNames(a.batch)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isFree && (
                      <div className="mt-2 bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-500/10 p-3 rounded-xl text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Ready to assign lectures in this slot</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default RoomAvailability;
