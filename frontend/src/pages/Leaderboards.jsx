import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Trophy, Search, Filter, Shield, Award, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const Leaderboards = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  
  // Lists for dropdown filters
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get('/student/leaderboard');
        setLeaderboard(data);

        // Extract batches for filtering
        const batchNames = [...new Set(data.map(item => item.batchName))].filter(b => b && b !== 'Unassigned');
        setBatches(batchNames);
      } catch (error) {
        console.error('Error fetching leaderboard', error);
        toast.error('Failed to load leaderboard details');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-800 border-t-transparent"></div>
      </div>
    );
  }

  // Filter leaderboard lists
  const filteredLeaderboard = leaderboard.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBatch = selectedBatchFilter ? student.batchName === selectedBatchFilter : true;
    const matchesGrade = selectedGradeFilter ? student.grade === selectedGradeFilter : true;

    return matchesSearch && matchesBatch && matchesGrade;
  });

  // Extract Top 3 champions globally
  const topThree = leaderboard.slice(0, 3);

  // Helper for podium colors
  const podiumStyles = [
    { 
      order: 'order-2', 
      height: 'h-40', 
      bg: 'bg-gradient-to-t from-amber-500/20 to-amber-400/5 dark:from-amber-600/30 dark:to-amber-500/5', 
      border: 'border-amber-400/30 dark:border-amber-500/40', 
      text: 'text-amber-500',
      label: '1st'
    },
    { 
      order: 'order-1', 
      height: 'h-32', 
      bg: 'bg-gradient-to-t from-slate-400/20 to-slate-300/5 dark:from-slate-500/30 dark:to-slate-400/5', 
      border: 'border-slate-300/30 dark:border-slate-400/40', 
      text: 'text-slate-400',
      label: '2nd'
    },
    { 
      order: 'order-3', 
      height: 'h-28', 
      bg: 'bg-gradient-to-t from-amber-700/20 to-amber-600/5 dark:from-amber-800/30 dark:to-amber-700/5', 
      border: 'border-amber-700/30 dark:border-amber-800/40', 
      text: 'text-amber-700',
      label: '3rd'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-800 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500 fill-amber-500/10" />
          Leaderboards & Rankings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Celebrate monthly champions and track batch-level and institute-level performance rankings.
        </p>
      </div>

      {/* Global Podium (Top 3) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto items-end pt-12 pb-6">
          {topThree.map((champ, index) => {
            const style = podiumStyles[index];
            if (!style) return null;
            return (
              <div key={champ.studentId} className={`flex flex-col items-center ${style.order}`}>
                {/* Crown or trophy */}
                <div className="relative mb-2.5">
                  <div className={`w-14 h-14 rounded-full bg-white dark:bg-gray-900 border-2 ${style.border} flex items-center justify-center font-extrabold text-lg shadow-lg`}>
                    {champ.name.charAt(0)}
                  </div>
                  <span className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white dark:bg-gray-900 border ${style.border} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                <div className={`w-full ${style.height} ${style.bg} border-t-2 ${style.border} rounded-t-3xl flex flex-col items-center justify-center p-4 text-center shadow-lg backdrop-blur-md`}>
                  <p className="text-xs font-black truncate max-w-full mb-0.5">{champ.name}</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-full font-medium mb-2">{champ.batchName}</p>
                  <span className="text-base font-black tracking-tight">{champ.finalScore}%</span>
                  <span className="text-[8px] font-bold text-violet-500 uppercase tracking-widest mt-1">Grade {champ.grade}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search student by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-205 dark:border-gray-805 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-205 dark:border-gray-805 bg-transparent text-xs focus:ring-2 focus:ring-violet-500 dark:bg-[#12131a]"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-400" />
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-205 dark:border-gray-805 bg-transparent text-xs focus:ring-2 focus:ring-violet-500 dark:bg-[#12131a]"
            >
              <option value="">All Grades</option>
              <option value="A+">Grade A+</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>

        </div>

      </div>

      {/* Rankings List Table */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 text-left text-xs font-semibold text-gray-400 dark:text-gray-400">
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider text-center">Inst. Rank</th>
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider text-center">Batch Rank</th>
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider">Student</th>
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider text-center">Weighted Score</th>
                <th className="px-6 py-4.5 font-bold uppercase tracking-wider text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/80 text-sm">
              {filteredLeaderboard.map((student, idx) => (
                <tr
                  key={student.studentId}
                  className="hover:bg-violet-50/15 dark:hover:bg-gray-800/20 transition-all"
                >
                  <td className="px-6 py-4 text-center font-black text-gray-700 dark:text-gray-300">
                    {student.instituteRank === 1 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold">1</span>
                    ) : student.instituteRank === 2 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold">2</span>
                    ) : student.instituteRank === 3 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/10 dark:bg-amber-900/10 text-amber-700 dark:text-amber-500 font-bold">3</span>
                    ) : (
                      `#${student.instituteRank}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-semibold text-gray-400">
                    {student.batchRank > 0 ? `#${student.batchRank}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                    <div>
                      <p>{student.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-xs text-gray-500 dark:text-gray-400">
                    {student.batchName}
                  </td>
                  <td className="px-6 py-4 text-center font-bold tracking-tight">
                    {student.finalScore}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-lg ${
                      student.grade === 'A+' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      student.grade === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                      student.grade === 'B' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                      student.grade === 'C' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                    }`}>
                      {student.grade}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 font-medium">
                    No student rankings match selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
