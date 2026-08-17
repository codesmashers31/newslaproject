import { describe, test, expect } from '@jest/globals';
import {
  TARGET_DAYS,
  getTargetDays,
  toDateKey,
  isWeekend,
  buildHolidaySet,
  resolveStartDate,
  classifyDay,
  buildActualTrainingDates,
  dedupeAttendanceRecords,
  computeAbsencesForStudent,
  computeAttendanceFromAbsences,
  computeProgress,
} from '../utils/attendanceLogic.js';

// These tests are 100% in-memory / pure-function based.
// No database connection is opened and no production data is touched.

describe('Fixed-denominator attendance formula', () => {
  test('TEST 1: Communication, 0 absences -> Present 80, Absent 0, 100%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 0);
    expect(result).toEqual({ presentCount: 80, absentCount: 0, attendancePercent: 100 });
  });

  test('TEST 2: Communication, 1 absence -> Present 79, Absent 1, 98.75%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 1);
    expect(result).toEqual({ presentCount: 79, absentCount: 1, attendancePercent: 98.75 });
  });

  test('TEST 3: Communication, 2 absences -> Present 78, Absent 2, 97.50%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 2);
    expect(result).toEqual({ presentCount: 78, absentCount: 2, attendancePercent: 97.5 });
  });

  test('TEST 4: Communication, 5 absences -> Present 75, Absent 5, 93.75%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 5);
    expect(result).toEqual({ presentCount: 75, absentCount: 5, attendancePercent: 93.75 });
  });

  test('TEST 5: Communication, 10 absences -> Present 70, Absent 10, 87.50%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 10);
    expect(result).toEqual({ presentCount: 70, absentCount: 10, attendancePercent: 87.5 });
  });

  test('TEST 6: Aptitude, 0 absences -> Present 120, Absent 0, 100%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 0);
    expect(result).toEqual({ presentCount: 120, absentCount: 0, attendancePercent: 100 });
  });

  test('TEST 7: Aptitude, 1 absence -> Present 119, Absent 1, 99.17%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 1);
    expect(result).toEqual({ presentCount: 119, absentCount: 1, attendancePercent: 99.17 });
  });

  test('TEST 8: Aptitude, 2 absences -> Present 118, Absent 2, 98.33%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 2);
    expect(result).toEqual({ presentCount: 118, absentCount: 2, attendancePercent: 98.33 });
  });

  test('TEST 9: Aptitude, 5 absences -> Present 115, Absent 5, 95.83%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 5);
    expect(result).toEqual({ presentCount: 115, absentCount: 5, attendancePercent: 95.83 });
  });

  test('TEST 10: Aptitude, 10 absences -> Present 110, Absent 10, 91.67%', () => {
    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 10);
    expect(result).toEqual({ presentCount: 110, absentCount: 10, attendancePercent: 91.67 });
  });

  test('Denominator sanity: getTargetDays never returns anything but 80/120', () => {
    expect(getTargetDays('Communication')).toBe(80);
    expect(getTargetDays('Aptitude')).toBe(120);
  });
});

describe('TEST 11: Start date must come from enrollment, never from QR scan', () => {
  test('QR scan date is completely irrelevant to resolveStartDate', () => {
    const enrollmentStartDate = '2026-08-17';
    const qrScanDate = '2026-08-18';

    const startDate = resolveStartDate({ enrollmentStartDate });

    expect(toDateKey(startDate)).toBe('2026-08-17');
    expect(toDateKey(startDate)).not.toBe(toDateKey(qrScanDate));
  });
});

describe('TEST 12: Weekend must never count as a training day / absence', () => {
  test('Saturday is excluded', () => {
    const status = classifyDay('2026-08-15', { scannedDateKeys: new Set(['2026-08-15']) });
    expect(status).toBe('WEEKEND');
  });

  test('Sunday is excluded', () => {
    const status = classifyDay('2026-08-16', { scannedDateKeys: new Set(['2026-08-16']) });
    expect(status).toBe('WEEKEND');
  });

  test('Weekends do not appear in actual training dates even with scans', () => {
    const dates = buildActualTrainingDates('2026-08-15', '2026-08-16', {
      scannedDateKeys: new Set(['2026-08-15', '2026-08-16']),
    });
    expect(dates).toEqual([]);
  });
});

