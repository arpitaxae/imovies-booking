require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const User = require('./models/User');
const Booking = require('./models/Booking');

const movies = [
  { title: 'Space Odyssey', genre: 'Sci-Fi', duration: 140, description: 'A crew travels beyond the solar system.' },
  { title: 'Laugh Riot', genre: 'Comedy', duration: 110, description: 'Three friends, one very bad plan.' },
  { title: 'Midnight Chase', genre: 'Action', duration: 125, description: 'A race against time through the city.' },
  { title: 'Hearts in Paris', genre: 'Romance', duration: 118, description: 'Two strangers, one unforgettable week.' },
  { title: 'The Haunting', genre: 'Horror', duration: 100, description: 'Some houses should stay empty.' },
  { title: 'Jungle Quest', genre: 'Adventure', duration: 130, description: 'A hidden treasure and a dangerous map.' }
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);
  const created = await Movie.insertMany(
    movies.map((m) => ({ ...m, poster: 'https://picsum.photos/seed/' + encodeURIComponent(m.title) + '/300/420' }))
  );
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const shows = [];
  created.forEach((m) => [0, 1].forEach((d) => ['10:00 AM', '2:00 PM', '7:00 PM'].forEach((t) =>
    shows.push({ movie: m._id, date: day(d), time: t, price: 200 }))));
  await Show.insertMany(shows);
  if (!(await User.findOne({ email: 'admin@imovies.com' })))
    await User.create({ name: 'Admin', email: 'admin@imovies.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
  console.log('Seeded! Admin login: admin@imovies.com / admin123');
  process.exit();
})();
