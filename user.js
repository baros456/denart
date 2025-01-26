javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  childName: { type: String, required: true },
  generalStatus: { type: String, required: true },
  lessonDate: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  artClassTopic: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
