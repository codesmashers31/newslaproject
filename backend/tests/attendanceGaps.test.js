import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Enrollment from '../models/Enrollment.js';
import Batch from '../models/Batch.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { scanQR } from '../controllers/studentController.js';
import { submitScanAttendance } from '../controllers/attendanceController.js';
import { closeSession, getQRToken, getTrainerDashboardStats } from '../controllers/trainerController.js';
import { calculateBulkStudentsAttendance } from '../services/attendanceService.js';
import { recordBulkAttendance } from '../services/attendanceEngine.js';
import { autoCloseAttendanceForToday, createAttendanceSchedulerTick } from '../services/cronService.js';
import { attendanceDateKey, attendanceDayRange, attendanceDayStart } from '../utils/attendanceDate.js';
import { authorizeStudentAttendance } from '../middleware/attendanceAccess.js';

// No database is connected: every model operation in these scenarios is mocked.
const id = () => new mongoose.Types.ObjectId();
const studentId = id(), batchId = id(), trainerId = id(), sessionId = id();
const chain = (value) => {
  const q = { then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) };
  for (const method of ['lean', 'select', 'populate', 'sort']) q[method] = () => q;
  return q;
};
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-10T12:35:00Z'));
});
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

test('IST day boundaries include historical UTC and IST midnight records', () => {
  const range = attendanceDayRange('2026-09-10');
  expect(range.$gte.toISOString()).toBe('2026-09-09T18:30:00.000Z');
  expect(range.$lte.toISOString()).toBe('2026-09-10T18:29:59.999Z');
  for (const value of ['2026-09-09T18:30:00Z', '2026-09-10T00:00:00Z']) {
    expect(attendanceDateKey(value)).toBe('2026-09-10');
    expect(new Date(value) >= range.$gte && new Date(value) <= range.$lte).toBe(true);
  }
  expect(attendanceDateKey('2026-09-10T18:30:00Z')).toBe('2026-09-11');
});

test.each([
  ['Student', studentId, String(studentId), true],
  ['Student', studentId, String(id()), false],
  ['Communication Trainer', trainerId, String(studentId), true],
  ['Admin', trainerId, String(studentId), true]
])('attendance access: %s', (role, userId, requested, allowed) => {
  const next = jest.fn(), res = response();
  authorizeStudentAttendance({ user: { _id: userId, role }, params: { studentId: requested } }, res, next);
  expect(next.mock.calls.length).toBe(allowed ? 1 : 0);
  if (!allowed) expect(res.statusCode).toBe(403);
});

const setupScan = (minutes = 0, subject = 'Communication Skills') => {
  const session = { _id: sessionId, batch: batchId, trainer: trainerId, subject,
    startTime: new Date(Date.now() - minutes * 60000), isActive: true };
  jest.spyOn(AttendanceSession, 'findById').mockImplementation(() => chain(session));
  jest.spyOn(Batch, 'findById').mockResolvedValue({ _id: batchId });
  jest.spyOn(Enrollment, 'findOne').mockResolvedValue({ batchId, department: 'Communication' });
  jest.spyOn(Attendance, 'findOne').mockResolvedValue(null);
  jest.spyOn(Attendance, 'findOneAndUpdate').mockImplementation(async (_, data) => data);
  jest.spyOn(AttendanceLog, 'create').mockResolvedValue({});
  jest.spyOn(Notification, 'create').mockResolvedValue({});
  const raw = `${sessionId}_${batchId}_${Math.floor(Date.now() / 1000)}`;
  const sign = crypto.createHmac('sha256', process.env.JWT_SECRET || 'lcp_secret_key_123456').update(raw).digest('base64url').slice(0, 10);
  return { session, req: { user: { _id: studentId, role: 'Student', status: 'Active' }, body: { token: `SLA:${raw}:${sign}` } } };
};

