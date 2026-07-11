import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Placement from '../models/Placement.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'lcp_secret_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, mobile, password, role, collegeName, degree, yearOfPassing, photo } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      status: 'Active',
    });

    if (user) {
      // If role is Student, create Student profile and Placement record
      if (role === 'Student') {
        await Student.create({ 
          user: user._id,
          collegeName: collegeName || '',
          degree: degree || '',
          yearOfPassing: yearOfPassing || '',
          photo: photo || '',
        });
        await Placement.create({ student: user._id });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const trimmedInput = email ? email.trim() : '';

    // 1. Try to find user directly by email
    let user = await User.findOne({ email: trimmedInput.toLowerCase() });

    // 2. If not found, try to find user by mobile (in case mobile is stored in User model's email or mobile field)
    if (!user) {
      user = await User.findOne({
        $or: [
          { email: trimmedInput },
          { mobile: trimmedInput }
        ]
      });
    }

    // 3. If still not found, search in the 'students' collection (which has the actual student mobile field)
    if (!user) {
      const studentProfile = await mongoose.connection.db.collection('students').findOne({
        $or: [
          { mobile: trimmedInput },
          { mobile: ` ${trimmedInput}` },
          { mobile: `${trimmedInput} ` },
          { email: trimmedInput.toLowerCase() }
        ]
      });

      if (studentProfile) {
        user = await User.findOne({
          $or: [
            { studentId: studentProfile._id.toString() },
            { studentId: studentProfile._id }
          ]
        });
      }
    }

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Inactive') {
        return res.status(403).json({ message: 'Your account is deactivated. Please contact admin.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.mobile = req.body.mobile || user.mobile;
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
