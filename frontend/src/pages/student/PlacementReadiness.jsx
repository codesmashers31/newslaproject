import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  Briefcase,
  Bell,
  Brain,
  MessageSquare,
  Cpu,
  FileCheck,
  Code2,
  Gamepad2,
  MapPin
} from 'lucide-react';
import { Card, CardHeader, PRIMARY } from '../../components/ui/primitives';

/**
 * Web counterpart of mobile/src/app/(tabs)/career.tsx.
 * Same four sections: announcement banner, AI & learning tools grid, recent
 * placed students rail, and job listings.
 *
 * The tool / placed-student / job lists are hardcoded on mobile too; they are
 * reproduced verbatim here so both apps show the same thing.
 */

const aiTools = [
  { id: 'ai-apt', name: 'AI Aptitude', desc: 'Quantitative mock tests', color: '#4F46E5', bgColor: '#EEF2F6', icon: Brain },
  { id: 'ai-comm', name: 'AI Communication', desc: 'Speech & tone analysis', color: '#D97706', bgColor: '#FEF3C7', icon: MessageSquare },
  { id: 'ai-tech', name: 'Technical AI', desc: 'Code review assistant', color: '#7C3AED', bgColor: '#F5F3FF', icon: Cpu },
  { id: 'ai-ats', name: 'Resume ATS Checker', desc: 'Match resume keywords', color: '#0D9488', bgColor: '#F0FDFA', icon: FileCheck },
  { id: 'ai-code', name: 'Code Challenging', desc: 'Interactive coding battles', color: '#E11D48', bgColor: '#FFF1F2', icon: Code2 },
  { id: 'ai-game', name: 'Game Zone', desc: 'Logic & IQ puzzles', color: '#2563EB', bgColor: '#EFF6FF', icon: Gamepad2 },
];

const placedStudents = [
  { id: 1, name: 'Sakthi S', company: 'Zoho Corp', pkg: '₹8.5 LPA', role: 'Associate Developer', batch: 'Batch 14', init: 'S', color: '#F5F3FF', textColor: '#7C3AED' },
  { id: 2, name: 'Janani K', company: 'Accenture', pkg: '₹6.5 LPA', role: 'System Engineer', batch: 'Batch 12', init: 'J', color: '#EEF2F6', textColor: '#4F46E5' },
  { id: 3, name: 'Arun Kumar', company: 'TCS', pkg: '₹5.5 LPA', role: 'System Engineer', batch: 'Batch 11', init: 'A', color: '#FEF3C7', textColor: '#D97706' },
  { id: 4, name: 'Naveen R', company: 'Cognizant', pkg: '₹4.8 LPA', role: 'Analyst', batch: 'Batch 10', init: 'N', color: '#F0FDFA', textColor: '#0D9488' },
];

const jobs = [
  { id: 1, title: 'Frontend Developer', company: 'Zenith Technologies', location: 'Bengaluru', salary: '₹6–8 LPA', deadline: 'Apply by Jul 28', status: 'New', actionText: 'Apply', actionType: 'primary' },
  { id: 2, title: 'QA Engineer', company: 'NovaSoft Pvt Ltd', location: 'Pune', salary: '₹4.5–6 LPA', deadline: 'Apply by Jul 30', status: 'Applied', actionText: 'View', actionType: 'outline' },
  { id: 3, title: 'Backend Developer (Node.js)', company: 'Clearwave Systems', location: 'Hyderabad', salary: '₹7–9 LPA', deadline: 'Apply by Aug 2', status: 'New', actionText: 'Apply', actionType: 'primary' },
];

