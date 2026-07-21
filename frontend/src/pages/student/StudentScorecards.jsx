import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Video, Code2, MessageSquare, Brain, Award } from 'lucide-react';
import { Card, CardHeader, ProgressBar, PRIMARY } from '../../components/ui/primitives';

/**
 * Web counterpart of mobile/src/app/(tabs)/ledger.tsx.
 * Same three sections: overall ring, per-domain progress cards, and the
 * mock interview rows.
 */
const StudentScorecards = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLedgerData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error) {
      toast.error('Failed to load scorecard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, []);

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center m-card animate-pulse">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!data) return null;

  // Helper to count modules
  const getModuleCounts = (list) => {
    const arr = list || [];
    const completed = arr.filter((s) => s.status === 'Completed').length;
    return { completed, total: arr.length || 10 };
  };

  const scorecards = data?.scorecards || {};
  const aptCount = getModuleCounts(scorecards.aptitude);
  const commCount = getModuleCounts(scorecards.communication);
  const techCount = getModuleCounts(scorecards.technical);

  const overallVal = data?.progress?.overall ?? 0;
  const aptiVal = data?.progress?.aptitude ?? 0;
  const commVal = data?.progress?.communication ?? 0;
  const techVal = data?.progress?.technical ?? 0;

  const aptMock = data?.calculatedScores?.aptitudeScore ?? 0;
  const commMock = data?.calculatedScores?.communicationScore ?? 0;
  const techMock = data?.calculatedScores?.technicalScore ?? 0;

  const placement = data?.placement || {};

  // Overall ring geometry, matching the mobile screen
  const radius = 56;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - overallVal / 100);

  const domains = [
    {
      key: 'technical',
      label: 'Technical',
      icon: Code2,
      color: '#8B5CF6',
      tile: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100/60 dark:border-violet-900/40',
      value: techVal,
      counts: techCount,
      mock: techMock,
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      color: '#D97706',
      tile: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100/60 dark:border-amber-900/40',
      value: commVal,
      counts: commCount,
      mock: commMock,
    },
    {
      key: 'aptitude',
      label: 'Aptitude',
      icon: Brain,
      color: PRIMARY,
      tile: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100/60 dark:border-indigo-900/40',
      value: aptiVal,
      counts: aptCount,
      mock: aptMock,
    },
  ];

  const mockRows = [
    {
      key: 'technical',
      label: 'Technical Mock Interview',
      color: '#8B5CF6',
      tile: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100/60 dark:border-violet-900/40',
      detail: `Score ${Number(techMock).toFixed(1)}/10 • ${placement.technicalInterviewCompleted ? 'Completed' : 'Sync Completed'}`,
    },
    {
      key: 'communication',
      label: 'Communication Mock',
      color: '#D97706',
      tile: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100/60 dark:border-amber-900/40',
      detail: `Score ${Number(commMock).toFixed(1)}/10 • ${placement.mockInterviewCompleted ? 'Completed' : 'Sync Completed'}`,
    },
    {
      key: 'aptitude',
      label: 'Aptitude Mock Test',
      color: PRIMARY,
      tile: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100/60 dark:border-indigo-900/40',
      detail: `Score ${Number(aptMock).toFixed(1)}/10 • Sync Completed`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-5">
        <CardHeader
          icon={Award}
          title="My Scorecard"
          subtitle="Module scores & mock interview progress"
        />
      </Card>

      {/* 1. Overall progress ring */}
      <Card className="p-6 flex flex-col items-center">
        <div className="relative" style={{ width: 132, height: 132 }}>
          <svg width={132} height={132}>
            <circle cx={66} cy={66} r={radius} stroke="#EEF2F6" strokeWidth={strokeWidth} fill="none" />
            <circle
              cx={66}
              cy={66}
              r={radius}
              stroke={PRIMARY}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 66 66)"
              style={{ transition: 'stroke-dashoffset 600ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#0F172A] dark:text-white">{overallVal}%</span>
            <span className="m-label mt-0.5">Overall</span>
          </div>
        </div>
        <p className="m-label mt-4">Updated by trainers after each session</p>
      </Card>

      {/* 2. Per-domain progress cards */}
      <div className="space-y-4">
        {domains.map(({ key, label, icon: Icon, color, tile, value, counts, mock }) => (
          <Card key={key}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${tile}`}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-sm font-black text-[#0F172A] dark:text-white">{label}</span>
              </div>
              <span className="text-xs font-black" style={{ color }}>{value}%</span>
            </div>
            <ProgressBar value={value} color={color} className="h-2 mb-2.5" />
            <p className="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400">
              {counts.completed}/{counts.total} modules • Mock Average: {Number(mock).toFixed(1)}/10
            </p>
          </Card>
        ))}
      </div>

      {/* 3. Mock interview updates */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-[#0F172A] dark:text-white">Mock Interview Updates</h3>
        <Card padded={false} className="overflow-hidden">
          {mockRows.map(({ key, label, color, tile, detail }, idx) => (
            <div
              key={key}
              className={`flex items-center p-4 gap-4 ${
                idx < mockRows.length - 1 ? 'border-b border-[#F1F5F9] dark:border-[#1e2330]' : ''
              }`}
            >
              <div className={`p-3 rounded-2xl border shrink-0 ${tile}`}>
                <Video size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[#0F172A] dark:text-white font-extrabold text-xs">{label}</p>
                <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default StudentScorecards;
