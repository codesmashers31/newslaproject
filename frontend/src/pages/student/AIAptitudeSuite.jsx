import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  Brain, 
  Calculator, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  Trophy,
  ArrowRight,
  RotateCcw,
  Search,
  Check,
  Flag,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/primitives';

const AIAptitudeSuite = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'test' | 'solver' | 'foundations' | 'history'
  const [loading, setLoading] = useState(true);
  const [foundations, setFoundations] = useState(null);
  const [history, setHistory] = useState([]);

  // Test Studio States
  const [testConfig, setTestConfig] = useState({ difficulty: 'Medium', questionCount: 5 });
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // AI Solver States
  const [solverQuestionText, setSolverQuestionText] = useState('');
  const [solverTopicHint, setSolverTopicHint] = useState('');
  const [solving, setSolving] = useState(false);
  const [solverResult, setSolverResult] = useState(null);

  const loadData = async () => {
    try {
      const [topicsRes, foundationsRes, historyRes] = await Promise.all([
        API.get('/aptitude/topics'),
        API.get('/aptitude/foundations'),
        API.get('/aptitude/my-history')
      ]);

      if (topicsRes.data?.data) {
        setTopics(topicsRes.data.data);
        if (topicsRes.data.data.length > 0) setSelectedTopic(topicsRes.data.data[0]);
      }
      if (foundationsRes.data?.data) setFoundations(foundationsRes.data.data);
      if (historyRes.data?.data) setHistory(historyRes.data.data);
    } catch (err) {
      toast.error('Failed to load aptitude suite data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer for Test Studio
  useEffect(() => {
    if (currentTest && timeLeft > 0 && !testResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentTest, timeLeft, testResult]);

  const handleStartTest = async (topicName) => {
    try {
      toast.loading('Generating adaptive test...', { id: 'test-gen' });
      const { data } = await API.post('/aptitude/generate-test', {
        topic: topicName || selectedTopic?.name || 'Percentages & Fraction Equivalence',
        difficulty: testConfig.difficulty,
        questionCount: testConfig.questionCount
      });

      if (data?.data) {
        setCurrentTest(data.data);
        setCurrentQuestionIdx(0);
        setUserAnswers({});
        setFlaggedQuestions([]);
        setTimeLeft(data.data.timeLimitSeconds || 300);
        setTestResult(null);
        setActiveTab('test');
        toast.success('Test started! Good luck.', { id: 'test-gen' });
      }
    } catch (err) {
      toast.error('Failed to generate test', { id: 'test-gen' });
    }
  };

  const handleSelectAnswer = (questionId, option) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleToggleFlag = (idx) => {
    setFlaggedQuestions(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleAutoSubmitTest = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!currentTest) return;
    setSubmittingTest(true);
    try {
      const payloadQuestions = currentTest.questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        options: q.options,
        studentAnswer: userAnswers[q.questionId] || 'Unanswered',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        shortcutSolution: q.shortcutSolution
      }));

      const { data } = await API.post('/aptitude/submit-test', {
        topic: currentTest.topic,
        difficulty: currentTest.difficulty,
        questions: payloadQuestions,
        timeTakenSeconds: (currentTest.timeLimitSeconds || 300) - timeLeft
      });

      if (data?.data) {
        setTestResult(data.data);
        toast.success('Test evaluated!');
        const histRes = await API.get('/aptitude/my-history');
        if (histRes.data?.data) setHistory(histRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to submit test');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleSolveQuestion = async (e) => {
    e.preventDefault();
    if (!solverQuestionText.trim()) {
      toast.error('Please enter a mathematical problem statement.');
      return;
    }

    setSolving(true);
    try {
      const { data } = await API.post('/aptitude/solve-question', {
        questionText: solverQuestionText,
        topicHint: solverTopicHint
      });

      if (data?.data) {
        setSolverResult(data.data);
        toast.success('Question decomposed successfully!');
      }
    } catch (err) {
      toast.error('Failed to solve question');
    } finally {
      setSolving(false);
    }
  };

  if (loading) return <PageSkeleton variant="list" />;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">MODULE 3 • QUANT SUITE</span>
            <h1 className="text-xl font-black text-[#0F172A] mt-0.5">AI Quantitative Aptitude Mastery</h1>
          </div>

          {/* Quick Nav Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'topics', label: '16 Topics' },
              { id: 'solver', label: 'AI Root Solver' },
              { id: 'foundations', label: 'Speed Math' },
              { id: 'history', label: 'History' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">

        {/* TAB 1: 16 TOPICS SELECTION */}
        {activeTab === 'topics' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-base font-black text-[#0F172A]">Placement Quantitative Modules</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Select a topic to launch timed practice tests or view shortcut formulas</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((top) => (
                <div
                  key={top._id || top.name}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {top.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Module #{top.order}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {top.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {top.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleStartTest(top.name)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>Start Test</span>
                    </button>
                    <button
                      onClick={() => {
                        setSolverTopicHint(top.name);
                        setActiveTab('solver');
                      }}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      title="Solve question with AI"
                    >
                      <Sparkles size={14} className="text-amber-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE TEST STUDIO */}
        {activeTab === 'test' && currentTest && (
          <div className="flex flex-col gap-6">
            
            {/* Test Header with Timer */}
            {!testResult && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                    {currentTest.topic} ({currentTest.difficulty})
                  </span>
                  <h2 className="text-sm font-bold text-slate-800 mt-0.5">
                    Question {currentQuestionIdx + 1} of {currentTest.questions.length}
                  </h2>
                </div>

                {/* Timer Badge */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-sm ${
                  timeLeft <= 60 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <Clock size={16} />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </div>
            )}

            {!testResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Question Card (8 cols) */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">
                        Single Choice Question
                      </span>
                      <button
                        onClick={() => handleToggleFlag(currentQuestionIdx)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                          flaggedQuestions.includes(currentQuestionIdx) 
                            ? 'bg-amber-50 border-amber-300 text-amber-700' 
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <Flag size={12} />
                        <span>{flaggedQuestions.includes(currentQuestionIdx) ? 'Flagged' : 'Flag for Review'}</span>
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-relaxed mb-6">
                      {currentTest.questions[currentQuestionIdx].question}
                    </h3>

                    {/* Options list */}
                    <div className="flex flex-col gap-3">
                      {currentTest.questions[currentQuestionIdx].options.map((opt, i) => {
                        const isSelected = userAnswers[currentTest.questions[currentQuestionIdx].questionId] === opt;
                        return (
                          <div
                            key={i}
                            onClick={() => handleSelectAnswer(currentTest.questions[currentQuestionIdx].questionId, opt)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-semibold text-slate-800">{opt}</span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nav Controls */}
                  <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIdx === 0}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-30 cursor-pointer"
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < currentTest.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx(prev => Math.min(currentTest.questions.length - 1, prev + 1))}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        disabled={submittingTest}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {submittingTest ? 'Submitting...' : 'Submit Test'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Palette (4 cols) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Question Palette
                  </h4>

                  <div className="grid grid-cols-5 gap-2.5">
                    {currentTest.questions.map((q, idx) => {
                      const isAnswered = !!userAnswers[q.questionId];
                      const isFlagged = flaggedQuestions.includes(idx);
                      const isCurrent = currentQuestionIdx === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIdx(idx)}
                          className={`h-10 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center relative ${
                            isCurrent ? 'ring-2 ring-indigo-600' : ''
                          } ${
                            isFlagged ? 'bg-amber-100 border border-amber-300 text-amber-800' :
                            isAnswered ? 'bg-emerald-500 text-white' :
                            'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-300" />
                      <span>Flagged for Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-md bg-slate-100" />
                      <span>Unattempted</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitTest}
                    disabled={submittingTest}
                    className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Submit Test Now
                  </button>
                </div>

              </div>
            ) : (
              /* TEST SCORECARD & DIAGNOSTICS */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Test Completed</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      Score: {testResult.score} / {testResult.totalQuestions} ({testResult.accuracy}%)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {testResult.aiAnalysis?.overallSummary}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartTest(currentTest.topic)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Retake Test</span>
                  </button>
                </div>

                {/* Explanations List */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Detailed Solutions & Shortcut Tricks
                  </h4>

                  {testResult.questions?.map((q, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-5 flex flex-col gap-3 ${
                        q.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-xs font-bold text-slate-900">
                          {idx + 1}. {q.question}
                        </h5>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase ${
                          q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {q.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">Your Answer: </span>
                        <span>{q.studentAnswer}</span> | <span className="font-bold text-emerald-700">Correct: </span>
                        <span className="font-semibold text-emerald-800">{q.correctAnswer}</span>
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                        📖 {q.explanation}
                      </p>

                      {q.shortcutSolution && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                          <Zap size={14} className="text-amber-500 shrink-0" />
                          <span>⚡ 10-Second Hack: {q.shortcutSolution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI ROOT-CAUSE QUESTION SOLVER */}
        {activeTab === 'solver' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0F172A]">AI Root-Cause Question Solver</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Paste any complex aptitude question to get instant step-by-step deconstruction and 10s mental hacks</p>
                </div>
              </div>

              <form onSubmit={handleSolveQuestion} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Problem Statement *</label>
                  <textarea
                    rows={4}
                    value={solverQuestionText}
                    onChange={(e) => setSolverQuestionText(e.target.value)}
                    placeholder="e.g. A can complete a work in 10 days, B in 15 days. If they work on alternate days starting with A, how many days will it take?"
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Topic Hint (Optional)</label>
                    <input
                      type="text"
                      value={solverTopicHint}
                      onChange={(e) => setSolverTopicHint(e.target.value)}
                      placeholder="e.g. Time and Work, Percentage, Profit & Loss"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={solving}
                  className="mt-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {solving ? 'Deconstructing Math Principles...' : 'Deconstruct & Solve with AI'}
                </button>
              </form>
            </div>

            {/* AI Deconstructed Result */}
            {solverResult && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-5 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      Topic: {solverResult.topicIdentified} ({solverResult.difficulty})
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      Mathematical Root-Cause Analysis
                    </h3>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Final Answer</span>
                    <span className="text-xs font-black text-emerald-700">{solverResult.finalAnswer}</span>
                  </div>
                </div>

                {/* Root Concept */}
                <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block mb-1">
                    🎯 Root Mathematical Concept
                  </span>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                    {solverResult.rootConcept}
                  </p>
                </div>

                {/* Given Data & Formula */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                      Extracted Given Data
                    </span>
                    <ul className="text-xs font-medium text-slate-700 list-disc list-inside space-y-1">
                      {solverResult.givenData?.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                      Governing Formula Applied
                    </span>
                    <p className="text-xs font-bold text-indigo-700 font-mono">
                      {solverResult.formulaUsed}
                    </p>
                  </div>
                </div>

                {/* Step by Step Derivation */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Step-by-Step Derivation
                  </span>
                  <div className="space-y-2">
                    {solverResult.stepByStepSolution?.map((step, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-800">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10-Second Shortcut Hack */}
                {solverResult.shortcutTrick && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                    <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                        ⚡ 10-Second Speed Hack
                      </span>
                      <p className="text-xs text-amber-900 font-bold mt-0.5 leading-relaxed">
                        {solverResult.shortcutTrick}
                      </p>
                    </div>
                  </div>
                )}

                {/* Common Pitfalls to Avoid */}
                {solverResult.commonMistakes && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                        ⚠️ Common Student Pitfalls & Traps
                      </span>
                      <p className="text-xs text-rose-900 font-medium mt-0.5">
                        {solverResult.commonMistakes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FOUNDATIONS & SPEED MATH TOOLKIT */}
        {activeTab === 'foundations' && foundations && (
          <div className="flex flex-col gap-6">
            
            {/* Fraction to % Conversions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-3">
                Fraction to Percentage Cheatsheet
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {foundations.fractionToPercentage?.map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex justify-between items-center">
                    <span className="text-xs font-black text-indigo-700">{item.fraction}</span>
                    <span className="text-xs font-bold text-slate-700">{item.percentage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divisibility Rules */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-3">
                Divisibility Rules (2 to 19)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {foundations.divisibilityRules?.map((d, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      ÷{d.number}
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{d.rule}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <h2 className="text-base font-black text-[#0F172A]">Aptitude Test History</h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold">No test attempts logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((att) => (
                  <div key={att._id} className="py-4 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {att.difficulty}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{att.topic}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{att.timeTakenSeconds}s taken</span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-indigo-700">{att.accuracy}%</span>
                      <span className="text-[10px] text-slate-400 block">{att.score} / {att.totalQuestions} Correct</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AIAptitudeSuite;
