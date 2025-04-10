const kue = require('kue');
const queue = kue.createQueue();
const resetMailer = require('../mailers/reset_password_mailer');

queue.process('reset_email', function(job, done) {
  resetMailer.resetPassword(job.data);
  done();
});

module.exports = queue;
