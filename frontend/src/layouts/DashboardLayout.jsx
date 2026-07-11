import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  FolderGit, 
  CalendarCheck, 
  GraduationCap, 
  Briefcase, 
  FilePieChart, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Menu, 
  X,
  ChevronRight,
  Sparkles,
  Camera,
  Trophy,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSla from '../assets/logosla.png';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sync theme with document class (Forced Light Mode)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Fetch student notifications if role is student
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && user.role === 'Student') {
        try {
          const { data } = await API.get('/student/notifications');
          setNotifications(data);
        } catch (error) {
          console.error('Error fetching notifications', error);
        }
      }
    };
    fetchNotifications();
  }, [user]);

  const markNotificationsRead = async () => {
    try {
      await API.put('/student/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role based navigation links
  const getNavLinks = () => {
    const baseClass = "group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 select-none ";
    const activeClass = "bg-[#4F46E5]/10 text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818cf8] font-bold border border-[#4F46E5]/20 shadow-xs";
    const inactiveClass = "text-slate-600 hover:text-[#4F46E5] hover:bg-slate-100/90 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50";

    const makeLink = (path, icon, label) => {
      const isActive = location.pathname === path;
      return (
        <Link 
          key={path}
          to={path} 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontStyle: 'normal',
            fontWeight: isActive ? 700 : 600,
            fontSize: '12px',
            lineHeight: '16px',
            color: isActive ? 'oklch(0.488 0.243 264.376)' : undefined
          }}
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        >
          <div className="flex items-center gap-3">
            <span className={`${isActive ? 'text-[#4F46E5] dark:text-[#818cf8]' : 'text-slate-500 group-hover:text-[#4F46E5]'} transition-colors`}>
              {icon}
            </span>
            <span className={`${!sidebarOpen && "lg:hidden"} origin-left duration-200 truncate`}>{label}</span>
          </div>
          {isActive && sidebarOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] dark:bg-[#818cf8]" />
          )}
        </Link>
      );
    };

    const renderSection = (title, links) => (
      <div className="space-y-1.5">
        {sidebarOpen && (
          <div className="px-3.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {title}
          </div>
        )}
        <div className="space-y-1.5">
          {links}
        </div>
      </div>
    );

    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      return renderSection('Administration', [
        makeLink('/admin', <LayoutDashboard size={17} />, 'Dashboard'),
        makeLink('/admin/trainers', <GraduationCap size={17} />, 'Trainers Directory'),
        makeLink('/admin/batches', <FolderGit size={17} />, 'Batches Directory'),
        makeLink('/admin/students', <Users size={17} />, 'Students Directory'),
        makeLink('/admin/attendance', <CalendarCheck size={17} />, 'Attendance'),
        makeLink('/admin/placement', <Briefcase size={17} />, 'Placement'),
      ]);
    } else if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(user?.role || '')) {
      return renderSection('Trainer Portal', [
        makeLink('/trainer', <LayoutDashboard size={17} />, 'Dashboard'),
        makeLink('/trainer/batches', <FolderGit size={17} />, 'Batches Directory'),
        makeLink('/trainer/students', <Users size={17} />, 'Students Directory'),
        makeLink('/trainer/attendance', <CalendarCheck size={17} />, 'Mark Attendance'),
        makeLink('/trainer/scores', <FilePieChart size={17} />, 'Grade Scorecard'),
        makeLink('/trainer/session', <Camera size={17} />, 'Smart Attendance QR'),
      ]);
    } else if (user?.role === 'Student') {
      return renderSection('Student Hub', [
        makeLink('/student', <LayoutDashboard size={17} />, 'Overview'),
        makeLink('/student/ai-roadmap', <Sparkles size={17} />, 'AI Study Planner'),
        makeLink('/student/scanner', <Camera size={17} />, 'Scan QR Attendance'),
        makeLink('/student/placement', <Briefcase size={17} />, 'Placement Readiness'),
        makeLink('/student/leaderboard', <Trophy size={17} />, 'Leaderboard'),
        makeLink('/student/scorecards', <FileText size={17} />, 'My Scorecards'),
      ]);
    }
    return null;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-100/50 text-gray-900 transition-colors duration-300 dark:bg-[#0b0c10] dark:text-gray-100 flex">
      
      {/* 1. SIDEBAR (LARGE SCREEN) */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800/80 bg-white/70 dark:bg-[#12131a]/80 backdrop-blur-md sticky top-0 h-screen transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 dark:border-gray-800/85">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-9 flex items-center">
              <img src={logoSla} alt="LCP Logo" className="h-8 w-auto object-contain" />
            </div>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400"
              >
                LCP System
              </motion.span>
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ChevronRight className={`h-5 w-5 transform transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-5 space-y-4 overflow-y-auto">
          {getNavLinks()}
        </nav>

        {/* Footer info / Logout */}
        <div className="p-3.5 border-t border-gray-200 dark:border-gray-800/85">
          {sidebarOpen ? (
            <div className="bg-gray-100/60 dark:bg-gray-900/40 rounded-xl p-2.5 mb-2.5 flex items-center gap-2.5">
              <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-[10px] font-semibold text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
          ) : null}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            <span className={`${!sidebarOpen && "lg:hidden"}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#12131a] border-r border-gray-200 dark:border-gray-800 shadow-2xl z-50 p-5 flex flex-col justify-between lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-9 flex items-center">
                      <img src={logoSla} alt="LCP Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">LCP System</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 dark:text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                <nav className="space-y-4">
                  {getNavLinks()}
                </nav>
              </div>

              <div>
                <div className="bg-gray-100/50 dark:bg-gray-900/40 rounded-2xl p-3 mb-4 flex items-center space-x-3">
                  <div className="h-9 w-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-semibold truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.role}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 font-medium transition-all duration-300"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <header className="h-16 bg-white/70 dark:bg-[#0b0c10]/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/80 sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu size={20} />
            </button>
            {user?.role !== 'Communication Trainer' && (
              <div className="hidden sm:flex items-center space-x-2 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100/40 dark:border-indigo-900/30">
                <Sparkles size={13} />
                <span>{user?.role} Workspace</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">

            {/* Notifications Dropdown (Student only) */}
            {user?.role === 'Student' && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setProfileDropdownOpen(false);
                    if (!notifDropdownOpen && unreadCount > 0) {
                      markNotificationsRead();
                    }
                  }}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"></span>
                  )}
                </button>

                <AnimatePresence>
                  {notifDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setNotifDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-40 p-4"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                          <h4 className="font-semibold text-sm">Notifications</h4>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {unreadCount} new
                          </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2.5">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">No notifications yet.</p>
                          ) : (
                            notifications.map(notif => (
                              <div key={notif._id} className={`p-2.5 rounded-xl border transition-all ${notif.isRead ? 'bg-transparent border-gray-100 dark:border-gray-800' : 'bg-indigo-50/30 border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/30'}`}>
                                <h5 className="text-xs font-semibold">{notif.title}</h5>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                                <span className="text-[8px] text-gray-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Quick Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 border border-gray-200/60 dark:border-gray-800 transition-all cursor-pointer shadow-2xs"
              >
                <div className="h-8 w-8 bg-[#4F46E5] rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-sm">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold leading-none text-gray-800 dark:text-gray-200">{user?.name}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{user?.role}</span>
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-40 p-2"
                    >
                      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 mb-1">
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400">
                          {user?.role}
                        </span>
                      </div>
                      <Link 
                        to={
                          user?.role === 'Student' 
                            ? '/student/profile' 
                            : (user?.role === 'Admin' || user?.role === 'Super Admin')
                            ? '/admin/profile'
                            : '/trainer/profile'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-[#4F46E5] transition-colors"
                      >
                        <User size={16} />
                        <span>My Profile</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left transition-colors mt-1"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Area Content */}
        <main className="flex-1 m-4 lg:m-6 p-6 lg:p-8 overflow-y-auto bg-white border border-gray-200/80 rounded-[24px] shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
