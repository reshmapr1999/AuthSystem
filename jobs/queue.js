
const kue = require('kue');
require('dotenv').config();
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log(process.env.REDIS_URL);
const queue = kue.createQueue({
  redis: redisUrl
});

const resetMailer = require('../mailers/reset_password_mailer');

queue.process('reset_email', function(job, done) {
  resetMailer.resetPassword(job.data);
  done();
});

module.exports = queue;
