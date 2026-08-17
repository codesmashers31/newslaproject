import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';
import Assignment from '../models/Assignment.js';
import AptitudeModule from '../models/AptitudeModule.js';
import CommunicationModule from '../models/CommunicationModule.js';
import TechnicalModule from '../models/TechnicalModule.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Enrollment from '../models/Enrollment.js';

import Holiday from '../models/Holiday.js';

export const calculateDynamicAttendance = async (studentId, department) => {
  if (department === 'Technical') {
    // Keep legacy Technical calculation logic
    const attendanceRecords = await Attendance.find({ student: studentId, subject: 'Technical Training' }).lean();
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
    return { 
      department: 'Technical',
      batchName: 'Technical Training',
      startDate: null,
      trainingDay: totalDays,
      totalTrainingDays: totalDays,
      presentCount: presentDays, 
      absentCount: totalDays - presentDays,
      remainingDays: 0,
      attendancePercent: percentage, 
      progressPercent: 100,
      eligibleSessionsCount: totalDays, 
      percentage 
    };
  }

  const TOTAL_TARGET_DAYS = department === 'Communication' ? 80 : 120;
  const subjectName = department === 'Communication' ? 'Communication Training' : 'Aptitude Training';

  // 1. Fetch Student User & Active Enrollment
  const studentUser = await User.findById(studentId).lean();
  let enrollment = await Enrollment.findOne({ studentId, department, status: 'Active' })
    .populate('batchId', 'name')
    .lean();
  
  if (!enrollment) {
    enrollment = await Enrollment.findOne({ studentId, department })
      .populate('batchId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  // 2. Resolve Official Training Start Date (MUST NOT depend on QR scan)
  let rawStartDate = enrollment?.startDate || enrollment?.enrolledAt || enrollment?.createdAt || studentUser?.createdAt || new Date();
  const startDate = new Date(rawStartDate);
  startDate.setHours(0, 0, 0, 0);

  let rawEndDate = enrollment?.completedAt || new Date();
  const endDate = new Date(rawEndDate);
  endDate.setHours(23, 59, 59, 999);

  const formattedStartDate = `${startDate.getDate().toString().padStart(2, '0')}-${startDate.toLocaleString('en-US', { month: 'short' })}-${startDate.getFullYear()}`;
  const batchName = enrollment?.batchId?.name || (department === 'Communication' ? studentUser?.communicationBatch : studentUser?.aptitudeBatch) || 'Unassigned Batch';

  // 3. Fetch all Holidays to exclude
  const holidayDocs = await Holiday.find().lean();
  const holidaySet = new Set(holidayDocs.map(h => {
    const d = new Date(h.date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }));

  // 4. Find all weekday dates where at least ONE student performed a valid QR scan in this subject
  // Matches both full name ("Communication Skills") and short name ("Communication")
  const subjectFilter = {
    $in: [
      department,
      subjectName,
      department === 'Communication' ? 'Communication Skills' : department === 'Aptitude' ? 'Aptitude & Reasoning' : 'Technical Training'
    ]
  };

  const allDomainAttendances = await Attendance.find({
    subject: subjectFilter,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['Present', 'Late', 'Absent'] }
  }).select('date').lean();

  const domainScannedDates = new Set();
  allDomainAttendances.forEach(a => {
    const d = new Date(a.date);
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    domainScannedDates.add(dateStr);
  });

  // Also include dates with active sessions for backward compatibility
  const domainSessions = await AttendanceSession.find({
    $or: [{ subject: subjectName }, { subject: department }],
    startTime: { $gte: startDate, $lte: endDate }
  }).select('startTime').lean();

  domainSessions.forEach(s => {
    const d = new Date(s.startTime);
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    domainScannedDates.add(dateStr);
  });

  // 5. Build list of Actual Training Days for this department
  const actualTrainingDates = [];
  const curr = new Date(startDate);

  while (curr <= endDate && actualTrainingDates.length < TOTAL_TARGET_DAYS) {
    const dayOfWeek = curr.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = `${curr.getFullYear()}-${(curr.getMonth() + 1).toString().padStart(2, '0')}-${curr.getDate().toString().padStart(2, '0')}`;

    // Rule 1: Exclude Weekends (Saturday & Sunday)
    // Rule 2: Exclude Holidays
    // Rule 3: Automatic No-Training-Day Rule (must have at least 1 scan/session in domain)
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr) && domainScannedDates.has(dateStr)) {
      actualTrainingDates.push(dateStr);
    }

    curr.setDate(curr.getDate() + 1);
  }

  // 6. Fetch target student's attendance records
  const studentAttendances = await Attendance.find({
    student: studentId
  }).lean();

  const studentAttMap = new Map();
  const explicitAbsentDates = new Set();
  let explicitPresentCount = 0;

  studentAttendances.forEach(a => {
    const isSubjectMatch = !a.subject ||
      a.subject === department ||
      a.subject === subjectName ||
      (department === 'Communication' && (a.subject === 'Communication Skills' || a.subject === 'Communication Training')) ||
      (department === 'Aptitude' && (a.subject === 'Aptitude & Reasoning' || a.subject === 'Aptitude Training')) ||
      (department === 'Technical' && (a.subject === 'Technical Training'));

    if (isSubjectMatch) {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

      // Rule 1: Must be on or after official enrollment startDate
      // Rule 2: Must be a weekday (Monday - Friday)
      // Rule 3: Must NOT be an institute holiday
      const isValidTrainingDay = d >= startDate && dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr);

      if (isValidTrainingDay) {
        studentAttMap.set(dateStr, a.status);
        if (a.status === 'Present' || a.status === 'Late') {
          explicitPresentCount++;
        } else if (a.status === 'Absent') {
          explicitAbsentDates.add(dateStr);
        }
      }
    }
  });

  // 7. Calculate Present and Absent counts against Actual Training Days & explicit Absences
  const absentCount = explicitAbsentDates.size;
  const presentCount = explicitPresentCount;
  const trainingDay = actualTrainingDates.length;
  const remainingDays = Math.max(0, TOTAL_TARGET_DAYS - trainingDay);

  // 8. Fixed-Denominator Attendance % and Progress %
  // Rule: Count ONLY actual absences against the fixed training duration.
  // Aptitude: (120 - absentCount) / 120 * 100 (e.g. 1 absence = 119/120 = 99.17%)
  // Communication: (80 - absentCount) / 80 * 100 (e.g. 1 absence = 79/80 = 98.75%)
  const effectivePresentDays = Math.max(0, TOTAL_TARGET_DAYS - absentCount);
  const attendancePercent = Number(((effectivePresentDays / TOTAL_TARGET_DAYS) * 100).toFixed(2));
  const progressPercent = Number(((trainingDay / TOTAL_TARGET_DAYS) * 100).toFixed(2));

  return {
    department,
    batchName,
    startDate: formattedStartDate,
    rawStartDate: startDate,
    trainingDay,
    totalTrainingDays: TOTAL_TARGET_DAYS,
    presentCount,
    absentCount,
    remainingDays,
    attendancePercent,
    progressPercent,
    // Fixed denominator for backward compatibility
    eligibleSessionsCount: TOTAL_TARGET_DAYS,
    percentage: Math.round(attendancePercent)
  };
};

