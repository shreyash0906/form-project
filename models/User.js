const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  password: String, // Hashed password
});

module.exports = mongoose.model('User', userSchema);
