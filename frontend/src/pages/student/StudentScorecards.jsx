import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Award, ShieldCheck, Printer, FileText, CheckCircle2, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const StudentScorecards = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aptitude'); // 'aptitude' | 'communication'

  const fetchScorecardData = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      setData(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load scorecard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4648d4] border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 bg-white rounded-3xl border border-[#c7c4d7]">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Scorecard data is currently unavailable.</p>
      </div>
    );
  }

  const { profile, batch, scorecards, placement, progress, attendance } = data;

  // Helper to render bubbles based on status
  const renderStatusBubbles = (status) => {
    const inProgress = status === 'In Progress' || status === 'Completed' || status === 'Mastered';
    const completed = status === 'Completed' || status === 'Mastered';
    const mastered = status === 'Mastered';

    return (
      <div className="flex justify-center space-x-2.5">
        <div 
          className={`h-4.5 w-4.5 rounded-full border-2 border-gray-400 flex items-center justify-center ${inProgress ? 'bg-indigo-650 border-indigo-655' : 'bg-transparent'}`}
          title="In Progress"
        >
          {inProgress && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <div 
          className={`h-4.5 w-4.5 rounded-full border-2 border-gray-400 flex items-center justify-center ${completed ? 'bg-emerald-600 border-emerald-600' : 'bg-transparent'}`}
          title="Completed"
        >
          {completed && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <div 
          className={`h-4.5 w-4.5 rounded-full border-2 border-gray-400 flex items-center justify-center ${mastered ? 'bg-amber-500 border-amber-500' : 'bg-transparent'}`}
          title="Mastered"
        >
          {mastered && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
      </div>
    );
  };

  const renderMockBubbles = (arr, count) => {
    const list = arr || Array(count).fill(false);
    return (
      <div className="flex justify-center space-x-2 mt-1.5">
        {Array(count).fill(0).map((_, i) => (
          <div 
            key={i} 
            className={`h-4.5 w-4.5 rounded-full border-2 border-gray-400 flex items-center justify-center ${list[i] ? 'bg-indigo-600 border-[#4648d4]' : 'bg-transparent'}`}
          >
            {list[i] && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>
        ))}
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const getAggregatedRemarks = (scorecardList) => {
    const remarks = scorecardList
      .filter(s => s.remarks)
      .map(s => `${s.moduleName}: ${s.remarks}`)
      .join(' | ');
    return remarks || 'Student is demonstrating consistent learning progress and batch participation.';
  };

  const chartScoreData = [
    { name: 'Aptitude', Score: progress.aptitude, Max: 100 },
    { name: 'Comm.', Score: progress.communication, Max: 100 },
    { name: 'Technical', Score: progress.technical, Max: 100 },
    { name: 'Attendance', Score: attendance.percentage, Max: 100 }
  ];

  const improvementHistory = [
    { month: 'Mar', Score: 68 },
    { month: 'Apr', Score: 74 },
    { month: 'May', Score: 81 },
    { month: 'Jun', Score: 89 }
  ];

  return (
    <div className="space-y-8 py-6">
      
      <div className="print:hidden flex flex-col sm:flex-row gap-4 items-center justify-between border-b pb-4 border-[#c7c4d7]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            LCP Printed Scorecards
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Display and print physical LCP evaluations matching SLA L&D department guidelines.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-[#c7c4d7]">
            <button
              onClick={() => setActiveTab('aptitude')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'aptitude' ? 'bg-white shadow text-[#4648d4]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Aptitude
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'communication' ? 'bg-white shadow text-[#4648d4]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Communication
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#4648d4] hover:bg-[#2f2ebe] text-white shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Page
          </button>
        </div>
      </div>

      <div className="print:hidden space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { title: 'Aptitude Score', val: '8.4 / 10', percent: progress.aptitude, stroke: 'stroke-blue-500' },
            { title: 'Comm. Score', val: '9.0 / 10', percent: progress.communication, stroke: 'stroke-purple-500' },
            { title: 'Technical Score', val: '9.2 / 10', percent: progress.technical, stroke: 'stroke-emerald-500' },
            { title: 'Assignment Score', val: '8.8 / 10', percent: 88, stroke: 'stroke-amber-500' },
            { title: 'Attendance Rate', val: `${attendance.percentage}%`, percent: attendance.percentage, stroke: 'stroke-indigo-600' },
            { title: 'Placement Score', val: `${placement.status || 'Active'}`, percent: progress.overall, stroke: 'stroke-pink-500' }
          ].map((score, i) => (
            <div key={i} className="bg-white border border-[#c7c4d7] p-4 rounded-3xl ambient-shadow flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">{score.title}</span>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-gray-100 fill-transparent" strokeWidth="4" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    className={`${score.stroke} fill-transparent`} 
                    strokeWidth="4" 
                    strokeDasharray={176} 
                    strokeDashoffset={176 - (176 * score.percent) / 100} 
                  />
                </svg>
                <span className="absolute text-xs font-black text-gray-800">{score.percent}%</span>
              </div>
              <span className="text-sm font-extrabold text-gray-700 mt-2">{score.val}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#c7c4d7] p-6 rounded-3xl ambient-shadow">
            <h4 className="font-bold text-sm text-[#111c2d] mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#4648d4]" />
              Subject Score Comparison
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartScoreData}>
                  <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="Score" fill="#4648d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-[#c7c4d7] p-6 rounded-3xl ambient-shadow">
            <h4 className="font-bold text-sm text-[#111c2d] mb-4 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              Monthly Improvement Curve
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={improvementHistory}>
                  <XAxis dataKey="month" fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="#888888" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="Score" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3">
            <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1">
              <CheckCircle2 size={16} />
              Key Strengths & Competencies
            </h5>
            <ul className="text-xs text-emerald-700 space-y-2 list-disc pl-4">
              <li>Excellent logical parsing and mathematical aptitude.</li>
              <li>Strong REST API controller building practices using Express.</li>
              <li>Postural confidence and pronunciation during public presentations.</li>
            </ul>
          </div>

          <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-3xl space-y-3">
            <h5 className="font-bold text-rose-800 text-xs flex items-center gap-1">
              <AlertCircle size={16} />
              Areas Recommended For Improvement
            </h5>
            <ul className="text-xs text-rose-700 space-y-2 list-disc pl-4">
              <li>Needs calculation speed improvements for Probability and Permutations.</li>
              <li>Filler words ("like", "umm") reduction under mock assessment pressure.</li>
              <li>Advanced query optimization and indexing models inside MongoDB database layers.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white text-gray-900 border border-gray-300 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl print:border-0 print:shadow-none print:p-0 print:m-0 print:rounded-none">
        
        <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tighter text-blue-700 font-sans">SLA</span>
            <span className="text-[8px] uppercase tracking-wider text-gray-400 font-bold -mt-1">Right Way To IT Job</span>
          </div>
          <div className="text-center font-serif">
            <h2 className="text-3xl font-black tracking-tight text-gray-800">LCP</h2>
            <p className="text-[10px] text-gray-500 font-medium -mt-1">(Learning & Career Progress)</p>
            <h3 className="text-xl font-bold text-gray-700 mt-2 uppercase tracking-wide">
              {activeTab === 'aptitude' ? 'Aptitude Scorecard' : 'Communication Scorecard'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-gray-450 tracking-wider">L&D Department</span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6 items-center">
          <div className="col-span-3 space-y-2.5 text-sm">
            <div className="flex items-center">
              <span className="w-24 font-bold text-gray-500">Name</span>
              <span className="font-bold border-b border-dashed border-gray-400 flex-1 pb-0.5">{profile.user?.name}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 font-bold text-gray-500">Batch</span>
              <span className="font-bold border-b border-dashed border-gray-400 flex-1 pb-0.5">{batch?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 font-bold text-gray-500">Enrollment ID</span>
              <span className="font-mono text-xs border-b border-dashed border-gray-400 flex-1 pb-0.5">{profile.user?._id}</span>
            </div>
          </div>
          <div className="col-span-1 flex justify-end">
            <div className="h-24 w-20 border border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-55 text-[10px] text-gray-400 text-center font-bold">
              {profile.photo ? (
                <img src={profile.photo} alt="Student" className="h-full w-full object-cover rounded-lg" />
              ) : (
                '[PHOTO]'
              )}
            </div>
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl overflow-hidden mb-6 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold">
                <th className="py-2.5 px-4 text-center w-12 border-r border-gray-300">S.No</th>
                <th className="py-2.5 px-4 border-r border-gray-300">MODULE NAME</th>
                <th className="py-2.5 px-4 text-center w-28">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-205">
              {activeTab === 'aptitude' ? (
                scorecards.aptitude.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 px-4 text-center font-bold text-gray-500 border-r border-gray-300">{idx + 1}.</td>
                    <td className="py-2 px-4 font-semibold text-gray-800 border-r border-gray-300">{item.moduleName}</td>
                    <td className="py-2 px-4 border-gray-300">{renderStatusBubbles(item.status)}</td>
                  </tr>
                ))
              ) : (
                scorecards.communication.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-55/50">
                    <td className="py-2 px-4 text-center font-bold text-gray-500 border-r border-gray-300">{idx + 1}.</td>
                    <td className="py-2 px-4 font-semibold text-gray-800 border-r border-gray-300">{item.moduleName}</td>
                    <td className="py-2 px-4 border-gray-300">{renderStatusBubbles(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activeTab === 'communication' && (
          <div className="grid grid-cols-3 gap-3 border border-gray-300 rounded-xl p-3 mb-6 text-center text-[10px] font-bold">
            <div className="border-r border-gray-200">
              <span className="uppercase text-gray-500 tracking-wider">Communication Mock</span>
              {renderMockBubbles(placement?.communicationMocks, 3)}
            </div>
            <div className="border-r border-gray-200">
              <span className="uppercase text-gray-500 tracking-wider">Placement Enhancement</span>
              {renderMockBubbles(placement?.placementEnhancement, 5)}
            </div>
            <div>
              <span className="uppercase text-gray-500 tracking-wider">Technical & Managerial Mock</span>
              {renderMockBubbles(placement?.technicalMocks, 3)}
            </div>
          </div>
        )}

        <div className="border border-gray-300 rounded-xl p-4.5 mb-8">
          <h4 className="font-bold text-xs text-gray-500 mb-2 uppercase tracking-wide">Mentor Remarks</h4>
          <p className="text-xs text-gray-700 italic leading-relaxed">
            {activeTab === 'aptitude' 
              ? getAggregatedRemarks(scorecards.aptitude) 
              : getAggregatedRemarks(scorecards.communication)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-6 border-t border-dashed border-gray-350 text-center text-xs font-semibold">
          <div className="flex flex-col items-center">
            <div className="h-10 w-36 border-b border-gray-400 mb-2 font-serif italic text-gray-550 text-base">
              {activeTab === 'aptitude' ? 'Aptitude Mentor' : 'Communication Mentor'}
            </div>
            <span className="text-gray-400 uppercase text-[9px] tracking-widest">Mentor Signature</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-10 w-36 border-b border-gray-400 mb-2 font-serif italic text-gray-550 text-base">
              SLA Coordinator
            </div>
            <span className="text-gray-400 uppercase text-[9px] tracking-widest">Manager Signature</span>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          aside, header, main {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
};

export default StudentScorecards;
