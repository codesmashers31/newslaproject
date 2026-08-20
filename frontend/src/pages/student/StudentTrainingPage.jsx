import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle2, Search, Layers, ArrowLeft, RefreshCw, Lock } from 'lucide-react';

const StudentTrainingPage = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [dashData, setDashData] = useState(null);

  // Modals
  const [techModalVisible, setTechModalVisible] = useState(false);
  const [aptiModalVisible, setAptiModalVisible] = useState(false);
  const [commModalVisible, setCommModalVisible] = useState(false);

  // Selected IDs
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  const [selectedAptiId, setSelectedAptiId] = useState(null);
  const [selectedCommId, setSelectedCommId] = useState(null);

  // Search State
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [aptiSearchQuery, setAptiSearchQuery] = useState('');
  const [commSearchQuery, setCommSearchQuery] = useState('');

  // Saving States
  const [savingTech, setSavingTech] = useState(false);
  const [savingApti, setSavingApti] = useState(false);
  const [savingComm, setSavingComm] = useState(false);

  const getBatchDomain = (batch) => {
    if (!batch) return 'Technical';
    if (batch.department === 'Aptitude') return 'Aptitude';
    if (batch.department === 'Communication') return 'Communication';
    if (batch.department === 'Technical') return 'Technical';

    const course = (batch.course || '').toLowerCase();
    const name = (batch.name || '').toLowerCase();
    if (course.includes('aptitude') || course.includes('quant') || course.includes('reasoning') || name.includes('aptitude') || name.includes('quant')) {
      return 'Aptitude';
    }
    if (course.includes('communication') || course.includes('softskills') || course.includes('english') || course.includes('verbal') || name.includes('communication') || name.includes('softskill')) {
      return 'Communication';
    }
    return 'Technical';
  };

  const resolveBatchSchedule = (batch, defaultDepartment) => {
    if (!batch) return 'Not Assigned';
    if (batch.startTime && batch.endTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : (batch.scheduleDays ? `${batch.scheduleDays} • ` : 'Mon - Fri • ');
      return `${daysPrefix}${batch.startTime} – ${batch.endTime}`;
    }
    if (batch.schedule && batch.schedule !== 'Schedule Not Set') {
      return batch.schedule;
    }
    
    if (batch.name) {
      const explicitMatch = batch.name.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
      if (explicitMatch) {
        return `Mon - Fri • ${explicitMatch[1]} – ${explicitMatch[2]}`;
      }
      const match = batch.name.match(/(\d{1,2})-(\d{1,2})/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        const formatTime = (h) => {
          if (h === 12) return '12:00 PM';
          if (h < 8) return `0${h}:00 PM`;
          return `${h < 10 ? '0' : ''}${h}:00 AM`;
        };
        return `Mon - Fri • ${formatTime(start)} – ${formatTime(end)}`;
      }
    }
    return 'Not Assigned';
  };

  const loadData = async () => {
    try {
      const [dashRes, batchRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches')
      ]);
      
      const myBatches = dashRes.data?.batches || [];
      const available = batchRes.data || [];
      setDashData(dashRes.data);
      setBatches(myBatches);
      setAvailableBatches(available);

      const tech = myBatches.filter((b) => getBatchDomain(b) === 'Technical');
      setSelectedTechIds(tech.map((b) => String(b._id)));
      
      const apti = myBatches.find((b) => getBatchDomain(b) === 'Aptitude');
      setSelectedAptiId(apti ? String(apti._id) : null);

      const comm = myBatches.find((b) => getBatchDomain(b) === 'Communication');
      setSelectedCommId(comm ? String(comm._id) : null);
      
    } catch (error) {
      console.error('Failed to load training data', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTech = async (isLocked = false) => {
    setSavingTech(true);
    try {
      await API.post('/student/enrollments', {
        technicalBatchIds: selectedTechIds,
        targetDomain: 'Technical',
        isLocked
      });
      setTechModalVisible(false);
      toast.success(isLocked ? 'Technical Batches Locked' : 'Technical Batches Saved');
      loadData();
    } catch (error) {
      toast.error('Failed to update technical batches');
    } finally {
      setSavingTech(false);
    }
  };

  const handleSaveApti = async (isLocked = false) => {
    setSavingApti(true);
    try {
      await API.post('/student/enrollments', {
        aptitudeBatchId: selectedAptiId,
        targetDomain: 'Aptitude',
        isLocked
      });
      setAptiModalVisible(false);
      toast.success(isLocked ? 'Aptitude Batch Locked' : 'Aptitude Batch Saved');
      loadData();
    } catch (error) {
      toast.error('Failed to update aptitude batch');
    } finally {
      setSavingApti(false);
    }
  };

  const handleSaveComm = async (isLocked = false) => {
    setSavingComm(true);
    try {
      await API.post('/student/enrollments', {
        communicationBatchId: selectedCommId,
        targetDomain: 'Communication',
        isLocked
      });
      setCommModalVisible(false);
      toast.success(isLocked ? 'Communication Batch Locked' : 'Communication Batch Saved');
      loadData();
    } catch (error) {
      toast.error('Failed to update communication batch');
    } finally {
      setSavingComm(false);
    }
  };

  const toggleTechBatch = (id) => {
    const stringId = String(id);
    if (selectedTechIds.includes(stringId)) {
      setSelectedTechIds(selectedTechIds.filter(x => x !== stringId));
    } else {
      setSelectedTechIds([...selectedTechIds, stringId]);
    }
  };

  if (loading) {
    return <div className="p-5 text-center text-sm text-slate-500 animate-pulse">Loading Training Data...</div>;
  }

  const techBatches = batches.filter(b => getBatchDomain(b) === 'Technical');
  const commBatch = batches.find(b => getBatchDomain(b) === 'Communication');
  const aptiBatch = batches.find(b => getBatchDomain(b) === 'Aptitude');

  const availTechBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Technical')
    .filter(b => (b.name || '').toLowerCase().includes(techSearchQuery.toLowerCase()));
    
  const availAptiBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Aptitude')
    .filter(b => (b.name || '').toLowerCase().includes(aptiSearchQuery.toLowerCase()));

  const availCommBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Communication')
    .filter(b => (b.name || '').toLowerCase().includes(commSearchQuery.toLowerCase()));

  // Lock logic
  const isTechLocked = dashData?.profile?.isTechnicalLocked;
  const isAptiLocked = dashData?.profile?.isAptitudeLocked;
  const isCommLocked = dashData?.profile?.isCommunicationLocked; // Fallback, not strictly defined in model but logic matches

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm relative z-10 sticky top-0">
        <h1 className="text-xl font-black text-[#0F172A]">My Training</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Manage your batch enrollments</p>
      </div>

      <div className="p-5 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto">
        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">ASSIGNED BATCHES & TRAINERS</p>

        {/* 1. TECHNICAL TRAINING CARD */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
            <div className="flex items-center flex-wrap gap-2 flex-1">
              <h3 className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                TECHNICAL TRAINING
                {isTechLocked && <Lock size={12} className="text-gray-400" />}
              </h3>
              {techBatches.length > 0 && (
                <div className="bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Layers size={10} color="#8B5CF6" />
                  <span className="text-[#8B5CF6] text-[10px] font-black">{techBatches.length} Courses Selected</span>
                </div>
              )}
            </div>
            {!isTechLocked && (
              <button onClick={() => setTechModalVisible(true)} className="bg-[#F3E8FF] px-3.5 py-1.5 rounded-xl text-[#8B5CF6] text-[11px] font-black hover:bg-[#E9D5FF] transition-colors">
                Manage ({selectedTechIds.length})
              </button>
            )}
          </div>
          
          {techBatches.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]">
              <span className="text-[#64748B] text-xs font-semibold">No technical courses selected</span>
              <button onClick={() => setTechModalVisible(true)} className="mt-3 bg-[#8B5CF6] px-4 py-2 rounded-xl text-white text-xs font-bold hover:bg-[#7C3AED] transition-colors shadow-sm">
                Select Courses
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {techBatches.map((item, index) => (
                <div key={item._id || index} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#E0E7FF] text-[#4338CA] text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0">
                        {item.course || 'Technical'}
                      </span>
                      <span className="text-[#0F172A] text-sm font-black truncate">
                        {item.name ? item.name.replace(/\s*\(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\)/ig, '').trim() : 'Unassigned'}
                      </span>
                    </div>
                    <span className="text-[#64748B] text-[11px] block mt-1">Trainer: <strong className="text-[#0F172A]">{item.trainers && item.trainers.length > 0 ? item.trainers[0].name : 'Auto-Assigned'}</strong></span>
                  </div>
                  <div className="md:border-l md:border-slate-200 md:pl-4 pt-2 md:pt-0 border-t border-slate-200 mt-1 md:mt-0">
                    <span className="text-[#4F46E5] text-[11px] font-extrabold whitespace-nowrap">{resolveBatchSchedule(item)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. COMMUNICATION SKILLS CARD */}
        {(() => {
          const stats = commBatch?.attendanceStats || dashData?.communicationSummary || {
            startDate: '14-Aug-2026', trainingDay: 0, totalTrainingDays: 80, presentCount: 0, absentCount: 0, remainingDays: 80, attendancePercent: 100, progressPercent: 0
          };
          return (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                    COMMUNICATION SKILLS
                    {isCommLocked && <Lock size={12} className="text-gray-400" />}
                  </h3>
                  <span className="bg-amber-100 px-2 py-0.5 rounded-full text-amber-800 text-[10px] font-black hidden sm:inline-block">Target: 80 Days</span>
                </div>
                {!isCommLocked && (
                  <button onClick={() => setCommModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl text-white text-[11px] font-black hover:bg-[#4338CA] transition-colors">
                    Change
                  </button>
                )}
              </div>
              
              {!commBatch ? (
                <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]">
                  <span className="text-[#64748B] text-xs font-semibold">No communication course selected</span>
                  <button onClick={() => setCommModalVisible(true)} className="mt-3 bg-[#4F46E5] px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:bg-[#4338CA] transition-colors">
                    Select Course
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <span className="text-[#64748B] text-[10px] font-bold uppercase block">Assigned Batch</span>
                      <span className="text-[#0F172A] text-sm font-black block mt-1 truncate">
                        {commBatch.name ? commBatch.name.replace(/\s*\(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\)/ig, '').trim() : 'Unassigned'}
                      </span>
                    </div>
                    <div className="shrink-0 md:text-right">
                      <span className="text-[#64748B] text-[10px] font-bold uppercase block">Start Date</span>
                      <span className="text-[#0F172A] text-sm font-black block mt-1">{stats.startDate || '14-Aug-2026'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                    <span className="text-[#64748B] text-[10px] font-bold uppercase flex items-center">Schedule</span>
                    <span className="text-[#4F46E5] text-[11px] font-extrabold block">{resolveBatchSchedule(commBatch, 'Communication')}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-2 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <span className="text-slate-600 text-xs font-extrabold">Training Day</span>
                      <span className="text-slate-900 text-sm font-black">Day {stats.trainingDay || 0} / {stats.totalTrainingDays || 80}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 text-[11px]">Present: <strong className="font-extrabold text-emerald-600 text-xs">{stats.presentCount || 0}</strong></span>
                      <span className="text-slate-500 text-[11px]">Absent: <strong className="font-extrabold text-rose-500 text-xs">{stats.absentCount || 0}</strong></span>
                      <span className="text-slate-500 text-[11px]">Remaining: <strong className="font-extrabold text-slate-800 text-xs">{stats.remainingDays ?? 80}</strong></span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-1">
                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Attendance %</span>
                        <span className="block text-sm font-black text-emerald-600 mt-1">{stats.attendancePercent !== undefined ? stats.attendancePercent : 100}%</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Progress %</span>
                        <span className="block text-sm font-black text-indigo-600 mt-1">{stats.progressPercent || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 3. APTITUDE & REASONING CARD */}
        {(() => {
          const stats = aptiBatch?.attendanceStats || dashData?.aptitudeSummary || {
            startDate: '14-Aug-2026', trainingDay: 0, totalTrainingDays: 120, presentCount: 0, absentCount: 0, remainingDays: 120, attendancePercent: 100, progressPercent: 0
          };
          return (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm transition-all hover:shadow-md mb-4">
              <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                    APTITUDE & REASONING
                    {isAptiLocked && <Lock size={12} className="text-gray-400" />}
                  </h3>
                  <span className="bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-800 text-[10px] font-black hidden sm:inline-block">Target: 120 Days</span>
                </div>
                {!isAptiLocked && (
                  <button onClick={() => setAptiModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl text-white text-[11px] font-black hover:bg-[#4338CA] transition-colors">
                    Change
                  </button>
                )}
              </div>
              
              {!aptiBatch ? (
                <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]">
                  <span className="text-[#64748B] text-xs font-semibold">No aptitude course selected</span>
                  <button onClick={() => setAptiModalVisible(true)} className="mt-3 bg-[#4F46E5] px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:bg-[#4338CA] transition-colors">
                    Select Course
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <span className="text-[#64748B] text-[10px] font-bold uppercase block">Assigned Batch</span>
                      <span className="text-[#0F172A] text-sm font-black block mt-1 truncate">
                        {aptiBatch.name ? aptiBatch.name.replace(/\s*\(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\)/ig, '').trim() : 'Unassigned'}
                      </span>
                    </div>
                    <div className="shrink-0 md:text-right">
                      <span className="text-[#64748B] text-[10px] font-bold uppercase block">Start Date</span>
                      <span className="text-[#0F172A] text-sm font-black block mt-1">{stats.startDate || '14-Aug-2026'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                    <span className="text-[#64748B] text-[10px] font-bold uppercase flex items-center">Schedule</span>
                    <span className="text-[#4F46E5] text-[11px] font-extrabold block">{resolveBatchSchedule(aptiBatch, 'Aptitude')}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-2 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <span className="text-slate-600 text-xs font-extrabold">Training Day</span>
                      <span className="text-slate-900 text-sm font-black">Day {stats.trainingDay || 0} / {stats.totalTrainingDays || 120}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 text-[11px]">Present: <strong className="font-extrabold text-emerald-600 text-xs">{stats.presentCount || 0}</strong></span>
                      <span className="text-slate-500 text-[11px]">Absent: <strong className="font-extrabold text-rose-500 text-xs">{stats.absentCount || 0}</strong></span>
                      <span className="text-slate-500 text-[11px]">Remaining: <strong className="font-extrabold text-slate-800 text-xs">{stats.remainingDays ?? 120}</strong></span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-1">
                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Attendance %</span>
                        <span className="block text-sm font-black text-emerald-600 mt-1">{stats.attendancePercent !== undefined ? stats.attendancePercent : 100}%</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Progress %</span>
                        <span className="block text-sm font-black text-indigo-600 mt-1">{stats.progressPercent || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tech Batches Modal */}
      {techModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] slide-in-from-bottom-full sm:slide-in-from-bottom-0">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setTechModalVisible(false)} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-lg font-black text-gray-900 flex-1">Manage Technical ({selectedTechIds.length})</h2>
            </div>
            
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches by name or trainer..."
                value={techSearchQuery}
                onChange={(e) => setTechSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {availTechBatches.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No batches match your search.</div>
              ) : (
                availTechBatches.map((b) => {
                  const isSelected = selectedTechIds.includes(String(b._id));
                  return (
                    <div
                      key={b._id}
                      onClick={() => !isTechLocked && toggleTechBatch(b._id)}
                      className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0] hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                        isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' : 'border-[#64748B]/40 text-transparent'
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{b.name}</p>
                        <p className="text-[#64748B] text-xs mt-1">Course: {b.course || 'Technical'}</p>
                        <p className="text-[#64748B] text-xs mt-0.5 truncate">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'} • {resolveBatchSchedule(b)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <button
                onClick={() => handleSaveTech(false)}
                disabled={savingTech || isTechLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                {savingTech ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Temporary'}
              </button>
              <button
                onClick={() => handleSaveTech(true)}
                disabled={savingTech || isTechLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-black bg-[#4F46E5] text-white hover:bg-[#4338ca] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {savingTech ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Lock size={16} />
                    <span>Lock Selection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apti Modal */}
      {aptiModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] slide-in-from-bottom-full sm:slide-in-from-bottom-0">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setAptiModalVisible(false)} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-lg font-black text-gray-900 flex-1">Select Aptitude Batch</h2>
            </div>
            
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={aptiSearchQuery}
                onChange={(e) => setAptiSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {availAptiBatches.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No batches match your search.</div>
              ) : (
                availAptiBatches.map((b) => {
                  const isSelected = selectedAptiId === String(b._id);
                  return (
                    <div
                      key={b._id}
                      onClick={() => !isAptiLocked && setSelectedAptiId(String(b._id))}
                      className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0] hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                        isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' : 'border-[#64748B]/40 text-transparent'
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{b.name}</p>
                        <p className="text-[#64748B] text-xs mt-1 truncate">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'} • {resolveBatchSchedule(b)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <button
                onClick={() => handleSaveApti(false)}
                disabled={savingApti || isAptiLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                {savingApti ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Temporary'}
              </button>
              <button
                onClick={() => handleSaveApti(true)}
                disabled={savingApti || isAptiLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-black bg-[#4F46E5] text-white hover:bg-[#4338ca] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {savingApti ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Lock size={16} />
                    <span>Lock Selection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comm Modal */}
      {commModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] slide-in-from-bottom-full sm:slide-in-from-bottom-0">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setCommModalVisible(false)} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-lg font-black text-gray-900 flex-1">Select Communication Batch</h2>
            </div>
            
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={commSearchQuery}
                onChange={(e) => setCommSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {availCommBatches.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">No batches match your search.</div>
              ) : (
                availCommBatches.map((b) => {
                  const isSelected = selectedCommId === String(b._id);
                  return (
                    <div
                      key={b._id}
                      onClick={() => !isCommLocked && setSelectedCommId(String(b._id))}
                      className={`flex items-center p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0] hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                        isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' : 'border-[#64748B]/40 text-transparent'
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{b.name}</p>
                        <p className="text-[#64748B] text-xs mt-1 truncate">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'} • {resolveBatchSchedule(b)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <button
                onClick={() => handleSaveComm(false)}
                disabled={savingComm || isCommLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                {savingComm ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Temporary'}
              </button>
              <button
                onClick={() => handleSaveComm(true)}
                disabled={savingComm || isCommLocked}
                className="flex-1 py-3.5 rounded-xl text-sm font-black bg-[#4F46E5] text-white hover:bg-[#4338ca] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {savingComm ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Lock size={16} />
                    <span>Lock Selection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTrainingPage;
