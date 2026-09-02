import AptitudeTopic from '../models/AptitudeTopic.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import { solveAptitudeQuestion, generateGeminiContent } from '../services/geminiService.js';

// 16 Standard Placement Topics
const standard16Topics = [
  { name: 'Number System & Divisibility', category: 'Arithmetic', description: 'Factors, Multiples, Remainder Theorem, Units Digit & Divisibility rules.', order: 1 },
  { name: 'Percentages & Fraction Equivalence', category: 'Commercial Math', description: 'Fraction-to-% conversion, Successive % changes, Population & Depreciation.', order: 2 },
  { name: 'Profit, Loss & Discount', category: 'Commercial Math', description: 'Cost Price, Selling Price, Marked Price, Dishonest Dealer problems.', order: 3 },
  { name: 'Simple & Compound Interest', category: 'Commercial Math', description: 'Annual/Semi-annual compounding, Difference between CI and SI shortcuts.', order: 4 },
  { name: 'Ratio, Proportion & Variation', category: 'Arithmetic', description: 'Mean proportional, Direct/Inverse variation, Partnership sharing.', order: 5 },
  { name: 'Ages & Averages', category: 'Arithmetic', description: 'Weighted average, Replacement problems, Linear age ratio shifts.', order: 6 },
  { name: 'Time and Work & Pipes/Cisterns', category: 'Arithmetic', description: 'Unitary rate & LCM work efficiency, Alternate days, Efficiency ratios.', order: 7 },
  { name: 'Time, Speed, Distance & Trains', category: 'Arithmetic', description: 'Relative velocity, Train crossings, Average speed harmonic shortcuts.', order: 8 },
  { name: 'Boats and Streams', category: 'Arithmetic', description: 'Upstream & Downstream speed analysis, Still water velocity formulas.', order: 9 },
  { name: 'Alligations & Mixtures', category: 'Arithmetic', description: 'Rule of Alligation, Repeated dilution replacement formulas.', order: 10 },
  { name: 'Permutations and Combinations', category: 'Modern Math & DI', description: 'Arrangements, Selections, Circular permutations, Constraint problems.', order: 11 },
  { name: 'Probability & Odds', category: 'Modern Math & DI', description: 'Classical probability, Conditional probability, Dice, Cards & Coin sets.', order: 12 },
  { name: 'Mensuration (2D & 3D Geometry)', category: 'Geometry & Mensuration', description: 'Area, Perimeter, Volume, Surface area of Cones, Cylinders & Spheres.', order: 13 },
  { name: 'Linear & Quadratic Equations', category: 'Algebra', description: 'Roots of quadratic equations, Discriminant, Min/Max values.', order: 14 },
  { name: 'Progressions: AP, GP & HP', category: 'Algebra', description: 'nth term, Sum of n terms, Arithmetic & Geometric mean relationships.', order: 15 },
  { name: 'Data Interpretation & Graphs', category: 'Modern Math & DI', description: 'Bar charts, Pie charts, Line graphs, Radar charts & Tabular DI.', order: 16 }
];

// Foundations & Speed Math Dataset
const foundationsData = {
  fractionToPercentage: [
    { fraction: '1/2', percentage: '50%' },
    { fraction: '1/3', percentage: '33.33%' },
    { fraction: '1/4', percentage: '25%' },
    { fraction: '1/5', percentage: '20%' },
    { fraction: '1/6', percentage: '16.66%' },
    { fraction: '1/7', percentage: '14.28%' },
    { fraction: '1/8', percentage: '12.5%' },
    { fraction: '1/9', percentage: '11.11%' },
    { fraction: '1/10', percentage: '10%' },
    { fraction: '1/11', percentage: '9.09%' },
    { fraction: '1/12', percentage: '8.33%' },
    { fraction: '1/13', percentage: '7.69%' },
    { fraction: '1/14', percentage: '7.14%' },
    { fraction: '1/15', percentage: '6.66%' },
    { fraction: '1/16', percentage: '6.25%' },
    { fraction: '1/20', percentage: '5%' }
  ],
  squares: Array.from({ length: 50 }, (_, i) => ({ number: i + 1, square: (i + 1) * (i + 1) })),
  cubes: Array.from({ length: 30 }, (_, i) => ({ number: i + 1, cube: (i + 1) ** 3 })),
  divisibilityRules: [
    { number: 2, rule: "Last digit is even (0, 2, 4, 6, 8)." },
    { number: 3, rule: "Sum of all digits is divisible by 3." },
    { number: 4, rule: "Number formed by last two digits is divisible by 4." },
    { number: 5, rule: "Last digit is 0 or 5." },
    { number: 6, rule: "Divisible by both 2 and 3." },
    { number: 7, rule: "Double the last digit and subtract from remaining number; result is divisible by 7." },
    { number: 8, rule: "Number formed by last three digits is divisible by 8." },
    { number: 9, rule: "Sum of all digits is divisible by 9." },
    { number: 11, rule: "Difference between sum of odd placed digits and even placed digits is 0 or multiple of 11." },
    { number: 13, rule: "Multiply last digit by 4 and add to remaining number; result is divisible by 13." },
    { number: 17, rule: "Multiply last digit by 5 and subtract from remaining number; result is divisible by 17." },
    { number: 19, rule: "Multiply last digit by 2 and add to remaining number; result is divisible by 19." }
  ]
};

