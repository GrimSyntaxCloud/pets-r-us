const express = require('express');
const User = require('./models/users');
const Appointment = require('./models/appointments');
const { hash } = require('./lib/password');
const { expiresAt } = require('./lib/retention');
const text = value => typeof value === 'string' ? value.trim() : '';
const validUsername = value => /^[a-z0-9_-]{3,32}$/.test(value);
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
module.exports = ({ passport, now }) => {
  const router = express.Router();
  const authenticated = (req, res, next) => req.user && !req.user.isDemo ? next() : res.redirect('/login');
  const invalid = (res, message) => res.status(400).render('message', { appPage: 'Check your details', message });
  for (const [route, view, appPage] of [['/', 'index', 'Home'], ['/grooming', 'grooming', 'Grooming'], ['/boarding', 'boarding', 'Boarding'], ['/training', 'training', 'Training'], ['/registration', 'registration', 'Register'], ['/login', 'login', 'Login']]) {
    router.get(route, (req, res) => res.render(view, { appPage }));
  }
  router.post('/registration', async (req, res, next) => {
    const username = text(req.body.txtUserName).toLowerCase();
    const email = text(req.body.email);
    const password = req.body.password;
    if (!validUsername(username) || !validEmail(email) || typeof password !== 'string' || password.length < 12 || password.length > 128) return invalid(res, 'Use a username of 3–32 letters, numbers, underscores or dashes; an email address; and a password of 12–128 characters.');
    if (await User.countDocuments({ isDemo: false, expiresAt: { $gt: now() } }) >= 100) return res.status(429).render('message', { appPage: 'Demo full', message: 'The demo has reached its account limit. Please try again later.' });
    const createdAt = now();
    const user = await User.create({ username, email, passwordHash: await hash(password), createdAt, expiresAt: expiresAt(createdAt), isDemo: false });
    req.login(user, err => err ? next(err) : res.redirect('/profile'));
  });
  router.post('/login', passport.authenticate('local', { failureRedirect: '/login?failed=1' }), (req, res) => res.redirect('/profile'));
  router.get('/appointment', authenticated, (req, res) => res.render('appointment', { appPage: 'Appointments' }));
  router.post('/appointment', authenticated, async (req, res) => {
    const firstName = text(req.body.firstName), lastName = text(req.body.lastName), email = text(req.body.email), service = text(req.body.service);
    if (!firstName || firstName.length > 60 || !lastName || lastName.length > 60 || !validEmail(email) || !['grooming', 'boarding', 'training'].includes(service)) return invalid(res, 'Enter both names, a valid email, and one of the listed services.');
    if (await Appointment.countDocuments({ userId: req.user._id, expiresAt: { $gt: now() } }) >= 20) return invalid(res, 'This demo allows up to 20 appointment requests per account.');
    const createdAt = now();
    await Appointment.create({ userId: req.user._id, firstName, lastName, email, service, createdAt, expiresAt: expiresAt(createdAt, req.user.expiresAt), isDemo: false });
    req.session.info = 'Demo appointment request saved. No real booking was made.';
    res.redirect('/profile');
  });
  router.get('/profile', authenticated, async (req, res) => {
    const appointments = await Appointment.find({ userId: req.user._id, isDemo: false, expiresAt: { $gt: now() } }).sort({ createdAt: -1 }).limit(20);
    res.render('profile', { appPage: 'Profile', appointments, demo: false });
  });
  router.get('/demo', async (req, res) => {
    const appointments = await Appointment.find({ isDemo: true }).limit(20);
    res.render('profile', { appPage: 'Sample appointments', appointments, demo: true });
  });
  router.get('/edit', authenticated, (req, res) => res.render('edit', { appPage: 'Edit profile' }));
  router.post('/edit', authenticated, async (req, res) => {
    const username = text(req.body.username).toLowerCase(), email = text(req.body.email);
    if (!validUsername(username) || !validEmail(email)) return invalid(res, 'Enter a valid username and email address.');
    req.user.username = username;
    req.user.email = email;
    await req.user.save();
    req.session.info = 'Profile updated.';
    res.redirect('/profile');
  });
  // Logout is a CSRF-protected POST; visiting a link cannot end somebody's session.
  router.post('/logout', (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(err => {
        if (err) return next(err);
        res.clearCookie('pets.sid');
        res.redirect('/');
      });
    });
  });
  return router;
};
