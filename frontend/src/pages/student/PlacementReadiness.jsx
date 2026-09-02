import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { 
  Bell, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  FileText, 
  Bot, 
  Compass, 
  BrainCircuit, 
  LineChart,
  Calendar,
  MessageSquare,
  Calculator,
  Award,
  CheckCircle2,
  Circle,
  TrendingUp,
  ChevronRight,
  Code2,
  BookOpen,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/primitives';

const aiTools = [
  { id: 'timetable', name: 'Study Timetable', desc: 'Gamified routines & streak rewards', icon: Calendar, color: '#4F46E5', bgColor: '#EEF2F6', link: '/student/timetable', tag: 'MODULE 1' },
  { id: 'comm', name: 'AI Speech Coach', desc: '6-dimension spoken interview coach', icon: MessageSquare, color: '#D97706', bgColor: '#FEF3C7', link: '/student/communication', tag: 'MODULE 2' },
  { id: 'aptitude', name: 'AI Aptitude Suite', desc: '16 topics & root question solver', icon: Calculator, color: '#059669', bgColor: '#ECFDF5', link: '/student/aptitude', tag: 'MODULE 3' },
  { id: 'mock', name: 'Mock Simulator', desc: 'Role-based live mock interview', icon: Bot, color: '#7C3AED', bgColor: '#F5F3FF', link: '/student/mock-interview', tag: 'MODULE 4' },
];

const jobs = [
  {
    id: 1,
    title: 'Frontend Developer Intern',
    company: 'Zenith Technologies',
    status: 'ACTIVE',
    location: 'Chennai (Hybrid)',
    salary: '₹15,000 - ₹20,000 / mo',
    deadline: 'Apply by 25 Oct',
    actionText: 'Apply Now',
  },
  {
    id: 2,
    title: 'Junior QA Analyst',
    company: 'NovaSoft Pvt Ltd',
    status: 'CLOSING SOON',
    location: 'Bangalore (On-site)',
    salary: '4.5 - 6 LPA',
    deadline: 'Apply by 18 Oct',
    actionText: 'Apply Now',
  },
  {
    id: 3,
    title: 'Backend Node.js Developer',
    company: 'Clearwave Systems',
    status: 'APPLIED',
    location: 'Remote',
    salary: '7.0 - 9.0 LPA',
    deadline: 'Applied on 10 Oct',
    actionText: 'View Status',
  },
];

const placedStudents = [
  { id: 1, name: 'Sakthi S', role: 'Associate Developer', batch: 'Batch 14', company: 'Zoho Corp', pkg: '8.5 LPA', color: '#F5F3FF', textColor: '#7C3AED', init: 'S' },
  { id: 2, name: 'Janani K', role: 'System Engineer', batch: 'Batch 12', company: 'Accenture', pkg: '6.5 LPA', color: '#EEF2F6', textColor: '#4F46E5', init: 'J' },
  { id: 3, name: 'Arun Kumar', role: 'System Engineer', batch: 'Batch 11', company: 'TCS', pkg: '5.5 LPA', color: '#FEF3C7', textColor: '#D97706', init: 'A' },
  { id: 4, name: 'Naveen R', role: 'Analyst', batch: 'Batch 10', company: 'Cognizant', pkg: '4.8 LPA', color: '#F0FDFA', textColor: '#0D9488', init: 'N' }
];

const PlacementReadiness = () => {
  const [readiness, setReadiness] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Onboarding Modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    targetRole: 'Full Stack Developer',
    targetCompanyTier: 'Product (Zoho/Freshworks)',
    skillLevel: { dsa: 3, frontend: 3, backend: 3, database: 3 },
    commLevel: 3,
    dailyHoursCommitment: 3
  });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const loadData = async () => {
    try {
      const [readinessRes, roadmapRes, todayRes, profileRes] = await Promise.all([
        API.get('/ai/readiness-score'),
        API.get('/ai/roadmap'),
        API.get('/ai/today'),
        API.get('/ai/profile')
      ]);

      if (readinessRes.data?.data) setReadiness(readinessRes.data.data);
      if (roadmapRes.data?.data) setRoadmap(roadmapRes.data.data);
      if (todayRes.data?.data) setTodayPlan(todayRes.data.data);
      if (profileRes.data?.data) {
        setProfile(profileRes.data.data);
        setOnboardingData({
          targetRole: profileRes.data.data.targetRole || 'Full Stack Developer',
          targetCompanyTier: profileRes.data.data.targetCompanyTier || 'Product (Zoho/Freshworks)',
          skillLevel: profileRes.data.data.skillLevel || { dsa: 3, frontend: 3, backend: 3, database: 3 },
          commLevel: profileRes.data.data.commLevel || 3,
          dailyHoursCommitment: profileRes.data.data.dailyHoursCommitment || 3
        });
      }
    } catch (err) {
      console.error('Failed to load placement data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (taskKey) => {
    try {
      const { data } = await API.post('/ai/day-progress/toggle', {
        dayNumber: todayPlan?.dayNumber || 1,
        taskKey
      });
      if (data?.data) {
        setTodayPlan(prev => ({
          ...prev,
          progress: data.data.progress
        }));
        if (data.data.readiness) setReadiness(data.data.readiness);
        toast.success('Task status updated!');
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleSaveOnboarding = async (e) => {
    e.preventDefault();
    setSavingOnboarding(true);
    try {
      const { data } = await API.post('/ai/onboarding', onboardingData);
      if (data?.data) {
        setProfile(data.data.profile);
        if (data.data.learningPath) setRoadmap(data.data.learningPath);
        if (data.data.readiness) setReadiness(data.data.readiness);
        setShowOnboarding(false);
        toast.success('Career goals and learning roadmap updated!');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingOnboarding(false);
    }
  };

  if (loading) return <PageSkeleton variant="list" />;

  const readinessPercent = readiness?.overallScore || 50;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">MODULE 4 • CAREER & PLACEMENT</span>
            <h1 className="text-xl font-black text-[#0F172A] mt-0.5">Career & AI Placement Suite</h1>
          </div>
          
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200 transition-colors cursor-pointer"
          >
            Edit Goals
          </button>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">

        {/* 1. Placement Readiness Banner */}
        <div className="bg-[#4F46E5] rounded-3xl p-6 shadow-md relative overflow-hidden text-white">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-[#C7D2FE]" />
            <span className="text-[10px] font-black text-[#C7D2FE] uppercase tracking-widest">
              WEIGHTED READINESS RADAR
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
            <div>
              <h2 className="text-2xl font-black">{readinessPercent}% Placement Ready</h2>
              <span className="inline-block bg-white/20 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mt-1.5">
                {readiness?.tierEligibility || 'Needs Preparation'}
              </span>
              <p className="text-xs text-indigo-100 mt-2 font-medium">
                Goal: {profile?.targetRole || 'Full Stack Developer'} • {profile?.targetCompanyTier || 'Product Tier'}
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center sm:text-right">
              <span className="text-[10px] text-indigo-200 block uppercase font-bold">Readiness Formula</span>
              <span className="text-xs font-semibold text-white mt-1 block">
                30% Tech + 20% Coding + 15% Comm + 15% Assign + 10% Attend + 10% Mock
              </span>
            </div>
          </div>

          {/* 6 Dimension Competencies Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-5 border-t border-indigo-400/30 pt-4">
            {[
              { label: 'Technical (30%)', val: readiness?.technicalScore || 50 },
              { label: 'Coding (20%)', val: readiness?.codingScore || 50 },
              { label: 'Comm (15%)', val: readiness?.communicationScore || 50 },
              { label: 'Assignments (15%)', val: readiness?.assignmentScore || 50 },
              { label: 'Attendance (10%)', val: readiness?.attendanceScore || 50 },
              { label: 'Mocks (10%)', val: readiness?.mockScore || 50 },
            ].map((d, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-2 text-center">
                <span className="text-[9px] text-indigo-200 block truncate font-bold">{d.label}</span>
                <span className="text-xs font-black text-white mt-0.5 block">{d.val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 4 Core AI Learning & Practice Modules Quick Access */}
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">
            Core AI Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aiTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <Link
                  key={tool.id}
                  to={tool.link}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-5 shadow-xs transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      style={{ backgroundColor: tool.bgColor }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100"
                    >
                      <IconComp size={22} color={tool.color} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                        {tool.tag}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{tool.desc}</p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. Today's Action Plan Card */}
        {todayPlan && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  DAY {todayPlan.dayNumber} ACTION PLAN
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{todayPlan.topicTitle}</h3>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                todayPlan.progress?.isDayCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {todayPlan.progress?.isDayCompleted ? '✓ Completed' : 'In Progress'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Theory Task */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">1. Theory Concept</span>
                    <span className="text-xs font-bold text-indigo-600">15 mins</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{todayPlan.theoryContent}</p>
                </div>
                <button
                  onClick={() => handleToggleTask('theory')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    todayPlan.progress?.tasks?.theory === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {todayPlan.progress?.tasks?.theory === 'Completed' ? '✓ Theory Read' : 'Mark as Read'}
                </button>
              </div>

              {/* Coding Challenge */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">2. Coding Challenge</span>
                    <span className="text-xs font-bold text-indigo-600">30 mins</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">{todayPlan.codingChallenge?.title}</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">{todayPlan.codingChallenge?.problemStatement}</p>
                </div>
                <button
                  onClick={() => handleToggleTask('coding')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    todayPlan.progress?.tasks?.coding === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {todayPlan.progress?.tasks?.coding === 'Completed' ? '✓ Code Submitted' : 'Submit Code'}
                </button>
              </div>

              {/* Daily Quiz */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">3. Daily Quiz</span>
                    <span className="text-xs font-bold text-indigo-600">5 mins</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{todayPlan.quizQuestion?.question}</p>
                </div>
                <button
                  onClick={() => handleToggleTask('quiz')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    todayPlan.progress?.tasks?.quiz === 'Completed' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {todayPlan.progress?.tasks?.quiz === 'Completed' ? '✓ Quiz Done' : 'Complete Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Multi-Week Learning Milestones Roadmap */}
        {roadmap && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                8-WEEK PLACEMENT ACCELERATOR
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">{roadmap.title}</h3>
            </div>

            <div className="space-y-3">
              {roadmap.milestones?.map((m) => (
                <div key={m.weekNumber} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Week {m.weekNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.learningObjectives?.map((obj, i) => (
                        <span key={i} className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                          • {obj}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shrink-0 ${
                    m.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {m.isCompleted ? 'Done' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Job Openings */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Curated Placement Drives
          </h3>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {job.status}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{job.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">{job.company} • {job.location} • {job.salary}</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer">
                  {job.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Onboarding Goals Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900">Configure Placement Career Goals</h3>
            
            <form onSubmit={handleSaveOnboarding} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Engineering Role</label>
                <select
                  value={onboardingData.targetRole}
                  onChange={(e) => setOnboardingData({ ...onboardingData, targetRole: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="QA Automation Engineer">QA Automation Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Company Tier</label>
                <select
                  value={onboardingData.targetCompanyTier}
                  onChange={(e) => setOnboardingData({ ...onboardingData, targetCompanyTier: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="Service (TCS/Wipro)">Service (TCS/Wipro/Infosys)</option>
                  <option value="Product (Zoho/Freshworks)">Product (Zoho/Freshworks/Swiggy)</option>
                  <option value="FAANG/Tier-1">FAANG / High-Growth Unicorns</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Hours Commitment</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={onboardingData.dailyHoursCommitment}
                  onChange={(e) => setOnboardingData({ ...onboardingData, dailyHoursCommitment: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowOnboarding(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOnboarding}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingOnboarding ? 'Saving...' : 'Save & Regenerate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlacementReadiness;
