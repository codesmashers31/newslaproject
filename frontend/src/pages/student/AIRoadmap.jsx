import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Hourglass, 
  ArrowRight, 
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  GraduationCap
} from 'lucide-react';

const AIRoadmap = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Form states
  const [targetTrack, setTargetTrack] = useState('MERN Full Stack Developer');
  const [familiarSkills, setFamiliarSkills] = useState('');
  const [dailyHours, setDailyHours] = useState(4);

  const loadingSteps = [
    "Analyzing your current skill profile...",
    "Scanning target technology track requirements...",
    "Filtering out familiar concepts and topics...",
    "Formatting custom study schedule and daily sessions...",
    "Finalizing your personalized AI Roadmap..."
  ];

  const fetchRoadmap = async () => {
    try {
      const { data } = await API.get('/student/ai-roadmap');
      setRoadmap(data);
      if (data) {
        setTargetTrack(data.targetTrack);
        setFamiliarSkills(data.familiarSkills?.join(', ') || '');
        setDailyHours(data.dailyHours);
      }
    } catch (error) {
      toast.error('Failed to load your study plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Simulate loader progression
  useEffect(() => {
    let interval;
    if (generating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetTrack) {
      toast.error('Please select a target track');
      return;
    }

    setGenerating(true);
    // Add artificial delay to show gorgeous AI scanning animation
    setTimeout(async () => {
      try {
        const { data } = await API.post('/student/ai-roadmap', {
          targetTrack,
          familiarSkills,
          dailyHours
        });
        setRoadmap(data);
        toast.success('Your customized AI Study Plan has been generated!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Generation failed');
      } finally {
        setGenerating(false);
      }
    }, 4500);
  };

  const handleToggleTopic = async (topicId) => {
    try {
      const { data } = await API.put('/student/ai-roadmap/toggle-topic', { topicId });
      setRoadmap(data);
      
      const toggledTopic = data.topics.find(t => t._id === topicId);
      if (toggledTopic?.completed) {
        toast.success(`Completed: ${toggledTopic.name}! Keep it up! 🚀`);
      }
    } catch (error) {
      toast.error('Failed to update topic status');
    }
  };

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse">
        <div className="flex items-center space-x-2 text-violet-800 dark:text-violet-400">
          <RotateCcw className="animate-spin w-5 h-5" />
          <span className="text-sm font-semibold">Loading your learning plans...</span>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTopics = roadmap?.topics?.length || 0;
  const completedTopics = roadmap?.topics?.filter(t => t.completed).length || 0;
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const totalDays = roadmap?.topics?.filter(t => !t.completed).reduce((acc, t) => acc + t.estimatedDays, 0) || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-800 via-purple-600 to-violet-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-violet-100 dark:shadow-none">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>AI Learning Co-Pilot</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Customized AI Study Planner</h1>
            <p className="text-violet-100 text-sm max-w-xl">
              Accelerate your placement prep with custom roadmaps. By filtering out skills you already have, we tailor a target syllabus just for you.
            </p>
          </div>
          {roadmap && (
            <div className="flex gap-4">
              <button 
                onClick={() => setRoadmap(null)}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Configure Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* State 1: Loading AI analysis */}
        {generating && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-8 lg:p-12 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl text-center space-y-6 shadow-sm"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-100 dark:bg-violet-950/40 rounded-full animate-ping opacity-75" />
              <div className="absolute inset-2 bg-violet-50 dark:bg-violet-950/40 rounded-full animate-pulse" />
              <div className="relative w-14 h-14 bg-violet-800 dark:bg-violet-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">AI Architect at Work</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto h-10 flex items-center justify-center">
                {loadingSteps[loadingStep]}
              </p>
            </div>
            {/* Visual Progress Dots */}
            <div className="flex justify-center space-x-1.5">
              {loadingSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === loadingStep ? 'w-6 bg-violet-800' : 'w-2 bg-gray-200 dark:bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* State 2: No active roadmap - setup view */}
        {!generating && !roadmap && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form Card */}
            <div className="lg:col-span-2 bg-white dark:bg-[#12131a] p-6 lg:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Setup Study Parameters</h3>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Track dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block uppercase tracking-wider">
                    Target Career Path
                  </label>
                  <select 
                    value={targetTrack}
                    onChange={(e) => setTargetTrack(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#181922] border border-gray-200 dark:border-gray-880 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="MERN Full Stack Developer">MERN Full Stack Developer</option>
                    <option value="Python Data Scientist">Python Data Scientist</option>
                    <option value="Java Backend Developer">Java Backend Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                  </select>
                </div>

                {/* Familiar skills input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block uppercase tracking-wider">
                    Familiar Skills (Comma-separated)
                  </label>
                  <textarea 
                    value={familiarSkills}
                    onChange={(e) => setFamiliarSkills(e.target.value)}
                    placeholder="E.g. HTML, CSS, React, Python basics..."
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#181922] border border-gray-200 dark:border-gray-880 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                  />
                  <p className="text-[10px] text-gray-400">
                    Entering skills you already know will automatically streamline your study plan and save estimated hours.
                  </p>
                </div>

                {/* Daily hours committed */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Daily Study Hours
                    </label>
                    <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-400 text-xs font-bold rounded-lg border border-violet-100 dark:border-violet-950">
                      {dailyHours} hours / day
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-800 dark:accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 px-1">
                    <span>1 hr (Casual)</span>
                    <span>5 hrs (Standard)</span>
                    <span>10 hrs (Intense)</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-violet-800 hover:bg-violet-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-violet-100 dark:shadow-none"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>Build AI Customized Syllabus</span>
                </button>
              </form>
            </div>

            {/* Sidebar Guidelines */}
            <div className="bg-gray-50 dark:bg-[#181922] border border-gray-200 dark:border-gray-800 p-6 rounded-3xl space-y-6">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                <GraduationCap className="w-4.5 h-4.5 text-violet-800 dark:text-violet-400" />
                <span>How it works</span>
              </h4>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-violet-100 dark:bg-violet-950 rounded-full flex items-center justify-center text-xs font-bold text-violet-800 dark:text-violet-400 shrink-0">1</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Specify Track:</strong> Select the role/profile you are targeting for upcoming placement assessments.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-violet-100 dark:bg-violet-950 rounded-full flex items-center justify-center text-xs font-bold text-violet-800 dark:text-violet-400 shrink-0">2</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Map Familiarity:</strong> List technologies you already studied. The AI skips or shortens these modules.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-violet-100 dark:bg-violet-950 rounded-full flex items-center justify-center text-xs font-bold text-violet-800 dark:text-violet-400 shrink-0">3</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Commit Hours:</strong> We calculate duration timelines dynamically using your daily time capacity.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* State 3: Active Roadmap View */}
        {!generating && roadmap && (
          <motion.div 
            key="roadmap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress Card */}
              <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Roadmap Progress</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-gray-800 dark:text-gray-200">{completionPercentage}%</span>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-gray-400">
                  {completedTopics} of {totalTopics} core topics ticked
                </div>
              </div>

              {/* Time Remaining Card */}
              <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Time Remaining</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-violet-800 dark:text-violet-400">{totalDays}</span>
                    <span className="text-xs text-gray-500 font-medium">Estimated Days</span>
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                  <Hourglass className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Calculated based on {roadmap.dailyHours} hrs / day commitment</span>
                </div>
              </div>

              {/* Track Config Card */}
              <div className="bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Technology Track</span>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">{roadmap.targetTrack}</p>
                  <p className="text-[10px] text-gray-400">
                    Familiar Skills: {roadmap.familiarSkills?.length > 0 ? roadmap.familiarSkills.join(', ') : 'None listed'}
                  </p>
                </div>
                <div className="mt-4 text-[10px] text-gray-400">
                  Generated: {new Date(roadmap.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Syllabus Checklist */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-violet-800" />
                <span>Personalized Topics Checklist</span>
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {roadmap.topics.map((topic) => (
                  <div 
                    key={topic._id} 
                    onClick={() => handleToggleTopic(topic._id)}
                    className={`p-5 border rounded-2xl transition cursor-pointer flex items-start gap-4 select-none ${
                      topic.completed 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50' 
                        : 'bg-white dark:bg-[#12131a] border-gray-200 dark:border-gray-800 hover:border-violet-400 dark:hover:border-violet-950'
                    }`}
                  >
                    {/* Tick Checkbox */}
                    <div className="mt-0.5 shrink-0">
                      {topic.completed ? (
                        <CheckSquare className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-500" />
                      ) : (
                        <Square className="w-5.5 h-5.5 text-gray-300 dark:text-gray-700" />
                      )}
                    </div>

                    {/* Topic Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`text-sm font-extrabold transition-all ${
                          topic.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {topic.name}
                        </h4>
                        
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 w-fit ${
                          topic.completed
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-500'
                            : 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-950 text-violet-800 dark:text-violet-400'
                        }`}>
                          {topic.completed ? 'Topic Done' : `${topic.estimatedDays} Days`}
                        </span>
                      </div>

                      {/* Subtopic Pills */}
                      {topic.subtopics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {topic.subtopics.map((sub, idx) => {
                            // Check if subtopic was in familiar skills
                            const isFamiliar = roadmap.familiarSkills?.some(
                              skill => sub.toLowerCase().includes(skill) || skill.includes(sub.toLowerCase() || '')
                            );
                            return (
                              <span 
                                key={idx} 
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  topic.completed
                                    ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                                    : isFamiliar
                                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-900'
                                      : 'bg-gray-50 dark:bg-[#181922] text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-800'
                                }`}
                              >
                                {sub} {isFamiliar && '⭐'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRoadmap;
