const crypto = require('crypto');
const User = require('../Model/user');
const queue = require('../jobs/queue');
const resetMailer = require('../mailers/reset_password_mailer');

// ------------------ Signup Controller ------------------
exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/signup');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/signup');
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    req.flash('success', 'User registered successfully. Please sign in.');
    res.redirect('/signin');
  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error', 'Something went wrong during signup.');
    res.redirect('/signup');
  }
};

// ------------------ Forgot Password Controller ------------------
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Email not found');
      return res.redirect('/forgot');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create job to send email
    const job = queue.create('emails', {
      user,
      link: `http://${req.headers.host}/reset/${token}`
    }).save(err => {
      if (err) {
        console.error('Error creating email job:', err);
      } else {
        console.log('Reset password email job queued:', job.id);
      }
    });

    req.flash('success', 'Reset link sent to email!');
    res.redirect('/signin');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/forgot');
  }
};

// ------------------ Show Reset Password Page ------------------
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Token expired or invalid.');
      return res.redirect('/forgot');
    }

    res.render('reset', { token: req.params.token });
  } catch (err) {
    console.error('Reset password page error:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/forgot');
  }
};

// ------------------ Update Password After Reset ------------------
exports.updatePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match!');
    return res.redirect('back');
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error', 'Token expired or invalid.');
      return res.redirect('/forgot');
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    req.flash('success', 'Password reset successful! Please sign in.');
    res.redirect('/signin');
  } catch (err) {
    console.error('Update password error:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/forgot');
  }
};
