import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Bell, MapPin, Briefcase, Sparkles, FileText, Bot, Compass, BrainCircuit, LineChart } from 'lucide-react';
import { PageSkeleton } from '../../components/ui/primitives';

const aiTools = [
  { id: 1, name: 'Resume Builder AI', desc: 'Auto-generate ATS-friendly resume', icon: FileText, color: '#2563EB', bgColor: '#EFF6FF' },
  { id: 2, name: 'AI Interview Prep', desc: 'Practice with voice AI bot', icon: Bot, color: '#7C3AED', bgColor: '#F5F3FF' },
  { id: 3, name: 'Career Path Finder', desc: 'Discover best roles for you', icon: Compass, color: '#D97706', bgColor: '#FFFBEB' },
  { id: 4, name: 'Skill Gap Analysis', desc: 'Identify missing technical skills', icon: BrainCircuit, color: '#059669', bgColor: '#ECFDF5' },
];

const jobs = [
  {
    id: 1,
    title: 'Frontend Developer Intern',
    company: 'TechCorp Solutions',
    status: 'ACTIVE',
    location: 'Chennai (Hybrid)',
    salary: '₹15,000 - ₹20,000 / month',
    deadline: 'Apply by 25 Oct',
    actionText: 'Apply Now',
    actionType: 'primary',
  },
  {
    id: 2,
    title: 'Junior QA Analyst',
    company: 'Global Systems Inc.',
    status: 'CLOSING SOON',
    location: 'Bangalore (On-site)',
    salary: '4.5 LPA',
    deadline: 'Apply by 18 Oct',
    actionText: 'Apply Now',
    actionType: 'primary',
  },
  {
    id: 3,
    title: 'Backend Node.js Developer',
    company: 'Startup XYZ',
    status: 'APPLIED',
    location: 'Remote',
    salary: '5.0 LPA - 7.0 LPA',
    deadline: 'Applied on 10 Oct',
    actionText: 'View Status',
    actionType: 'secondary',
  },
];

const placedStudents = [
  { id: 1, name: 'Rahul S.', role: 'SDE-1', batch: '2023', company: 'Amazon', pkg: '12 LPA', color: '#DBEAFE', textColor: '#1E40AF', init: 'R' },
  { id: 2, name: 'Priya K.', role: 'Frontend Eng.', batch: '2024', company: 'Zoho', pkg: '8 LPA', color: '#FCE7F3', textColor: '#BE185D', init: 'P' },
  { id: 3, name: 'Amit V.', role: 'QA Automation', batch: '2023', company: 'TCS', pkg: '6.5 LPA', color: '#FEF3C7', textColor: '#B45309', init: 'A' },
  { id: 4, name: 'Sneha M.', role: 'Full Stack', batch: '2024', company: 'Freshworks', pkg: '10 LPA', color: '#D1FAE5', textColor: '#047857', init: 'S' },
];

const PlacementReadiness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load placement data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <PageSkeleton variant="list" />;

  const readinessPercent = data?.progress?.overall ?? 0;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20">
        <h1 className="text-xl font-black text-[#0F172A]">Career Portal</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Explore placements, mock tests, and AI tools</p>
      </div>

      <div className="p-5 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* 1. Announcements Ads Card */}
        <div className="bg-[#4F46E5] rounded-3xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-[#C7D2FE]" />
            <span className="text-[10px] font-black text-[#C7D2FE] uppercase tracking-widest">PLACEMENT AD & NEWS</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1.5 leading-snug">
            Campus Hiring Drive starts this week!
          </h2>
          <p className="text-xs text-[#E0E7FF] mt-2 font-semibold leading-relaxed">
            Over 12 companies are recruiting for Frontend, QA, and backend developer tracks. Set up your resume now!
          </p>
          
          <div className="flex justify-between items-center mt-4 border-t border-indigo-400/30 pt-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#C7D2FE] font-bold">Your Readiness Score</span>
              <span className="text-base font-black text-white mt-0.5">{readinessPercent}% Ready</span>
            </div>
            <button className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl border border-white/20">
              <span className="text-white text-xs font-black">View Calendar</span>
            </button>
          </div>
        </div>

        {/* 2. AI & Learning Tools Cards */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-black text-[#0F172A]">AI & Learning Tools</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {aiTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm flex flex-col items-center text-center justify-between min-h-[142px]"
                >
                  <div 
                    style={{ backgroundColor: tool.bgColor }} 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 border border-slate-100"
                  >
                    <IconComp size={20} color={tool.color} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-[#0F172A] text-center">{tool.name}</span>
                    <span className="text-[9px] text-[#64748B] font-semibold text-center mt-1 leading-normal">
                      {tool.desc}
                    </span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full mt-2.5">
                    <span className="text-[#64748B] text-[8px] font-black uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Recent Placed Students */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-black text-[#0F172A]">Recent Placed Students</h3>
          
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
            {placedStudents.map((stud) => (
              <div 
                key={stud.id} 
                className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm min-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    style={{ backgroundColor: stud.color }} 
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-100 shrink-0"
                  >
                    <span style={{ color: stud.textColor }} className="text-sm font-black">{stud.init}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#0F172A]">{stud.name}</span>
                    <span className="text-[9px] text-[#64748B] font-semibold">{stud.role} • {stud.batch}</span>
                  </div>
                </div>
                <div className="border-t border-[#F1F5F9] pt-2.5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Company</span>
                    <span className="text-[11px] font-black text-[#0F172A] mt-0.5">{stud.company}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Package</span>
                    <span className="text-[11px] font-black text-emerald-700 mt-0.5">{stud.pkg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Job Listings List */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-black text-[#0F172A]">Job Listings</h3>

          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
                
                {/* Header row */}
                <div className="flex justify-between items-start mb-2.5">
                  <h4 className="text-sm font-black text-[#0F172A] flex-1 pr-4">{job.title}</h4>
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0">
                    {job.status}
                  </span>
                </div>

                {/* Company & Details */}
                <span className="text-xs font-extrabold text-[#64748B] block">{job.company}</span>
                
                <div className="flex items-center gap-4 mt-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#64748B]" />
                    <span className="text-[10px] font-semibold text-[#64748B]">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={12} className="text-[#64748B]" />
                    <span className="text-[10px] font-semibold text-[#64748B]">{job.salary}</span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] font-bold text-[#64748B]">{job.deadline}</span>
                  <button 
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                      job.actionType === 'primary' 
                        ? 'bg-[#4F46E5] text-white hover:bg-[#4338ca]' 
                        : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50'
                    }`}
                  >
                    {job.actionText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlacementReadiness;
