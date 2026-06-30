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
  const attendanceRecords = await Attendance.find({ student: studentId }).lean();
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'Late').length;
  // Late counts as half presence or we can calculate straight attendance percentage
  const attendancePercent = totalDays > 0 ? ((presentDays + lateDays * 0.5) / totalDays) * 100 : 100;
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
    if (scores.length === 0) return 8.0; // default baseline if not started
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
