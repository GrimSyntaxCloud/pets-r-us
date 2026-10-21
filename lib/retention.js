const RETENTION_MS = 96 * 60 * 60 * 1000;
function expiresAt(now = new Date(), ownerExpiry) {
  return new Date(Math.min(+now + RETENTION_MS, ownerExpiry ? +ownerExpiry : Infinity));
}
function isActive(record, now = new Date()) {
  return Boolean(record && (record.isDemo === true || (record.expiresAt && +record.expiresAt > +now)));
}
async function cleanup({ User, Appointment, sessions }, now = new Date()) {
  // Explicit false protects seeded demo data and unclassified legacy records.
  const expired = { isDemo: false, expiresAt: { $lte: now } };
  const appointments = await Appointment.deleteMany(expired);
  const users = await User.deleteMany(expired);
  const sessionResult = sessions ? await sessions.deleteMany({ expires: { $lte: now } }) : { deletedCount: 0 };
  return { users: users.deletedCount, appointments: appointments.deletedCount, sessions: sessionResult.deletedCount };
}
module.exports = { RETENTION_MS, expiresAt, isActive, cleanup };
