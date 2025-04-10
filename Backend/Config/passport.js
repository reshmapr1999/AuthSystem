const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Model/user');

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.isValidPassword(password))) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: "/auth/google/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//   let user = await User.findOne({ googleId: profile.id });
//   if (!user) {
//     user = await User.create({
//       googleId: profile.id,
//       name: profile.displayName,
//       email: profile.emails[0].value
//     });
//   }
//   return done(null, user);
// }));
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then(user => done(null, user)));
