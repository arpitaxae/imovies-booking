import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from './api';

const errMsg = (e) => e.response?.data?.message || 'Something went wrong';

function Nav() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">🎬 IMovies</Link>
      <div>
        {user ? (
          <>
            {user.role === 'admin' && <Link className="btn btn-warning me-2" to="/admin">Add Movie</Link>}
            <Link className="btn btn-outline-light me-2" to="/bookings">My Bookings</Link>
            <button className="btn btn-danger" onClick={() => { localStorage.clear(); nav('/login'); }}>
              Logout ({user.name})
            </button>
          </>
        ) : <Link className="btn btn-light" to="/login">Login</Link>}
      </div>
    </nav>
  );
}

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/' + (mode === 'login' ? 'login' : 'register'), f);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (e) { setErr(errMsg(e)); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h3>{mode === 'login' ? 'Login' : 'Create account'}</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form onSubmit={submit}>
        {mode === 'register' && <input className="form-control mb-2" placeholder="Name" value={f.name} onChange={set('name')} />}
        <input className="form-control mb-2" type="email" placeholder="Email" value={f.email} onChange={set('email')} />
        <input className="form-control mb-3" type="password" placeholder="Password" value={f.password} onChange={set('password')} />
        <button className="btn btn-primary w-100">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      <button className="btn btn-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
      </button>
    </div>
  );
}

function Movies() {
  const [movies, setMovies] = useState([]);
  useEffect(() => { api.get('/movies').then((r) => setMovies(r.data)); }, []);
  return (
    <div className="container mt-4">
      <h3 className="mb-3">Now Showing</h3>
      <div className="row">
        {movies.map((m) => (
          <div className="col-6 col-md-4 col-lg-3 mb-4" key={m._id}>
            <div className="card h-100">
              <img src={m.poster} className="card-img-top" alt={m.title} />
              <div className="card-body">
                <h5>{m.title}</h5>
                <p className="text-muted mb-2">{m.genre} • {m.duration} min</p>
                <Link className="btn btn-primary btn-sm" to={'/movie/' + m._id}>Book Now</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  useEffect(() => {
    api.get('/movies/' + id).then((r) => setMovie(r.data));
    api.get('/shows/movie/' + id).then((r) => setShows(r.data));
  }, [id]);
  if (!movie) return <div className="container mt-4">Loading...</div>;
  const dates = [...new Set(shows.map((s) => s.date))];
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4"><img src={movie.poster} className="img-fluid rounded" alt="" /></div>
        <div className="col-md-8">
          <h2>{movie.title}</h2>
          <p className="text-muted">{movie.genre} • {movie.duration} min</p>
          <p>{movie.description}</p>
          <h5>Select a showtime</h5>
          {dates.map((d) => (
            <div key={d} className="mb-3">
              <strong>{d}</strong><br />
              {shows.filter((s) => s.date === d).map((s) => (
                <Link key={s._id} className="btn btn-outline-primary me-2 mt-2" to={'/seats/' + s._id}>{s.time}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ROWS = ['A', 'B', 'C', 'D'];
const SEATS = ROWS.flatMap((r) => Array.from({ length: 10 }, (_, i) => r + (i + 1)));

function Seats() {
  const { id } = useParams();
  const nav = useNavigate();
  const [show, setShow] = useState(null);
  const [picked, setPicked] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api.get('/shows/detail/' + id).then((r) => setShow(r.data));
  useEffect(() => { load(); }, [id]);
  if (!show) return <div className="container mt-4">Loading...</div>;
  const toggle = (s) => setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]);
  const book = async () => {
    try {
      await api.post('/bookings', { showId: id, seats: picked });
      nav('/bookings');
    } catch (e) {
      setErr(errMsg(e));
      if (e.response?.status === 401) nav('/login');
      setPicked([]); load();
    }
  };
  return (
    <div className="container mt-4">
      <h4>{show.movie.title} — {show.date}, {show.time}</h4>
      <div className="text-center my-3 p-1 bg-secondary text-white rounded">SCREEN</div>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="d-flex flex-wrap justify-content-center" style={{ maxWidth: 520, margin: '0 auto' }}>
        {SEATS.map((s) => {
          const booked = show.bookedSeats.includes(s);
          const sel = picked.includes(s);
          return (
            <button key={s} disabled={booked} onClick={() => toggle(s)}
              className={'btn m-1 ' + (booked ? 'btn-secondary' : sel ? 'btn-success' : 'btn-outline-dark')}
              style={{ width: 44 }}>{s}</button>
          );
        })}
      </div>
      <p className="text-center mt-3">
        <span className="badge bg-secondary me-1">Booked</span>
        <span className="badge bg-success me-1">Selected</span>
        <span className="badge border text-dark">Available</span>
      </p>
      <div className="text-center">
        <p>Seats: {picked.join(', ') || 'none'} | Total: ₹{picked.length * show.price}</p>
        <button className="btn btn-primary" disabled={!picked.length} onClick={book}>Confirm Booking</button>
      </div>
    </div>
  );
}

function Bookings() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const load = () => api.get('/bookings/my').then((r) => setList(r.data)).catch(() => nav('/login'));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { if (confirm('Cancel this booking?')) { await api.delete('/bookings/' + id); load(); } };
  return (
    <div className="container mt-4">
      <h3>My Bookings</h3>
      {!list.length && <p>No bookings yet.</p>}
      {list.map((b) => (
        <div className="card mb-3" key={b._id}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h5>{b.show?.movie?.title}</h5>
              <div>{b.show?.date} at {b.show?.time}</div>
              <div>Seats: {b.seats.join(', ')} | Total: ₹{b.totalPrice}</div>
            </div>
            <button className="btn btn-outline-danger" onClick={() => cancel(b._id)}>Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Admin() {
  const [f, setF] = useState({ title: '', genre: '', duration: '', poster: '', description: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/movies', f); setMsg('Movie added!'); } catch (e) { setMsg(errMsg(e)); }
  };
  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h3>Add Movie (Admin)</h3>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={submit}>
        {Object.keys(f).map((k) => (
          <input key={k} className="form-control mb-2" placeholder={k} value={f[k]} onChange={set(k)} />
        ))}
        <button className="btn btn-primary">Add</button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Movies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/seats/:id" element={<Seats />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
