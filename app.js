const path = require('node:path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { csrfSync } = require('csrf-sync');
const setupPassport = require('./setuppassport');
module.exports = function createApp({ store, secret, secure = false, now = () => new Date() }) {
  if (!secret || secret.length < 32 || secret.startsWith('replace-')) throw new Error('Set SESSION_SECRET to at least 32 random characters.');
  if (!store) throw new Error('A persistent session store is required.');
  const app = express();
  // The managed adapter supplies an encrypted socket; never trust client proxy headers.
  app.disable('x-powered-by');
  app.set('views', path.join(__dirname, 'views'));
  app.engine('html', require('ejs').__express);
  app.set('view engine', 'html');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    'script-src': ["'self'"], 'style-src': ["'self'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:'], 'upgrade-insecure-requests': secure ? [] : null
  } } }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: false, limit: '8kb', parameterLimit: 20 }));
  app.use(session({ name: 'pets.sid', secret, store, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 } }));
  const passport = setupPassport(now);
  app.use(passport.initialize(), passport.session());
  const { generateToken, csrfSynchronisedProtection } = csrfSync({ getTokenFromRequest: req => req.body?._csrf });
  app.use(csrfSynchronisedProtection);
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.locals.loginFailed = req.path === '/login' && req.query.failed === '1';
    res.locals.currentUser = req.user;
    res.locals.csrfToken = generateToken(req);
    res.locals.info = req.session.info || '';
    delete req.session.info;
    next();
  });
  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, keyGenerator: () => 'pets-demo', standardHeaders: 'draft-8', legacyHeaders: false });
  app.use(['/login', '/registration'], (req, res, next) => req.method === 'POST' ? authLimit(req, res, next) : next());
  app.use(require('./routes')({ passport, now }));
  app.use((req, res) => res.status(404).render('404', { appPage: 'Not found' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.locals.currentUser ??= req.user || null;
    res.locals.csrfToken ??= req.session ? generateToken(req) : '';
    res.locals.info ??= '';
    const status = err.status === 403 ? 403 : err.code === 11000 || err.name === 'ValidationError' ? 400 : 500;
    const message = status === 403 ? 'This form expired. Reload the page and try again.' : status === 400 ? 'Please check your details. That username may already be taken.' : 'Something went wrong. Please try again.';
    // Never include connection strings, submitted passwords, or driver errors in responses/logs.
    res.status(status).render('message', { appPage: 'Request error', message });
  });
  return app;
};