const PlacementReadiness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: dashboardData } = await API.get('/student/dashboard');
        setData(dashboardData);
      } catch (error) {
        toast.error('Failed to load career data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  const readinessPercent = data?.placementReadiness?.percentage ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/40 shrink-0">
            <Briefcase size={20} className="text-teal-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#0F172A] dark:text-white truncate">Career Portal</h1>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Explore placements, mock tests, and AI tools
            </p>
          </div>
        </div>
      </Card>

      {/* 1. Announcement banner */}
      <div className="bg-[#4F46E5] rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-indigo-200" />
          <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
            Placement Ad &amp; News
          </span>
        </div>
        <h2 className="text-lg font-black text-white mt-1.5 leading-snug">
          Campus Hiring Drive starts this week!
        </h2>
        <p className="text-xs text-indigo-100 mt-2 font-semibold leading-relaxed">
          Over 12 companies are recruiting for Frontend, QA, and backend developer tracks. Set up your resume now!
        </p>

        <div className="flex items-center justify-between mt-4 border-t border-indigo-400/30 pt-3 gap-4">
          <div>
            <p className="text-[10px] text-indigo-200 font-bold">Your Readiness Score</p>
            <p className="text-base font-black text-white mt-0.5">{readinessPercent}% Ready</p>
          </div>
          <button
            type="button"
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-black shrink-0 cursor-pointer transition-colors"
          >
            View Calendar
          </button>
        </div>
      </div>

      {/* 2. AI & learning tools */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-[#0F172A] dark:text-white">AI &amp; Learning Tools</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {aiTools.map(({ id, name, desc, color, bgColor, icon: Icon }) => (
            <Card key={id} className="p-4 flex flex-col items-center text-center justify-between min-h-[142px]">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 border border-slate-100 dark:border-[#1e2330]"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-black text-[#0F172A] dark:text-white">{name}</p>
                <p className="text-[9px] text-[#64748B] dark:text-slate-400 font-semibold mt-1 leading-normal">
                  {desc}
                </p>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded-full mt-2.5 text-[#64748B] dark:text-slate-400 text-[8px] font-black uppercase tracking-wider">
                Coming Soon
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Recent placed students */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-[#0F172A] dark:text-white">Recent Placed Students</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {placedStudents.map((stud) => (
            <Card key={stud.id} className="p-4 min-w-[200px] shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-100 dark:border-[#1e2330] shrink-0"
                  style={{ backgroundColor: stud.color }}
                >
                  <span className="text-sm font-black" style={{ color: stud.textColor }}>{stud.init}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#0F172A] dark:text-white truncate">{stud.name}</p>
                  <p className="text-[9px] text-[#64748B] dark:text-slate-400 font-semibold truncate">
                    {stud.role} • {stud.batch}
                  </p>
                </div>
              </div>
              <div className="border-t border-[#F1F5F9] dark:border-[#1e2330] pt-2.5 flex justify-between items-center gap-3">
                <div>
                  <p className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Company</p>
                  <p className="text-[11px] font-black text-[#0F172A] dark:text-white mt-0.5">{stud.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Package</p>
                  <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{stud.pkg}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Job listings */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-[#0F172A] dark:text-white">Job Listings</h3>
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex justify-between items-start mb-2.5 gap-4">
                <h4 className="text-sm font-black text-[#0F172A] dark:text-white flex-1">{job.title}</h4>
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                  {job.status}
                </span>
              </div>

              <p className="text-xs font-extrabold text-[#64748B] dark:text-slate-400">{job.company}</p>

              <div className="flex items-center gap-4 mt-3 pb-3 border-b border-[#F1F5F9] dark:border-[#1e2330]">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                  <MapPin size={12} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#64748B] dark:text-slate-400">
                  <Briefcase size={12} />
                  {job.salary}
                </span>
              </div>

              <div className="flex justify-between items-center mt-3 gap-4">
                <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400">{job.deadline}</span>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-colors ${
                    job.actionType === 'primary'
                      ? 'bg-[#4F46E5] hover:bg-[#4338ca] text-white'
                      : 'border border-[#E2E8F0] dark:border-[#1e2330] bg-white dark:bg-[#12131a] text-[#64748B] dark:text-slate-400'
                  }`}
                >
                  {job.actionText}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlacementReadiness;
