import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  FolderGit, 
  AlertTriangle, 
  CheckCircle, 
  Check, 
  ArrowRight,
  School,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RoomAllocation = () => {
  // Existing data arrays
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  // Selection states
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Availability query response states
  const [checking, setChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load initial dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [batchesRes, trainersRes] = await Promise.all([
          API.get('/admin/batches'),
          API.get('/admin/trainers')
        ]);
        setBatches(batchesRes.data || []);
        // Only active trainers or trainers with valid roles
        setTrainers(trainersRes.data || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load batches or trainers data');
      }
    };

    loadDropdownData();
  }, []);

  // Trigger check-availability whenever key schedule fields change
  useEffect(() => {
    if (date && startTime && endTime) {
      handleCheckAvailability();
    }
  }, [date, startTime, endTime, selectedTrainer, selectedBatch]);

  const handleCheckAvailability = async () => {
    setChecking(true);
    setSelectedRoom(null);
    try {
      const payload = {
        date,
        startTime,
        endTime,
        trainerId: selectedTrainer,
        batchId: selectedBatch
      };

      const { data } = await API.post('/allocations/check-availability', payload);
      setAvailabilityResult(data);
      if (data.suggestedRoom) {
        setSelectedRoom(data.suggestedRoom);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to run availability and conflict checks');
    } finally {
      setChecking(false);
    }
  };

  const handleBookRoom = async () => {
    if (!selectedRoom) {
      toast.error('Please select a classroom first');
      return;
    }

    setLoading(true);
    try {
      await API.post('/allocations', {
        room: selectedRoom._id,
        batch: selectedBatch,
        trainer: selectedTrainer,
        date,
        startTime,
        endTime
      });
      
      toast.success('Room allocated successfully!');
      // Reset form
      setSelectedBatch('');
      setSelectedTrainer('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setAvailabilityResult(null);
      setSelectedRoom(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Calendar className="text-indigo-600 dark:text-indigo-400" />
          Book Classroom
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          Create room allocations, inspect trainer schedules, and detect classroom double-bookings automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 lg:col-span-5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <School size={20} className="text-indigo-600" />
            Allocation Details
          </h2>
          
          <div className="space-y-4">
            {/* Batch Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderGit size={12} />
                Select Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose Batch...</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.course}) - {b.students?.length || 0} Students
                  </option>
                ))}
              </select>
            </div>

            {/* Trainer Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} />
                Select Trainer
              </label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose Trainer...</option>
                {trainers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} />
                Schedule Date
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Time Slot Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Book Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={handleBookRoom}
              disabled={loading || !selectedRoom || !selectedBatch || !selectedTrainer}
              className={`w-full py-4 rounded-2xl font-bold text-xs select-none transition-all flex items-center justify-center gap-2 ${
                selectedRoom && selectedBatch && selectedTrainer
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              Book Classroom
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {checking ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm h-full"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <h3 className="font-bold text-slate-900 dark:text-white">Querying Availability...</h3>
                <p className="text-xs text-slate-500 mt-1.5">Checking schedules, double bookings, and room conflicts</p>
              </motion.div>
            ) : !availabilityResult ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-12 py-16 flex flex-col items-center justify-center text-center shadow-sm"
              >
                <Info size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white">Awaiting Schedule Details</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Specify date, start/end time, trainer, and batch on the left. The live checker will automatically scan rooms and trainer workloads.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Conflict Warnings */}
                {availabilityResult.trainerConflict && (
                  <div className="bg-rose-50 border border-rose-200/50 dark:bg-rose-950/15 dark:border-rose-900/35 p-4 rounded-2xl flex gap-3 text-rose-800 dark:text-rose-400">
                    <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Trainer Schedule Overlap</h4>
                      <p className="text-xs font-medium mt-1 leading-relaxed">
                        Trainer <strong>{availabilityResult.trainerConflict.trainerName}</strong> is already teaching in Room <strong>{availabilityResult.trainerConflict.roomName}</strong> from {availabilityResult.trainerConflict.timeSlot}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggested Room Card */}
                {availabilityResult.suggestedRoom ? (
                  <div className="bg-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-600/15 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
                      <School size={200} />
                    </div>
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div>
                        <span className="bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 w-max">
                          <Sparkles size={11} />
                          Suggested Classroom
                        </span>
                        <h3 className="text-2xl font-black mt-3">
                          {availabilityResult.suggestedRoom.name}
                        </h3>
                        <p className="text-xs text-indigo-100 font-semibold mt-1">
                          Room {availabilityResult.suggestedRoom.roomNumber} • Floor {availabilityResult.suggestedRoom.floor === 0 ? 'G' : availabilityResult.suggestedRoom.floor}
                        </p>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl border border-white/15">
                        <CheckCircle size={24} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold mb-6">
                      <div>
                        <span className="text-indigo-200 text-[10px] block">Room Capacity</span>
                        <span className="text-sm mt-0.5 block">{availabilityResult.suggestedRoom.capacity} Students</span>
                      </div>
                      <div>
                        <span className="text-indigo-200 text-[10px] block">Room Status</span>
                        <span className="text-sm mt-0.5 block">100% Available</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRoom(availabilityResult.suggestedRoom)}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-md transition-all select-none ${
                        selectedRoom?._id === availabilityResult.suggestedRoom._id
                          ? 'bg-white text-indigo-600 hover:bg-slate-50'
                          : 'bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-500/20'
                      }`}
                    >
                      {selectedRoom?._id === availabilityResult.suggestedRoom._id
                        ? 'Room Selected for Booking'
                        : 'Select Suggested Room'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200/50 dark:bg-amber-950/15 dark:border-amber-900/35 p-6 rounded-3xl text-center">
                    <AlertTriangle size={32} className="mx-auto text-amber-600 dark:text-amber-500 mb-2" />
                    <h3 className="font-bold text-amber-800 dark:text-amber-400">No Optimal Rooms Available</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-500/80 mt-1 max-w-sm mx-auto">
                      All active classrooms with matching capacities are fully booked at this hour. Check the alternatives below.
                    </p>
                  </div>
                )}

                {/* Alternative Rooms List */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Alternative Classrooms ({availabilityResult.availableRooms?.filter(r => r._id !== availabilityResult.suggestedRoom?._id).length || 0})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availabilityResult.availableRooms
                      ?.filter(r => r._id !== availabilityResult.suggestedRoom?._id)
                      .map((room) => (
                        <div 
                          key={room._id}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 cursor-pointer hover:shadow-xs transition-all relative overflow-hidden ${
                            selectedRoom?._id === room._id
                              ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                              : 'border-slate-200/80 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{room.name}</h4>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Room {room.roomNumber}</span>
                            </div>
                            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded border border-emerald-500/10">
                              Free
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                            <span>Floor {room.floor}</span>
                            <span>Cap: {room.capacity}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Capacity Mismatch Warnings */}
                {availabilityResult.alternativeRooms && availabilityResult.alternativeRooms.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      Size Mismatch Warnings ({availabilityResult.alternativeRooms.length})
                    </h3>
                    <div className="space-y-2.5">
                      {availabilityResult.alternativeRooms.map((room) => (
                        <div 
                          key={room._id}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-4 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer flex justify-between items-center ${
                            selectedRoom?._id === room._id
                              ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                              : 'border-slate-200/80 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle size={15} className="text-amber-500" />
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs">{room.name} (Room {room.roomNumber})</h4>
                              <span className="text-[10px] text-amber-600 block mt-0.5 font-semibold">{room.warning}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Cap: {room.capacity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Occupied Rooms / Conflicts list */}
                {availabilityResult.conflictRooms && availabilityResult.conflictRooms.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      Occupied Classrooms ({availabilityResult.conflictRooms.length})
                    </h3>
                    
                    <div className="space-y-2.5">
                      {availabilityResult.conflictRooms.map((room) => (
                        <div 
                          key={room._id}
                          className="p-4 rounded-xl border border-rose-200/50 bg-rose-50/10 dark:border-rose-950/20 dark:bg-rose-950/5 flex justify-between items-center opacity-70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-350 text-xs">{room.name} (Room {room.roomNumber})</h4>
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5 font-semibold">
                                Class: <strong>{room.conflictDetails.batchName}</strong> with {room.conflictDetails.trainerName} ({room.conflictDetails.timeSlot})
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">In Use</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RoomAllocation;
