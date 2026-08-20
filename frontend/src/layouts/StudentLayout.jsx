import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Camera, FileText, Briefcase, User } from 'lucide-react';

const StudentLayout = ({ children }) => {
  const tabs = [
    { name: 'Home', path: '/student', exact: true, icon: Home },
    { name: 'Training', path: '/student/training', exact: false, icon: BookOpen },
    { name: 'QR Scan', path: '/student/scanner', exact: false, icon: Camera },
    { name: 'Scorecard', path: '/student/scorecards', exact: false, icon: FileText },
    { name: 'Career', path: '/student/career', exact: false, icon: Briefcase },
    { name: 'Profile', path: '/student/profile', exact: false, icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="w-full bg-[#f8fafc] min-h-screen relative flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-[90px] relative no-scrollbar md:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-between items-center px-4 py-3 pb-6 z-50 md:px-12 lg:px-24">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.name}
                to={tab.path}
                end={tab.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full gap-1.5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`
                }
              >
                <Icon size={22} strokeWidth={2.5} />
                <span className="text-[10px] font-bold">{tab.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default StudentLayout;