// GET /api/aptitude/topics
export const getTopics = async (req, res) => {
  try {
    let topics = await AptitudeTopic.find({}).sort({ order: 1 });
    if (topics.length === 0) {
      topics = await AptitudeTopic.insertMany(standard16Topics);
    }
    return res.json({ success: true, data: topics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/aptitude/generate-test
export const generateTest = async (req, res) => {
  try {
    const { topic = 'Time and Work & Pipes/Cisterns', difficulty = 'Medium', questionCount = 5 } = req.body;

    const prompt = `Generate a Quantitative Aptitude test for campus placement:
Topic: ${topic}
Difficulty: ${difficulty}
Count: ${questionCount}

Output strictly valid JSON array:
[
  {
    "questionId": "q1",
    "question": "Clear problem statement with numerical values",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Detailed step by step solution",
    "shortcutSolution": "10-second shortcut technique"
  }
]`;

    const aiQuestions = await generateGeminiContent(prompt);
    let finalQuestions = Array.isArray(aiQuestions) && aiQuestions.length >= 3 ? aiQuestions : [
      {
        questionId: "q1",
        question: `A can finish a piece of work in 12 days and B can finish the same work in 18 days. If they work together, in how many days will the work be completed?`,
        options: ["7.2 days", "8.5 days", "6.0 days", "9.0 days"],
        correctAnswer: "7.2 days",
        explanation: "Total work = LCM(12, 18) = 36 units. A's rate = 3 units/day, B's rate = 2 units/day. Combined rate = 5 units/day. Time = 36 / 5 = 7.2 days.",
        shortcutSolution: "Formula: (A * B) / (A + B) = (12 * 18) / 30 = 216 / 30 = 7.2 days."
      },
      {
        questionId: "q2",
        question: `A sum of ₹10,000 is invested at 10% per annum compound interest for 2 years. Find the difference between Compound Interest and Simple Interest.`,
        options: ["₹100", "₹150", "₹200", "₹50"],
        correctAnswer: "₹100",
        explanation: "SI for 2 years = (10000 * 10 * 2) / 100 = ₹2,000. CI for 2 years = 10000 * (1.1)^2 - 10000 = ₹2,100. Difference = ₹100.",
        shortcutSolution: "2-year Difference formula = P * (R/100)^2 = 10000 * (10/100)^2 = 10000 * 0.01 = ₹100."
      },
      {
        questionId: "q3",
        question: `A train 180 meters long crosses a pole in 9 seconds. What is the speed of the train in km/hr?`,
        options: ["72 km/hr", "64 km/hr", "80 km/hr", "54 km/hr"],
        correctAnswer: "72 km/hr",
        explanation: "Speed in m/s = Distance / Time = 180 / 9 = 20 m/s. Convert to km/hr by multiplying by 18/5: 20 * (18/5) = 72 km/hr.",
        shortcutSolution: "Speed = 20 m/s. 20 * 3.6 = 72 km/hr directly."
      },
      {
        questionId: "q4",
        question: `If the price of sugar increases by 25%, by what percentage should a household reduce its consumption so that the expenditure remains unchanged?`,
        options: ["20%", "25%", "16.66%", "33.33%"],
        correctAnswer: "20%",
        explanation: "Reduction % = [R / (100 + R)] * 100 = [25 / 125] * 100 = (1/5) * 100 = 20%.",
        shortcutSolution: "Product constancy rule: +1/4 increase requires -1/5 decrease = 20%."
      },
      {
        questionId: "q5",
        question: `In how many different ways can the letters of the word 'CAMPUS' be arranged?`,
        options: ["720", "5040", "120", "360"],
        correctAnswer: "720",
        explanation: "The word 'CAMPUS' has 6 distinct letters. Number of permutations = 6! = 6 * 5 * 4 * 3 * 2 * 1 = 720.",
        shortcutSolution: "6! = 720."
      }
    ];

    return res.json({
      success: true,
      data: {
        sessionId: `APT-${Date.now()}`,
        topic,
        difficulty,
        totalQuestions: finalQuestions.length,
        timeLimitSeconds: finalQuestions.length * 90,
        questions: finalQuestions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/aptitude/submit-test
export const submitTest = async (req, res) => {
  try {
    const student = req.user;
    const { topic = 'Quantitative Aptitude', difficulty = 'Medium', questions = [], timeTakenSeconds = 0 } = req.body;

    let score = 0;
    const evaluatedQuestions = questions.map((q) => {
      const isCorrect = String(q.studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      if (isCorrect) score += 1;
      return {
        ...q,
        isCorrect
      };
    });

    const totalQuestions = questions.length || 1;
    const accuracy = Math.round((score / totalQuestions) * 100);

    const attempt = await AptitudeAttempt.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      topic,
      difficulty,
      totalQuestions,
      score,
      accuracy,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      questions: evaluatedQuestions,
      aiAnalysis: {
        overallSummary: accuracy >= 80 ? "Exceptional mathematical precision and speed!" : accuracy >= 50 ? "Solid foundational grasp, practice speed math shortcuts." : "Review core derivations and formula cheat sheets.",
        strengths: accuracy >= 60 ? ["Strong arithmetic concept application", "Accurate formula execution"] : ["Good attempt pacing"],
        weaknesses: accuracy < 80 ? ["Time spent on algebraic steps", "Check for standard shortcut tricks"] : [],
        recommendations: ["Review fraction-to-% mental conversions", "Use LCM method for Time & Work problems"]
      }
    });

    return res.json({
      success: true,
      message: 'Test submitted and graded',
      data: attempt
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/aptitude/solve-question
export const solveQuestion = async (req, res) => {
  try {
    const { questionText = '', topicHint = '' } = req.body;
    if (!questionText.trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }

    const solution = await solveAptitudeQuestion(questionText, topicHint);
    return res.json({ success: true, data: solution });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/aptitude/foundations
export const getFoundations = async (req, res) => {
  try {
    return res.json({ success: true, data: foundationsData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/aptitude/topic-guide/:topicName
export const getTopicGuide = async (req, res) => {
  try {
    const { topicName } = req.params;
    const guide = {
      topicName,
      keyFormulas: [
        { name: "Unitary Efficiency Rate", formula: "\\text{Rate} = \\frac{\\text{Total Work}}{\\text{Time Taken}}" },
        { name: "Combined Work (2 Workers)", formula: "\\text{Time} = \\frac{A \\times B}{A + B}" },
        { name: "Successive Percentage Change", formula: "\\text{Net \\%} = A + B + \\frac{A \\times B}{100}" }
      ],
      speedShortcuts: [
        "Use LCM of numbers to convert fractions into integers instantly.",
        "Use Unitary ratio matching instead of setting up $x$ variables."
      ],
      workedExamples: [
        {
          problem: "A can do a work in 10 days, B in 15 days. In how many days will they finish together?",
          solution: "Total work = LCM(10, 15) = 30 units. A = 3 u/day, B = 2 u/day. Combined = 5 u/day. Time = 30 / 5 = 6 days."
        }
      ]
    };
    return res.json({ success: true, data: guide });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/aptitude/my-history
export const getMyHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const history = await AptitudeAttempt.find({ studentId }).sort({ createdAt: -1 }).limit(30);
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