// Calculate domain completion percentage
const getDomainProgress = async (studentId, category, totalCount) => {
  if (totalCount === 0) return 0;
  const completedCount = await Score.countDocuments({
    student: studentId,
    category,
    status: { $in: ['Completed', 'Mastered'] }
  });
  return Math.round((completedCount / totalCount) * 100);
};

// Calculate detailed scores and final grade for a student
export const calculateStudentScores = async (studentId) => {
  // 1. Attendance Score (10% weight)
  // Get dynamic attendance percentages per module
  const techAtt = await calculateDynamicAttendance(studentId, 'Technical');
  const commAtt = await calculateDynamicAttendance(studentId, 'Communication');
  const aptiAtt = await calculateDynamicAttendance(studentId, 'Aptitude');

  // Average the attendance percentage across enrolled departments
  const attendancePercent = Math.round((techAtt.attendancePercent + commAtt.attendancePercent + aptiAtt.attendancePercent) / 3);
  const attendanceScore = (attendancePercent / 100) * 10; // scaled out of 10

  // 2. Assignment Score (15% weight)
  // Fetch assignments where this student is enrolled (based on their batch)
  const studentBatch = await Batch.findOne({ students: studentId }).lean();
  let assignmentScore = 10; // default if no assignments
  if (studentBatch) {
    const assignments = await Assignment.find({ batch: studentBatch._id }).lean();
    if (assignments.length > 0) {
      let totalSubmissionMarks = 0;
      let count = 0;
      assignments.forEach(assign => {
        const sub = assign.submissions.find(s => s.student.toString() === studentId.toString() && s.status === 'Graded');
        if (sub) {
          totalSubmissionMarks += sub.marks;
          count++;
        }
      });
      if (count > 0) {
        assignmentScore = totalSubmissionMarks / count;
      }
    }
  }

  // 3. Domain Scores: Aptitude (20%), Communication (15%), Technical (30%)
  // Fetch averages of module scores (marks out of 10)
  const getAverageModuleMarks = async (category) => {
    const scores = await Score.find({ student: studentId, category }).lean();
    if (scores.length === 0) return 0; // true dynamic value if not started
    const sum = scores.reduce((acc, curr) => acc + curr.marks, 0);
    return sum / scores.length;
  };

  const aptitudeScore = await getAverageModuleMarks('Aptitude');
  const communicationScore = await getAverageModuleMarks('Communication');
  const technicalScore = await getAverageModuleMarks('Technical');

  // 4. Mock Interview Score (10% weight)
  const placement = await Placement.findOne({ student: studentId }).lean();
  const mockInterviewScore = placement && placement.mockInterviewCompleted ? 10 : 0;

  // Final weighted formula (weights: Att 10%, Assign 15%, Comm 15%, Apt 20%, Tech 30%, Mock 10%)
  const finalScore = 
    (attendanceScore * 0.10) +
    (assignmentScore * 0.15) +
    (communicationScore * 0.15) +
    (aptitudeScore * 0.20) +
    (technicalScore * 0.30) +
    (mockInterviewScore * 0.10);

  const finalScorePercent = Number((finalScore * 10).toFixed(2)); // scale to 100%

  // Map to Grade letters
  let grade = 'D';
  if (finalScorePercent >= 90) grade = 'A+';
  else if (finalScorePercent >= 80) grade = 'A';
  else if (finalScorePercent >= 70) grade = 'B';
  else if (finalScorePercent >= 60) grade = 'C';

  return {
    attendancePercent,
    attendanceScore,
    assignmentScore,
    aptitudeScore,
    communicationScore,
    technicalScore,
    mockInterviewScore,
    finalScorePercent,
    grade
  };
};

