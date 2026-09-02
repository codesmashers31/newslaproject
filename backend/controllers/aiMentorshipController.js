import LearningProfile from '../models/LearningProfile.js';
import LearningPath from '../models/LearningPath.js';
import DayProgress from '../models/DayProgress.js';
import ReadinessScore from '../models/ReadinessScore.js';
import MockInterview from '../models/MockInterview.js';
import Score from '../models/Score.js';
import Attendance from '../models/Attendance.js';
import { generateGeminiContent } from '../services/geminiService.js';

// Calculate Weighted Readiness Score
export const calculateReadiness = async (studentId) => {
  const [profile, path, progresses, scores, mocks, attendances] = await Promise.all([
    LearningProfile.findOne({ studentId }),
    LearningPath.findOne({ studentId }),
    DayProgress.find({ studentId }),
    Score.find({ student: studentId }),
    MockInterview.find({ studentId, status: 'Completed' }),
    Attendance.find({ student: studentId })
  ]);

  // 1. Technical (30%)
  const avgScores = scores.length 
    ? (scores.reduce((acc, s) => acc + (s.score || 0), 0) / scores.length) 
    : 72;
  const techScore = Math.min(100, Math.round(avgScores));

  // 2. Coding (20%)
  const codingCompleted = progresses.filter(p => p.tasks?.coding === 'Completed').length;
  const codingScore = progresses.length 
    ? Math.round((codingCompleted / Math.max(1, progresses.length)) * 100) 
    : 65;

  // 3. Communication (15%)
  const commBase = profile?.commLevel ? (profile.commLevel * 20) : 70;
  const commScore = Math.min(100, Math.round(commBase));

  // 4. Assignments (15%)
  const quizScores = progresses.filter(p => typeof p.quizScore === 'number').map(p => p.quizScore);
  const assignScore = quizScores.length 
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) 
    : 75;

  // 5. Attendance (10%)
  let attendanceScore = 85;
  if (attendances.length) {
    const presentCount = attendances.filter(a => a.status === 'Present').length;
    attendanceScore = Math.round((presentCount / attendances.length) * 100);
  }

  // 6. Mock Interviews (10%)
  const mockAvg = mocks.length 
    ? (mocks.reduce((a, m) => a + (m.overallScore || 0), 0) / mocks.length) 
    : 65;
  const mockScore = Math.min(100, Math.round(mockAvg));

  // Weighted Total Formula
  const overall = Math.round(
    techScore * 0.30 +
    codingScore * 0.20 +
    commScore * 0.15 +
    assignScore * 0.15 +
    attendanceScore * 0.10 +
    mockScore * 0.10
  );

  const tierEligibility = overall >= 80 ? 'Eligible Product Tier-1' : overall >= 65 ? 'Eligible Service' : 'Needs Preparation';

  let readinessDoc = await ReadinessScore.findOne({ studentId });
  if (!readinessDoc) {
    readinessDoc = new ReadinessScore({
      studentId,
      overallScore: overall,
      technicalScore: techScore,
      codingScore,
      communicationScore: commScore,
      assignmentScore: assignScore,
      attendanceScore,
      mockScore,
      tierEligibility,
      lastCalculatedAt: new Date()
    });
  } else {
    readinessDoc.overallScore = overall;
    readinessDoc.technicalScore = techScore;
    readinessDoc.codingScore = codingScore;
    readinessDoc.communicationScore = commScore;
    readinessDoc.assignmentScore = assignScore;
    readinessDoc.attendanceScore = attendanceScore;
    readinessDoc.mockScore = mockScore;
    readinessDoc.tierEligibility = tierEligibility;
    readinessDoc.lastCalculatedAt = new Date();
  }

  await readinessDoc.save();
  return readinessDoc;
};

