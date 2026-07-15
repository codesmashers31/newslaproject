import RoomAllocation from '../models/RoomAllocation.js';
import Room from '../models/Room.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';

// Helper to compute duration in decimal hours from HH:MM strings
const getDurationInHours = (start, end) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
  return Math.max(0, durationMin / 60);
};

// @desc    Get dashboard stats for Super Admin
// @route   GET /api/reports/dashboard-stats
// @access  Private/SuperAdmin
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    
    // 1. Total rooms
    const totalRooms = await Room.countDocuments();
    
    // Start/End of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all allocations for today
    const todayAllocations = await RoomAllocation.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    }).populate('room batch trainer');

    // Get current time string (HH:MM)
    const currentHourStr = String(now.getHours()).padStart(2, '0');
    const currentMinStr = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHourStr}:${currentMinStr}`;

    let occupiedCount = 0;
    let reservedCount = 0;
    let runningClasses = [];
    let upcomingClasses = [];

    todayAllocations.forEach(alloc => {
      const isOverlapping = currentTimeStr >= alloc.startTime && currentTimeStr <= alloc.endTime;
      if (isOverlapping) {
        occupiedCount++;
        runningClasses.push({
          roomName: alloc.room?.name,
          roomNumber: alloc.room?.roomNumber,
          batchName: alloc.batch?.name,
          trainerName: alloc.trainer?.name,
          timeSlot: `${alloc.startTime} - ${alloc.endTime}`
        });
      } else if (alloc.startTime > currentTimeStr) {
        reservedCount++;
        upcomingClasses.push({
          roomName: alloc.room?.name,
          roomNumber: alloc.room?.roomNumber,
          batchName: alloc.batch?.name,
          trainerName: alloc.trainer?.name,
          timeSlot: `${alloc.startTime} - ${alloc.endTime}`
        });
      }
    });

    const availableCount = totalRooms - occupiedCount;

    res.json({
      totalRooms,
      availableRooms: Math.max(0, availableCount),
      occupiedRooms: occupiedCount,
      todayAllocationsCount: todayAllocations.length,
      currentRunningClasses: runningClasses,
      upcomingClasses: upcomingClasses.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get room utilization report
// @route   GET /api/reports/utilization
// @access  Private/SuperAdmin
export const getUtilizationReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Count days in range (minimum 1)
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    // Assume 8 operational hours per room per day (e.g. 09:00 - 17:00)
    const OPERATIONAL_HOURS_PER_DAY = 8;
    const totalOperationalHours = daysCount * OPERATIONAL_HOURS_PER_DAY;

    const rooms = await Room.find();
    const allocations = await RoomAllocation.find({
      date: { $gte: start, $lte: end }
    }).populate('room');

    const reportData = rooms.map(room => {
      // Filter allocations for this room
      const roomAllocs = allocations.filter(a => a.room?._id.toString() === room._id.toString());
      
      // Calculate total allocated hours
      let totalAllocatedHours = 0;
      roomAllocs.forEach(a => {
        totalAllocatedHours += getDurationInHours(a.startTime, a.endTime);
      });

      // Calculate utilization percentage
      const utilizationRate = totalOperationalHours > 0 
        ? Math.min(100, Math.round((totalAllocatedHours / totalOperationalHours) * 100))
        : 0;

      return {
        roomId: room._id,
        roomName: room.name,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
        totalAllocations: roomAllocs.length,
        allocatedHours: Number(totalAllocatedHours.toFixed(1)),
        operationalHours: totalOperationalHours,
        utilizationRate,
      };
    });

    res.json(reportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get daily usage report summary
// @route   GET /api/reports/daily
// @access  Private/SuperAdmin
export const getDailyUsageReport = async (req, res) => {
  const { date } = req.query;

  try {
    const queryDate = date ? new Date(date) : new Date();
    const startOfToday = new Date(queryDate);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(queryDate);
    endOfToday.setHours(23, 59, 59, 999);

    const rooms = await Room.find({ status: 'Active' });
    const allocations = await RoomAllocation.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    }).populate('room batch trainer');

    const report = rooms.map(room => {
      const roomAllocs = allocations.filter(a => a.room?._id.toString() === room._id.toString());
      let totalHours = 0;
      
      roomAllocs.forEach(a => {
        totalHours += getDurationInHours(a.startTime, a.endTime);
      });

      const formatBatchNames = (batchField) => {
        if (!batchField) return 'Unknown Batch';
        if (Array.isArray(batchField)) {
          return batchField.map(b => b.name).filter(Boolean).join(', ');
        }
        return batchField.name || 'Unknown Batch';
      };

      return {
        roomName: room.name,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
        totalClassesToday: roomAllocs.length,
        totalHoursUsed: Number(totalHours.toFixed(1)),
        scheduleList: roomAllocs.map(a => ({
          batchName: formatBatchNames(a.batch),
          trainerName: a.trainer?.name || 'Deleted Trainer',
          timeSlot: `${a.startTime} - ${a.endTime}`,
          duration: getDurationInHours(a.startTime, a.endTime)
        }))
      };
    });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly usage summary (grouped by day for charts)
// @route   GET /api/reports/monthly
// @access  Private/SuperAdmin
export const getMonthlyUsageReport = async (req, res) => {
  const { year, month } = req.query;

  try {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) !== undefined ? Number(month) : new Date().getMonth(); // 0-indexed

    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const allocations = await RoomAllocation.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('room');

    const daysInMonth = endDate.getDate();
    const dailyStats = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(y, m, day);
      const dayAllocs = allocations.filter(a => {
        const d = new Date(a.date);
        return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
      });

      let totalHours = 0;
      dayAllocs.forEach(a => {
        totalHours += getDurationInHours(a.startTime, a.endTime);
      });

      dailyStats.push({
        day: `${m + 1}/${day}`,
        totalAllocations: dayAllocs.length,
        totalHours: Number(totalHours.toFixed(1))
      });
    }

    res.json({
      year: y,
      month: m + 1,
      totalMonthlyAllocations: allocations.length,
      dailyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainer availability and schedule report
// @route   GET /api/reports/trainers
// @access  Private/SuperAdmin
export const getTrainerReport = async (req, res) => {
  const { date } = req.query;

  try {
    const queryDate = date ? new Date(date) : new Date();
    const startOfToday = new Date(queryDate);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(queryDate);
    endOfToday.setHours(23, 59, 59, 999);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[queryDate.getDay()];

    const trainers = await User.find({
      role: { $in: ['Trainer', 'Technical Trainer', 'Communication Trainer', 'Aptitude Trainer'] }
    });

    const allocations = await RoomAllocation.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    }).populate('room batch trainer');

    const report = trainers.map(trainer => {
      // Find allocations for this trainer
      const trainerAllocs = allocations.filter(a => a.trainer?._id.toString() === trainer._id.toString());
      
      // Calculate total hours allocated
      let totalHours = 0;
      trainerAllocs.forEach(a => {
        totalHours += getDurationInHours(a.startTime, a.endTime);
      });

      // Get configured availability slots for this day of week
      const daySlots = trainer.trainerAvailability 
        ? trainer.trainerAvailability.filter(s => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase())
        : [];

      const availabilityText = daySlots.length > 0 
        ? daySlots.map(s => `${s.startTime} - ${s.endTime}`).join(', ')
        : '24/7 Available (No constraints)';

      // Determine trainer status
      let status = 'Free / No Class';
      if (trainerAllocs.length > 0) {
        status = 'Scheduled';
      }

      return {
        trainerId: trainer._id,
        trainerName: trainer.name,
        trainerRole: trainer.role,
        status,
        totalHoursUsed: Number(totalHours.toFixed(1)),
        availabilitySlots: availabilityText,
        scheduleList: trainerAllocs.map(a => {
          const formatBatchNames = (batchField) => {
            if (!batchField) return 'Unknown Batch';
            if (Array.isArray(batchField)) {
              return batchField.map(b => b.name).filter(Boolean).join(', ');
            }
            return batchField.name || 'Unknown Batch';
          };
          return {
            roomName: a.room?.name || 'Deleted Room',
            roomNumber: a.room?.roomNumber || 'N/A',
            batchName: formatBatchNames(a.batch),
            timeSlot: `${a.startTime} - ${a.endTime}`,
            duration: getDurationInHours(a.startTime, a.endTime)
          };
        })
      };
    });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
