import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  TrendingUp,
  BookOpen,
  Sparkles,
  FileDown,
  Bookmark,
  Trophy,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

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
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, batch, scorecards, progress, leaderboardRank, placementReadiness, calculatedScores } = data;

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
              {data.batches && data.batches.length > 0 
                ? `Enrolled in: ${data.batches.map(b => `${b.name} (${b.course})`).join(' • ')}`
                : batch 
                ? `Enrolled in: ${batch.name} • ${batch.course}` 
                : 'Unassigned Batch. Contact administrator.'}
            </p>
          </div>
        </div>
      </div>

      {/* Batch Details and Daily Attendance Scanner Roll Call */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Batch Profile Details */}
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Active Training Batch</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Course duration & curriculum details</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-850">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Batch Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{batch?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-850">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Course / Syllabus:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{batch?.course || 'Full Stack Placement Prep'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-850">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Schedule:</span>
                <span className="font-bold">
                  {batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                  {' — '}
                  {batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* List of Trainers */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Assigned Staff Trainers</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {batch?.trainers && batch.trainers.length > 0 ? (
                  batch.trainers.map((tr) => (
                    <div key={tr._id} className="p-2.5 border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-[#181922] rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide block truncate">{tr.role}</span>
                      <h5 className="font-bold text-xs text-gray-800 dark:text-white truncate" title={tr.name}>{tr.name}</h5>
                      <span className="text-[9px] text-gray-400 block truncate">{tr.email}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic col-span-3 text-center py-2 bg-gray-50 dark:bg-[#181922] rounded-xl">No trainers assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Daily Roll Call Check-in */}
        <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Daily Attendance Roll Call</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Today is: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Status View */}
            {data.attendance?.todayRecord ? (
              // Case: Marked
              <div className="flex flex-col items-center justify-center py-5 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl p-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <span className="inline-flex px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    {data.attendance.todayRecord.status}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    Verified today at {new Date(data.attendance.todayRecord.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Daily attendance session logged successfully.</p>
                </div>
              </div>
            ) : (
              // Case: Pending Check-in
              <div className="flex flex-col items-center justify-center py-5 space-y-3 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl p-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center animate-bounce">
                  <AlertTriangle size={24} />
                </div>
                <div className="text-center">
                  <span className="inline-flex px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    Pending
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    You have not checked in for today's sessions yet.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Please scan the live QR code projected by your trainer to record attendance.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Link: Scanner Direct link */}
          {!data.attendance?.todayRecord && (
            <Link
              to="/student/scanner"
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-500/20 duration-200 cursor-pointer"
            >
              <Camera size={14} />
              <span>Scan Attendance QR Code</span>
            </Link>
          )}
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
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
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
            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
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
            className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>{isCertificateClaimed ? 'Download Certificate' : 'Claim Certificate'}</span>
          </button>
        </div>
      )}


      {/* 5. Advanced Interactive Modules Dashboard */}
      <div className="bg-white border border-[#c7c4d7] rounded-3xl ambient-shadow overflow-hidden">
        {/* Module Switcher Tabs */}
        <div className="flex border-b border-[#c7c4d7] bg-[#f0f3ff]">
          {[
            { id: 'aptitude', name: 'Aptitude Module', icon: BookOpen },
            { id: 'communication', name: 'Communication Module', icon: Bookmark },
            { id: 'technical', name: 'Technical Module', icon: Award },
            { id: 'attendance', name: 'Attendance History', icon: Calendar }
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Avg. Score</span>
                  <span className="text-xl font-extrabold text-blue-700 mt-1 block">8.2 / 10</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Practice Tests</span>
                  <span className="text-xl font-extrabold text-indigo-700 mt-1 block">16 / 16 Done</span>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Mock Assessments</span>
                  <span className="text-xl font-extrabold text-purple-700 mt-1 block">11 Cleared</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
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
                        <p className="text-[10px] text-gray-400">Lead Aptitude Trainer</p>
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
                        <p className="text-[10px] text-gray-400">Communication Lead</p>
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
                        <p className="text-[10px] text-gray-400">Technical Evaluator</p>
                      </div>
                    </div>
                    <blockquote className="text-xs text-gray-600 italic bg-white p-3 rounded-xl border border-[#c7c4d7]">
                      "Understands asynchronous control flow and MongoDB indexing principles. Excellent work building clean REST controllers."
                    </blockquote>
                    <div className="pt-2 border-t border-[#c7c4d7] flex justify-between items-center text-xs">
                      <span className="text-gray-500">Coding Speed</span>
                      <span className="font-extrabold text-indigo-600">Top 10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeScorecard === 'attendance' && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Attendance Rate</span>
                  <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{data.attendance?.percentage || 0}%</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Classes Present</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{data.attendance?.presentCount || 0} Days</span>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Sessions</span>
                  <span className="text-xl font-extrabold text-gray-700 mt-1 block">{data.attendance?.totalClasses || 0} Sessions</span>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-[#111c2d]">Day-Wise Attendance Logs</h4>
                <div className="border border-[#c7c4d7] rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#c7c4d7] text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c7c4d7]">
                      {!data.attendance?.records || data.attendance.records.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-gray-500 italic">No attendance records found.</td>
                        </tr>
                      ) : (
                        data.attendance.records.map((item, idx) => (
                          <tr key={item._id || idx} className="hover:bg-gray-50/20 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-800">
                              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                item.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                item.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 max-w-[200px] truncate">{item.remarks || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
