const express = require('express');
const passport = require('passport');
const crypto = require('crypto');
const User = require('../Model/user');
const router = express.Router();
const queue = require('../jobs/queue');
const resetMailer = require('../mailers/reset_password_mailer');

// Pages
router.get('/', (req, res) => res.render('home'));
// router.get('/home', isAuthenticated, (req, res) => {
//   res.render('home', { user: req.user });
// });
router.get('/signup', (req, res) => res.render('signup'));
router.get('/signin', (req, res) => res.render('signin'));
router.get('/forgot', (req, res) => res.render('forgot'));
router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Invalid or expired link');
    return res.redirect('/forgot');
  }
  res.render('reset', { token: req.params.token });
});

// Auth
router.post('/signup', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/signup');
  }
  try {
    await User.create({ email, password });
    req.flash('success', 'Account created!');
    res.redirect('/signin');
  } catch (err) {
    req.flash('error', 'Email already exists');
    res.redirect('/signup');
  }
});

router.post('/', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signin',
  failureFlash: true
}));

// router.get('/signout', (req, res) => {
//   req.logout(() => res.redirect('/signin'));
// });
router.get('/signout', (req, res) => {
  req.logout(() => {
    req.flash('success', 'You have logged out!');
    res.redirect('/signin');
  });
});

router.post('/forgot', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'User not found');
    return res.redirect('/forgot');
  }

  const token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 3600000;
  await user.save();

  queue.create('reset_email', {
    user,
    link: `http://${req.headers.host}/reset/${token}`
  }).save();

  req.flash('success', 'Reset link sent');
  res.redirect('/signin');
});

router.post('/reset/:token', async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('back');
  }

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Invalid or expired token');
    return res.redirect('/forgot');
  }

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  req.flash('success', 'Password updated');
  res.redirect('/signin');
});

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

module.exports = router;
