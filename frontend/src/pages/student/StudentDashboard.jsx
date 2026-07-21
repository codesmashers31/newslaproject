import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  HeroHeader,
  SectionLabel,
  InfoRow,
  Pill,
  ProgressRing,
  EmptyState,
  PRIMARY
} from '../../components/ui/primitives';
import BannerCarousel from '../../components/ui/BannerCarousel';

/**
 * Web counterpart of mobile/src/app/(tabs)/index.tsx.
 * Content is deliberately limited to what the mobile home screen shows:
 * banner carousel, welcome header, today's roll call, module progress rings,
 * and the three assigned-cohort cards. Nothing else.
 */
const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, batch, progress } = data;
  const user = profile?.user || {};

  // The API returns `todayRecords` as an array (backend studentController).
  // Tolerate the legacy singular field so an older payload still renders.
  const todayRecords = data.attendance?.todayRecords
    || (data.attendance?.todayRecord ? [data.attendance.todayRecord] : []);
  const hasCheckedIn = todayRecords.length > 0;

  // The three domain cards, in the same order as the mobile home screen.
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

  return (
    <div className="space-y-6">
      <BannerCarousel />

      {/* 1. Welcome banner */}
      <HeroHeader
        eyebrow="Student Portal"
        eyebrowIcon={Sparkles}
        title={`Hello, ${user.name || 'Student'}!`}
        subtitle={
          batch?.name
            ? `Cohort: ${batch.name} • ${batch.course}`
            : 'Unassigned Batch. Contact admin.'
        }
        avatarText={user.name?.charAt(0).toUpperCase() || 'S'}
      />

      {/* 2. Daily roll call check-in */}
      <Card>
        <CardHeader
          icon={Clock}
          title="Daily Attendance Roll Call"
          subtitle={`Today: ${new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`}
          action={
            <Link
              to="/student/scorecards"
              className="text-[10px] font-black text-[#4F46E5] dark:text-indigo-400 hover:underline shrink-0"
            >
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
          <ProgressRing percent={progress?.aptitude} label="Aptitude" color={PRIMARY} trackColor="#F1EBFB" />
          <ProgressRing percent={progress?.communication} label="Comms" color="#F59E0B" trackColor="#FEF3C7" />
          <ProgressRing percent={progress?.technical} label="Technical" color="#8B5CF6" trackColor="#EDE9FE" />
        </div>
      </Card>

      {/* 4. Assigned cohorts & trainers */}
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
    </div>
  );
};

export default StudentDashboard;
