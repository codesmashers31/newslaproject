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
import {
  Card,
  CardHeader,
  HeroHeader,
  StatCard,
  SectionLabel,
  InfoRow,
  Pill,
  ProgressRing,
  ProgressBar,
  EmptyState,
  Tabs,
  PRIMARY
} from '../../components/ui/primitives';

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
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, batch, scorecards, progress, leaderboardRank, placementReadiness, calculatedScores } = data;
  const user = profile?.user || {};

  const currentScorecard =
    activeScorecard === 'aptitude' ? scorecards.aptitude :
    activeScorecard === 'communication' ? scorecards.communication :
    scorecards.technical;

  const isEligibleForCertificate = progress.overall >= 80;
  const isCertificateClaimed = data.certificates?.length > 0;

  // The API returns `todayRecords` as an array (see backend studentController).
  // Tolerate the legacy singular field so an older payload still renders.
  const todayRecords = data.attendance?.todayRecords
    || (data.attendance?.todayRecord ? [data.attendance.todayRecord] : []);
  const hasCheckedIn = todayRecords.length > 0;

  // Assigned cohorts, mirroring the three domain cards on the mobile home screen.
  const domains = [
    {
      key: 'technical',
      title: 'Technical Training',
      caption: 'Core technology track',
      batch: user.technicalBatch,
      trainer: user.technicalTrainer,
    },
    {
      key: 'communication',
      title: 'Communication Skills',
      caption: 'Soft skills & interview prep',
      batch: user.communicationBatch,
      trainer: user.communicationTrainer,
    },
    {
      key: 'aptitude',
      title: 'Aptitude & Reasoning',
      caption: 'Quantitative & analytical prep',
      batch: user.aptitudeBatch,
      trainer: user.aptitudeTrainer,
    },
  ];

  const enrolledLine = data.batches && data.batches.length > 0
    ? `Cohort: ${data.batches.map(b => `${b.name} (${b.course})`).join(' • ')}`
    : batch
      ? `Cohort: ${batch.name} • ${batch.course}`
      : 'Unassigned Batch. Contact administrator.';

  return (
    <div className="space-y-6">
      {/* 1. Welcome banner — mobile home header */}
      <HeroHeader
        eyebrow="Student Portal"
        eyebrowIcon={Sparkles}
        title={`Hello, ${user.name || 'Student'}!`}
        subtitle={enrolledLine}
        avatarText={user.name?.charAt(0).toUpperCase() || 'S'}
      />

      {user.slaeId && (
        <div className="-mt-3">
          <Pill tone="info">SLA ID · {user.slaeId}</Pill>
        </div>
      )}

      {/* 2. Daily roll call check-in */}
      <Card>
        <CardHeader
          icon={Clock}
          title="Daily Attendance Roll Call"
          subtitle={`Today: ${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`}
          action={
            <Link to="/student/scanner" className="text-[10px] font-black text-[#4F46E5] dark:text-indigo-400 hover:underline shrink-0">
              View Logs
            </Link>
          }
          className="mb-4"
        />

        {hasCheckedIn ? (
          <div className="space-y-3">
            {todayRecords.map((record, index) => (
              <div
                key={record._id || index}
                className="flex items-center justify-between py-3.5 px-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider truncate">
                      {record.subject || 'Class'}
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">
                      {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Pill tone="success">{record.status}</Pill>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            tone="warning"
            badge="Pending"
            title="You have not checked in for today's sessions yet."
            action={
              <Link to="/student/scanner" className="m-btn-primary">
                <Camera size={16} />
                <span>Scan Attendance QR</span>
              </Link>
            }
          />
        )}
      </Card>

      {/* 3. Module progress rings */}
      <Card>
        <h3 className="m-title mb-4">Module Progress</h3>
        <div className="flex flex-wrap justify-around gap-6">
          <ProgressRing percent={progress.aptitude} label="Aptitude" color={PRIMARY} trackColor="#F1EBFB" />
          <ProgressRing percent={progress.communication} label="Comms" color="#F59E0B" trackColor="#FEF3C7" />
          <ProgressRing percent={progress.technical} label="Technical" color="#8B5CF6" trackColor="#EDE9FE" />
          <ProgressRing percent={progress.overall} label="Overall" color="#10B981" trackColor="#D1FAE5" />
        </div>
      </Card>

      {/* 4. Headline metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Trophy}
          label="Leaderboard Rank"
          value={`#${leaderboardRank?.institute || '—'}`}
          hint={`Batch #${leaderboardRank?.batch || '—'}`}
        />
        <StatCard
          icon={Award}
          label="Overall Grade"
          value={calculatedScores?.grade || '—'}
          hint={`${calculatedScores?.finalScorePercent || 0}% weighted`}
        />
        <StatCard
          icon={TrendingUp}
          label="Placement Readiness"
          value={`${placementReadiness?.percentage || 0}%`}
          hint={placementReadiness?.status || 'Critical'}
          tone={
            (placementReadiness?.percentage || 0) >= 75 ? 'success'
              : (placementReadiness?.percentage || 0) >= 50 ? 'warning'
              : 'danger'
          }
        />
      </div>

      {/* 5. Track progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Overall Progress', value: progress.overall, color: PRIMARY },
          { label: 'Aptitude Track', value: progress.aptitude, color: '#3B82F6' },
          { label: 'Communication Track', value: progress.communication, color: '#F59E0B' },
          { label: 'Technical Track', value: progress.technical, color: '#8B5CF6' }
        ].map((item, i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="m-label">{item.label}</span>
              <span className="text-xs font-black text-[#0F172A] dark:text-white">{item.value}%</span>
            </div>
            <ProgressBar value={item.value} color={item.color} />
          </Card>
        ))}
      </div>

      {/* 6. Assigned cohorts & trainers — mobile domain cards */}
      <div className="space-y-4">
        <SectionLabel>Assigned Cohorts &amp; Trainers</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <Card key={domain.key}>
              <CardHeader
                icon={CalendarDays}
                title={domain.title}
                subtitle={domain.caption}
                className="mb-4"
              />
              <div className="space-y-2.5">
                <InfoRow label="Assigned Batch:" value={domain.batch || 'Unassigned'} />
                <InfoRow label="Trainer:" value={domain.trainer || 'Unassigned'} accent />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 7. Batch schedule & staff roster */}
      <Card>
        <CardHeader
          icon={CalendarDays}
          title="Active Training Batch"
          subtitle="Course duration & curriculum details"
          className="mb-4"
        />
        <div className="space-y-2.5">
          <InfoRow label="Batch Name:" value={batch?.name || 'N/A'} />
          <InfoRow label="Course / Syllabus:" value={batch?.course || 'Full Stack Placement Prep'} accent />
          <InfoRow
            label="Schedule:"
            value={`${batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'} — ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}`}
          />
        </div>

        <div className="pt-5">
          <SectionLabel className="block mb-2">Assigned Staff Trainers</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {batch?.trainers && batch.trainers.length > 0 ? (
              batch.trainers.map((tr) => (
                <div
                  key={tr._id}
                  className="p-3 border border-[#E2E8F0] dark:border-[#1e2330] bg-slate-50/60 dark:bg-[#181922] rounded-2xl text-center space-y-1"
                >
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wide block truncate">{tr.role}</span>
                  <h5 className="font-bold text-xs text-[#0F172A] dark:text-white truncate" title={tr.name}>{tr.name}</h5>
                  <span className="text-[9px] text-[#64748B] dark:text-slate-500 block truncate">{tr.email}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[#64748B] italic col-span-3 text-center py-3 bg-slate-50 dark:bg-[#181922] rounded-2xl">
                No trainers assigned yet.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 8. Certificate claim */}
      {isEligibleForCertificate && (
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-amber-200/70 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
              <Award size={26} />
            </div>
            <div>
              <h4 className="m-title">Course Certificate Available</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Congratulations! You completed over 80% of the training modules. Claim your official scorecard credential.
              </p>
            </div>
          </div>
          <button
            onClick={isCertificateClaimed ? generatePDFCertificate : handleClaimCertificate}
            disabled={certificateClaiming}
            className="m-btn-primary sm:w-auto sm:px-6 shrink-0"
          >
            <FileDown size={14} />
            <span>{isCertificateClaimed ? 'Download Certificate' : 'Claim Certificate'}</span>
          </button>
        </Card>
      )}

      {/* 9. Module detail tabs */}
      <Card padded={false} className="overflow-hidden">
        <Tabs
          active={activeScorecard}
          onChange={setActiveScorecard}
          tabs={[
            { id: 'aptitude', name: 'Aptitude', icon: BookOpen },
            { id: 'communication', name: 'Communication', icon: Bookmark },
            { id: 'technical', name: 'Technical', icon: Award },
            { id: 'attendance', name: 'Attendance', icon: Calendar }
          ]}
        />

        <div className="p-6">
          {activeScorecard !== 'attendance' && (
            <div className="space-y-4">
              <h4 className="m-title">Modules &amp; Topic Grades</h4>
              <div className="border border-[#E2E8F0] dark:border-[#1e2330] rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#181922] border-b border-[#E2E8F0] dark:border-[#1e2330] text-[#64748B] dark:text-slate-400 font-black uppercase tracking-wider">
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1e2330]">
                    {!currentScorecard || currentScorecard.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-[#64748B] italic">
                          No graded modules yet.
                        </td>
                      </tr>
                    ) : (
                      currentScorecard.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-[#0F172A] dark:text-white">{item.moduleName}</td>
                          <td className="px-4 py-3.5">
                            <Pill tone={item.status === 'Completed' ? 'success' : 'warning'}>{item.status}</Pill>
                          </td>
                          <td className="px-4 py-3.5 text-center font-extrabold text-[#0F172A] dark:text-white">{item.marks}/10</td>
                          <td className="px-4 py-3.5 text-[#64748B] dark:text-slate-400 max-w-[200px] truncate">{item.remarks}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeScorecard === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4">
                  <span className="m-label block">Attendance Rate</span>
                  <span className="text-xl font-black text-[#4F46E5] dark:text-indigo-400 mt-1 block">
                    {data.attendance?.percentage || 0}%
                  </span>
                </Card>
                <Card className="p-4">
                  <span className="m-label block">Classes Present</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {data.attendance?.presentCount || 0} Days
                  </span>
                </Card>
                <Card className="p-4">
                  <span className="m-label block">Total Sessions</span>
                  <span className="text-xl font-black text-[#0F172A] dark:text-white mt-1 block">
                    {data.attendance?.totalClasses || 0} Sessions
                  </span>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="m-title">Day-Wise Attendance Logs</h4>
                <div className="border border-[#E2E8F0] dark:border-[#1e2330] rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#181922] border-b border-[#E2E8F0] dark:border-[#1e2330] text-[#64748B] dark:text-slate-400 font-black uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1e2330]">
                      {!data.attendance?.records || data.attendance.records.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-[#64748B] italic">No attendance records found.</td>
                        </tr>
                      ) : (
                        data.attendance.records.map((item, idx) => (
                          <tr key={item._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-[#0F172A] dark:text-white">
                              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3.5 text-[#64748B] dark:text-slate-400">{item.subject || '—'}</td>
                            <td className="px-4 py-3.5">
                              <Pill
                                tone={
                                  item.status === 'Present' ? 'success'
                                    : item.status === 'Late' ? 'warning'
                                    : 'danger'
                                }
                              >
                                {item.status}
                              </Pill>
                            </td>
                            <td className="px-4 py-3.5 text-[#64748B] dark:text-slate-400 max-w-[200px] truncate">{item.remarks || '—'}</td>
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
      </Card>
    </div>
  );
};

export default StudentDashboard;
