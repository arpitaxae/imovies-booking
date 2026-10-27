const mongoose = require('mongoose');
module.exports = mongoose.model('Show', new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  date: String,
  time: String,
  price: { type: Number, default: 200 },
  bookedSeats: { type: [String], default: [] }
}));