describe('TEST 13: Institute holiday must never count as a training day / absence', () => {
  test('A weekday holiday is excluded even if scans exist', () => {
    const holidaySet = buildHolidaySet([{ date: '2026-08-19' }]);
    const status = classifyDay('2026-08-19', {
      holidaySet,
      scannedDateKeys: new Set(['2026-08-19']),
    });
    expect(status).toBe('HOLIDAY');
  });

  test('Holiday is excluded from actual training dates', () => {
    const holidaySet = buildHolidaySet([{ date: '2026-08-19' }]);
    const dates = buildActualTrainingDates('2026-08-19', '2026-08-19', {
      holidaySet,
      scannedDateKeys: new Set(['2026-08-19']),
    });
    expect(dates).toEqual([]);
  });
});

describe('TEST 14: Automatic No Training Day (zero scans on a weekday)', () => {
  test('Weekday with 0 Communication scans is NO_TRAINING_DAY', () => {
    const status = classifyDay('2026-08-19', { scannedDateKeys: new Set() });
    expect(status).toBe('NO_TRAINING_DAY');
  });

  test('No Training Day does not enter the training-day counter', () => {
    const dates = buildActualTrainingDates('2026-08-19', '2026-08-19', {
      scannedDateKeys: new Set(),
    });
    expect(dates.length).toBe(0);
  });
});

describe('TEST 15: An actual training day marks non-attendees absent (Communication)', () => {
  test('Day becomes TRAINING_DAY once at least one student scans', () => {
    const status = classifyDay('2026-08-19', {
      scannedDateKeys: new Set(['2026-08-19']),
    });
    expect(status).toBe('TRAINING_DAY');
  });

  test('A student who did not attend that training day is marked absent', () => {
    const actualTrainingDates = buildActualTrainingDates('2026-08-19', '2026-08-19', {
      scannedDateKeys: new Set(['2026-08-19']),
    });
    const absences = computeAbsencesForStudent(actualTrainingDates, new Set());
    expect(absences).toEqual(['2026-08-19']);
  });
});

describe('TEST 16: An actual training day marks non-attendees absent (Aptitude), domains independent', () => {
  test('Aptitude date becomes TRAINING_DAY on its own scan activity', () => {
    const status = classifyDay('2026-08-19', {
      scannedDateKeys: new Set(['2026-08-19']),
    });
    expect(status).toBe('TRAINING_DAY');
  });

  test('Non-attending Aptitude student receives an absence', () => {
    const actualTrainingDates = buildActualTrainingDates('2026-08-19', '2026-08-19', {
      scannedDateKeys: new Set(['2026-08-19']),
    });
    const absences = computeAbsencesForStudent(actualTrainingDates, new Set());
    expect(absences).toEqual(['2026-08-19']);
  });
});

describe('TEST 17: Duplicate QR scans must not create duplicate attendance', () => {
  test('Two scans, same student/subject/date -> exactly one record', () => {
    const records = [
      { student: 'stu1', subject: 'Communication', date: '2026-08-19T09:00:00Z', status: 'Present' },
      { student: 'stu1', subject: 'Communication', date: '2026-08-19T09:05:00Z', status: 'Present' },
    ];
    const deduped = dedupeAttendanceRecords(records);
    expect(deduped.length).toBe(1);
  });

  test('Present count must not become 2, absent count must not change incorrectly', () => {
    const records = [
      { student: 'stu1', subject: 'Communication', date: '2026-08-19T09:00:00Z', status: 'Present' },
      { student: 'stu1', subject: 'Communication', date: '2026-08-19T09:05:00Z', status: 'Present' },
    ];
    const deduped = dedupeAttendanceRecords(records);
    const presentCount = deduped.filter((r) => r.status === 'Present').length;
    expect(presentCount).toBe(1);

    const actualTrainingDates = buildActualTrainingDates('2026-08-19', '2026-08-19', {
      scannedDateKeys: new Set(['2026-08-19']),
    });
    const presentDateKeys = new Set(deduped.map((r) => toDateKey(r.date)));
    const absences = computeAbsencesForStudent(actualTrainingDates, presentDateKeys);
    expect(absences).toEqual([]);
  });
});

