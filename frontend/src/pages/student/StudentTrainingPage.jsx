import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { BookOpen, Lock, Search, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/primitives';

const StudentTrainingPage = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);

  // Modals
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [aptiModalOpen, setAptiModalOpen] = useState(false);

  // Selected IDs
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  const [selectedAptiId, setSelectedAptiId] = useState(null);

  // Search State
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [aptiSearchQuery, setAptiSearchQuery] = useState('');

  // Lock States
  const [isTechLocked, setIsTechLocked] = useState(false);
  const [isAptiLocked, setIsAptiLocked] = useState(false);

  // Loading States
  const [savingTechTemp, setSavingTechTemp] = useState(false);
  const [lockingTech, setLockingTech] = useState(false);
  const [savingAptiTemp, setSavingAptiTemp] = useState(false);
  const [lockingApti, setLockingApti] = useState(false);

  const loadData = async () => {
    try {
      const [dashRes, batchRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches')
      ]);

      const myBatches = dashRes.data?.batches || [];
      setBatches(myBatches);
      setAvailableBatches(batchRes.data || []);

      const uObj = dashRes.data?.user || dashRes.data?.profile?.user || {};
      setIsTechLocked(!!uObj.isTechnicalLocked);
      setIsAptiLocked(!!uObj.isAptitudeLocked);

      // Initialize selected tech ids
      const tech = myBatches.filter((b) => b.course?.includes('Technical'));
      setSelectedTechIds(tech.map((b) => b._id));

      // Initialize selected apti id
      const apti = myBatches.find((b) => b.course?.includes('Aptitude'));
      setSelectedAptiId(apti ? apti._id : null);
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

  // Technical Save / Lock Handler
  const handleSaveTech = async (isPermanent = false) => {
    if (isPermanent) setLockingTech(true);
    else setSavingTechTemp(true);

    try {
      await API.post('/student/enrollments', {
        technicalBatchIds: selectedTechIds,
        isPermanent,
        targetDomain: 'Technical'
      });
      setTechModalOpen(false);
      if (isPermanent) setIsTechLocked(true);
      toast.success(isPermanent ? 'Technical Batches Permanently Locked!' : 'Technical Batches Saved!');
      loadData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update technical batches';
      toast.error(msg);
    } finally {
      setSavingTechTemp(false);
      setLockingTech(false);
    }
  };

  // Aptitude Save / Lock Handler
  const handleSaveApti = async (isPermanent = false) => {
    if (isPermanent) setLockingApti(true);
    else setSavingAptiTemp(true);

    try {
      await API.post('/student/enrollments', {
        aptitudeBatchId: selectedAptiId,
        isPermanent,
        targetDomain: 'Aptitude'
      });
      setAptiModalOpen(false);
      if (isPermanent) setIsAptiLocked(true);
      toast.success(isPermanent ? 'Aptitude Batch Permanently Locked!' : 'Aptitude Batch Saved!');
      loadData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update aptitude batch';
      toast.error(msg);
    } finally {
      setSavingAptiTemp(false);
      setLockingApti(false);
    }
  };

  const toggleTechBatch = (id) => {
    if (selectedTechIds.includes(id)) {
      setSelectedTechIds(selectedTechIds.filter((x) => x !== id));
    } else {
      setSelectedTechIds([...selectedTechIds, id]);
    }
  };

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    );
  }

  const techBatches = batches.filter((b) => b.course?.includes('Technical'));
  const commBatch = batches.find((b) => b.course?.includes('Communication'));
  const aptiBatch = batches.find((b) => b.course?.includes('Aptitude'));

  const availTechBatches = availableBatches
    .filter((b) => b.course?.includes('Technical'))
    .filter((b) => b.name?.toLowerCase().includes(techSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name.toLowerCase().includes(techSearchQuery.toLowerCase())));

  const availAptiBatches = availableBatches
    .filter((b) => b.course?.includes('Aptitude'))
    .filter((b) => b.name?.toLowerCase().includes(aptiSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name.toLowerCase().includes(aptiSearchQuery.toLowerCase())));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3.5 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-200/40">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Training</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage your batch enrollments and trainers</p>
        </div>
      </div>

      <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ASSIGNED BATCHES & TRAINERS</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. TECHNICAL TRAINING CARD */}
        <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 dark:text-white font-extrabold text-xs uppercase tracking-wide">TECHNICAL TRAINING</h3>
              {isTechLocked ? (
                <span className="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Lock size={12} /> Locked
                </span>
              ) : (
                <button
                  onClick={() => setTechModalOpen(true)}
                  className="bg-violet-100 dark:bg-violet-950/50 hover:bg-violet-200 text-violet-700 dark:text-violet-300 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors"
                >
                  Manage
                </button>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Assigned Batch</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {techBatches.length > 0 ? techBatches.map(b => b.name).join(', ') : 'Unassigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Trainer</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {techBatches.length > 0 && techBatches[0].trainers && techBatches[0].trainers.length > 0
                    ? techBatches[0].trainers.map(t => t.name).join(', ')
                    : 'Auto-Assigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Schedule</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">Mon-Fri • 9:00 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. COMMUNICATION SKILLS CARD */}
        <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 dark:text-white font-extrabold text-xs uppercase tracking-wide">COMMUNICATION SKILLS</h3>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                READ ONLY
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Assigned Batch</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {commBatch ? commBatch.name : 'Unassigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Trainer</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {commBatch && commBatch.trainers && commBatch.trainers.length > 0
                    ? commBatch.trainers.map(t => t.name).join(', ')
                    : 'Auto-Assigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Schedule</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">Tue & Thu • 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. APTITUDE & REASONING CARD */}
        <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 dark:text-white font-extrabold text-xs uppercase tracking-wide">APTITUDE & REASONING</h3>
              {isAptiLocked ? (
                <span className="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Lock size={12} /> Locked
                </span>
              ) : (
                <button
                  onClick={() => setAptiModalOpen(true)}
                  className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Assigned Batch</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {aptiBatch ? aptiBatch.name : 'Unassigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Trainer</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">
                  {aptiBatch && aptiBatch.trainers && aptiBatch.trainers.length > 0
                    ? aptiBatch.trainers.map(t => t.name).join(', ')
                    : 'Auto-Assigned'}
                </p>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-3">
                <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold">Schedule</span>
                <p className="text-gray-900 dark:text-white font-black mt-0.5">Mon-Fri • 11:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Batches Modal */}
      {techModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Manage Technical Batches</h2>
              <button onClick={() => setTechModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches by name or trainer..."
                value={techSearchQuery}
                onChange={(e) => setTechSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0c0d12]/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {availTechBatches.map((b) => {
                const isSelected = selectedTechIds.includes(b._id);
                return (
                  <div
                    key={b._id}
                    onClick={() => !isTechLocked && toggleTechBatch(b._id)}
                    className={`flex items-center p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected ? 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800' : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300'}`}>
                      {isSelected && <CheckCircle2 size={13} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSaveTech(false)}
                disabled={savingTechTemp || lockingTech || isTechLocked}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                {savingTechTemp ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Temp'}
              </button>
              <button
                onClick={() => handleSaveTech(true)}
                disabled={savingTechTemp || lockingTech || isTechLocked}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-[#4F46E5] hover:bg-[#4338ca] text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {lockingTech ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Lock size={14} />
                    <span>{isTechLocked ? 'Locked' : 'Lock Selection'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aptitude Batch Modal */}
      {aptiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Select Aptitude Batch</h2>
              <button onClick={() => setAptiModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search batches..."
                value={aptiSearchQuery}
                onChange={(e) => setAptiSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0c0d12]/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {availAptiBatches.map((b) => {
                const isSelected = selectedAptiId === b._id;
                return (
                  <div
                    key={b._id}
                    onClick={() => !isAptiLocked && setSelectedAptiId(b._id)}
                    className={`flex items-center p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected ? 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800' : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300'}`}>
                      {isSelected && <CheckCircle2 size={13} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSaveApti(false)}
                disabled={savingAptiTemp || lockingApti || isAptiLocked}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                {savingAptiTemp ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Temp'}
              </button>
              <button
                onClick={() => handleSaveApti(true)}
                disabled={savingAptiTemp || lockingApti || isAptiLocked}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-[#4F46E5] hover:bg-[#4338ca] text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {lockingApti ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Lock size={14} />
                    <span>{isAptiLocked ? 'Locked' : 'Lock Selection'}</span>
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
