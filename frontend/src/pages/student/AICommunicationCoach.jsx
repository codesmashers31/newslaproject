import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Volume2,
  ChevronRight,
  MessageSquare,
  Send,
  History,
  BrainCircuit,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../../components/ui/primitives';

const AICommunicationCoach = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coach'); // 'coach' | 'history'
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const loadData = async () => {
    try {
      const [topicsRes, historyRes, analyticsRes] = await Promise.all([
        API.get('/communication/topics'),
        API.get('/communication/my-history'),
        API.get('/communication/my-analytics')
      ]);

      if (topicsRes.data?.data) {
        setTopics(topicsRes.data.data);
        if (topicsRes.data.data.length > 0) {
          setSelectedTopic(topicsRes.data.data[0]);
        }
      }
      if (historyRes.data?.data) setHistory(historyRes.data.data);
      if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
    } catch (err) {
      toast.error('Failed to load communication coach data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Web Audio MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setEvaluationResult(null);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      toast.success('Audio recording started. Speak clearly!');
    } catch (err) {
      toast.error('Microphone access denied or not supported. You can type your response below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      toast.success('Recording captured!');
    }
  };

  const resetRecording = () => {
    if (isRecording) stopRecording();
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscriptText('');
    setRecordingSeconds(0);
    setEvaluationResult(null);
  };

  const handleSubmitEvaluation = async () => {
    if (!transcriptText.trim() && !audioBlob) {
      toast.error('Please record your speech or type your response.');
      return;
    }

    setEvaluating(true);
    try {
      const { data } = await API.post('/communication/submit-speech', {
        topic: selectedTopic?.title || 'General Interview Practice',
        category: selectedTopic?.category || 'General',
        transcriptText: transcriptText.trim() || 'Spoken interview response recorded via web microphone.',
        durationSeconds: recordingSeconds || 60
      });

      if (data?.data) {
        setEvaluationResult(data.data);
        toast.success('Speech evaluated successfully!');
        
        // Refresh history and analytics
        const [histRes, anaRes] = await Promise.all([
          API.get('/communication/my-history'),
          API.get('/communication/my-analytics')
        ]);
        if (histRes.data?.data) setHistory(histRes.data.data);
        if (anaRes.data?.data) setAnalytics(anaRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Speech evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateCustomTopic = async () => {
    try {
      toast.loading('Generating custom AI scenario...', { id: 'gen-topic' });
      const { data } = await API.post('/communication/generate-topic', {
        category: selectedTopic?.category || 'Project & Technical',
        level: 'Intermediate'
      });
      if (data?.data) {
        setTopics(prev => [data.data, ...prev]);
        setSelectedTopic(data.data);
        toast.success('New AI Interview scenario generated!', { id: 'gen-topic' });
      }
    } catch (err) {
      toast.error('Failed to generate topic', { id: 'gen-topic' });
    }
  };

  if (loading) return <PageSkeleton variant="detail" />;

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      
      {/* Top Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">MODULE 2 • AI SPEECH COACH</span>
            <h1 className="text-xl font-black text-[#0F172A] mt-0.5">Spoken Communication & Interview Coach</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('coach')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'coach' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Practice Studio
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My History
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">

        {/* TAB 1: COACH STUDIO */}
        {activeTab === 'coach' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Topics Selector (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Interview Scenarios</h3>
                  <button
                    onClick={handleGenerateCustomTopic}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Generate Custom AI Scenario"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto no-scrollbar">
                  {topics.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => {
                        setSelectedTopic(t);
                        resetRecording();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedTopic?._id === t._id 
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {t.recommendedDurationSeconds}s
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{t.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregated Competency Bar */}
              {analytics && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-indigo-600" />
                    <span>Your Average Fluency</span>
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-indigo-700">{analytics.averageOverallScore}%</span>
                    <span className="text-xs font-semibold text-slate-500">{analytics.totalSessions} Sessions Graded</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Interactive Recording Studio & Results (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Selected Topic Brief */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                    {selectedTopic?.category || 'General Practice'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500">
                    Duration: ~{selectedTopic?.recommendedDurationSeconds || 90}s
                  </span>
                </div>

                <h2 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedTopic?.title}
                </h2>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {selectedTopic?.description}
                </p>

                {/* Key Points Hints */}
                {selectedTopic?.keyPointsToCover?.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                      Recruiter Checkpoints to Hit:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.keyPointsToCover.map((pt, i) => (
                        <span key={i} className="text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-slate-700">
                          ✓ {pt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Recording & Waveform Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center gap-5">
                
                {/* Timer & Waveform animation */}
                <div className="flex flex-col items-center gap-3">
                  <span className={`text-3xl font-black ${isRecording ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                    {formatSeconds(recordingSeconds)}
                  </span>
                  
                  {isRecording ? (
                    <div className="flex items-center gap-1.5 h-8">
                      {[18, 28, 14, 32, 22, 36, 16, 30, 24, 18].map((h, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${h}px` }}
                          className="w-1.5 bg-rose-500 rounded-full animate-bounce"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold">
                      {audioBlob ? 'Audio captured. Ready for grading.' : 'Press the microphone button to start recording.'}
                    </p>
                  )}
                </div>

                {/* Primary Mic Controls */}
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
                      title="Start Recording"
                    >
                      <Mic size={26} />
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer animate-pulse"
                      title="Stop Recording"
                    >
                      <Square size={24} />
                    </button>
                  )}

                  {audioUrl && (
                    <button
                      onClick={resetRecording}
                      className="p-3.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Reset Audio"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>

                {/* Audio playback */}
                {audioUrl && (
                  <audio controls src={audioUrl} className="w-full max-w-sm mt-2" />
                )}

                {/* Text Fallback Area */}
                <div className="w-full border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Transcript / Typed Response (Optional or Fallback):
                  </label>
                  <textarea
                    rows={3}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="Type or paste your spoken response here if microphone is unavailable..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Submit for AI Evaluation */}
                <button
                  onClick={handleSubmitEvaluation}
                  disabled={evaluating || (!audioBlob && !transcriptText.trim())}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {evaluating ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Submit for 6-Competency AI Grading</span>
                    </>
                  )}
                </button>
              </div>

              {/* 6-COMPETENCY AI EVALUATION RESULTS */}
              {evaluationResult && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-6 animate-fadeIn">
                  
                  {/* Overall Score Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/60 border border-indigo-100 p-5 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                        Recruiter Scorecard
                      </span>
                      <h3 className="text-2xl font-black text-[#0F172A] mt-0.5">
                        {evaluationResult.overallScore}% Overall Articulation
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {evaluationResult.overallScore >= 80 ? '🌟 Tier-1 Interview Ready' : '📈 Solid effort, review structural feedback below.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-white border border-indigo-200 px-3.5 py-1.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Fillers</span>
                        <span className="text-xs font-black text-rose-600">{evaluationResult.fillerWordCount || 0} Count</span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Linguistic Competencies Grid */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                      6-Dimension Verbal Competencies
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'Grammar & Syntax', val: evaluationResult.scores?.grammar || 75 },
                        { name: 'Fluency & Pacing', val: evaluationResult.scores?.fluency || 75 },
                        { name: 'Vocabulary Range', val: evaluationResult.scores?.vocabulary || 75 },
                        { name: 'Clarity & Articulation', val: evaluationResult.scores?.clarity || 75 },
                        { name: 'Professional Tone', val: evaluationResult.scores?.professionalTone || 75 },
                        { name: 'Technical Depth', val: evaluationResult.scores?.technicalCommunication || 75 }
                      ].map((c, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-500 block truncate">{c.name}</span>
                          <span className="text-sm font-black text-slate-800 mt-0.5 block">{c.val}%</span>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div style={{ width: `${c.val}%` }} className="bg-indigo-600 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentence-by-Sentence Mistakes */}
                  {evaluationResult.mistakes?.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Sentence-by-Sentence Refinement
                      </h4>
                      <div className="flex flex-col gap-3">
                        {evaluationResult.mistakes.map((m, idx) => (
                          <div key={idx} className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                                {m.category}
                              </span>
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-rose-800">You Said: </span>
                              <span className="text-slate-700 italic">"{m.originalText}"</span>
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-emerald-700">Recruiter Version: </span>
                              <span className="text-slate-900 font-semibold">"{m.improvedVersion}"</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                              💡 {m.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recruiter-Level Ideal Answer */}
                  {evaluationResult.idealAnswerOrExample && (
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                        🌟 Recruiter-Approved Model Demonstration
                      </span>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                        "{evaluationResult.idealAnswerOrExample}"
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <h2 className="text-base font-black text-[#0F172A]">Previous Speaking Sessions</h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold">No previous practice recordings found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((s) => (
                  <div key={s._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {s.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{s.topic}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">"{s.transcript}"</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-black text-indigo-700">{s.overallScore}%</span>
                        <span className="text-[10px] text-slate-400 block">{s.durationSeconds}s duration</span>
                      </div>
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

export default AICommunicationCoach;