describe('TEST 18 & 19: Communication and Aptitude attendance are fully independent', () => {
  test('TEST 18: Communication has 1 absence, Aptitude has 0 -> independent results', () => {
    const communication = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 1);
    const aptitude = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 0);

    expect(communication.attendancePercent).toBe(98.75);
    expect(aptitude.attendancePercent).toBe(100);
  });

  test('TEST 19: Reverse - Communication 0 absences, Aptitude 1 absence -> independent results', () => {
    const communication = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 0);
    const aptitude = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 1);

    expect(communication.attendancePercent).toBe(100);
    expect(aptitude.attendancePercent).toBe(99.17);
  });

  test('Changing Communication absences never changes the Aptitude result', () => {
    const aptitudeBefore = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 3);
    computeAttendanceFromAbsences(TARGET_DAYS.Communication, 7);
    const aptitudeAfter = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 3);
    expect(aptitudeAfter).toEqual(aptitudeBefore);
  });
});

describe('TEST 20, 21, 22: Progress % must never be confused with attendance %', () => {
  test('TEST 20: Communication progress 20/80 = 25%, Aptitude progress 30/120 = 25%', () => {
    expect(computeProgress(TARGET_DAYS.Communication, 20)).toBe(25);
    expect(computeProgress(TARGET_DAYS.Aptitude, 30)).toBe(25);
  });

  test('TEST 21: Communication, 20 completed days + 1 absence', () => {
    const attendance = computeAttendanceFromAbsences(TARGET_DAYS.Communication, 1);
    const progress = computeProgress(TARGET_DAYS.Communication, 20);

    expect(attendance.attendancePercent).toBe(98.75);
    expect(progress).toBe(25);
    expect(attendance.attendancePercent).not.toBe(95);
  });

  test('TEST 22: Aptitude, 20 completed days + 1 absence', () => {
    const attendance = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, 1);
    const progress = computeProgress(TARGET_DAYS.Aptitude, 20);

    expect(attendance.attendancePercent).toBe(99.17);
    expect(progress).toBe(16.67);
    expect(attendance.attendancePercent).not.toBe(95);
  });
});

describe('TEST 23: Multiple No-Training-Day types never inflate absences', () => {
  test('Saturday + Sunday + Holiday + zero-scan weekday all excluded', () => {
    const holidaySet = buildHolidaySet([{ date: '2026-08-17' }]);
    const scannedDateKeys = new Set(['2026-08-19']);

    const dates = buildActualTrainingDates('2026-08-15', '2026-08-19', {
      holidaySet,
      scannedDateKeys,
    });

    expect(dates).toEqual(['2026-08-19']);

    const absences = computeAbsencesForStudent(dates, new Set(['2026-08-19']));
    expect(absences).toEqual([]);
  });
});

describe('TEST 24 & 25: Multiple actual training days use the fixed denominator, not attended/held ratio', () => {
  test('TEST 24: Communication, 10 actual training days, student misses 2', () => {
    const scannedDateKeys = new Set([
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
      '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
    ]);
    const actualTrainingDates = buildActualTrainingDates('2026-08-17', '2026-08-28', {
      scannedDateKeys,
    });
    expect(actualTrainingDates.length).toBe(10);

    const missed = new Set(['2026-08-21', '2026-08-28']);
    const presentDateKeys = new Set(actualTrainingDates.filter((d) => !missed.has(d)));
    const absences = computeAbsencesForStudent(actualTrainingDates, presentDateKeys);
    expect(absences.length).toBe(2);

    const result = computeAttendanceFromAbsences(TARGET_DAYS.Communication, absences.length);
    expect(result.absentCount).toBe(2);
    expect(result.presentCount).toBe(78);
    expect(result.attendancePercent).toBe(97.5);
    expect(result.attendancePercent).not.toBe(80);
  });

  test('TEST 25: Aptitude, 10 actual training days, student misses 2', () => {
    const scannedDateKeys = new Set([
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
      '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
    ]);
    const actualTrainingDates = buildActualTrainingDates('2026-08-17', '2026-08-28', {
      scannedDateKeys,
    });
    expect(actualTrainingDates.length).toBe(10);

    const missed = new Set(['2026-08-21', '2026-08-28']);
    const presentDateKeys = new Set(actualTrainingDates.filter((d) => !missed.has(d)));
    const absences = computeAbsencesForStudent(actualTrainingDates, presentDateKeys);
    expect(absences.length).toBe(2);

    const result = computeAttendanceFromAbsences(TARGET_DAYS.Aptitude, absences.length);
    expect(result.absentCount).toBe(2);
    expect(result.presentCount).toBe(118);
    expect(result.attendancePercent).toBe(98.33);
    expect(result.attendancePercent).not.toBe(80);
  });
});