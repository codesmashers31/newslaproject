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
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sync theme with document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
    const baseClass = "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ";
    const activeClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/25 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400 shadow-sm";
    const inactiveClass = "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-gray-800/30";

    const makeLink = (path, icon, label) => {
      const isActive = location.pathname === path;
      return (
        <Link 
          key={path}
          to={path} 
          onClick={() => setMobileMenuOpen(false)}
          className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
        >
          {icon}
          <span className={`${!sidebarOpen && "lg:hidden"} origin-left duration-200`}>{label}</span>
        </Link>
      );
    };

    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      return [
        makeLink('/admin', <LayoutDashboard size={20} />, 'Dashboard'),
        makeLink('/admin/students', <Users size={20} />, 'Students'),
        makeLink('/admin/batches', <FolderGit size={20} />, 'Batches'),
        makeLink('/admin/trainers', <GraduationCap size={20} />, 'Trainers'),
        makeLink('/admin/attendance', <CalendarCheck size={20} />, 'Attendance'),
        makeLink('/admin/placement', <Briefcase size={20} />, 'Placement'),
      ];
    } else if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(user?.role || '')) {
      return [
        makeLink('/trainer', <LayoutDashboard size={20} />, 'Dashboard'),
        makeLink('/trainer/attendance', <CalendarCheck size={20} />, 'Mark Attendance'),
        makeLink('/trainer/scores', <FilePieChart size={20} />, 'Grade Scorecard'),
        makeLink('/trainer/session', <Camera size={20} />, 'Smart Attendance QR'),
      ];
    } else if (user?.role === 'Student') {
      return [
        makeLink('/student', <LayoutDashboard size={20} />, 'Overview'),
        makeLink('/student/profile', <User size={20} />, 'My Profile'),
        makeLink('/student/scanner', <Camera size={20} />, 'Scan QR Attendance'),
        makeLink('/student/placement', <Briefcase size={20} />, 'Placement Readiness'),
        makeLink('/student/leaderboard', <Trophy size={20} />, 'Leaderboard'),
        makeLink('/student/scorecards', <FileText size={20} />, 'My Scorecards'),
      ];
    }
    return [];
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-[#0b0c10] dark:text-gray-100 flex">
      
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
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {getNavLinks()}
        </nav>

        {/* Footer info / Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/85">
          {sidebarOpen ? (
            <div className="bg-gray-100/50 dark:bg-gray-900/40 rounded-2xl p-3 mb-3 flex items-center space-x-3">
              <div className="h-9 w-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
          ) : null}
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-950/20 font-medium transition-all duration-300"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
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
                <nav className="space-y-2">
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
              className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100/40 dark:border-indigo-900/30">
              <Sparkles size={13} />
              <span>{user?.role} Workspace</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 hover:text-indigo-650 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

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
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#12131a] border border-gray-250 dark:border-gray-800 rounded-2xl shadow-xl z-40 p-4"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-850 pb-2">
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
                              <div key={notif._id} className={`p-2.5 rounded-xl border transition-all ${notif.isRead ? 'bg-transparent border-gray-100 dark:border-gray-850' : 'bg-indigo-50/30 border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/30'}`}>
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
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
              >
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/25">
                  {user?.name?.charAt(0)}
                </div>
                <span className="hidden sm:block text-xs font-semibold">{user?.name}</span>
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
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-850">
                        <p className="text-xs font-semibold truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link 
                        to={user?.role === 'Student' ? '/student/profile' : '#'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850"
                      >
                        <User size={15} />
                        <span>My Profile</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left"
                      >
                        <LogOut size={15} />
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
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
