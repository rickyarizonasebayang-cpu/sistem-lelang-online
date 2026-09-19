import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, Mail, Lock, User, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Kata sandi harus memiliki minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, role);
      navigate('/my-dashboard');
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Silakan gunakan email lain atau periksa input Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-icon" style={{ margin: '0 auto 1rem', width: '44px', height: '44px' }}>
            <Gavel size={24} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Buat Akun Baru
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Daftar untuk mengikuti lelang dan memantau tawaran Anda
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Contoh: Ahmad Fadillah"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email"
                className="form-control"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi (Min. 6 Karakter)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {/* Role Choice (Memudahkan Pengujian Fitur Admin) */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Daftar Sebagai Peran</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRole('user')}
                style={{ fontSize: '0.85rem', padding: '0.6rem' }}
              >
                <User size={16} />
                <span>Pengguna Biasa</span>
              </button>
              <button
                type="button"
                className={`btn ${role === 'admin' ? 'btn-gold' : 'btn-secondary'}`}
                onClick={() => setRole('admin')}
                style={{ fontSize: '0.85rem', padding: '0.6rem' }}
              >
                <ShieldCheck size={16} />
                <span>Administrator</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginBottom: '1.25rem' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Sudah memiliki akun?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
