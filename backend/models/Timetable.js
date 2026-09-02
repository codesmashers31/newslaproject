import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:30"
  activity: { type: String, required: true },  // "DSA & Problem Solving"
  category: { 
    type: String, 
    enum: ['DSA', 'Web Development', 'Aptitude', 'Communication', 'Revision', 'Core Subjects', 'Break'], 
    default: 'DSA' 
  },
  isMandatory: { type: Boolean, default: true }
});

const DailyCompletionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  completedSlotIds: [{ type: String }],
  completionRate: { type: Number, default: 0 }, // 0 to 100
  isFullyDone: { type: Boolean, default: false },
  xpEarned: { type: Number, default: 0 }
});

const TimetableSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  startDate: { type: String, required: true }, // "YYYY-MM-DD" (Timetable creation anchor date)
  studyPace: { type: String, enum: ['Normal', 'Intense', 'Placement Sprint'], default: 'Normal' },
  wakeUpTime: { type: String, default: '06:30' },
  sleepTime: { type: String, default: '23:00' },
  slots: [SlotSchema],
  dailyCompletions: [DailyCompletionSchema],
  streak: { type: Number, default: 0 },
  xpPoints: { type: Number, default: 0 },
  lastCompletedDate: { type: String },
  badges: [{ name: String, awardedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', TimetableSchema);
export default Timetable;