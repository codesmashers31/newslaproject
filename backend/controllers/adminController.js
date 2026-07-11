import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import { syncStudentTrainers, syncBatchStudents, syncStudentBatchesFromStrings } from '../utils/trainerMapper.js';

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================

export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalTrainers = await User.countDocuments({ 
      role: { $in: ['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'] } 
    });
    const totalBatches = await Batch.countDocuments();
    
    // Placement counts
    const placementStats = await Placement.find({});
    const placedCount = placementStats.filter(p => p.status === 'Selected' || p.status === 'Offer Received').length;

    // Attendance stats
    const attendanceRecords = await Attendance.find({});
    const totalAttendanceCount = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercentage = totalAttendanceCount > 0 
      ? Math.round((presentRecords / totalAttendanceCount) * 100) 
      : 100;

    // Score calculations
    const scores = await Score.find({});
    const completedScores = scores.filter(s => s.status === 'Completed');
    const avgMarks = completedScores.length > 0 
      ? Number((completedScores.reduce((sum, s) => sum + s.marks, 0) / completedScores.length).toFixed(2))
      : 0;

    // Monthly attendance charts
    // Group attendance by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAttendance = Array(12).fill(0).map((_, i) => ({ month: months[i], Present: 0, Absent: 0, Late: 0 }));
    
    attendanceRecords.forEach(rec => {
      if (rec.date) {
        const m = new Date(rec.date).getMonth();
        if (rec.status === 'Present') monthlyAttendance[m].Present += 1;
        if (rec.status === 'Absent') monthlyAttendance[m].Absent += 1;
        if (rec.status === 'Late') monthlyAttendance[m].Late += 1;
      }
    });

    // Placement Stats chart
    const placementChartData = [
      { name: 'Selected', value: placementStats.filter(p => p.status === 'Selected').length },
      { name: 'Offer Received', value: placementStats.filter(p => p.status === 'Offer Received').length },
      { name: 'Interviewing/Pending', value: placementStats.filter(p => p.status === 'Pending').length },
      { name: 'Rejected', value: placementStats.filter(p => p.status === 'Rejected').length },
      { name: 'Unplaced/Not Started', value: placementStats.filter(p => p.status === 'Not Started').length },
    ];

    // Modules completion counts
    const moduleProgressStats = {
      completed: scores.filter(s => s.status === 'Completed').length,
      inProgress: scores.filter(s => s.status === 'In Progress').length,
      notStarted: scores.filter(s => s.status === 'Not Started').length,
    };

    res.json({
      cards: {
        totalStudents,
        totalTrainers,
        totalBatches,
        placedCount,
        attendancePercentage,
        avgMarks,
        completedModules: moduleProgressStats.completed,
        pendingModules: moduleProgressStats.inProgress + moduleProgressStats.notStarted,
      },
      charts: {
        monthlyAttendance,
        placementChartData,
        moduleProgressStats,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

// Get all students with optional filters and pagination
export const getStudents = async (req, res) => {
  const { search, batchId, placementStatus } = req.query;

  try {
    let query = { role: 'Student' };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    // Retrieve users
    let students = await User.find(query).select('-password').lean();

    // Map profiles and batches
    const studentIds = students.map(s => s._id);
    const profiles = await Student.find({ user: { $in: studentIds } }).lean();
    const placements = await Placement.find({ student: { $in: studentIds } }).lean();
    
    // Find batches that contain student IDs
    const batches = await Batch.find({ students: { $in: studentIds } }).lean();

    let result = students.map(student => {
      const profile = profiles.find(p => p.user.toString() === student._id.toString()) || {};
      const placement = placements.find(p => p.student.toString() === student._id.toString()) || {};
      const studentBatches = batches.filter(b => b.students.some(sId => sId.toString() === student._id.toString()));

      return {
        ...student,
        profile,
        placement,
        batches: studentBatches.map(b => ({ _id: b._id, name: b.name, course: b.course })),
        batch: studentBatches[0] ? { _id: studentBatches[0]._id, name: studentBatches[0].name, course: studentBatches[0].course } : null,
      };
    });

    // Apply secondary filters
    if (batchId) {
      result = result.filter(s => s.batches && s.batches.some(b => b._id.toString() === batchId));
    }
    if (placementStatus) {
      result = result.filter(s => s.placement && s.placement.status === placementStatus);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Single Student
export const addStudent = async (req, res) => {
  const { name, email, mobile, password, technicalBatch, communicationBatch, aptitudeBatch } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'Student',
      status: 'Active',
      technicalBatch: technicalBatch || '',
      communicationBatch: communicationBatch || '',
      aptitudeBatch: aptitudeBatch || '',
    });

    const studentProfile = await Student.create({ user: user._id });
    const placement = await Placement.create({ student: user._id });

    await syncStudentBatchesFromStrings(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: studentProfile,
      placement,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit Student
export const editStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, status, collegeName, degree, department, yearOfPassing, gender, address, skills, bio, linkedin, github, technicalBatch, communicationBatch, aptitudeBatch } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Student user not found' });
    }

    // Update user details
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.status = status || user.status;
    if (technicalBatch !== undefined) user.technicalBatch = technicalBatch;
    if (communicationBatch !== undefined) user.communicationBatch = communicationBatch;
    if (aptitudeBatch !== undefined) user.aptitudeBatch = aptitudeBatch;
    await user.save();

    // Update profile
    const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
    const profile = await Student.findOneAndUpdate(
      { user: id },
      {
        collegeName,
        degree,
        department,
        yearOfPassing,
        gender,
        address,
        skills: skillsArray,
        bio,
        linkedin,
        github,
      },
      { new: true, upsert: true }
    );

    await syncStudentBatchesFromStrings(user._id);

    res.json({ message: 'Student updated successfully', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndDelete(id);
    await Student.findOneAndDelete({ user: id });
    await Placement.findOneAndDelete({ student: id });
    await Score.deleteMany({ student: id });
    await Attendance.deleteMany({ student: id });
    
    // Remove from batch
    await Batch.updateMany(
      { students: id },
      { $pull: { students: id } }
    );

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import students from Excel sheet
export const importStudentsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let importCount = 0;

    for (const row of data) {
      // Headers expected: Name, Email, Mobile, Password, CollegeName, Degree, Department, YearOfPassing
      const name = row.Name || row.name;
      const email = row.Email || row.email;
      const mobile = row.Mobile || row.mobile || row.Phone || row.phone;
      const password = row.Password || row.password || 'password123';
      const collegeName = row.CollegeName || row.college || '';
      const degree = row.Degree || row.degree || '';
      const department = row.Department || row.department || '';
      const yearOfPassing = row.YearOfPassing || row.year || '';

      if (!name || !email || !mobile) continue;

      const userExists = await User.findOne({ email });
      if (userExists) continue; // Skip existing email

      const user = await User.create({
        name,
        email,
        mobile: mobile.toString(),
        password,
        role: 'Student',
        status: 'Active',
      });

      await Student.create({
        user: user._id,
        collegeName,
        degree,
        department,
        yearOfPassing: yearOfPassing.toString(),
      });

      await Placement.create({ student: user._id });
      importCount++;
    }

    res.json({ message: `Successfully imported ${importCount} students` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// BATCH MANAGEMENT
// ==========================================

export const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate('trainers', 'name email role')
      .populate('students', 'name email mobile');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBatch = async (req, res) => {
  const { name, course, trainers, students, startDate, endDate, status } = req.body;

  try {
    const batchExists = await Batch.findOne({ name });
    if (batchExists) {
      return res.status(400).json({ message: 'Batch with this name already exists' });
    }

    const batch = await Batch.create({
      name,
      course,
      trainers: trainers || [],
      students: students || [],
      startDate,
      endDate,
      status: status || 'Active',
    });

    if (students && students.length > 0) {
      await syncBatchStudents(batch._id);
    }

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editBatch = async (req, res) => {
  const { id } = req.params;
  const { name, course, trainers, students, startDate, endDate, status } = req.body;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    batch.name = name || batch.name;
    batch.course = course || batch.course;
    batch.trainers = trainers || batch.trainers;
    batch.students = students || batch.students;
    batch.startDate = startDate || batch.startDate;
    batch.endDate = endDate || batch.endDate;
    batch.status = status || batch.status;

    await batch.save();
    await syncBatchStudents(batch._id);
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBatch = async (req, res) => {
  const { id } = req.params;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    await Batch.findByIdAndDelete(id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// TRAINER MANAGEMENT
// ==========================================

export const getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({
      role: { $in: ['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'] }
    }).select('-password').lean();

    // Map assigned batches to each trainer
    const trainerIds = trainers.map(t => t._id);
    const batches = await Batch.find({ trainers: { $in: trainerIds } }).lean();

    const result = trainers.map(trainer => {
      const assignedBatches = batches
        .filter(b => b.trainers.some(tId => tId.toString() === trainer._id.toString()))
        .map(b => ({ _id: b._id, name: b.name }));

      return {
        ...trainer,
        batches: assignedBatches,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTrainer = async (req, res) => {
  const { name, email, mobile, password, role, trainerId, stacks, skills } = req.body;

  try {
    if (!['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid trainer role selection' });
    }

    const trainerExists = await User.findOne({ email });
    if (trainerExists) {
      return res.status(400).json({ message: 'Trainer email already exists' });
    }

    const trainer = await User.create({
      name,
      email,
      mobile,
      password: password || 'trainer123',
      role,
      trainerId: trainerId || `TR-${Date.now().toString().slice(-4)}`,
      stacks: stacks || [],
      skills: skills || [],
      status: 'Active',
    });

    res.status(201).json(trainer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTrainer = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, role, status, trainerId, stacks, skills } = req.body;

  try {
    const trainer = await User.findById(id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (name !== undefined) trainer.name = name;
    if (email !== undefined) trainer.email = email;
    if (mobile !== undefined) trainer.mobile = mobile;
    if (role !== undefined) trainer.role = role;
    if (status !== undefined) trainer.status = status;
    if (trainerId !== undefined) trainer.trainerId = trainerId;
    if (stacks !== undefined) trainer.stacks = stacks;
    if (skills !== undefined) trainer.skills = skills;

    await trainer.save();
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTrainer = async (req, res) => {
  const { id } = req.params;
  try {
    const trainer = await User.findById(id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTrainerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const trainer = await User.findById(id);
    if (!trainer || !['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(trainer.role)) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    trainer.status = status;
    await trainer.save();
    res.json({ message: `Trainer account status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetTrainerPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const trainer = await User.findById(id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    trainer.password = password; // pre-save hook will hash it automatically
    await trainer.save();
    res.json({ message: 'Trainer password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTrainerBatches = async (req, res) => {
  const { id } = req.params;
  const { batchIds } = req.body;

  try {
    const trainer = await User.findById(id);
    if (!trainer || !['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(trainer.role)) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    const trainerObjectId = new mongoose.Types.ObjectId(id);
    const batchObjectIds = (batchIds || []).map(bId => new mongoose.Types.ObjectId(bId));

    // Pull trainer from all batches
    await Batch.updateMany(
      { trainers: trainerObjectId },
      { $pull: { trainers: trainerObjectId } }
    );

    // Add trainer to selected batches
    if (batchObjectIds.length > 0) {
      await Batch.updateMany(
        { _id: { $in: batchObjectIds } },
        { $addToSet: { trainers: trainerObjectId } }
      );
    }

    res.json({ message: 'Trainer batch assignments updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// PLACEMENT MANAGEMENT (ADMIN)
// ==========================================

export const updatePlacementDetails = async (req, res) => {
  const { studentId } = req.params;
  const { 
    resumeUploaded, 
    mockInterviewCompleted, 
    technicalInterviewCompleted, 
    hrInterviewCompleted, 
    companyName, 
    interviewDate, 
    status, 
    joiningDate 
  } = req.body;

  try {
    let offerLetterUrl = '';
    if (req.file) {
      offerLetterUrl = `/uploads/${req.file.filename}`;
    }

    const updateFields = {
      resumeUploaded,
      mockInterviewCompleted,
      technicalInterviewCompleted,
      hrInterviewCompleted,
      companyName,
      interviewDate,
      status,
      joiningDate
    };

    if (offerLetterUrl) {
      updateFields.offerLetterUrl = offerLetterUrl;
    }

    const placement = await Placement.findOneAndUpdate(
      { student: studentId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json({ message: 'Placement details updated successfully', placement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ATTENDANCE & REPORT LOGS (ADMIN)
// ==========================================

export const getAttendanceLogs = async (req, res) => {
  try {
    const attendance = await Attendance.find({})
      .populate('student', 'name email mobile')
      .populate('batch', 'name course')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
