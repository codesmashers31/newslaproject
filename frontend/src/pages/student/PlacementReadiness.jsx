import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Briefcase, CheckCircle, XCircle, AlertTriangle, Sparkles, User, Github, Linkedin, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PlacementReadiness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const { data } = await API.get('/student/dashboard');
        setData(data);
      } catch (error) {
        console.error('Error fetching dashboard details', error);
        toast.error('Failed to load placement readiness details');
      } finally {
        setLoading(false);
      }
    };
    fetchReadiness();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data || !data.placementReadiness) {
    return (
      <div className="text-center py-10 bg-white dark:bg-[#12131a] rounded-3xl border border-gray-250 dark:border-gray-800">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Placement details not available.</p>
      </div>
    );
  }

  const { percentage, status, breakdown, recommendations } = data.placementReadiness;

  // Status mapping colors
  const statusConfig = {
    'Ready': {
      bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450',
      border: 'border-emerald-250 dark:border-emerald-900/30',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
    },
    'Almost Ready': {
      bg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-900/30',
      icon: <CheckCircle className="w-5 h-5 text-blue-500" />
    },
    'Needs Improvement': {
      bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-455',
      border: 'border-amber-250 dark:border-amber-900/30',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
    },
    'Critical': {
      bg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450',
      border: 'border-rose-200 dark:border-rose-900/30',
      icon: <XCircle className="w-5 h-5 text-rose-500" />
    }
  };

  const currentStatus = statusConfig[status] || statusConfig['Critical'];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Placement Readiness Engine
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Verify requirements, monitor score breakdowns, and resolve recommendations to qualify for corporate placement drives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Progress Card */}
        <div className="md:col-span-1 bg-white/70 dark:bg-[#12131a]/80 border border-gray-250 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
          <h2 className="font-bold text-lg mb-6">Readiness score</h2>
          
          {/* Radial progress ring */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                strokeWidth="10"
                className="stroke-gray-150 dark:stroke-gray-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                strokeWidth="10"
                className="stroke-indigo-650 dark:stroke-indigo-500"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * percentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold">{percentage}%</span>
              <span className="text-[10px] block font-semibold text-gray-400 mt-0.5">READINESS</span>
            </div>
          </div>

          <div className={`mt-6 inline-flex items-center gap-2 px-4.5 py-2 rounded-full border text-xs font-semibold ${currentStatus.bg} ${currentStatus.border}`}>
            {currentStatus.icon}
            Status: {status}
          </div>
        </div>

        {/* Requirements Breakdown List */}
        <div className="md:col-span-2 bg-white/70 dark:bg-[#12131a]/80 border border-gray-250 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl">
          <h2 className="font-bold text-lg mb-6">Readiness Criteria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Criteria Items */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">Resume Uploaded</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.resume}% / 15%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Linkedin className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">LinkedIn Updated</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.linkedin}% / 10%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Github className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">GitHub Updated</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.github}% / 10%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">Mock Interview</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.mockInterview}% / 15%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">Technical Mock Panel</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.technicalInterview}% / 15%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">HR Interview Panel</span>
              </div>
              <span className="text-xs font-bold text-gray-500">{breakdown.hrInterview}% / 10%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <span className="text-xs font-medium">Aptitude Progress</span>
              <span className="text-xs font-bold text-gray-500">{breakdown.aptitudeScore}% / 10%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl">
              <span className="text-xs font-medium">Communication Progress</span>
              <span className="text-xs font-bold text-gray-500">{breakdown.communicationScore}% / 10%</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200/40 dark:border-gray-800/40 rounded-xl sm:col-span-2">
              <span className="text-xs font-medium">Technical Module Progress</span>
              <span className="text-xs font-bold text-gray-500">{breakdown.technicalScore}% / 5%</span>
            </div>

          </div>
        </div>
      </div>

      {/* AI Recommendation Panel */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-250 dark:border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-xl">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2.5">
          <Sparkles className="text-violet-500 fill-violet-500/20" />
          AI Recommendation Panel
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Personalized guidance to improve your placement scores, prepare for mock panels, and complete outstanding tasks.
        </p>

        <div className="space-y-3.5">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex gap-3.5 p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 text-sm font-medium"
            >
              <div className="h-5 w-5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-655 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <span className="text-gray-700 dark:text-gray-300">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career Guidance Section */}
      <div className="bg-white border border-[#c7c4d7] rounded-3xl p-8 ambient-shadow space-y-6">
        <div className="border-b pb-4 border-[#c7c4d7]">
          <h2 className="font-bold text-lg text-[#111c2d]">Career Guidance & Placement Manuals</h2>
          <p className="text-xs text-gray-500 mt-1">Exclusive preparation cheat sheets, templates, and resume guidelines for top IT job drives.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-[#f0f3ff] border border-[#c7c4d7] rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-[#4648d4]">DSA & Coding Rounds</h4>
            <p className="text-xs text-gray-600">Master arrays, dynamic programming, and binary trees. Recommended practice sheets for LeetCode & HackerRank.</p>
            <a href="#dsa" className="text-xs font-bold text-[#4648d4] hover:underline block pt-2">Access Practice Sheets &rarr;</a>
          </div>

          <div className="p-5 bg-[#f0f3ff] border border-[#c7c4d7] rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-[#4648d4]">Technical Interviews</h4>
            <p className="text-xs text-gray-600">System design parameters, REST patterns, database indexing checklists, and JavaScript closures cheat sheets.</p>
            <a href="#tech" className="text-xs font-bold text-[#4648d4] hover:underline block pt-2">View System Design Cheat Sheet &rarr;</a>
          </div>

          <div className="p-5 bg-[#f0f3ff] border border-[#c7c4d7] rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-[#4648d4]">Behavioral (HR) rounds</h4>
            <p className="text-xs text-gray-600">Succeed in HR evaluations using the STAR method (Situation, Task, Action, Result) for conflict resolution.</p>
            <a href="#hr" className="text-xs font-bold text-[#4648d4] hover:underline block pt-2">Read Behavioral Prep Guide &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementReadiness;
