// attendanceLogic.js
//
// Pure, framework/DB-free attendance business logic for the LCP system.
// These functions contain NO Mongoose/DB calls so they can be unit
// tested in isolation. `calculations.js` (calculateDynamicAttendance)
// mirrors this exact logic when talking to the database.
//
// Fixed-denominator rules:
//   Communication -> denominator is ALWAYS 80
//   Aptitude      -> denominator is ALWAYS 120
//   Denominator is NEVER elapsed days or training days completed.

export const TARGET_DAYS = {
  Communication: 80,
  Aptitude: 120,
};

export function getTargetDays(department) {
  if (department === 'Communication') return TARGET_DAYS.Communication;
  if (department === 'Aptitude') return TARGET_DAYS.Aptitude;
  throw new Error(`Unknown department: ${department}`);
}

export function toDateKey(dateInput) {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export function isWeekend(dateInput) {
  const day = new Date(dateInput).getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

export function buildHolidaySet(holidayDocs = []) {
  return new Set(holidayDocs.map((h) => toDateKey(h.date)));
}

export function resolveStartDate({
  enrollmentStartDate,
  enrollmentEnrolledAt,
  enrollmentCreatedAt,
  studentCreatedAt,
} = {}) {
  const raw =
    enrollmentStartDate ||
    enrollmentEnrolledAt ||
    enrollmentCreatedAt ||
    studentCreatedAt ||
    new Date();
  const d = new Date(raw);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function classifyDay(dateInput, { holidaySet = new Set(), scannedDateKeys = new Set() } = {}) {
  if (isWeekend(dateInput)) return 'WEEKEND';
  const key = toDateKey(dateInput);
  if (holidaySet.has(key)) return 'HOLIDAY';
  if (!scannedDateKeys.has(key)) return 'NO_TRAINING_DAY';
  return 'TRAINING_DAY';
}

export function buildActualTrainingDates(
  startDate,
  endDate,
  { holidaySet = new Set(), scannedDateKeys = new Set(), targetDays = Infinity } = {}
) {
  const result = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);
  const end = new Date(endDate);

  while (curr <= end && result.length < targetDays) {
    if (classifyDay(curr, { holidaySet, scannedDateKeys }) === 'TRAINING_DAY') {
      result.push(toDateKey(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return result;
}

export function dedupeAttendanceRecords(records = []) {
  const seen = new Map();
  records.forEach((r) => {
    const key = `${r.student}|${r.subject}|${toDateKey(r.date)}`;
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  });
  return Array.from(seen.values());
}

export function computeAbsencesForStudent(actualTrainingDates = [], studentPresentDateKeys = new Set()) {
  return actualTrainingDates.filter((dateKey) => !studentPresentDateKeys.has(dateKey));
}

export function computeAttendanceFromAbsences(targetDays, absentCount) {
  const safeAbsent = Math.max(0, absentCount);
  const presentCount = Math.max(0, targetDays - safeAbsent);
  const attendancePercent = Number(((presentCount / targetDays) * 100).toFixed(2));
  return { presentCount, absentCount: safeAbsent, attendancePercent };
}

export function computeProgress(targetDays, trainingDayCount) {
  return Number(((trainingDayCount / targetDays) * 100).toFixed(2));
}