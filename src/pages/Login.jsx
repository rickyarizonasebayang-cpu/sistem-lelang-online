import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Demo shortcut login helper
  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const demoEmail = role === 'admin' ? 'admin@lelanghub.com' : 'user@example.com';
      await signIn(demoEmail, 'password123');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-icon" style={{ margin: '0 auto 1rem', width: '44px', height: '44px' }}>
            <Gavel size={24} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Selamat Datang
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Masuk ke akun LelangHub untuk mulai menawar barang
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

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginBottom: '1.25rem' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Memproses...' : 'Masuk ke Akun'}</span>
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        {!isSupabaseConfigured && (
          <div style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
              Uji Coba Cepat (Demo Mode):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('user')}
              >
                Masuk sbg User
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('admin')}
                style={{ color: '#fbbf24' }}
              >
                Masuk sbg Admin
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Belum punya akun?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
