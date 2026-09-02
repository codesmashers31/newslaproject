import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  Calendar, 
  Clock, 
  Flame, 
  Award, 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Zap, 
  Trophy, 
  ArrowRight,
  BookOpen,
  Code2,
  Brain,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/primitives';

const categoryColors = {
  'DSA': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Web Development': 'bg-blue-50 text-blue-700 border-blue-200',
  'Aptitude': 'bg-amber-50 text-amber-700 border-amber-200',
  'Communication': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Revision': 'bg-purple-50 text-purple-700 border-purple-200',
  'Core Subjects': 'bg-rose-50 text-rose-700 border-rose-200',
  'Break': 'bg-slate-50 text-slate-600 border-slate-200'
};

const categoryIcons = {
  'DSA': Code2,
  'Web Development': BookOpen,
  'Aptitude': Brain,
  'Communication': MessageSquare,
  'Revision': RefreshCw,
  'Core Subjects': BookOpen,
  'Break': Clock
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const StudyTimetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(getTodayStr());
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('routine'); // 'routine' | 'leaderboard' | 'config'
  
  // Routine configuration state
  const [config, setConfig] = useState({
    wakeUpTime: '06:30',
    sleepTime: '23:00',
    studyPace: 'Normal',
    track: 'Full Stack'
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const loadTimetable = async () => {
    try {
      const { data } = await API.get('/timetable/my');
      if (data?.data) {
        setTimetable(data.data);
        setConfig({
          wakeUpTime: data.data.wakeUpTime || '06:30',
          sleepTime: data.data.sleepTime || '23:00',
          studyPace: data.data.studyPace || 'Normal',
          track: 'Full Stack'
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data } = await API.get('/timetable/leaderboard');
      if (data?.data) setLeaderboard(data.data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  };

  useEffect(() => {
    loadTimetable();
    loadLeaderboard();
  }, []);

  const handleDateChange = (direction) => {
    const current = new Date(activeDate);
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const newDateStr = current.toISOString().split('T')[0];

    if (timetable?.startDate && newDateStr < timetable.startDate) {
      toast.error('Cannot navigate prior to timetable creation start date.');
      return;
    }
    setActiveDate(newDateStr);
  };

  const handleToggleSlot = async (slotId) => {
    const todayStr = getTodayStr();
    if (activeDate > todayStr) {
      toast.error('Cannot complete future time slots ahead of time.');
      return;
    }
    if (timetable?.startDate && activeDate < timetable.startDate) {
      toast.error('Cannot modify logs before timetable creation date.');
      return;
    }

    try {
      const { data } = await API.post('/timetable/my/check-slot', {
        date: activeDate,
        slotId
      });
      if (data?.data) {
        setTimetable(data.data);
        toast.success(data.message || 'Slot status updated');
        loadLeaderboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update slot');
    }
  };

  const handleCheckAll = async () => {
    const todayStr = getTodayStr();
    if (activeDate > todayStr) {
      toast.error('Cannot complete future slots ahead of time.');
      return;
    }

    try {
      const { data } = await API.post('/timetable/my/check-all', { date: activeDate });
      if (data?.data) {
        setTimetable(data.data);
        toast.success('All daily slots marked done! +25 Bonus XP Earned!');
        loadLeaderboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check all slots');
    }
  };

  const handleSaveRoutineConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const { data: previewData } = await API.post('/timetable/generate', config);
      if (previewData?.data?.slots) {
        const { data: savedData } = await API.post('/timetable/my', {
          studyPace: config.studyPace,
          wakeUpTime: config.wakeUpTime,
          sleepTime: config.sleepTime,
          slots: previewData.data.slots
        });
        if (savedData?.data) {
          setTimetable(savedData.data);
          toast.success('Study routine generated and saved successfully!');
          setActiveTab('routine');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) return <PageSkeleton variant="list" />;

  const todayStr = getTodayStr();
  const isFutureDate = activeDate > todayStr;
  const isPastDisabled = timetable?.startDate && activeDate <= timetable.startDate;

  const activeDaily = timetable?.dailyCompletions?.find(d => d.date === activeDate);
  const completedIds = activeDaily?.completedSlotIds || [];
  const completionRate = activeDaily?.completionRate || 0;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">MODULE 1 • GAMIFIED ROUTINE</span>
            <h1 className="text-xl font-black text-[#0F172A] mt-0.5">Study Timetable & Routine</h1>
          </div>
          
          {/* XP & Streak Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
              <Zap size={15} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-800">{timetable?.xpPoints || 0} XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-2xl">
              <Flame size={15} className="text-rose-500 fill-rose-500" />
              <span className="text-xs font-black text-rose-700">{timetable?.streak || 0} Days</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 max-w-4xl mx-auto border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'routine' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daily Routine
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            XP Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'config' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Routine Generator
          </button>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">

        {/* TAB 1: DAILY ROUTINE */}
        {activeTab === 'routine' && (
          <>
            {/* Date Picker Bar & 1-Click Complete */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDateChange('prev')}
                  disabled={isPastDisabled}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} className="text-slate-700" />
                </button>
                
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <span className="text-sm font-black text-[#0F172A]">
                    {activeDate === todayStr ? `Today (${activeDate})` : activeDate}
                  </span>
                </div>

                <button
                  onClick={() => handleDateChange('next')}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight size={18} className="text-slate-700" />
                </button>
              </div>

              {/* Progress & 1-Click Button */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold block">Completion</span>
                  <span className="text-xs font-black text-indigo-700">{completionRate}% Done</span>
                </div>

                <button
                  onClick={handleCheckAll}
                  disabled={isFutureDate || activeDaily?.isFullyDone}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Zap size={14} />
                  <span>1-Click Mark All (+25 XP)</span>
                </button>
              </div>
            </div>

            {/* Strict Notice for Future/Past */}
            {isFutureDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-800 font-semibold flex items-center gap-2">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span>Viewing future schedule. Check-in actions unlock on this date.</span>
              </div>
            )}

            {/* Slots Timeline */}
            <div className="flex flex-col gap-3.5">
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <span>Daily Action Slots</span>
                <span className="text-xs font-semibold text-slate-400">({timetable?.slots?.length || 0} Slots)</span>
              </h2>

              {timetable?.slots?.map((slot, idx) => {
                const isCompleted = completedIds.includes(slot.slotId);
                const IconComp = categoryIcons[slot.category] || BookOpen;
                const colorClasses = categoryColors[slot.category] || 'bg-slate-50 text-slate-700 border-slate-200';

                return (
                  <div
                    key={slot.slotId || idx}
                    className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-xs transition-all flex items-center justify-between gap-4 ${
                      isCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleToggleSlot(slot.slotId)}
                        disabled={isFutureDate}
                        className={`p-1 rounded-full transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                          isCompleted ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={24} className="fill-emerald-100" /> : <Circle size={24} />}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${colorClasses}`}>
                            {slot.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {slot.startTime} – {slot.endTime}
                          </span>
                          {slot.isMandatory && (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.2 rounded-md">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <h3 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {slot.activity}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isCompleted ? '+10 XP' : '10 XP'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <span>Student XP & Streak Leaderboard</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Top rankers earn priority recruiter referrals</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {leaderboard.map((user) => (
                <div key={user.rank} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center text-xs font-black ${
                      user.rank === 1 ? 'text-amber-500 text-sm' : user.rank === 2 ? 'text-slate-400 text-sm' : user.rank === 3 ? 'text-amber-700 text-sm' : 'text-slate-400'
                    }`}>
                      #{user.rank}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-700">
                      {user.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{user.studentName}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{user.slaeId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-600">{user.xpPoints} XP</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">{user.streak} day streak</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GENERATE ROUTINE */}
        {activeTab === 'config' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0F172A]">AI Smart Routine Configurator</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Customize daily study hours, wake-up schedule, and pace</p>
              </div>
            </div>

            <form onSubmit={handleSaveRoutineConfig} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Wake-up Time</label>
                  <input
                    type="time"
                    value={config.wakeUpTime}
                    onChange={(e) => setConfig({ ...config, wakeUpTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sleep Time</label>
                  <input
                    type="time"
                    value={config.sleepTime}
                    onChange={(e) => setConfig({ ...config, sleepTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Study Pace</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Normal', 'Intense', 'Placement Sprint'].map((pace) => (
                    <button
                      key={pace}
                      type="button"
                      onClick={() => setConfig({ ...config, studyPace: pace })}
                      className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                        config.studyPace === pace ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pace}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="mt-4 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingConfig ? 'Generating Schedule...' : 'Regenerate & Apply Timetable'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudyTimetable;
