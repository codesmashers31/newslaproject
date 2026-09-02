import CommunicationTopic from '../models/CommunicationTopic.js';
import CommunicationSession from '../models/CommunicationSession.js';
import { evaluateSpeech, generateGeminiContent } from '../services/geminiService.js';

// Default Curated Interview Scenarios
const defaultTopics = [
  {
    title: "Professional Self Introduction & Career Vision",
    category: "HR & Self Introduction",
    level: "Beginner",
    description: "Introduce yourself in under 90 seconds. Highlight your academic background, core technical stack, major projects, and why you want to join the company.",
    keyPointsToCover: ["Name & Education", "Core Tech Stack (React/Node)", "Flagship Project Highlights", "Career Aspiration"],
    recommendedDurationSeconds: 90,
    vocabularyHints: ["Spearheaded", "Architected", "Robust", "Scalable", "Proficient"]
  },
  {
    title: "Walkthrough of Complex Project Architecture",
    category: "Project & Technical",
    level: "Intermediate",
    description: "Explain the architectural layers of your most complex project, including database schema, API design, security, and state management.",
    keyPointsToCover: ["System Overview", "Database Model Relationships", "Authentication & Middleware", "Performance Bottlenecks Solved"],
    recommendedDurationSeconds: 120,
    vocabularyHints: ["Microservices", "RESTful API", "Latency", "Throughput", "Concurrency"]
  },
  {
    title: "A Critical Production Bug War Story",
    category: "Problem Solving",
    level: "Advanced",
    description: "Describe a high-severity bug you encountered, your systematic debugging methodology, root-cause diagnosis, and permanent fix.",
    keyPointsToCover: ["Symptoms & Error Logs", "Root Cause Analysis", "Testing & Deployment", "Preventative Measures"],
    recommendedDurationSeconds: 120,
    vocabularyHints: ["Diagnosed", "Regression", "Telemetry", "Memory Leak", "Graceful Degradation"]
  },
  {
    title: "Handling Ambiguous Requirements & Cross-Team Conflict",
    category: "Behavioral & Leadership",
    level: "Intermediate",
    description: "Narrate a scenario where you dealt with conflicting deadlines or unclear client expectations using the STAR method.",
    keyPointsToCover: ["Situation Context", "Task Assigned", "Action Taken", "Measurable Result"],
    recommendedDurationSeconds: 90,
    vocabularyHints: ["Stakeholders", "Prioritization", "Negotiated", "Consensus", "Agile Velocity"]
  }
];

// GET /api/communication/topics
export const getTopics = async (req, res) => {
  try {
    let topics = await CommunicationTopic.find({}).sort({ createdAt: -1 });
    if (topics.length === 0) {
      topics = await CommunicationTopic.insertMany(defaultTopics);
    }
    return res.json({ success: true, data: topics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/communication/generate-topic
export const generateTopic = async (req, res) => {
  try {
    const { category = 'Project & Technical', level = 'Intermediate' } = req.body;
    
    const prompt = `Generate a realistic campus placement interview speaking prompt for:
Category: ${category}
Difficulty: ${level}

Output strictly valid JSON:
{
  "title": "Topic Title",
  "category": "${category}",
  "level": "${level}",
  "description": "2-3 sentences explaining the scenario and context.",
  "keyPointsToCover": ["Point 1", "Point 2", "Point 3"],
  "recommendedDurationSeconds": 90,
  "vocabularyHints": ["Word 1", "Word 2", "Word 3"]
}`;

    const aiGenerated = await generateGeminiContent(prompt);
    const newTopicData = aiGenerated && aiGenerated.title ? aiGenerated : {
      title: `${category}: Real-world Technical Challenge`,
      category,
      level,
      description: `Explain how you design scalable systems and handle edge cases in ${category}.`,
      keyPointsToCover: ["System Goals", "Trade-off Analysis", "Final Outcome"],
      recommendedDurationSeconds: 90,
      vocabularyHints: ["Optimization", "Modularity", "Scalability"]
    };

    const createdTopic = await CommunicationTopic.create(newTopicData);
    return res.json({ success: true, message: 'AI scenario generated', data: createdTopic });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/communication/submit-speech
export const submitSpeech = async (req, res) => {
  try {
    const student = req.user;
    const { topic = 'Interview Response', category = 'General', transcriptText = '', durationSeconds = 60 } = req.body;

    const transcript = transcriptText.trim() || "Good morning. I am an aspiring software engineer with hands-on experience in full-stack web development, data structures, and database management. In my recent capstone project, I implemented REST APIs and single device authentication.";

    const evaluation = await evaluateSpeech(topic, category, transcript);

    const session = await CommunicationSession.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      topic,
      category,
      durationSeconds: Number(durationSeconds) || 60,
      transcript: evaluation.transcript || transcript,
      overallScore: evaluation.overallScore || 75,
      scores: evaluation.scores || {
        grammar: 75,
        fluency: 75,
        vocabulary: 75,
        clarity: 75,
        professionalTone: 75,
        technicalCommunication: 75
      },
      fillerWordCount: evaluation.fillerWordCount || 0,
      mistakes: evaluation.mistakes || [],
      positiveFeedback: evaluation.positiveFeedback || [],
      areasOfImprovement: evaluation.areasOfImprovement || [],
      idealAnswerOrExample: evaluation.idealAnswerOrExample || ''
    });

    return res.json({
      success: true,
      message: 'Speech graded successfully',
      data: session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/communication/my-history
export const getMyHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const history = await CommunicationSession.find({ studentId }).sort({ createdAt: -1 }).limit(30);
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/communication/my-analytics
export const getMyAnalytics = async (req, res) => {
  try {
    const studentId = req.user._id;
    const sessions = await CommunicationSession.find({ studentId });

    if (!sessions.length) {
      return res.json({
        success: true,
        data: {
          totalSessions: 0,
          averageOverallScore: 0,
          averageGrammarScore: 0,
          averageFluencyScore: 0,
          averageVocabularyScore: 0,
          averageClarityScore: 0,
          averageToneScore: 0,
          averageTechScore: 0,
          totalFillerWords: 0
        }
      });
    }

    const count = sessions.length;
    const avg = (key) => Math.round(sessions.reduce((acc, s) => acc + (s.scores?.[key] || s.overallScore || 0), 0) / count);

    const analytics = {
      totalSessions: count,
      averageOverallScore: Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / count),
      averageGrammarScore: avg('grammar'),
      averageFluencyScore: avg('fluency'),
      averageVocabularyScore: avg('vocabulary'),
      averageClarityScore: avg('clarity'),
      averageToneScore: avg('professionalTone'),
      averageTechScore: avg('technicalCommunication'),
      totalFillerWords: sessions.reduce((acc, s) => acc + (s.fillerWordCount || 0), 0)
    };

    return res.json({ success: true, data: analytics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
