import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { 
  Clock, CheckCircle2, Camera, Sparkles, User, Compass, 
  BookOpen, Phone, ChevronRight 
} from 'lucide-react';
import ProgressRing from '../../components/ProgressRing';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const primaryColor = '#4F46E5';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/student/dashboard');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-5 text-center text-sm text-slate-500 animate-pulse">Loading Dashboard...</div>;
  }

  const profile = data?.profile?.user || user || {};
  const studentProfile = data?.profile || {};
  const todayRecords = data?.attendance?.todayRecords || [];
  const progress = data?.progress || { aptitude: 0, communication: 0, technical: 0 };
  const batches = data?.batches || [];

  // Calculate profile completeness
  let completedFields = 0;
  const totalFields = 8;
  if (studentProfile.collegeName) completedFields++;
  if (studentProfile.degree) completedFields++;
  if (studentProfile.department) completedFields++;
  if (studentProfile.yearOfPassing) completedFields++;
  if (studentProfile.photo || profile.photo) completedFields++;
  if (studentProfile.resumeUrl) completedFields++;
  if (studentProfile.linkedin) completedFields++;
  if (studentProfile.github) completedFields++;

  const resolveBatchSchedule = (batch) => {
    if (!batch) return 'Mon - Fri • 09:00 AM – 01:00 PM';
    if (batch.startTime && batch.endTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : (batch.scheduleDays ? `${batch.scheduleDays} • ` : '');
      return `${daysPrefix}${batch.startTime} – ${batch.endTime}`;
    }
    if (batch.schedule && typeof batch.schedule === 'string' && batch.schedule !== 'Schedule Not Set') {
      return batch.schedule;
    }
    return 'Mon - Fri • 09:00 AM – 01:00 PM';
  };

  const banners = [
    {
      id: 1,
      title: 'Complete Profile',
      desc: 'Unlock placement opportunities by keeping your profile updated.',
      bgClass: 'bg-indigo-600',
      btnText: 'Edit Profile',
      tag: 'Placement Ready',
      icon: <User size={24} color="#ffffff" />,
      link: '/student/profile'
    },
    {
      id: 2,
      title: 'AI Career Coach',
      desc: 'Get your custom training roadmaps and career benchmarks.',
      bgClass: 'bg-violet-700',
      btnText: 'View Roadmap',
      tag: 'NEW FEATURE',
      icon: <Compass size={24} color="#ffffff" />,
      link: '/student/career'
    },
    {
      id: 3,
      title: 'Digital Attendance',
      desc: 'Check in to training lectures by scanning room QR codes.',
      bgClass: 'bg-emerald-600',
      btnText: 'Scan Attendance',
      tag: 'DAILY ROLL CALL',
      icon: <Camera size={24} color="#ffffff" />,
      link: '/student/scanner'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      
      {/* Top Fluid Pastel Gradient Aura */}
      <div className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none" style={{
        background: 'linear-gradient(180deg, #DDD6FE 0%, rgba(238, 242, 255, 0.8) 40%, #F8FAFC 100%)'
      }} />

      {/* Greeting Row */}
      <div className="px-5 pt-6 flex justify-between items-center relative z-10">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Welcome Back</p>
          <h1 className="text-xl font-black text-slate-800 mt-0.5">👋 Hey, {profile.name || 'Student'}</h1>
        </div>
        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center border border-white/80 overflow-hidden relative shadow-md shadow-indigo-600/5">
          {profile.photo ? (
            <img src={profile.photo} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-black text-indigo-700">{(profile.name || 'S').charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Horizontal Paged Carousel Banners */}
      <div className="mt-5 relative z-10 w-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-3.5 px-5 pb-4">
        {banners.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            className={`flex-none w-[85%] rounded-3xl p-5 ${item.bgClass} shadow-md overflow-hidden relative min-h-[145px] snap-center block`}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-black/10 rounded-full" />

            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="bg-white/20 inline-block px-2.5 py-0.5 rounded-full mb-2.5">
                  <span className="text-white text-[9px] font-black tracking-widest uppercase">{item.tag}</span>
                </div>
                <h3 className="text-white text-base font-black leading-tight">{item.title}</h3>
                <p className="text-white/80 text-[11px] font-semibold mt-1 leading-normal">{item.desc}</p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="bg-white px-4 py-2 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">{item.btnText}</span>
                </div>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Feature Cards */}
      <div className="px-5 mt-2 flex flex-col gap-5 pb-10">
        
        {/* Card A: Complete Profile Progress Card */}
        <Link 
          to="/student/profile"
          className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm overflow-hidden relative flex items-center block"
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(90deg, #FFF1F2 0%, rgba(245, 243, 255, 0.8) 100%)'
          }} />
          
          <div className="flex-1 pr-4 relative z-10">
            <div className="flex items-center mb-1 gap-1">
              <Sparkles size={11} color="#EC4899" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#EC4899]">Profile Completeness</span>
            </div>
            <h3 className="text-base font-black text-slate-800 leading-tight">Complete Profile</h3>
            <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-normal">
              Finish all sections to share your details with recruiters.
            </p>
            
            <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl self-start inline-block mt-4 shadow-sm">
              <span className="text-[#EC4899] text-[10px] font-extrabold uppercase tracking-wider">Update Profile</span>
            </div>
          </div>

          <div className="w-[72px] h-[72px] rounded-full border-[6px] border-slate-100 flex items-center justify-center relative z-10 shrink-0">
            <div className="absolute inset-0 rounded-full border-[6px] border-[#EC4899] opacity-20" />
            <span className="text-base font-black text-[#EC4899]">{completedFields}/{totalFields}</span>
          </div>
        </Link>

        {/* Card B: Daily Attendance Roll Call Status Card */}
        <div className="bg-slate-900 rounded-3xl p-5 shadow-sm overflow-hidden relative min-h-[150px]">
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#4F46E5]/20 rounded-full" />
          
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center mr-3">
                  <Clock size={16} color="#ffffff" />
                </div>
                <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-wider">Daily Attendance</h3>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                    Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Link to="/student/history" className="text-[10px] font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-full">
                View Logs
              </Link>
            </div>

            {todayRecords.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {todayRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3.5 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} color="#10B981" />
                      <span className="text-white text-xs font-bold uppercase tracking-wider">{record.subject || 'Class'}</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                  Check-in is required to track your training sessions. Scan the room QR code to begin.
                </p>
                
                <Link
                  to="/student/scanner"
                  className="mt-4 w-full py-3.5 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10 block text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera size={14} color="#ffffff" />
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Scan QR</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Card C: Assigned Training Cohorts Info */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center mb-4 border-b border-[#F1F5F9] pb-3 gap-2">
            <BookOpen size={16} color={primaryColor} />
            <h3 className="font-extrabold text-sm text-[#0F172A]">Assigned Cohorts</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {batches.length > 0 ? (
              batches.map((b) => (
                <div key={b._id} className="py-2 border-b border-[#F1F5F9]/50 last:border-0">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <div className="flex-1">
                      <h4 className="font-extrabold text-[11px] text-slate-800">{b.department ? `${b.department} Training` : 'Training Module'}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers.map((t) => t.name).join(', ') : 'Unassigned'}</p>
                      <p className="text-[10px] text-indigo-600 font-extrabold mt-0.5">Schedule: {resolveBatchSchedule(b)}</p>
                    </div>
                    <div className="shrink-0 max-w-[45%]">
                      <span className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl block truncate">
                        {b.name ? b.name.replace(/\s*\(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)\)/ig, '').trim() : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  
                  {b.attendanceStats && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          {b.attendanceStats.presentCount} / {b.attendanceStats.totalTrainingDays || b.attendanceStats.eligibleSessionsCount || 80} Days Attended
                        </span>
                      </div>
                      <span className={`text-[10px] font-black ${(b.attendanceStats.attendancePercent ?? b.attendanceStats.percentage) >= 70 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {b.attendanceStats.attendancePercent ?? b.attendanceStats.percentage}%
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-2">No batches assigned yet.</p>
            )}
          </div>
        </div>

        {/* Card D: Module Progress Stats */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <h3 className="font-extrabold text-sm text-[#0F172A] mb-4">Module Progress Ring Checks</h3>
          <div className="flex justify-between items-center px-2">
            <ProgressRing percent={progress.aptitude} label="Aptitude" color={primaryColor} trackColor="#F1EBFB" />
            <ProgressRing percent={progress.communication} label="Comms" color="#F59E0B" trackColor="#FEF3C7" />
            <ProgressRing percent={progress.technical} label="Technical" color="#8B5CF6" trackColor="#EDE9FE" />
          </div>
        </div>

        {/* Helpline */}
        <div 
          onClick={() => window.open('https://wa.me/919876543210?text=Hello%20SLA%20Portal%20Support', '_blank')}
          className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Phone size={16} color="#10B981" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-800">Essential Help Desk & WhatsApp</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Reach placement coordinators</p>
            </div>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
