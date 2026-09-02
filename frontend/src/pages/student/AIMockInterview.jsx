import React, { useState } from 'react';
import API from '../../services/api';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  Mic, 
  Briefcase,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const AIMockInterview = () => {
  const [role, setRole] = useState('Full Stack Developer');
  const [topic, setTopic] = useState('React, Node.js & System Architecture');
  const [difficulty, setDifficulty] = useState('Medium');
  
  const [generating, setGenerating] = useState(false);
  const [activeMock, setActiveMock] = useState(null);
  const [answers, setAnswers] = useState(['', '', '']);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setResult(null);
    try {
      const { data } = await API.post('/ai/mock/generate', {
        role,
        topic,
        difficulty
      });
      if (data?.data) {
        setActiveMock(data.data);
        setAnswers(data.data.questions.map(() => ''));
        toast.success('Mock interview questions generated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate mock interview');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitMock = async () => {
    if (!activeMock) return;
    setEvaluating(true);
    try {
      const { data } = await API.post('/ai/mock/evaluate', {
        mockId: activeMock._id,
        answers
      });
      if (data?.data) {
        setResult(data.data);
        toast.success('Mock interview evaluated!');
      }
    } catch (err) {
      toast.error('Failed to submit mock interview');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">MODULE 4 • AI MOCK INTERVIEW</span>
            <h1 className="text-xl font-black text-[#0F172A] mt-0.5">AI Technical & Behavioral Mock Simulator</h1>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">

        {/* Generator Form */}
        {!activeMock && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0F172A]">Generate Targeted Mock Interview</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Simulate real technical and HR questions tailored to your dream company tier</p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuestions} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Engineering Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-600"
                  >
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Frontend Engineer (React/Next.js)">Frontend Engineer (React/Next.js)</option>
                    <option value="Backend Engineer (Node.js/Microservices)">Backend Engineer (Node.js/Microservices)</option>
                    <option value="QA Automation Engineer">QA Automation Engineer</option>
                    <option value="Data Engineer / Analytics">Data Engineer / Analytics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty Tier</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-600"
                  >
                    <option value="Easy">Easy (Foundation / Service Company)</option>
                    <option value="Medium">Medium (Product Tier-2 / Zoho / Freshworks)</option>
                    <option value="Hard">Hard (Tier-1 / FAANG / System Design)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Focus Technologies / Topics</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. React lifecycle, MongoDB indexing, REST APIs, STAR behavioral"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-600"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="mt-2 w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-2xl shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generating ? 'Synthesizing Interview Scenario...' : 'Start Mock Interview Session'}
              </button>
            </form>
          </div>
        )}

        {/* Live Mock Questions Panel */}
        {activeMock && !result && (
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-violet-600 tracking-wider">
                  {activeMock.role} • {activeMock.difficulty}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">{activeMock.topic}</h3>
              </div>
              <button
                onClick={() => setActiveMock(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Restart Session
              </button>
            </div>

            {activeMock.questions.map((q, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
                <span className="text-xs font-black text-violet-600 uppercase">Question {idx + 1}</span>
                <h4 className="text-sm font-bold text-slate-900 leading-relaxed">{q.questionText}</h4>

                <textarea
                  rows={4}
                  value={answers[idx] || ''}
                  onChange={(e) => {
                    const next = [...answers];
                    next[idx] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="Articulate your structured explanation here (or use bullet points with trade-offs)..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-violet-600 mt-2"
                />
              </div>
            ))}

            <button
              onClick={handleSubmitMock}
              disabled={evaluating}
              className="py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-2xl shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {evaluating ? 'Grading Responses...' : 'Submit All Answers for AI Review'}
            </button>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-violet-50 border border-violet-100 p-5 rounded-2xl">
              <div>
                <span className="text-[10px] font-black uppercase text-violet-700 tracking-wider">Evaluation Complete</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  Overall Score: {result.mock?.overallScore}%
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {result.mock?.feedbackSummary}
                </p>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setActiveMock(null);
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                New Mock Session
              </button>
            </div>

            {/* Questions Feedback */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Question-by-Question Breakdown
              </h4>

              {result.mock?.questions?.map((q, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 bg-slate-50/30">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-slate-900">Q{idx + 1}: {q.questionText}</h5>
                    <span className="text-xs font-black text-violet-700">{q.score}%</span>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">Your Answer: </span>
                    <span>{q.studentAnswer || 'N/A'}</span>
                  </div>

                  <div className="text-xs text-emerald-800 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                    <span className="font-bold">🌟 Ideal Model Points: </span>
                    <span>{q.idealAnswer}</span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    💡 <span className="font-bold">Feedback:</span> {q.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIMockInterview;
