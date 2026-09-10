# Attendance gap fixes — 10 September 2026

This change fixes implementation defects without replacing the existing attendance policy. No database migration, deletion, seed, or historical attendance correction was performed. All existing routes remain available.

## Fixed

| Gap | Result |
| --- | --- |
| Closing the QR display left the database session active | A server close endpoint deactivates the session; the screen only confirms success after the server responds. |
| Another trainer could request a session's QR | QR retrieval and closure require the session owner or an administrator. |
| Trainer dashboard read a Map as an object | The dashboard now reads the actual computed percentage. Legitimate zero percentages are also preserved in student-list fields. |
| Two QR endpoints applied different eligibility and timing rules | Both call the existing web/mobile scan implementation. The general attendance endpoint retains its response envelope and now accepts the same compact tokens. |
| Student attendance lookup allowed access to another student's ID | Students can read their own records; existing trainer and administrator access remains available. |
| Scan route had no role restriction in the general attendance router | It now permits the same Student/Admin/Super Admin roles as the existing student scan router. |
| Date normalization depended on host timezone | Attendance writes, daily matching, date formatting, dashboard buckets, and date-filter endpoints use IST calendar days. Daily ranges include older UTC-midnight records without migration. |
| 6 PM job used department-wide activity to select students | It now restricts eligible enrollment batches to those with a session or Present/Late activity. Existing cross-batch records still prevent automatic absence in the student's department. |
| 6 PM job did not deactivate sessions | It deactivates active sessions started on or before that day's 6 PM cutoff after successful processing. Weekend and holiday exemptions remain. |
| Scheduler missed the whole day after a late start or a failed run | It catches up after 6 PM on the current day and retries failures, with an in-process overlap guard. Automatic attendance writes remain insert-only. |
| Bulk submission counted modified records twice | Successful count is inserted plus matched records. |
| Only the older pure attendance formula had tests | Added regression tests exercising the active scan controllers, attendance service, dashboard, access middleware, and scheduler using mocked database operations. Original tests remain. |

## Existing policy preserved

- Scan timing: elapsed whole minutes 0–10 Present, 11–20 Late, 21+ Absent.
- Technical requires exact-batch enrollment; Communication and Aptitude allow department-level cross-batch scanning.
- QR refresh remains 15 seconds; compact-token validity remains 150 seconds. Invalid future-dated tokens are rejected.
- Training targets remain Communication 80, Aptitude 120, Technical 80.
- Current percentage formulas, Late handling, leave policy, three-department averaging, and elapsed-weekday/domain fallback remain in place.
- Wi-Fi verification and strict device binding stay disabled, as explicitly documented by the existing code.
- Manual attendance, history, notifications, and scan audit logs remain supported.

These preserved policies can still produce different figures between the general attendance summary, department dashboards, and the older fixed-target formula. Consolidating those formulas or removing fallback days would require choosing a business rule and is outside this corrective change.

## Validation and limitations

- 70 backend tests passed in both UTC and Asia/Kolkata server timezones.
- Frontend production build passed; Vite reported a large-bundle warning.
- Tests use model mocks and do not connect to the database or write real student records.
- Camera scanning on a real device and authenticated UI workflows were not exercised.
- Scheduler catch-up is same-day only. It does not backfill historical days or provide a persistent multi-server job lock.
- Historical duplicate or incorrect records are retained. This patch does not repair or remove them.
- Three root ZIP files were already marked deleted in Git before this work; that pre-existing state was left untouched.

## Subsequent user-authorized reset — 10 September 2026

The user subsequently requested removal of attendance records and a new first day for all students. The reset was executed separately from the corrective patch above, in one MongoDB transaction:

- Removed 680 attendance records and 1,285 scan audit records; verified zero remained immediately afterward.
- Set the attendance baseline of all 93 students and the start date of all 246 active enrollments to 10 September 2026, midnight IST.
- Updated the start date of the 13 batches referenced by active enrollments.
- Closed two active QR sessions; retained all 36 session documents.
- Preserved all four completed enrollments, account creation dates, other data, collections, and indexes.
- Saved and validated an EJSON recovery snapshot outside the repository before writing.

The web and mobile training screens now use backend-provided dates instead of hard-coded August fallbacks. A student-level baseline preserves the reset date even when a department has no active enrollment. Verified all 93 students report Day 1 in all three departments. Both local and live student dashboard APIs returned zero history records.

The pre-existing weekday fallback still calculates an unmarked current day as Absent; that calculated value is not an old attendance record. Attendance policy was not changed by this reset.

Validation: 72 backend tests, frontend build, and mobile TypeScript check passed. The reset script defaults to a read-only preview and is never invoked by application startup or deployment.

## Technical batch attendance policy (subsequently authorized)

Technical attendance now uses the exact batch's start/end dates, narrowed by the student's enrollment and attendance baseline. Saturdays, Sundays, declared holidays, and elapsed days with no successful Present/Late QR scan in that batch are excluded. Starting a session or entering manual attendance alone does not establish a conducted class. Manual corrections are respected on days with successful scans.

Unrecorded attendance stays pending until 6 PM IST. The automatic close job uses the same batch and date restrictions and preserves existing records. A student enrolled in multiple Technical batches receives separate statistics and can scan each batch; totals combine batch-days, not unrelated department activity.

Technical percentage is (Present + Late) / applicable conducted batch-days. There is no fixed 80-day Technical target. Future scheduled weekdays remain provisional in total/remaining days and are removed when they pass without scans. Missing or invalid batch dates are flagged rather than replaced with an invented target. Communication and Aptitude retain their existing calculations and targets.