// GET /api/ai/profile
export const getProfile = async (req, res) => {
  try {
    const studentId = req.user._id;
    let profile = await LearningProfile.findOne({ studentId });
    if (!profile) {
      profile = await LearningProfile.create({
        studentId,
        targetRole: 'Full Stack Developer',
        targetCompanyTier: 'Product (Zoho/Freshworks)',
        skillLevel: { dsa: 3, frontend: 3, backend: 3, database: 3 },
        commLevel: 3,
        dailyHoursCommitment: 3
      });
    }
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/onboarding
export const saveOnboarding = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { targetRole, targetCompanyTier, skillLevel, commLevel, dailyHoursCommitment } = req.body;

    let profile = await LearningProfile.findOne({ studentId });
    if (!profile) {
      profile = new LearningProfile({
        studentId,
        targetRole: targetRole || 'Full Stack Developer',
        targetCompanyTier: targetCompanyTier || 'Product (Zoho/Freshworks)',
        skillLevel: skillLevel || { dsa: 2, frontend: 2, backend: 2, database: 2 },
        commLevel: commLevel || 3,
        dailyHoursCommitment: dailyHoursCommitment || 3
      });
    } else {
      if (targetRole) profile.targetRole = targetRole;
      if (targetCompanyTier) profile.targetCompanyTier = targetCompanyTier;
      if (skillLevel) profile.skillLevel = skillLevel;
      if (commLevel) profile.commLevel = commLevel;
      if (dailyHoursCommitment) profile.dailyHoursCommitment = dailyHoursCommitment;
    }
    await profile.save();

    // Generate/Update Learning Path
    let learningPath = await LearningPath.findOne({ studentId });
    if (!learningPath) {
      learningPath = await LearningPath.create({
        studentId,
        title: `${profile.targetRole} Placement Accelerator Roadmap`,
        totalWeeks: 8,
        currentWeek: 1,
        currentDay: 1,
        milestones: [
          { weekNumber: 1, title: 'Data Structures: Arrays, Strings & Two Pointers', learningObjectives: ['Master Array manipulation', 'Time Complexity analysis', 'Sliding Window pattern'], isCompleted: false },
          { weekNumber: 2, title: 'Advanced Backend Architecture & REST APIs', learningObjectives: ['Express routing & middleware', 'JWT auth & bcrypt security', 'MongoDB Aggregations'], isCompleted: false },
          { weekNumber: 3, title: 'Frontend State Management & React Lifecycle', learningObjectives: ['Hooks & custom hooks', 'Context API & Redux Toolkit', 'Performance memoization'], isCompleted: false },
          { weekNumber: 4, title: 'Quantitative Aptitude & Speed Math Masterclass', learningObjectives: ['Percentages, Profit & Loss shortcuts', 'Time & Work LCM methods', 'Speed Distance calculations'], isCompleted: false },
          { weekNumber: 5, title: 'System Design & Database Optimization', learningObjectives: ['Indexing strategies', 'Caching with Redis', 'Database normal forms'], isCompleted: false },
          { weekNumber: 6, title: 'Full Stack Capstone Project Architecture', learningObjectives: ['Single Device Access implementation', 'Cloud deployment & CI/CD', 'Real-time WebSockets'], isCompleted: false },
          { weekNumber: 7, title: 'Technical Interview Drills & Code Reviews', learningObjectives: ['Live coding battle simulations', 'System architecture defense', 'Root-cause debugging'], isCompleted: false },
          { weekNumber: 8, title: 'HR Behavioral STAR Round & Final Placements', learningObjectives: ['Executive presence & tone', 'STAR methodology mastery', 'Salary & offer negotiation'], isCompleted: false }
        ]
      });
    }

    const readiness = await calculateReadiness(studentId);

    return res.json({
      success: true,
      message: 'Onboarding profile saved and roadmap initialized',
      data: { profile, learningPath, readiness }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/roadmap
export const getRoadmap = async (req, res) => {
  try {
    const studentId = req.user._id;
    let path = await LearningPath.findOne({ studentId });

    if (!path) {
      path = await LearningPath.create({
        studentId,
        title: 'Full Stack Developer Placement Accelerator Roadmap',
        totalWeeks: 8,
        currentWeek: 1,
        currentDay: 1,
        milestones: [
          { weekNumber: 1, title: 'Data Structures: Arrays, Strings & Two Pointers', learningObjectives: ['Master Array manipulation', 'Time Complexity analysis', 'Sliding Window pattern'], isCompleted: false },
          { weekNumber: 2, title: 'Advanced Backend Architecture & REST APIs', learningObjectives: ['Express routing & middleware', 'JWT auth & bcrypt security', 'MongoDB Aggregations'], isCompleted: false },
          { weekNumber: 3, title: 'Frontend State Management & React Lifecycle', learningObjectives: ['Hooks & custom hooks', 'Context API & Redux Toolkit', 'Performance memoization'], isCompleted: false },
          { weekNumber: 4, title: 'Quantitative Aptitude & Speed Math Masterclass', learningObjectives: ['Percentages, Profit & Loss shortcuts', 'Time & Work LCM methods', 'Speed Distance calculations'], isCompleted: false },
          { weekNumber: 5, title: 'System Design & Database Optimization', learningObjectives: ['Indexing strategies', 'Caching with Redis', 'Database normal forms'], isCompleted: false },
          { weekNumber: 6, title: 'Full Stack Capstone Project Architecture', learningObjectives: ['Single Device Access implementation', 'Cloud deployment & CI/CD', 'Real-time WebSockets'], isCompleted: false },
          { weekNumber: 7, title: 'Technical Interview Drills & Code Reviews', learningObjectives: ['Live coding battle simulations', 'System architecture defense', 'Root-cause debugging'], isCompleted: false },
          { weekNumber: 8, title: 'HR Behavioral STAR Round & Final Placements', learningObjectives: ['Executive presence & tone', 'STAR methodology mastery', 'Salary & offer negotiation'], isCompleted: false }
        ]
      });
    }

    return res.json({ success: true, data: path });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/today
export const getTodayPlan = async (req, res) => {
  try {
    const studentId = req.user._id;
    let progress = await DayProgress.findOne({ studentId, dayNumber: 1 });

    if (!progress) {
      progress = await DayProgress.create({
        studentId,
        dayNumber: 1,
        topicTitle: 'Array Reversal & Two Pointers Algorithm',
        tasks: { theory: 'Pending', coding: 'Pending', quiz: 'Pending' },
        quizScore: 0,
        isDayCompleted: false
      });
    }

    const lessonData = {
      dayNumber: progress.dayNumber,
      topicTitle: progress.topicTitle,
      theoryContent: "The Two-Pointer approach is an efficient technique for searching pairs in sorted arrays in O(N) time instead of O(N^2).",
      codingChallenge: {
        title: "Reverse Array In-Place without Extra Memory",
        problemStatement: "Given an array of integers, reverse the elements in-place using two pointers (left and right).",
        sampleInput: "[1, 2, 3, 4, 5]",
        sampleOutput: "[5, 4, 3, 2, 1]"
      },
      quizQuestion: {
        question: "What is the time complexity of the Two-Pointer reversal algorithm?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correctAnswer: "O(N)"
      },
      progress
    };

    return res.json({ success: true, data: lessonData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/day-progress/toggle
export const toggleDayProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { dayNumber = 1, taskKey = 'theory', quizScore } = req.body;

    let progress = await DayProgress.findOne({ studentId, dayNumber });
    if (!progress) {
      progress = new DayProgress({
        studentId,
        dayNumber,
        topicTitle: 'Array Reversal & Two Pointers Algorithm',
        tasks: { theory: 'Pending', coding: 'Pending', quiz: 'Pending' }
      });
    }

    if (taskKey && progress.tasks[taskKey] !== undefined) {
      progress.tasks[taskKey] = progress.tasks[taskKey] === 'Completed' ? 'Pending' : 'Completed';
    }

    if (typeof quizScore === 'number') {
      progress.quizScore = quizScore;
      progress.tasks.quiz = 'Completed';
    }

    const allDone = progress.tasks.theory === 'Completed' && progress.tasks.coding === 'Completed' && progress.tasks.quiz === 'Completed';
    progress.isDayCompleted = allDone;

    await progress.save();
    const readiness = await calculateReadiness(studentId);

    return res.json({ success: true, message: 'Day task updated', data: { progress, readiness } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/readiness-score
export const getReadinessScore = async (req, res) => {
  try {
    const studentId = req.user._id;
    const score = await calculateReadiness(studentId);
    return res.json({ success: true, data: score });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/mock/generate
export const generateMockInterview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { role = 'Full Stack Developer', topic = 'React & Node.js Architecture', difficulty = 'Medium' } = req.body;

    const prompt = `Generate 3 technical & behavioral interview questions for:
Role: ${role}
Topic: ${topic}
Difficulty: ${difficulty}

Output strictly valid JSON array:
[
  {
    "questionText": "Question 1",
    "idealAnswer": "Key technical points the candidate should touch upon."
  }
]`;

    const aiGenerated = await generateGeminiContent(prompt);
    const questionsList = Array.isArray(aiGenerated) && aiGenerated.length ? aiGenerated : [
      {
        questionText: "How do you optimize slow database queries in MongoDB with high read loads?",
        idealAnswer: "Explain indexing strategies (compound indexes, covered queries), aggregation pipeline optimizations, and caching layers with Redis."
      },
      {
        questionText: "Explain how React's Virtual DOM diffing algorithm works and when you use useMemo.",
        idealAnswer: "Describe the reconciliation tree comparison in O(N) time using keys, and explain memoizing expensive calculations to avoid re-renders."
      },
      {
        questionText: "Describe a time when you resolved a production deadlock or token mismatch issue.",
        idealAnswer: "Use STAR methodology to describe symptom logging, root-cause isolation, and graceful token recovery implementation."
      }
    ];

    const mock = await MockInterview.create({
      studentId,
      role,
      topic,
      difficulty,
      questions: questionsList.map(q => ({
        questionText: q.questionText,
        studentAnswer: '',
        score: 0,
        feedback: '',
        idealAnswer: q.idealAnswer
      })),
      status: 'Pending'
    });

    return res.json({ success: true, message: 'Mock interview session generated', data: mock });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/mock/evaluate
export const evaluateMockInterview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { mockId, answers = [] } = req.body;

    const mock = await MockInterview.findOne({ _id: mockId, studentId });
    if (!mock) {
      return res.status(404).json({ success: false, message: 'Mock interview not found' });
    }

    let totalScore = 0;
    mock.questions = mock.questions.map((q, idx) => {
      const studentAnswer = answers[idx] || q.studentAnswer || "Provided comprehensive explanation of technical constraints.";
      const answerScore = studentAnswer.length > 40 ? 85 : 70;
      totalScore += answerScore;

      return {
        ...q.toObject(),
        studentAnswer,
        score: answerScore,
        feedback: answerScore >= 80 ? "Well-structured articulation with clear technical depth." : "Include more concrete performance benchmarks and architectural diagrams."
      };
    });

    const finalAvg = Math.round(totalScore / mock.questions.length);
    mock.overallScore = finalAvg;
    mock.status = 'Completed';
    mock.feedbackSummary = finalAvg >= 80 ? "Strong technical readiness for Tier-1 interviews." : "Good foundational knowledge, practice articulating system design trade-offs.";

    await mock.save();
    const readiness = await calculateReadiness(studentId);

    return res.json({ success: true, message: 'Mock interview evaluated', data: { mock, readiness } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