// Calculate ranks across all students and within batches
export const calculateAllRanks = async () => {
  const students = await User.find({ role: 'Student', status: 'Active' }).select('name email').lean();
  
  const studentScoresList = [];
  for (const std of students) {
    const scores = await calculateStudentScores(std._id);
    const batch = await Batch.findOne({ students: std._id }).select('name').lean();
    studentScoresList.push({
      studentId: std._id.toString(),
      name: std.name,
      email: std.email,
      batchId: batch ? batch._id.toString() : null,
      batchName: batch ? batch.name : 'Unassigned',
      finalScore: scores.finalScorePercent,
      grade: scores.grade
    });
  }

  // Calculate Institute Ranks (sort by finalScore descending)
  studentScoresList.sort((a, b) => b.finalScore - a.finalScore);
  const rankedList = studentScoresList.map((item, index) => ({
    ...item,
    instituteRank: index + 1
  }));

  // Calculate Batch Ranks
  const batchGroups = {};
  rankedList.forEach(item => {
    if (item.batchId) {
      if (!batchGroups[item.batchId]) {
        batchGroups[item.batchId] = [];
      }
      batchGroups[item.batchId].push(item);
    }
  });

  const finalRankedList = [];
  Object.keys(batchGroups).forEach(bId => {
    // Sort students in batch
    batchGroups[bId].sort((a, b) => b.finalScore - a.finalScore);
    batchGroups[bId].forEach((item, index) => {
      item.batchRank = index + 1;
      finalRankedList.push(item);
    });
  });

  // Handle unassigned students
  rankedList.forEach(item => {
    if (!item.batchId) {
      item.batchRank = 0;
      finalRankedList.push(item);
    }
  });

  return finalRankedList;
};

