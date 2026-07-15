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
  Info,
  X,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RoomAllocation = () => {
  // Existing data arrays
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  // Selection states
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Dropdown toggles & search queries
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  const [trainerDropdownOpen, setTrainerDropdownOpen] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');

  // Availability query response states
  const [checking, setChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Trainer Availability Modal states
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [tempAvailability, setTempAvailability] = useState([]);
  const [newDay, setNewDay] = useState('Monday');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Load initial dropdown data
  const loadDropdownData = async () => {
    try {
      const [batchesRes, trainersRes] = await Promise.all([
        API.get('/admin/batches'),
        API.get('/admin/trainers')
      ]);
      setBatches(batchesRes.data || []);
      setTrainers(trainersRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load batches or trainers data');
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  // Trigger check-availability whenever key schedule fields change
  useEffect(() => {
    if (date && startTime && endTime) {
      handleCheckAvailability();
    }
  }, [date, startTime, endTime, selectedTrainer, selectedBatches]);

  const handleCheckAvailability = async () => {
    setChecking(true);
    setSelectedRoom(null);
    try {
      const payload = {
        date,
        startTime,
        endTime,
        trainerId: selectedTrainer,
        batchId: selectedBatches
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
    if (selectedBatches.length === 0) {
      toast.error('Please select at least one batch');
      return;
    }

    setLoading(true);
    try {
      await API.post('/allocations', {
        room: selectedRoom._id,
        batch: selectedBatches,
        trainer: selectedTrainer,
        date,
        startTime,
        endTime
      });
      
      toast.success('Room allocated successfully!');
      // Reset form
      setSelectedBatches([]);
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

  // Availability Modal Handlers
  const openAvailabilityModal = () => {
    if (!selectedTrainer) {
      toast.error('Please select a trainer first');
      return;
    }
    const trainerObj = trainers.find(t => t._id === selectedTrainer);
    setTempAvailability(trainerObj?.trainerAvailability || []);
    setShowAvailabilityModal(true);
  };

  const handleAddSlot = () => {
    if (newStart >= newEnd) {
      toast.error('End time must be after start time');
      return;
    }
    if (newDay === 'All Days (Mon - Sun)') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else if (newDay === 'Weekdays (Mon - Fri)') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else if (newDay === 'Weekends (Sat - Sun)') {
      const days = ['Saturday', 'Sunday'];
      const newSlots = days.map(d => ({ dayOfWeek: d, startTime: newStart, endTime: newEnd }));
      setTempAvailability([...tempAvailability, ...newSlots]);
    } else {
      setTempAvailability([...tempAvailability, { dayOfWeek: newDay, startTime: newStart, endTime: newEnd }]);
    }
  };

  const handleRemoveSlot = (idx) => {
    setTempAvailability(tempAvailability.filter((_, i) => i !== idx));
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await API.put(`/admin/trainers/${selectedTrainer}/availability`, {
        availability: tempAvailability
      });
      toast.success('Trainer availability updated!');
      // Update local trainers state
      setTrainers(trainers.map(t => t._id === selectedTrainer ? { ...t, trainerAvailability: tempAvailability } : t));
      setShowAvailabilityModal(false);
      // Refresh check availability if fields are set
      if (date && startTime && endTime) {
        handleCheckAvailability();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save trainer availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Helper to resolve Trainer shift info for displaying inline availability
  const getTrainerShiftForSelectedDate = () => {
    if (!selectedTrainer || !date) return null;
    const trainerObj = trainers.find(t => t._id === selectedTrainer);
    if (!trainerObj) return null;
    if (!trainerObj.trainerAvailability || trainerObj.trainerAvailability.length === 0) {
      return '24/7 Shift (No constraints)';
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[new Date(date).getDay()];
    const slots = trainerObj.trainerAvailability.filter(s => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase());
    if (slots.length === 0) {
      return `No shifts scheduled for ${dayOfWeek}`;
    }
    return slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
  };

  const shiftInfo = getTrainerShiftForSelectedDate();

  // Filter lists based on search queries
  const filteredDropdownBatches = batches.filter(b => 
    b.name.toLowerCase().includes(batchSearchQuery.toLowerCase()) || 
    (b.course && b.course.toLowerCase().includes(batchSearchQuery.toLowerCase()))
  );

  const filteredDropdownTrainers = trainers.filter(t => 
    t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
    (t.role && t.role.toLowerCase().includes(trainerSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 font-sans">
          <Calendar className="text-indigo-600 dark:text-indigo-400" />
          Book Classroom
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium font-sans">
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
            {/* Batch Selection (Premium Dropdown Multi-Select with Search) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderGit size={12} />
                Select Batches (Multi-Select)
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-wrap items-center gap-1.5 justify-between cursor-pointer"
                >
                  <div className="flex flex-wrap gap-1">
                    {selectedBatches.length === 0 ? (
                      <span className="text-slate-400">Choose Batches...</span>
                    ) : (
                      selectedBatches.map(id => {
                        const b = batches.find(x => x._id === id);
                        return (
                          <span key={id} className="bg-indigo-55 dark:bg-indigo-955/40 text-indigo-750 dark:text-indigo-400 px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                            {b ? (b.batchId || b.name) : id}
                            <X 
                              size={10} 
                              className="cursor-pointer hover:text-indigo-900" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatches(selectedBatches.filter(x => x !== id));
                              }}
                            />
                          </span>
                        );
                      })
                    )}
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {batchDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBatchDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-2 z-20 max-h-60 overflow-y-auto rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl p-2 space-y-1">
                      {/* Search box inside dropdown */}
                      <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search batches..."
                            value={batchSearchQuery}
                            onChange={(e) => setBatchSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      
                      {filteredDropdownBatches.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-3">No matching batches found.</p>
                      ) : (
                        filteredDropdownBatches.map(b => {
                          const isChecked = selectedBatches.includes(b._id);
                          return (
                            <div
                              key={b._id}
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedBatches(selectedBatches.filter(id => id !== b._id));
                                } else {
                                  setSelectedBatches([...selectedBatches, b._id]);
                                }
                              }}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-indigo-55/60 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400' 
                                  : 'text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              <span>{b.batchId || b.name} ({b.course || 'General'})</span>
                              {isChecked && <Check size={14} className="text-indigo-600" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Trainer Selection (Premium Dropdown Single-Select with Search) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} />
                  Select Trainer
                </label>
                {selectedTrainer && (
                  <button
                    onClick={openAvailabilityModal}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Settings size={12} />
                    Trainer Shift
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTrainerDropdownOpen(!trainerDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between cursor-pointer"
                >
                  <span className={selectedTrainer ? 'text-slate-955 dark:text-white font-bold' : 'text-slate-400 font-medium'}>
                    {selectedTrainer 
                      ? (trainers.find(t => t._id === selectedTrainer)?.name || 'Choose Trainer...') 
                      : 'Choose Trainer...'}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {trainerDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTrainerDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-2 z-20 max-h-60 overflow-y-auto rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl p-2 space-y-1">
                      {/* Search box inside dropdown */}
                      <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search trainers..."
                            value={trainerSearchQuery}
                            onChange={(e) => setTrainerSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {filteredDropdownTrainers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-3">No matching trainers found.</p>
                      ) : (
                        filteredDropdownTrainers.map(t => (
                          <div
                            key={t._id}
                            onClick={() => {
                              setSelectedTrainer(t._id);
                              setTrainerDropdownOpen(false);
                            }}
                            className={`px-3.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900 ${
                              selectedTrainer === t._id 
                                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-700 dark:text-slate-350'
                            }`}
                          >
                            {t.name} ({t.role})
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shift Times indicator under selection */}
            {shiftInfo && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-650 dark:text-indigo-400 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-indigo-500/5">
                <Clock size={12} className="shrink-0" />
                <span>Trainer shift hours on selected date: <strong className="text-indigo-700 dark:text-indigo-300">{shiftInfo}</strong></span>
              </div>
            )}

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
              disabled={loading || !selectedRoom || selectedBatches.length === 0 || !selectedTrainer}
              className={`w-full py-4 rounded-2xl font-bold text-xs select-none transition-all flex items-center justify-center gap-2 ${
                selectedRoom && selectedBatches.length > 0 && selectedTrainer
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Book Classroom
                  <ArrowRight size={14} />
                </>
              )}
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
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm h-[400px] flex flex-col justify-center items-center"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Analyzing schedules...</h3>
                <p className="text-xs text-slate-400 mt-1">Resolving room usage and checking trainer availability slots</p>
              </motion.div>
            ) : availabilityResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Warnings / Alerts Panel */}
                {(availabilityResult.trainerConflict || availabilityResult.batchConflict || availabilityResult.trainerAvailabilityWarning) && (
                  <div className="bg-rose-50/50 dark:bg-rose-955/10 border border-rose-500/10 rounded-2xl p-4 space-y-2">
                    <div className="flex gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-455 items-start">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        {availabilityResult.trainerConflict && (
                          <p>
                            Trainer Conflict: Already allocated to Room "{availabilityResult.trainerConflict.roomName}" for Batch "{availabilityResult.trainerConflict.batchName}" at {availabilityResult.trainerConflict.timeSlot}.
                          </p>
                        )}
                        {availabilityResult.batchConflict && (
                          <p className="mt-1">
                            Batch Conflict: Batch "{availabilityResult.batchConflict.batchName}" is already scheduled in Room "{availabilityResult.batchConflict.roomName}" at {availabilityResult.batchConflict.timeSlot}.
                          </p>
                        )}
                        {availabilityResult.trainerAvailabilityWarning && (
                          <p className="mt-1">
                            Trainer Hours Warning: {availabilityResult.trainerAvailabilityWarning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Recommendation Widget */}
                {availabilityResult.suggestedRoom ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-850/50 rounded-3xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase select-none">
                        <Sparkles size={12} />
                        Recommended Classroom
                      </div>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Info size={12} />
                        Best capacity fit
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                          {availabilityResult.suggestedRoom.name}
                          <span className="text-sm font-semibold text-slate-50">Floor {availabilityResult.suggestedRoom.floor}</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Room Number: {availabilityResult.suggestedRoom.roomNumber}</p>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Capacity</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{availabilityResult.suggestedRoom.capacity} Students</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-indigo-200/20">
                      {availabilityResult.suggestedRoom.facilities.map((fac, idx) => (
                        <span key={idx} className="bg-white/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                          {fac}
                        </span>
                      ))}
                    </div>

                    {selectedRoom?._id === availabilityResult.suggestedRoom._id ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 select-none">
                        <CheckCircle size={16} />
                        Selected for Booking
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedRoom(availabilityResult.suggestedRoom)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md transition-all select-none"
                      >
                        Select Recommended Room
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-500/10 rounded-3xl p-8 text-center">
                    <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
                    <h3 className="font-extrabold text-amber-800 dark:text-amber-400 text-sm">No classrooms fit this capacity</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      All available rooms during this timeslot are smaller than the required total capacity.
                    </p>
                  </div>
                )}

                {/* Alternatives and Conflicts Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Alternative Rooms (Capacity warning) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <School size={14} className="text-amber-500" />
                      Smaller Classrooms ({availabilityResult.alternativeRooms.length})
                    </h4>
                    <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                      {availabilityResult.alternativeRooms.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No alternative vacant rooms.</p>
                      ) : (
                        availabilityResult.alternativeRooms.map(room => (
                          <div 
                            key={room._id} 
                            onClick={() => setSelectedRoom(room)}
                            className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              selectedRoom?._id === room._id
                                ? 'bg-indigo-55/65 border-indigo-500/30 text-indigo-900'
                                : 'bg-slate-50/50 border-slate-100 dark:border-slate-800/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-330'
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span>{room.name} ({room.roomNumber})</span>
                              <span className="text-[10px] text-amber-600">Cap: {room.capacity}</span>
                            </div>
                            <span className="text-[10px] text-amber-500 block mt-1">Warning: Under target capacity</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Occupied Classrooms */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <School size={14} className="text-rose-500" />
                      Occupied Classrooms ({availabilityResult.conflictRooms.length})
                    </h4>
                    <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                      {availabilityResult.conflictRooms.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No rooms occupied at this time.</p>
                      ) : (
                        availabilityResult.conflictRooms.map(room => (
                          <div key={room._id} className="p-3 bg-slate-50/30 dark:bg-slate-955/10 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs font-semibold text-slate-505">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-700 dark:text-slate-350">{room.name} ({room.roomNumber})</span>
                              <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded">Occupied</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Booked: {room.conflictDetails?.batchName} ({room.conflictDetails?.timeSlot})</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-16 text-center shadow-sm h-[400px] flex flex-col justify-center items-center"
              >
                <Calendar size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Awaiting Schedule Details</h3>
                <p className="text-xs text-slate-450 mt-1.5 max-w-sm">
                  Fill in the Date, Start Time, and End Time to run automatic conflict checking and view recommended rooms.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Trainer Availability / Working Hours Modal */}
      <AnimatePresence>
        {showAvailabilityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvailabilityModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Configure Working Hours</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Define available teaching timeslots for this trainer</p>
                </div>
                <button onClick={() => setShowAvailabilityModal(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350">
                  <X size={18} />
                </button>
              </div>

              {/* Add New Slot form */}
              <div className="bg-slate-50 dark:bg-slate-955/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                <h4 className="text-xs font-bold text-slate-855 dark:text-slate-200 flex items-center gap-1">
                  <Plus size={14} className="text-indigo-650" />
                  Add Availability Slot
                </h4>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="All Days (Mon - Sun)">All Days (Mon - Sun)</option>
                      <option value="Weekdays (Mon - Fri)">Weekdays (Mon - Fri)</option>
                      <option value="Weekends (Sat - Sun)">Weekends (Sat - Sun)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">Start Time</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-955 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">End Time</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-955 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSlot}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 dark:bg-indigo-600 dark:hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md transition-all select-none"
                >
                  Add Timeslot
                </button>
              </div>

              {/* Current Slots List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured Preferred Hours</h4>
                  {tempAvailability.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove all configured shift slots?')) {
                          setTempAvailability([]);
                        }
                      }}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Remove All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {tempAvailability.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No working hours slots configured. Defaults to 24/7 availability.</p>
                  ) : (
                    tempAvailability.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                        <span>{slot.dayOfWeek} • {slot.startTime} - {slot.endTime}</span>
                        <button 
                          onClick={() => handleRemoveSlot(idx)}
                          className="text-rose-500 hover:text-rose-700 transition-all p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Save / Close buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all select-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-650/20 transition-all select-none flex items-center justify-center"
                >
                  {savingAvailability ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Save Working Hours'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomAllocation;