describe.each([['student', scanQR], ['shared', submitScanAttendance]])('%s scan endpoint', (_, handler) => {
  test.each([[0, 'Present'], [10, 'Present'], [11, 'Late'], [20, 'Late'], [21, 'Absent']])('preserves %i-minute status %s', async (minutes, expected) => {
    const { req } = setupScan(minutes); const res = response();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect((res.body.attendance || res.body.data).status).toBe(expected);
    expect(Attendance.findOneAndUpdate.mock.calls[0][1].date).toEqual(attendanceDayStart(new Date()));
  });
  test('rejects closed sessions without writing attendance', async () => {
    const { req, session } = setupScan(); session.isActive = false;
    const res = response(); await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });
  test('requires enrollment for Technical scans', async () => {
    const { req } = setupScan(0, 'Technical Training');
    Enrollment.findOne.mockResolvedValue(null);
    const res = response(); await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(Enrollment.findOne.mock.calls[0][0].batchId).toEqual(batchId);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });
  test('allows Communication cross-batch enrollment and rejects duplicates', async () => {
    const { req } = setupScan();
    Enrollment.findOne.mockResolvedValue({ batchId: id() });
    Attendance.findOne.mockResolvedValueOnce({ status: 'Present' });
    const res = response(); await handler(req, res);
    expect(Enrollment.findOne.mock.calls[0][0]).toMatchObject({ department: 'Communication', status: 'Active' });
    expect(res.statusCode).toBe(400);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });
  test.each(['Communication Skills', 'Aptitude & Reasoning'])('keeps cross-batch scanning for %s', async (subject) => {
    const { req } = setupScan(0, subject);
    Enrollment.findOne.mockResolvedValue({ batchId: id() });
    const res = response(); await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(Attendance.findOneAndUpdate.mock.calls[0][1].scannedBatch).toEqual(batchId);
  });
  test('expired compact tokens cannot write attendance', async () => {
    const { req } = setupScan();
    jest.setSystemTime(new Date(Date.now() + 151000));
    const res = response(); await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

test('session owner closes the server session and cannot get another QR', async () => {
  const session = { trainer: trainerId, isActive: true, save: jest.fn().mockResolvedValue({}) };
  jest.spyOn(AttendanceSession, 'findById').mockResolvedValue(session);
  const req = { user: { _id: trainerId, role: 'Communication Trainer' }, params: { sessionId } };
  await closeSession(req, response());
  expect(session.isActive).toBe(false); expect(session.save).toHaveBeenCalledTimes(1);
  const res = response(); await getQRToken(req, res); expect(res.statusCode).toBe(404);
});

test('another trainer cannot close a session', async () => {
  const session = { trainer: trainerId, isActive: true, save: jest.fn() };
  jest.spyOn(AttendanceSession, 'findById').mockResolvedValue(session);
  const res = response();
  await closeSession({ user: { _id: id(), role: 'Technical Trainer' }, params: { sessionId } }, res);
  expect(res.statusCode).toBe(403); expect(session.save).not.toHaveBeenCalled();
});

test('scheduler catches up after 18:00, retries failures, and runs on the next date', async () => {
  let dateISO = '2026-09-10', hours = 17;
  const run = jest.fn().mockResolvedValueOnce({ status: 'error' }).mockResolvedValue({ status: 'success' });
  const tick = createAttendanceSchedulerTick(run, () => ({ dateISO, hours }));
  await tick(); expect(run).not.toHaveBeenCalled();
  hours = 19; await tick(); await tick(); await tick(); expect(run).toHaveBeenCalledTimes(2);
  dateISO = '2026-09-11'; await tick(); expect(run).toHaveBeenCalledTimes(3);
});

test('auto-close scopes enrollment to conducted batches and preserves existing records', async () => {
  jest.spyOn(Holiday, 'findOne').mockResolvedValue(null);
  jest.spyOn(User, 'findOne').mockResolvedValue({ _id: trainerId });
  jest.spyOn(AttendanceSession, 'find').mockReturnValue(chain([{ batch: batchId }]));
  jest.spyOn(AttendanceSession, 'updateMany').mockResolvedValue({});
  const existingStudent = id();
  jest.spyOn(Enrollment, 'find').mockReturnValue(chain([
    { studentId, batchId, startDate: '2026-09-01' },
    { studentId: existingStudent, batchId, startDate: '2026-09-01' }
  ]));
  jest.spyOn(Attendance, 'find').mockImplementation(q => chain(q.student ? [{ student: existingStudent, status: 'Leave' }] : []));
  jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({ upsertedCount: 1 });
  const result = await autoCloseAttendanceForToday();
  expect(result.status).toBe('success');
  for (const [query] of Enrollment.find.mock.calls) expect(query.batchId.$in).toEqual([String(batchId)]);
  for (const [ops] of Attendance.bulkWrite.mock.calls) {
    expect(ops).toHaveLength(1);
    expect(ops[0].updateOne.filter.student).toEqual(studentId);
    expect(Object.keys(ops[0].updateOne.update)).toEqual(['$setOnInsert']);
    expect(ops[0].updateOne.update.$setOnInsert.date).toEqual(attendanceDayStart(new Date()));
  }
  expect(AttendanceSession.updateMany).toHaveBeenCalled();
});

test('auto-close creates no absences when no batch held training', async () => {
  jest.spyOn(Holiday, 'findOne').mockResolvedValue(null);
  jest.spyOn(User, 'findOne').mockResolvedValue({ _id: trainerId });
  jest.spyOn(Attendance, 'find').mockReturnValue(chain([]));
  jest.spyOn(AttendanceSession, 'find').mockReturnValue(chain([]));
  jest.spyOn(AttendanceSession, 'updateMany').mockResolvedValue({});
  jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({});
  const result = await autoCloseAttendanceForToday();
  expect(result.status).toBe('success');
  expect(Attendance.bulkWrite).not.toHaveBeenCalled();
});

test('auto-close keeps the holiday exemption', async () => {
  jest.spyOn(Holiday, 'findOne').mockResolvedValue({ date: new Date() });
  jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({});
  expect(await autoCloseAttendanceForToday()).toMatchObject({ status: 'skipped', reason: 'holiday' });
  expect(Attendance.bulkWrite).not.toHaveBeenCalled();
});

const setupStats = () => {
  const batch = { _id: batchId, name: 'Test', students: [{ _id: studentId, role: 'Student', name: 'Test Student' }] };
  jest.spyOn(Batch, 'find').mockReturnValue(chain([batch]));
  jest.spyOn(Enrollment, 'find').mockReturnValue(chain([{ studentId, batchId: batch, startDate: '2026-09-09' }]));
  jest.spyOn(Holiday, 'find').mockReturnValue(chain([]));
  jest.spyOn(AttendanceSession, 'find').mockReturnValue(chain([
    { batch: batchId, createdAt: new Date('2026-09-09T09:00:00+05:30') },
    { batch: batchId, createdAt: new Date('2026-09-10T09:00:00+05:30') }
  ]));
  jest.spyOn(Attendance, 'find').mockReturnValue(chain([]));
};

test('trainer dashboard uses calculated Map values including zero', async () => {
  setupStats();
  const res = response();
  await getTrainerDashboardStats({ user: { _id: trainerId, role: 'Communication Trainer' }, query: {} }, res);
  expect(res.statusCode).toBe(200);
  expect(res.body.cards.attendancePercentage).toBe(0);
});

test('live calculation retains conducted-day percentage and 80-day progress target', async () => {
  setupStats();
  Attendance.find.mockReturnValue(chain([{ student: studentId, batch: batchId, date: new Date('2026-09-09T00:00:00Z'), status: 'Late' }]));
  const result = (await calculateBulkStudentsAttendance([studentId], 'Communication')).get(String(studentId));
  expect(result).toMatchObject({ presentCount: 1, absentCount: 1, trainingDay: 2, attendancePercent: 50, totalTrainingDays: 80, progressPercent: 2.5 });
});

test('bulk result does not count modified records twice', async () => {
  jest.spyOn(Batch, 'findById').mockReturnValue(chain({ course: 'Communication' }));
  jest.spyOn(Attendance, 'bulkWrite').mockResolvedValue({ upsertedCount: 0, matchedCount: 1, modifiedCount: 1 });
  const result = await recordBulkAttendance({ batchId, classDate: '2026-09-10', records: [{ studentId, status: 'Present' }], user: { _id: trainerId } });
  expect(result.successfulCount).toBe(1);
});