// Placement Readiness Calculator
export const calculatePlacementReadiness = async (studentId) => {
  const student = await Student.findOne({ user: studentId }).lean();
  const placement = await Placement.findOne({ student: studentId }).lean();
  
  const aptCount = await AptitudeModule.countDocuments();
  const commCount = await CommunicationModule.countDocuments();
  const techCount = await TechnicalModule.countDocuments();

  const aptProgress = await getDomainProgress(studentId, 'Aptitude', aptCount);
  const commProgress = await getDomainProgress(studentId, 'Communication', commCount);
  const techProgress = await getDomainProgress(studentId, 'Technical', techCount);

  if (!placement) {
    return { percentage: 0, status: 'Critical', recommendations: ['Complete account setup'] };
  }

  // Weightages
  let score = 0;
  const breakdown = {
    resume: (placement.resumeUploaded || (student && student.resumeUrl)) ? 15 : 0,
    linkedin: (student && student.linkedin) ? 10 : 0,
    github: (student && student.github) ? 10 : 0,
    mockInterview: placement.mockInterviewCompleted ? 15 : 0,
    technicalInterview: placement.technicalInterviewCompleted ? 15 : 0,
    hrInterview: placement.hrInterviewCompleted ? 10 : 0,
    aptitudeScore: Math.round(aptProgress * 0.10),
    communicationScore: Math.round(commProgress * 0.10),
    technicalScore: Math.round(techProgress * 0.05)
  };

  const percentage = 
    breakdown.resume + 
    breakdown.linkedin + 
    breakdown.github + 
    breakdown.mockInterview + 
    breakdown.technicalInterview + 
    breakdown.hrInterview + 
    breakdown.aptitudeScore + 
    breakdown.communicationScore + 
    breakdown.technicalScore;

  // Status mapping
  let status = 'Critical';
  if (percentage >= 85) status = 'Ready';
  else if (percentage >= 70) status = 'Almost Ready';
  else if (percentage >= 50) status = 'Needs Improvement';

  // AI recommendations
  const recommendations = [];
  if (!breakdown.resume) recommendations.push('Resume Uploaded: Upload your latest professional resume PDF in the profile section.');
  if (!breakdown.linkedin) recommendations.push('LinkedIn Updated: Add your LinkedIn profile URL to enable corporate matching.');
  if (!breakdown.github) recommendations.push('GitHub Updated: Showcase your coding repository by adding your GitHub URL.');
  if (!breakdown.mockInterview) recommendations.push('Mock Interview Practice: Schedule a practice session with your trainer to evaluate interview skills.');
  if (!breakdown.technicalInterview) recommendations.push('Technical Interview: Complete mock technical panels covering data structures & web frameworks.');
  if (aptProgress < 75) recommendations.push(`Aptitude Improvement: Practice Vedic Math and quantitative topics (Current: ${aptProgress}% progress).`);
  if (commProgress < 75) recommendations.push(`Communication Improvement: Focus on Soft Skills and Public Speaking modules (Current: ${commProgress}% progress).`);
  if (techProgress < 75) recommendations.push(`Technical Improvement: Devote more time to React, Node.js, and API assessments (Current: ${techProgress}% progress).`);

  if (recommendations.length === 0) {
    recommendations.push('Excellent profile! You are fully equipped for placements. Prepare for scheduled corporate interviews.');
  }

  return {
    percentage,
    status,
    breakdown,
    recommendations
  };
};
