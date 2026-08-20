import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Video, Code2, MessageSquare, Brain, FileText } from 'lucide-react';
import { PageSkeleton } from '../../components/ui/primitives';

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
    return <PageSkeleton variant="list" />;
  }

  if (!data) return null;

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

  const radius = 56;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - overallVal / 100);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-10">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20">
        <h1 className="text-xl font-black text-[#0F172A]">My Scorecard</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Module scores & mock interview progress</p>
      </div>

      <div className="p-5 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">

        {/* 1. Elevated circular progress card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 flex flex-col items-center shadow-sm">
          <div className="relative" style={{ width: 132, height: 132 }}>
            <svg width={132} height={132}>
              <circle cx={66} cy={66} r={radius} stroke="#EEF2F6" strokeWidth={strokeWidth} fill="none" />
              <circle
                cx={66}
                cy={66}
                r={radius}
                stroke="#4F46E5"
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
              <span className="text-3xl font-black text-[#0F172A]">{overallVal}%</span>
              <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mt-0.5">Overall</span>
            </div>
          </div>
          <p className="text-[10px] text-[#64748B] mt-4 font-extrabold uppercase tracking-wider">
            Updated by trainers after each session
          </p>
        </div>

        {/* 2. Horizontal progress bars with theme colors and icons */}
        <div className="flex flex-col gap-4">
          
          {/* Technical Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-50 rounded-xl border border-violet-100/50">
                  <Code2 size={16} className="text-[#8B5CF6]" />
                </div>
                <span className="text-sm font-black text-[#0F172A]">Technical</span>
              </div>
              <span className="text-xs font-black text-[#8B5CF6]">{techVal}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${techVal}%` }} />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B]">
              {techCount.completed}/{techCount.total} modules • Mock Average: {Number(techMock).toFixed(1)}/10
            </p>
          </div>

          {/* Communication Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100/50">
                  <MessageSquare size={16} className="text-[#D97706]" />
                </div>
                <span className="text-sm font-black text-[#0F172A]">Communication</span>
              </div>
              <span className="text-xs font-black text-[#D97706]">{commVal}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-[#D97706]" style={{ width: `${commVal}%` }} />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B]">
              {commCount.completed}/{commCount.total} modules • Mock Average: {Number(commMock).toFixed(1)}/10
            </p>
          </div>

          {/* Aptitude Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
                  <Brain size={16} className="text-[#4F46E5]" />
                </div>
                <span className="text-sm font-black text-[#0F172A]">Aptitude</span>
              </div>
              <span className="text-xs font-black text-[#4F46E5]">{aptiVal}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${aptiVal}%` }} />
            </div>
            <p className="text-[10px] font-extrabold text-[#64748B]">
              {aptCount.completed}/{aptCount.total} modules • Mock Average: {Number(aptMock).toFixed(1)}/10
            </p>
          </div>

        </div>

        {/* 3. Mock Interview Updates Section */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-sm font-black text-[#0F172A]">Mock Interview Updates</h3>

          <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm flex flex-col">
            
            {/* Technical Mock row */}
            <div className="flex items-center p-4 border-b border-[#F1F5F9] gap-4">
              <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100/50 shrink-0">
                <Video size={16} className="text-[#8B5CF6]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] font-extrabold text-xs truncate">Technical Mock Interview</p>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                  {placement.technicalInterviewCompleted 
                    ? `Score ${Number(techMock).toFixed(1)}/10 • Completed` 
                    : `Score ${Number(techMock).toFixed(1)}/10 • Sync Completed`}
                </p>
              </div>
            </div>

            {/* Comm Mock row */}
            <div className="flex items-center p-4 border-b border-[#F1F5F9] gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50 shrink-0">
                <Video size={16} className="text-[#D97706]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] font-extrabold text-xs truncate">Communication Mock</p>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                  {placement.mockInterviewCompleted 
                    ? `Score ${Number(commMock).toFixed(1)}/10 • Completed` 
                    : `Score ${Number(commMock).toFixed(1)}/10 • Sync Completed`}
                </p>
              </div>
            </div>

            {/* Aptitude Mock row */}
            <div className="flex items-center p-4 gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50 shrink-0">
                <Video size={16} className="text-[#4F46E5]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] font-extrabold text-xs truncate">Aptitude Mock Test</p>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                  Score {Number(aptMock).toFixed(1)}/10 • Sync Completed
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentScorecards;
