import Timetable from '../models/Timetable.js';
import User from '../models/User.js';

// Helper: Get Today in YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// Helper: Get Yesterday in YYYY-MM-DD
const getYesterdayStr = (todayStr) => {
  const d = new Date(todayStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// Default Routine Generator
const buildDefaultSlots = (wakeUp = '06:30', sleep = '23:00', pace = 'Normal', track = 'Full Stack') => {
  const slots = [
    { slotId: 's1', startTime: '07:00', endTime: '08:30', activity: 'DSA: Arrays, Strings & Algorithms', category: 'DSA', isMandatory: true },
    { slotId: 's2', startTime: '09:00', endTime: '11:00', activity: 'Core Tech: Backend & API Development', category: 'Web Development', isMandatory: true },
    { slotId: 's3', startTime: '11:30', endTime: '13:00', activity: 'Quantitative Aptitude & Speed Math', category: 'Aptitude', isMandatory: true },
    { slotId: 's4', startTime: '14:00', endTime: '15:30', activity: 'Verbal Fluency & Interview Practice', category: 'Communication', isMandatory: true },
    { slotId: 's5', startTime: '16:00', endTime: '18:00', activity: 'Project Coding & Real-world Tasks', category: 'Web Development', isMandatory: true },
    { slotId: 's6', startTime: '19:30', endTime: '20:30', activity: 'Daily Flashcard Revision & Quiz', category: 'Revision', isMandatory: false }
  ];

  if (pace === 'Placement Sprint') {
    slots.push({ slotId: 's7', startTime: '21:00', endTime: '22:30', activity: 'Mock Interview & Company Specific Tests', category: 'Core Subjects', isMandatory: true });
  }

  return slots;
};

// POST /api/timetable/generate
export const generateTimetablePreview = async (req, res) => {
  try {
    const { wakeUpTime = '06:30', sleepTime = '23:00', pace = 'Normal', track = 'Full Stack' } = req.body;
    const previewSlots = buildDefaultSlots(wakeUpTime, sleepTime, pace, track);

    return res.json({
      success: true,
      message: 'Generated personalized study schedule preview',
      data: {
        startDate: getTodayStr(),
        studyPace: pace,
        wakeUpTime,
        sleepTime,
        slots: previewSlots
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/timetable/my
export const getMyTimetable = async (req, res) => {
  try {
    const studentId = req.user._id;
    let timetable = await Timetable.findOne({ studentId });

    if (!timetable) {
      const initialSlots = buildDefaultSlots();
      timetable = await Timetable.create({
        studentId,
        startDate: getTodayStr(),
        studyPace: 'Normal',
        wakeUpTime: '06:30',
        sleepTime: '23:00',
        slots: initialSlots,
        dailyCompletions: [],
        streak: 0,
        xpPoints: 50,
        badges: [{ name: 'Journey Started', awardedAt: new Date() }]
      });
    }

    return res.json({ success: true, data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/timetable/my
export const saveMyTimetable = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { slots, studyPace, wakeUpTime, sleepTime, startDate } = req.body;

    let timetable = await Timetable.findOne({ studentId });
    if (!timetable) {
      timetable = new Timetable({
        studentId,
        startDate: startDate || getTodayStr(),
        studyPace: studyPace || 'Normal',
        wakeUpTime: wakeUpTime || '06:30',
        sleepTime: sleepTime || '23:00',
        slots: slots || buildDefaultSlots(),
        dailyCompletions: [],
        streak: 0,
        xpPoints: 50
      });
    } else {
      if (slots) timetable.slots = slots;
      if (studyPace) timetable.studyPace = studyPace;
      if (wakeUpTime) timetable.wakeUpTime = wakeUpTime;
      if (sleepTime) timetable.sleepTime = sleepTime;
    }

    await timetable.save();
    return res.json({ success: true, message: 'Timetable saved successfully', data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/timetable/my/check-slot
export const checkSlot = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { date, slotId } = req.body;
    const todayStr = getTodayStr();

    if (!date || !slotId) {
      return res.status(400).json({ success: false, message: 'Date and slotId are required' });
    }

    let timetable = await Timetable.findOne({ studentId });
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Strict Date Validation: Cannot mark prior to creation date or in the future
    if (date < timetable.startDate) {
      return res.status(400).json({ success: false, message: 'Cannot mark completion prior to your timetable start date.' });
    }
    if (date > todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot mark future time slots ahead of time.' });
    }

    let daily = timetable.dailyCompletions.find(d => d.date === date);
    if (!daily) {
      daily = {
        date,
        completedSlotIds: [],
        completionRate: 0,
        isFullyDone: false,
        xpEarned: 0
      };
      timetable.dailyCompletions.push(daily);
      daily = timetable.dailyCompletions[timetable.dailyCompletions.length - 1];
    }

    const index = daily.completedSlotIds.indexOf(slotId);
    let xpChange = 0;

    if (index > -1) {
      daily.completedSlotIds.splice(index, 1);
      xpChange = -10;
    } else {
      daily.completedSlotIds.push(slotId);
      xpChange = 10;
    }

    const totalSlotsCount = timetable.slots.length || 1;
    daily.completionRate = Math.round((daily.completedSlotIds.length / totalSlotsCount) * 100);
    daily.isFullyDone = daily.completionRate === 100;
    daily.xpEarned = Math.max(0, (daily.xpEarned || 0) + xpChange);

    timetable.xpPoints = Math.max(0, (timetable.xpPoints || 0) + xpChange);

    // Update streak if >= 70%
    const yesterdayStr = getYesterdayStr(todayStr);
    if (daily.completionRate >= 70) {
      if (timetable.lastCompletedDate === yesterdayStr) {
        timetable.streak = (timetable.streak || 0) + 1;
      } else if (timetable.lastCompletedDate !== date) {
        timetable.streak = 1;
      }
      timetable.lastCompletedDate = date;
    }

    await timetable.save();
    return res.json({ success: true, message: 'Slot updated', data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/timetable/my/check-all
export const checkAllSlots = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { date } = req.body;
    const todayStr = getTodayStr();

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    let timetable = await Timetable.findOne({ studentId });
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    if (date < timetable.startDate) {
      return res.status(400).json({ success: false, message: 'Cannot mark completion prior to timetable start date.' });
    }
    if (date > todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot mark future time slots ahead of time.' });
    }

    let daily = timetable.dailyCompletions.find(d => d.date === date);
    if (!daily) {
      daily = {
        date,
        completedSlotIds: [],
        completionRate: 0,
        isFullyDone: false,
        xpEarned: 0
      };
      timetable.dailyCompletions.push(daily);
      daily = timetable.dailyCompletions[timetable.dailyCompletions.length - 1];
    }

    const allSlotIds = timetable.slots.map(s => s.slotId);
    daily.completedSlotIds = allSlotIds;
    daily.completionRate = 100;
    daily.isFullyDone = true;
    
    // +25 bonus XP for 1-click complete
    const bonusXp = 25;
    daily.xpEarned = (allSlotIds.length * 10) + bonusXp;
    timetable.xpPoints = (timetable.xpPoints || 0) + bonusXp + (allSlotIds.length * 10);

    // Update Streak
    const yesterdayStr = getYesterdayStr(todayStr);
    if (timetable.lastCompletedDate === yesterdayStr) {
      timetable.streak = (timetable.streak || 0) + 1;
    } else if (timetable.lastCompletedDate !== date) {
      timetable.streak = 1;
    }
    timetable.lastCompletedDate = date;

    await timetable.save();
    return res.json({ success: true, message: 'All daily slots completed! +25 Bonus XP Earned!', data: timetable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/timetable/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const topTimetables = await Timetable.find({})
      .populate('studentId', 'name email avatar slaeId')
      .sort({ xpPoints: -1, streak: -1 })
      .limit(20);

    const formatted = topTimetables.map((item, idx) => ({
      rank: idx + 1,
      studentId: item.studentId?._id,
      studentName: item.studentId?.name || 'Student',
      studentEmail: item.studentId?.email,
      slaeId: item.studentId?.slaeId || `SLA-00${idx + 1}`,
      streak: item.streak || 0,
      xpPoints: item.xpPoints || 0,
      badgesCount: item.badges?.length || 0
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
