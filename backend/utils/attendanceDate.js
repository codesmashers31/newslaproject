// Attendance is a calendar day in India, independent of the server timezone.
export const attendanceDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
};

export const attendanceDayStart = (value) => {
  const key = attendanceDateKey(value);
  return key ? new Date(`${key}T00:00:00+05:30`) : null;
};

export const attendanceDayEnd = (value) => {
  const start = attendanceDayStart(value);
  return start ? new Date(start.getTime() + 86400000 - 1) : null;
};

// Also finds historical records stored at UTC midnight; no migration needed.
export const attendanceDayRange = (value) => ({
  $gte: attendanceDayStart(value), $lte: attendanceDayEnd(value)
});

export const attendanceWeekday = (value) => new Date(attendanceDateKey(value)).getUTCDay();

// Missing attendance stays pending until the daily 6 PM IST cutoff.
export const isAttendanceDayClosed = (value, now = new Date()) => {
  const key = attendanceDateKey(value);
  return !!key && now >= new Date(`${key}T18:00:00+05:30`);
};
