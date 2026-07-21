import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Placement from '../models/Placement.js';
import DeviceResetRequest from '../models/DeviceResetRequest.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'lcp_secret_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  };

  res.cookie('jwtToken', token, cookieOptions);

  res.status(statusCode).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile || '',
    role: user.role,
    slaeId: user.slaeId || '',
    token,
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

      sendTokenResponse(user, 201, res);
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
  const { email, password, deviceId, deviceInfo } = req.body;

  try {
    const trimmedInput = email ? email.trim() : '';

    // 1. Try to find user by email or slaeId (EID)
    let user = await User.findOne({
      $or: [
        { email: trimmedInput.toLowerCase() },
        { slaeId: trimmedInput },
        { slaeId: trimmedInput.toUpperCase() },
        { slaeId: trimmedInput.toLowerCase() }
      ]
    });

    // 2. If not found, try to find user by mobile
    if (!user) {
      user = await User.findOne({
        $or: [
          { email: trimmedInput },
          { mobile: trimmedInput }
        ]
      });
    }

    // 3. If still not found, search in the 'students' collection
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
    let passwordMatches = false;
    if (user) {
      passwordMatches = await user.matchPassword(password);
      
      if (!passwordMatches) {
        passwordMatches = await user.matchPassword(password.toLowerCase());
      }
      
      if (!passwordMatches) {
        passwordMatches = await user.matchPassword(password.toUpperCase());
      }
    }

    if (user && passwordMatches) {
      if (user.status === 'Inactive') {
        return res.status(403).json({ message: 'Your account is deactivated. Please contact admin.' });
      }

      // Check if device is locked
      if (user.role === 'Student' && user.isDeviceLocked) {
        return res.status(403).json({ 
          code: 'DEVICE_LOCKED', 
          message: 'Access Blocked: Your device authentication access has been locked. Contact SLA support to resolve.' 
        });
      }

      // Single Device Access logic
      if (user.role === 'Student' && deviceId) {
        if (!user.deviceId) {
          user.deviceId = deviceId;
          user.deviceInfo = deviceInfo || 'Unknown Web Browser';
          user.deviceLastUsed = new Date();
          await user.save();
        } else if (user.deviceId !== deviceId) {
          return res.status(403).json({
            code: 'UNAUTHORIZED_DEVICE',
            message: 'Access Denied: This account is already registered and logged in on another device.',
            registeredDevice: user.deviceInfo || 'Other Registered Device',
            lastUsed: user.deviceLastUsed
          });
        } else {
          user.deviceLastUsed = new Date();
          await user.save();
        }
      }

      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwtToken', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        slaeId: user.slaeId || '',
        status: user.status || 'Active'
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
      if (req.file) {
        user.photo = `/uploads/${req.file.filename}`;
      }
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
        photo: updatedUser.photo,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request Registered Device Reset
// @route   POST /api/auth/request-device-reset
// @access  Public
export const requestDeviceReset = async (req, res) => {
  const { emailOrSlaeId, reason, requestedDevice } = req.body;

  try {
    if (!emailOrSlaeId || !reason || !requestedDevice) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const trimmedInput = emailOrSlaeId.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedInput.toLowerCase() },
        { slaeId: trimmedInput },
        { slaeId: trimmedInput.toUpperCase() },
        { slaeId: trimmedInput.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with that Email or SLAEID.' });
    }

    // Check if there is already a pending request
    const existing = await DeviceResetRequest.findOne({ user: user._id, status: 'Pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending device reset request. Please wait for admin approval.' });
    }

    await DeviceResetRequest.create({
      user: user._id,
      reason,
      requestedDevice
    });

    res.status(201).json({ message: 'Device reset request submitted successfully. SLA Admins have been notified.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
