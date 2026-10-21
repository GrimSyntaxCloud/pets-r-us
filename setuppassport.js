const { Passport } = require('passport');
const { Strategy } = require('passport-local');
const User = require('./models/users');
const { verify } = require('./lib/password');
const { isActive } = require('./lib/retention');
module.exports = function setupPassport(now) {
  const passport = new Passport();
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, isActive(user, now()) ? user : false);
    } catch (err) { done(err); }
  });
  passport.use(new Strategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username.toLowerCase() }).select('+passwordHash');
      const valid = await verify(password, user?.passwordHash);
      done(null, valid && isActive(user, now()) && !user.isDemo ? user : false);
    } catch (err) { done(err); }
  }));
  return passport;
};
