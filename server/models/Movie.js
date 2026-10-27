const mongoose = require('mongoose');
module.exports = mongoose.model('Movie', new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String,
  duration: Number,
  genre: String
}));
