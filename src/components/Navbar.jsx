import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, User, ShieldCheck, LogOut, LogIn, Menu, X, Trophy, PlusCircle, Compass } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, signOut, switchDemoRole, isSupabaseConfigured } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="container nav-wrapper">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <Gavel size={22} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.4rem' }}>
            Lelang<span style={{ color: '#f59e0b' }}>Hub</span>
          </span>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="mobile-nav-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Compass size={18} />
            <span>Jelajah Lelang</span>
          </Link>

          <Link 
            to="/winners" 
            className={`nav-link ${isActive('/winners') ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Trophy size={18} />
            <span>Hasil & Pemenang</span>
          </Link>

          {user && (
            <Link 
              to="/my-dashboard" 
              className={`nav-link ${isActive('/my-dashboard') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={18} />
              <span>Aktivitas Saya</span>
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin" 
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ color: '#fbbf24', fontWeight: 600 }}
            >
              <ShieldCheck size={18} />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* User Auth Info & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Profile info badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                    <span className={`badge ${isAdmin ? 'badge-role-admin' : 'badge-role-user'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                      {isAdmin ? 'ADMIN' : 'USER'}
                    </span>
                    {!isSupabaseConfigured && (
                      <button
                        title="Klik untuk beralih role testing (Demo Mode)"
                        onClick={() => switchDemoRole(isAdmin ? 'user' : 'admin')}
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#cbd5e1',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Ganti Role
                      </button>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary btn-sm"
                  title="Keluar"
                  style={{ padding: '0.45rem' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setIsMobileMenuOpen(false)}>
                  <LogIn size={16} />
                  <span>Masuk</span>
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMobileMenuOpen(false)}>
                  <span>Daftar</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
