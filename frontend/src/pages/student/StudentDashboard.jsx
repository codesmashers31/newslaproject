import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  BookOpen,
  ChevronRight,
  Sparkles,
  FileDown,
  Mail,
  Phone,
  Bookmark,
  Trophy
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScorecard, setActiveScorecard] = useState('aptitude'); // 'aptitude' | 'communication' | 'technical'
  const [certificateClaiming, setCertificateClaiming] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/student/dashboard');
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClaimCertificate = async () => {
    setCertificateClaiming(true);
    try {
      await API.post('/student/certificate');
      toast.success('Certificate registered successfully!');
      generatePDFCertificate();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Certificate criteria not met');
    } finally {
      setCertificateClaiming(false);
    }
  };

  // Generate high-fidelity certificate using jsPDF
  const generatePDFCertificate = () => {
    if (!data) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const studentName = data.profile?.user?.name || 'Graduated Student';
    const courseName = data.batch?.course || 'Full Stack Placement Training Programme';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- Elegant Border Frame ---
    doc.setDrawColor(99, 102, 241); // Indigo border
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 281, 194); // outer frame
    
    doc.setDrawColor(219, 180, 74); // Gold inner border
    doc.setLineWidth(0.8);
    doc.rect(12, 12, 273, 186); // inner frame

    // Corner decorative lines
    doc.line(12, 22, 22, 12);
    doc.line(285, 22, 275, 12);
    doc.line(12, 188, 22, 198);
    doc.line(285, 188, 275, 198);

    // --- Header ---
    doc.setFont('Times', 'italic');
    doc.setFontSize(20);
    doc.setTextColor(115, 115, 115);
    doc.text('Certificate of Completion', 148, 42, { align: 'center' });

    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('THIS CREDENTIAL IS PROUDLY PRESENTED TO', 148, 56, { align: 'center' });

    // --- Student Name (Large elegant cursive/serif style) ---
    doc.setFont('Times', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(24, 24, 27);
    doc.text(studentName, 148, 76, { align: 'center' });

    // --- Award Text ---
    doc.setFont('Times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text('for having successfully completed all curriculum requirements and evaluations in', 148, 92, { align: 'center' });

    doc.setFont('Times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241); // Indigo color
    doc.text(courseName, 148, 106, { align: 'center' });

    // --- Progress summary details ---
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(115, 115, 115);
    doc.text(`Graded with honors across Aptitude (${data.progress.aptitude}%), Communication (${data.progress.communication}%), and Technical (${data.progress.technical}%) syllabi.`, 148, 122, { align: 'center' });

    // --- Date ---
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    doc.text(`Awarded on: ${dateStr}`, 148, 138, { align: 'center' });

    // --- Signature & Seal Mockups ---
    // Seal (Gold)
    doc.setFillColor(219, 180, 74);
    doc.circle(148, 166, 12, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL', 148, 165, { align: 'center' });
    doc.text('SEAL', 148, 168, { align: 'center' });

    // Left Signature
    doc.setDrawColor(180, 180, 180);
    doc.line(45, 172, 105, 172);
    doc.setFont('Courier', 'oblique');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('Director of Education', 75, 168, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('AUTHORIZED SIGNATURE', 75, 177, { align: 'center' });

    // Right Signature
    doc.line(189, 172, 249, 172);
    doc.setFont('Courier', 'oblique');
    doc.setFontSize(12);
    doc.text('Supervising Evaluator', 219, 168, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ACADEMIC REGISTRAR', 219, 177, { align: 'center' });

    doc.save(`Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-250 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-250 dark:bg-gray-800 rounded-3xl" />
          <div className="h-80 bg-gray-250 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  const { profile, placement, batch, attendance, scorecards, progress, notifications, upcomingClasses, leaderboardRank, placementReadiness, calculatedScores } = data;

  const currentScorecard = 
    activeScorecard === 'aptitude' ? scorecards.aptitude :
    activeScorecard === 'communication' ? scorecards.communication :
    scorecards.technical;

  const isEligibleForCertificate = progress.overall >= 80;
  const isCertificateClaimed = data.certificates?.length > 0;

  return (
    <div className="space-y-8">
      {/* 1. Welcoming Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-grid-white/[0.06] bg-[size:15px_15px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-100">Student Space</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Hello, {profile.user?.name}!</h1>
            <p className="text-sm text-indigo-100 mt-1">
              Enrolled in {batch ? `${batch.name} • ${batch.course}` : 'Unassigned Batch. Contact administrator.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Grades, Ranks and Placement readiness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ranks Card */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl backdrop-blur-md shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Trophy size={24} />
          </div>
          <div>
            <h4 className="text-xs text-gray-500 font-semibold uppercase">Leaderboard Ranks</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black">#{leaderboardRank?.institute || '—'}</span>
              <span className="text-[10px] text-gray-400">Inst. Rank</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">#{leaderboardRank?.batch || '—'}</span>
              <span className="text-[10px] text-gray-400">Batch Rank</span>
            </div>
          </div>
        </div>

        {/* Grade Card */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl backdrop-blur-md shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-2xl">
            <Award size={24} />
          </div>
          <div>
            <h4 className="text-xs text-gray-500 font-semibold uppercase">Overall Grade</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black">{calculatedScores?.grade || '—'}</span>
              <span className="text-[10px] text-gray-400">Grade Letter</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">({calculatedScores?.finalScorePercent || 0}%)</span>
              <span className="text-[10px] text-gray-400">Weighted Score</span>
            </div>
          </div>
        </div>

        {/* Placement Readiness Card */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl backdrop-blur-md shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-xs text-gray-500 font-semibold uppercase">Placement Readiness</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black">{placementReadiness?.percentage || 0}%</span>
              <span className="text-[10px] text-gray-400">Readiness</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {placementReadiness?.status || 'Critical'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Score & Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Overall Progress', value: progress.overall, color: 'bg-indigo-600' },
          { label: 'Aptitude Track', value: progress.aptitude, color: 'bg-blue-500' },
          { label: 'Communication Track', value: progress.communication, color: 'bg-purple-500' },
          { label: 'Technical Track', value: progress.technical, color: 'bg-emerald-500' }
        ].map((item, i) => (
          <div key={i} className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl backdrop-blur-md shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>{item.label}</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{item.value}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-850 h-2.5 rounded-full overflow-hidden">
              <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Certificate Claims Card */}
      {isEligibleForCertificate && (
        <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-300/30 dark:border-amber-950/20 p-6 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
              <Award size={26} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Course Certificate Available</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Congratulations! You completed over 80% of the training modules. Claim your official scorecard credential.
              </p>
            </div>
          </div>
          <button
            onClick={isCertificateClaimed ? generatePDFCertificate : handleClaimCertificate}
            disabled={certificateClaiming}
            className="bg-indigo-650 hover:bg-indigo-550 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>{isCertificateClaimed ? 'Download Certificate' : 'Claim Certificate'}</span>
          </button>
        </div>
      )}

      {/* 4. Placement preparation & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placement Log */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-250 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
          <h4 className="font-bold text-sm flex items-center gap-1.5 border-b pb-2 border-gray-150 dark:border-gray-850">
            <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
            Career Preparation timeline
          </h4>
          <div className="space-y-4 text-xs">
            {[
              { title: 'Resume Uploaded', check: placement.resumeUploaded },
              { title: 'Mock Interview Feedback', check: placement.mockInterviewCompleted },
              { title: 'Technical Interview evaluation', check: placement.technicalInterviewCompleted },
              { title: 'HR Round clearing', check: placement.hrInterviewCompleted }
            ].map((milestone, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-500">{milestone.title}</span>
                {milestone.check ? (
                  <span className="text-emerald-555 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={15} />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1 font-bold">
                    <AlertCircle size={15} />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <hr className="border-gray-200 dark:border-gray-805" />

          <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border text-xs">
            <p className="font-semibold text-gray-500 uppercase tracking-wider text-[9px]">Placement Status</p>
            <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mt-1">{placement.status || 'Not Started'}</p>
            {placement.companyName && (
              <p className="text-[10px] text-gray-500 mt-0.5">Company: {placement.companyName}</p>
            )}
          </div>
        </div>

        {/* Attendance chart */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-[#12131a]/60 border border-gray-250 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2 border-gray-150 dark:border-gray-850 mb-4">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
              Monthly Attendance Curves
            </h4>
            <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
              Rate: {attendance.percentage}%
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance.monthlyGraph}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Present" stroke="#6366f1" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Advanced Interactive Modules Dashboard */}
      <div className="bg-white border border-[#c7c4d7] rounded-3xl ambient-shadow overflow-hidden">
        {/* Module Switcher Tabs */}
        <div className="flex border-b border-[#c7c4d7] bg-[#f0f3ff]">
          {[
            { id: 'aptitude', name: 'Aptitude Module', icon: BookOpen },
            { id: 'communication', name: 'Communication Module', icon: Bookmark },
            { id: 'technical', name: 'Technical Module', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveScorecard(tab.id)}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
                  activeScorecard === tab.id
                    ? 'border-[#4648d4] text-[#4648d4] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeScorecard === 'aptitude' && (
            <div className="space-y-6">
              {/* Aptitude Dashboard Header Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Avg. Score</span>
                  <span className="text-xl font-extrabold text-blue-700 mt-1 block">8.2 / 10</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Practice Tests</span>
                  <span className="text-xl font-extrabold text-indigo-700 mt-1 block">16 / 16 Done</span>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Mock Assessments</span>
                  <span className="text-xl font-extrabold text-purple-700 mt-1 block">11 Cleared</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Trainer Status</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1 block">Readiness OK</span>
                </div>
              </div>

              {/* Grid: Modules Table and Leaderboard rank */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Modules & Scores */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Modules & Topic Grades</h4>
                  <div className="border border-[#c7c4d7] rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#c7c4d7] text-gray-500 font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3">Topic</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Score</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c7c4d7]">
                        {currentScorecard.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-800">{item.moduleName}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-extrabold">{item.marks}/10</td>
                            <td className="px-4 py-3.5 text-gray-500 max-w-[150px] truncate">{item.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Trainer Feedback & Class Rank */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Trainer Feedback</h4>
                  <div className="p-5 border border-[#c7c4d7] rounded-2xl bg-gray-50/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-sm">
                        AT
                      </div>
                      <div>
                        <p className="font-bold text-xs">Prof. Sarah Jenkins</p>
                        <p className="text-[10px] text-gray-450">Lead Aptitude Trainer</p>
                      </div>
                    </div>
                    <blockquote className="text-xs text-gray-600 italic bg-white p-3 rounded-xl border border-[#c7c4d7]">
                      "Strong logical reasoning skills. Needs minor practice on speed calculations for permutation and probability models. Overall readiness is very promising."
                    </blockquote>
                    <div className="pt-2 border-t border-[#c7c4d7] flex justify-between items-center text-xs">
                      <span className="text-gray-500">Track Progress</span>
                      <span className="font-extrabold text-[#4648d4]">84% Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeScorecard === 'communication' && (
            <div className="space-y-6">
              {/* Communication Skill Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { name: 'Reading', rating: '8.5/10', color: 'border-blue-200 bg-blue-50/50' },
                  { name: 'Writing', rating: '8.0/10', color: 'border-indigo-200 bg-indigo-50/50' },
                  { name: 'Speaking', rating: '9.0/10', color: 'border-purple-200 bg-purple-50/50' },
                  { name: 'Listening', rating: '9.5/10', color: 'border-pink-200 bg-pink-50/50' },
                  { name: 'Presentation', rating: '8.8/10', color: 'border-amber-200 bg-amber-50/50' },
                  { name: 'Group Discussion', rating: '8.5/10', color: 'border-emerald-200 bg-emerald-50/50' },
                  { name: 'Interview Comm.', rating: '9.2/10', color: 'border-teal-200 bg-teal-50/50' }
                ].map((skill, i) => (
                  <div key={i} className={`p-3 border rounded-xl text-center ${skill.color}`}>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{skill.name}</span>
                    <span className="text-sm font-extrabold mt-1 block">{skill.rating}</span>
                  </div>
                ))}
              </div>

              {/* Grid: Topics and Trainer Remarks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scorecard Table */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Modules & Topic Grades</h4>
                  <div className="border border-[#c7c4d7] rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#c7c4d7] text-gray-500 font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3">Communication Topic</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Score</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c7c4d7]">
                        {currentScorecard.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-800">{item.moduleName}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-extrabold">{item.marks}/10</td>
                            <td className="px-4 py-3.5 text-gray-500 max-w-[150px] truncate">{item.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Speech Modulation Remarks */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Speech & Body Language Feed</h4>
                  <div className="p-5 border border-[#c7c4d7] rounded-2xl bg-gray-50/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-sm">
                        CT
                      </div>
                      <div>
                        <p className="font-bold text-xs">Prof. Julian Reed</p>
                        <p className="text-[10px] text-gray-450">Communication Lead</p>
                      </div>
                    </div>
                    <blockquote className="text-xs text-gray-600 italic bg-white p-3 rounded-xl border border-[#c7c4d7]">
                      "Elena spoke clearly during the mock interview. Her posture and confidence were stellar. She should reduce filler words like 'like' or 'umm' under pressure."
                    </blockquote>
                    <div className="pt-2 border-t border-[#c7c4d7] flex justify-between items-center text-xs">
                      <span className="text-gray-500">GD Engagement</span>
                      <span className="font-extrabold text-emerald-600">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeScorecard === 'technical' && (
            <div className="space-y-6">
              {/* Technology Stack & GitHub Tracking Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tech Stack */}
                <div className="p-4 border border-[#c7c4d7] rounded-2xl bg-white space-y-2">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Technology Stack</h5>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'TailwindCSS', 'Git', 'Frontend Development'].map((tech, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-[#4648d4] text-[10px] font-bold rounded-lg border border-indigo-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* GitHub Sync Status */}
                <div className="p-4 border border-[#c7c4d7] rounded-2xl bg-white flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">GitHub Integration</h5>
                    <p className="text-xs font-bold text-emerald-600">Connected & Synced</p>
                    <p className="text-[10px] text-gray-400">Last commit: 2 hrs ago</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl text-gray-700 font-bold">
                    [GIT]
                  </div>
                </div>

                {/* Project Reviews Summary */}
                <div className="p-4 border border-[#c7c4d7] rounded-2xl bg-white space-y-1">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project Reviews</h5>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-black">9.2 / 10</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Approved</span>
                  </div>
                </div>
              </div>

              {/* Grid: Coding Tests & Trainer Remarks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table list */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Modules & Topic Grades</h4>
                  <div className="border border-[#c7c4d7] rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#c7c4d7] text-gray-500 font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3">Technical Topic</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Score</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c7c4d7]">
                        {currentScorecard.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-55/20 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-800">{item.moduleName}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-extrabold">{item.marks}/10</td>
                            <td className="px-4 py-3.5 text-gray-500 max-w-[150px] truncate">{item.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Code Reviews Feedback */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111c2d]">Coding Review logs</h4>
                  <div className="p-5 border border-[#c7c4d7] rounded-2xl bg-gray-50/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-sm">
                        TT
                      </div>
                      <div>
                        <p className="font-bold text-xs">Prof. Marcus Vance</p>
                        <p className="text-[10px] text-gray-455">Technical Evaluator</p>
                      </div>
                    </div>
                    <blockquote className="text-xs text-gray-600 italic bg-white p-3 rounded-xl border border-[#c7c4d7]">
                      "Understands asynchronous control flow and MongoDB indexing principles. Excellent work building clean REST controllers."
                    </blockquote>
                    <div className="pt-2 border-t border-[#c7c4d7] flex justify-between items-center text-xs">
                      <span className="text-gray-500">Coding Speed</span>
                      <span className="font-extrabold text-indigo-650">Top 10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
