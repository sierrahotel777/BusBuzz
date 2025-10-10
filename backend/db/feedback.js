const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  route: String,
  busNo: String,
  comments: String,
  issue: String,
  details: Object,
  attachmentName: String,
  submittedOn: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
}, { collection: 'Feedback' }); // Explicitly set collection name

module.exports = mongoose.model('Feedback', feedbackSchema);