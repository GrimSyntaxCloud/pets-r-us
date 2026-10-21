const { randomBytes, scrypt: derive, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(derive);
async function hash(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function verify(password, encoded) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [scheme, salt, value] = (encoded || '').split(':');
  if (scheme !== 'scrypt' || !/^[a-f0-9]{128}$/.test(value || '')) return false;
  const key = await scrypt(password, salt, 64);
  return timingSafeEqual(key, Buffer.from(value, 'hex'));
}
module.exports = { hash, verify };
