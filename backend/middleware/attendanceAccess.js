const staffRoles = new Set(['Admin', 'Super Admin', 'Communication Trainer', 'Aptitude Trainer', 'Technical Trainer']);

export const authorizeStudentAttendance = (req, res, next) => {
  if (staffRoles.has(req.user?.role) ||
      (req.user?.role === 'Student' && String(req.user._id) === req.params.studentId)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'You cannot view another student\'s attendance.', data: null });
};
