import React from 'react';
import { Gavel, Shield, Clock, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
                <Gavel size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f8fafc' }}>
                Lelang<span style={{ color: '#f59e0b' }}>Hub</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '400px' }}>
              Platform sistem lelang daring yang aman, transparan, dan realtime. Temukan barang idaman, elektronik premium, dan koleksi berharga dengan penawaran terbaik.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Keunggulan
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} style={{ color: '#6366f1' }} />
                <span>Transaksi Terbuka & Adil</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: '#f59e0b' }} />
                <span>Countdown Realtime Presisi</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} style={{ color: '#10b981' }} />
                <span>Verifikasi Pemenang Otomatis</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status Sistem
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Didukung oleh Database PostgreSQL & Realtime Supabase.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span className="live-dot" />
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Sistem Bidding Aktif</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            &copy; {new Date().getFullYear()} LelangHub. Hak Cipta Dilindungi.
          </div>
          <div>
            Dibangun dengan React + Vite & Supabase.
          </div>
        </div>
      </div>
    </footer>
  );
}
