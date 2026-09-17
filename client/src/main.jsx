import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(localStorage.token ? { Authorization: `Bearer ${localStorage.token}` } : {})
    }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body;
}

function Landing({ onStart }) {
  return (
    <main className="landing">
      <nav className="landing-nav"><strong>ParkEase</strong><button onClick={onStart}>Open attendant desk</button></nav>
      <section className="hero">
        <p className="eyebrow">PARKING, WITHOUT THE PAPER TRAIL</p>
        <h1>Every spot accounted for.</h1>
        <p>Check vehicles in, calculate fair fees, and keep a busy multi-level garage moving with one clear operational view.</p>
        <button className="primary" onClick={onStart}>Start managing</button>
      </section>
      <section className="feature-grid">
        <article><span>01</span><h3>Correct billing</h3><p>Tiered rates round up partial hours and respect a daily cap.</p></article>
        <article><span>02</span><h3>EV-ready allocation</h3><p>EV vehicles are assigned charging spots, never a general bay.</p></article>
        <article><span>03</span><h3>Fast vehicle lookup</h3><p>Find an active car or browse a paginated history by plate.</p></article>
      </section>
      <footer><div><small>BUILT FOR</small><h2>Attendants and garage operators.</h2></div><div><small>NEXT ON THE ROADMAP</small><p>Reservations · Digital payments · Parking analytics</p></div></footer>
    </main>
  );
}

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await request(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.token = data.token;
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth"><div className="auth-panel">
      <p className="eyebrow">PARKEASE / ATTENDANT ACCESS</p>
      <h1>{register ? 'Create your desk.' : 'Welcome back.'}</h1>
      <p>Keep the garage flowing from one reliable place.</p>
      <form onSubmit={submit}>
        {register && <label>Your name<input placeholder="Your name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
        <label>Email address<input type="email" placeholder="Email address" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" placeholder="Password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button className="primary">{register ? 'Register' : 'Log in'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <button className="link" onClick={() => setRegister(!register)}>{register ? 'Already have an account? Log in' : 'New attendant? Register here'}</button>
    </div></main>
  );
}

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getBreakdown(spots) {
  return ['COMPACT', 'STANDARD', 'EV'].map((type) => {
    const matching = spots.filter((spot) => spot.type === type);
    return { type, available: matching.filter((spot) => spot.status === 'AVAILABLE').length, total: matching.length };
  });
}

function Dashboard({ user, onLogout }) {
  const [garage, setGarage] = useState(null);
  const [stats, setStats] = useState({});
  const [spots, setSpots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [plate, setPlate] = useState('');
  const [checkInPlate, setCheckInPlate] = useState('');
  const [checkInType, setCheckInType] = useState('STANDARD');
  const [checkOutPlate, setCheckOutPlate] = useState('');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const garageResponse = await request('/garages');
      const current = Array.isArray(garageResponse.garages) ? garageResponse.garages[0] : null;
      setGarage(current || null);
      if (!current?._id) {
        setStats({});
        setSpots([]);
        setSessions([]);
        return;
      }
      const [availability, spotResponse, history] = await Promise.all([
        request(`/spots/availability?garageId=${current._id}`),
        request(`/spots?garageId=${current._id}`),
        request(`/parking?garageId=${current._id}&limit=8&sort=checkInTime&order=desc`)
      ]);
      setStats(availability || {});
      setSpots(Array.isArray(spotResponse.spots) ? spotResponse.spots : []);
      setSessions(Array.isArray(history.sessions) ? history.sessions : []);
    } catch (err) {
      setGarage(null);
      setStats({});
      setSpots([]);
      setSessions([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function checkIn(event) {
    event.preventDefault();
    if (!garage?._id) return setError('No active garage is available');
    setError('');
    try {
      const result = await request('/parking/check-in', { method: 'POST', body: JSON.stringify({ garageId: garage._id, plateNumber: checkInPlate, vehicleType: checkInType }) });
      setMessage(`Vehicle ${result.session.plateNumber} assigned to ${result.session.spot.spotNumber}`);
      setCheckInPlate('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkOut(event) {
    event.preventDefault();
    if (!garage?._id) return setError('No active garage is available');
    setError('');
    setReceipt(null);
    try {
      const result = await request('/parking/check-out', { method: 'POST', body: JSON.stringify({ garageId: garage._id, plateNumber: checkOutPlate }) });
      setReceipt(result.receipt);
      setMessage('Vehicle checked out and spot released.');
      setCheckOutPlate('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function search(event) {
    event.preventDefault();
    if (!garage?._id) return setError('No active garage is available');
    try {
      const result = await request(`/parking/search?plate=${encodeURIComponent(plate)}`);
      setSessions(Array.isArray(result.sessions) ? result.sessions : []);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <main className="dashboard"><div className="loading-state"><span className="loader" /><p>Loading your garage and parking availability...</p></div></main>;
  if (error && !garage) return <main className="dashboard"><div className="state-panel"><p className="eyebrow">GARAGE DESK</p><h1>Unable to load garage</h1><p>{error}</p><button className="primary" onClick={load}>Try again</button></div></main>;
  if (!garage) return <main className="dashboard"><div className="state-panel"><p className="eyebrow">GARAGE DESK</p><h1>No garage yet</h1><p>Your account has not been assigned a garage. Complete onboarding to start managing parking.</p><button className="link" onClick={onLogout}>Log out</button></div></main>;

  const breakdown = getBreakdown(spots);
  const activeSessions = sessions.filter((session) => session.status === 'ACTIVE');

  return <main className="dashboard">
    <header className="dashboard-header">
      <div className="brand-lockup"><div className="brand-mark">P</div><div><p className="eyebrow">PARKEASE / LIVE GARAGE DESK</p><h1>ParkEase</h1></div></div>
      <div className="garage-identity"><strong>{garage.name}</strong><span>{garage.address}</span></div>
      <div className="account"><span>{user.name}</span><button onClick={() => { localStorage.clear(); onLogout(); }}>Log out</button></div>
    </header>
    {error && <div className="notice error">{error}</div>}
    {message && <div className="notice success">{message}</div>}

    <section className="stats-grid">
      <div className="stat-card"><small>TOTAL SPOTS</small><strong>{stats.total ?? '-'}</strong><span>Across this garage</span></div>
      <div className="stat-card available"><small>AVAILABLE</small><strong>{stats.available ?? '-'}</strong><span>Ready to assign</span></div>
      <div className="stat-card occupied"><small>OCCUPIED</small><strong>{stats.occupied ?? '-'}</strong><span>Currently in use</span></div>
      <div className="stat-card ev"><small>EV AVAILABLE</small><strong>{stats.evAvailable ?? '-'} / {stats.evTotal ?? '-'}</strong><span>Charging spots</span></div>
    </section>

    <section className="dashboard-section availability-section"><div className="section-heading"><div><p className="eyebrow">CAPACITY</p><h2>Availability breakdown</h2></div><span className="section-note">Live spot status</span></div><div className="breakdown-grid">{breakdown.map((item) => <div className="breakdown-item" key={item.type}><div><strong>{item.type}</strong><span>{item.available} available of {item.total}</span></div><div className="bar"><i style={{ width: item.total ? `${(item.available / item.total) * 100}%` : '0%' }} /></div></div>)}</div></section>

    <section className="dashboard-section active-section"><div className="section-heading"><div><p className="eyebrow">ON THE FLOOR</p><h2>Active vehicles</h2></div><span className="section-note">{activeSessions.length} active</span></div>{activeSessions.length ? <div className="active-list">{activeSessions.map((session) => <div className="active-row" key={session._id}><div><strong>{session.plateNumber}</strong><span>{session.vehicleType}</span></div><div><small>SPOT</small><strong>{session.spot?.spotNumber || '-'}</strong></div><div><small>CHECKED IN</small><strong>{formatTime(session.checkInTime)}</strong></div><div><small>CURRENT FEE</small><strong>{session.fee == null ? 'In progress' : `₹${session.fee}`}</strong></div></div>)}</div> : <div className="empty-state">No vehicles are currently parked.</div>}</section>

    <section className="work-grid">
      <form className="panel action-panel" onSubmit={checkIn}><p className="eyebrow">ARRIVAL</p><h2>Vehicle Arrival</h2><p className="panel-intro">Assign the best available spot for an incoming vehicle.</p><label>Plate number<input placeholder="Enter plate number" value={checkInPlate} onChange={(event) => setCheckInPlate(event.target.value)} required /></label><label>Vehicle type<select value={checkInType} onChange={(event) => setCheckInType(event.target.value)}><option>STANDARD</option><option>COMPACT</option><option>EV</option></select></label><button className="primary action-button">Assign Spot</button></form>
      <form className="panel action-panel" onSubmit={checkOut}><p className="eyebrow">DEPARTURE</p><h2>Vehicle Departure</h2><p className="panel-intro">Calculate the final fee and release the vehicle's spot.</p><label>Plate number<input placeholder="Enter plate number" value={checkOutPlate} onChange={(event) => setCheckOutPlate(event.target.value)} required /></label><div className="receipt-slot">{receipt && <div className="receipt"><div><small>RECEIPT</small><strong>{receipt.plateNumber}</strong></div><span>{receipt.spot?.spotNumber || '-'} · {receipt.durationMinutes} min · {receipt.billableHours} hr(s)</span><b>₹{receipt.fee}</b></div>}</div><button className="dark action-button">Calculate &amp; Release</button></form>
    </section>

    <section className="dashboard-section history panel"><div className="section-heading history-heading"><div><p className="eyebrow">GARAGE LOG</p><h2>Recent sessions</h2></div><form onSubmit={search} className="search-form"><input placeholder="Search plate..." value={plate} onChange={(event) => setPlate(event.target.value)} /><button>Search</button></form></div>{sessions.length ? <div className="table-wrap"><table><thead><tr><th>Plate</th><th>Spot</th><th>Type</th><th>Check-in</th><th>Status</th><th>Fee</th></tr></thead><tbody>{sessions.map((session) => <tr key={session._id}><td><strong>{session.plateNumber}</strong></td><td>{session.spot?.spotNumber || '-'}</td><td>{session.vehicleType}</td><td>{formatTime(session.checkInTime)}</td><td><span className={`status ${session.status.toLowerCase()}`}>{session.status}</span></td><td>{session.fee == null ? '-' : `₹${session.fee}`}</td></tr>)}</tbody></table></div> : <div className="empty-state">No parking sessions match this view.</div>}</section>
  </main>;
}

function App() {
  const [page, setPage] = useState(localStorage.token ? 'dashboard' : 'landing');
  const [user, setUser] = useState(null);
  if (page === 'landing') return <Landing onStart={() => setPage('auth')} />;
  if (page === 'auth') return <Auth onLogin={(value) => { setUser(value); setPage('dashboard'); }} />;
  return <Dashboard user={user || { name: 'Attendant' }} onLogout={() => setPage('landing')} />;
}

createRoot(document.getElementById('root')).render(<App />);
