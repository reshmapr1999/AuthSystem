const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
require('./Config/db');
dotenv.config();

const app = express();
require('./Config/passport');

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log("DB Error:", err));

app.use(express.urlencoded({ extended: true }));
// app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.user;
  next();
});

app.use('/', require('./Routes/auth'));
// app.get('/', (req, res) => {
//   res.redirect('/signin');
// });

app.listen(process.env.PORT, () => console.log(`Server started on http://localhost:${process.env.PORT}`));
