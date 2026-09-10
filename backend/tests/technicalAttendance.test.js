import { describe, test, expect, jest, afterEach } from '@jest/globals';
import { computeTechnicalBatchAttendance, technicalWindow } from '../services/technicalAttendanceService.js';
import { closeTechnicalAttendanceDay } from '../services/cronService.js';
import Attendance from '../models/Attendance.js';
import Enrollment from '../models/Enrollment.js';

const batch = { _id: 'batch-a', name: 'Java', startDate: '2026-09-01', endDate: '2026-09-30' };
const enrollment = { startDate: '2026-09-01' };
const scan = (date, extra = {}) => ({ student: 'other', batch: batch._id, date, status: 'Present', attendanceMode: 'SCAN', ...extra });
const calculate = (extra = {}) => computeTechnicalBatchAttendance({ studentId: 'student', batch, enrollment, now: new Date('2026-10-01T09:00:00+05:30'), ...extra });

afterEach(() => jest.restoreAllMocks());

test('technical denominator is 20 scanned weekdays, with 18 attended giving 90%', () => {
  const weekdays = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)
    .filter(d => ![0, 6].includes(new Date(d).getUTCDay()));
  const scans = weekdays.slice(0, 20).map(d => scan(d));
  const records = weekdays.slice(0, 18).map(d => scan(d, { student: 'student', status: 'Late' }));
  expect(calculate({ scans, records })).toMatchObject({ trainingDay: 20, totalTrainingDays: 20,
    presentCount: 18, absentCount: 2, attendancePercent: 90, remainingDays: 0 });
});

test('weekends, holidays, out-of-batch scans and dates outside batch never count', () => {
  const scans = ['2026-08-31', '2026-09-05', '2026-09-06', '2026-09-07', '2026-10-01'].map(d => scan(d));
  scans.push(scan('2026-09-08', { batch: 'batch-b' }));
  expect(calculate({ scans, holidays: [{ date: '2026-09-07' }] })).toMatchObject({ trainingDay: 0, absentCount: 0, totalTrainingDays: 0 });
});

test('manual attendance and failed/absent scans do not establish a conducted day', () => {
  const scans = [scan('2026-09-01', { attendanceMode: 'MANUAL' }), scan('2026-09-02', { status: 'Absent' })];
  expect(calculate({ scans, records: [scan('2026-09-03', { student: 'student', attendanceMode: 'MANUAL' })] })).toMatchObject({ trainingDay: 0, absentCount: 0 });
});

test('late enrollment and completion restrict the batch window', () => {
  expect(technicalWindow(batch, { startDate: '2026-09-08', completedAt: '2026-09-10' })).toEqual({ start: '2026-09-08', end: '2026-09-10' });
  expect(calculate({ enrollment: { startDate: '2026-09-08', completedAt: '2026-09-10' }, scans: ['2026-09-07', '2026-09-08', '2026-09-11'].map(d => scan(d)) }))
    .toMatchObject({ trainingDay: 1, absentCount: 1 });
});

test.each([['17:59:59', 0, 1], ['18:00:00', 1, 0]])('unmarked day at %s respects closing time', (time, absentCount, pendingCount) => {
  expect(calculate({ scans: [scan('2026-09-10')], now: new Date(`2026-09-10T${time}+05:30`) }))
    .toMatchObject({ absentCount, pendingCount });
});

test('explicit present, late and leave records are respected on scanned days', () => {
  const scans = ['2026-09-08', '2026-09-09', '2026-09-10'].map(d => scan(d));
  const records = ['Present', 'Late', 'Leave'].map((status, i) => scan(scans[i].date, { student: 'student', status, attendanceMode: 'MANUAL' }));
  expect(calculate({ scans, records })).toMatchObject({ presentCount: 2, leaveCount: 1, absentCount: 0, trainingDay: 3 });
});

test('repeated scans cannot count a day twice; later corrections win', () => {
  const scans = [scan('2026-09-10'), scan('2026-09-10')];
  const records = [scan('2026-09-10', { student: 'student', updatedAt: '2026-09-10T09:00Z' }),
    scan('2026-09-10', { student: 'student', status: 'Leave', updatedAt: '2026-09-10T10:00Z' })];
  expect(calculate({ scans, records })).toMatchObject({ trainingDay: 1, leaveCount: 1, presentCount: 0 });
});

test('future weekdays are provisional remaining days, never absences', () => {
  const result = calculate({ batch: { ...batch, endDate: '2026-09-11' }, scans: [scan('2026-09-09')], now: new Date('2026-09-09T19:00:00+05:30') });
  expect(result).toMatchObject({ trainingDay: 1, totalTrainingDays: 3, remainingDays: 2, absentCount: 1 });
});

test('missing batch dates require configuration instead of falling back to 80', () => {
  expect(calculate({ batch: { _id: 'batch-a' }, scans: [scan('2026-09-10')] }))
    .toMatchObject({ configurationRequired: true, totalTrainingDays: 0, trainingDay: 0 });
});

test('6 PM job only creates Technical absences in the scanned, in-range batch', async () => {
  const chain = value => ({ populate() { return this; }, lean: async () => value });
  jest.spyOn(Enrollment, 'find').mockReturnValue(chain([
    { studentId: 'missing', batchId: batch, ...enrollment },
    { studentId: 'present', batchId: batch, ...enrollment },
    { studentId: 'off', batchId: { ...batch, _id: 'batch-b' }, ...enrollment },
    { studentId: 'ended', batchId: { ...batch, _id: 'batch-c', endDate: '2026-09-09' }, ...enrollment }
  ]));
  jest.spyOn(Attendance, 'find').mockImplementation(query => chain(query.attendanceMode
    ? [scan('2026-09-10', { student: 'present' })] : [scan('2026-09-10', { student: 'present' })]));
  jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({ upsertedCount: 1 });
  expect(await closeTechnicalAttendanceDay('2026-09-10', 'trainer')).toBe(1);
  const ops = Attendance.bulkWrite.mock.calls[0][0];
  expect(ops).toHaveLength(1);
  expect(ops[0].updateOne.filter).toMatchObject({ student: 'missing', batch: 'batch-a' });
});
