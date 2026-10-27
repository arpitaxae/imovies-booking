require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(express.json());

// ---- middleware ----
const auth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Please login first' });
  }
};
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });

const makeToken = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ---- auth ----
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.json({ token: makeToken(user), user: { name: user.name, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password, user.password)))
      return res.status(400).json({ message: 'Wrong email or password' });
    res.json({ token: makeToken(user), user: { name: user.name, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---- movies ----
app.get('/api/movies', async (req, res) => res.json(await Movie.find()));
app.get('/api/movies/:id', async (req, res) => res.json(await Movie.findById(req.params.id)));
app.post('/api/movies', auth, adminOnly, async (req, res) => res.json(await Movie.create(req.body)));

// ---- shows ----
app.get('/api/shows/movie/:movieId', async (req, res) =>
  res.json(await Show.find({ movie: req.params.movieId })));
app.get('/api/shows/detail/:id', async (req, res) =>
  res.json(await Show.findById(req.params.id).populate('movie')));

// ---- bookings ----
app.post('/api/bookings', auth, async (req, res) => {
  try {
    const { showId, seats } = req.body;
    if (!seats || !seats.length) return res.status(400).json({ message: 'Select at least one seat' });
    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: 'Show not found' });
    if (seats.some((s) => show.bookedSeats.includes(s)))
      return res.status(400).json({ message: 'Some seats were just taken. Pick others.' });
    show.bookedSeats.push(...seats);
    await show.save();
    const booking = await Booking.create({
      user: req.user.id, show: show._id, seats, totalPrice: seats.length * show.price
    });
    res.json(booking);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/bookings/my', auth, async (req, res) => {
  const list = await Booking.find({ user: req.user.id })
    .populate({ path: 'show', populate: { path: 'movie' } }).sort('-createdAt');
  res.json(list);
});

app.delete('/api/bookings/:id', auth, async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  await Show.findByIdAndUpdate(b.show, { $pull: { bookedSeats: { $in: b.seats } } });
  await b.deleteOne();
  res.json({ message: 'Cancelled' });
});

// ---- start ----
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Server running on port ' + (process.env.PORT || 5000))))
  .catch((e) => console.error('DB connection failed:', e.message));
