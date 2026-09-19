import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../lib/auctionService';
import { formatRupiah, formatDateTime } from '../lib/supabase';
import Toast from '../components/Toast';
import { 
  User, Trophy, History, Shield, CheckCircle2, Clock, 
  CreditCard, ExternalLink, AlertCircle 
} from 'lucide-react';

export default function UserDashboard() {
  const { user, profile, isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('bids'); // 'bids' | 'won' | 'profile'
  const [activity, setActivity] = useState({ myBids: [], wonAuctions: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadUserActivity = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await auctionService.getUserActivity(user.id);
      setActivity(data);
    } catch (err) {
      console.error('Error loading user activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserActivity();
  }, [user]);

  const handlePaymentSimulation = async (auctionId, newStatus) => {
    try {
      await auctionService.updatePaymentStatus(auctionId, newStatus);
      setToast({
        type: 'success',
        message: `Status pembayaran berhasil diubah menjadi "${newStatus.toUpperCase()}"`
      });
      await loadUserActivity();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Gagal mengubah status' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Toast Notification */}
      <div className="toast-container">
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>

      {/* Profile Overview Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'white'
          }}>
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {profile?.full_name || 'Pengguna Lelang'}
              </h1>
              <span className={`badge ${isAdmin ? 'badge-role-admin' : 'badge-role-user'}`}>
                {isAdmin ? 'ADMINISTRATOR' : 'USER'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Tawaran Diajukan</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8' }}>
              {activity.myBids.length}
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lelang Dimenangkan</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
              {activity.wonAuctions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`}
          onClick={() => setActiveTab('bids')}
        >
          <History size={16} />
          <span>Riwayat Tawaran Saya ({activity.myBids.length})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'won' ? 'active' : ''}`}
          onClick={() => setActiveTab('won')}
        >
          <Trophy size={16} />
          <span>Lelang Dimenangkan ({activity.wonAuctions.length})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>Profil Akun</span>
        </button>
      </div>

      {/* Tab Content: Riwayat Tawaran */}
      {activeTab === 'bids' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} style={{ color: '#6366f1' }} />
            <span>Riwayat Semua Tawaran yang Anda Ikuti</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              Memuat riwayat tawaran...
            </div>
          ) : activity.myBids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <History size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>Anda belum pernah mengajukan tawaran pada barang lelang apapun.</p>
              <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Jelajah Lelang Sekarang
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Barang Lelang</th>
                    <th>Nominal Tawaran Anda</th>
                    <th>Status Barang</th>
                    <th>Waktu Tawaran</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.myBids.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.auction?.title || 'Barang Lelang'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Harga saat ini: {formatRupiah(b.auction?.current_price)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                        {formatRupiah(b.bid_amount)}
                      </td>
                      <td>
                        <span className={`badge ${
                          b.auction?.status === 'active' ? 'badge-active' :
                          b.auction?.status === 'upcoming' ? 'badge-upcoming' : 'badge-ended'
                        }`}>
                          {b.auction?.status === 'active' ? 'Sedang Berlangsung' :
                           b.auction?.status === 'upcoming' ? 'Akan Datang' : 'Telah Selesai'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(b.created_at)}
                      </td>
                      <td>
                        <Link to={`/auction/${b.auction_id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <span>Lihat</span>
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Lelang Dimenangkan & Status Pembayaran */}
      {activeTab === 'won' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={20} style={{ color: '#f59e0b' }} />
            <span>Daftar Barang yang Berhasil Anda Menangkan</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              Memuat data kemenangan...
            </div>
          ) : activity.wonAuctions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Trophy size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>Belum ada lelang yang Anda menangkan saat ini. Tetap ajukan tawaran terbaik Anda!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activity.wonAuctions.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    background: 'rgba(15, 23, 42, 0.5)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80'} 
                      alt={item.title}
                      style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Selesai: {formatDateTime(item.end_time)}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.35rem' }}>
                        {formatRupiah(item.current_price)}
                      </div>
                    </div>
                  </div>

                  {/* Status Pembayaran */}
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Status Pembayaran
                    </span>
                    <span className={`badge badge-${item.payment_status || 'pending'}`} style={{ fontSize: '0.85rem' }}>
                      {item.payment_status === 'paid' ? 'LUNAS / TERBAYAR' :
                       item.payment_status === 'cancelled' ? 'DIBATALKAN' : 'MENUNGGU PEMBAYARAN'}
                    </span>
                  </div>

                  {/* Aksi Pembayaran Sederhana (Simulasi: pending, paid, cancelled) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Simulasi Transaksi:
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {item.payment_status !== 'paid' && (
                        <button 
                          onClick={() => handlePaymentSimulation(item.id, 'paid')}
                          className="btn btn-success btn-sm"
                        >
                          <CreditCard size={14} />
                          <span>Bayar Sekarang (Simulasi)</span>
                        </button>
                      )}
                      {item.payment_status !== 'cancelled' && (
                        <button 
                          onClick={() => handlePaymentSimulation(item.id, 'cancelled')}
                          className="btn btn-danger btn-sm"
                        >
                          Batalkan
                        </button>
                      )}
                      <Link to={`/auction/${item.id}`} className="btn btn-secondary btn-sm">
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Profil Sederhana */}
      {activeTab === 'profile' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: '#6366f1' }} />
            <span>Informasi Akun Pengguna</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ID Pengguna</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {user?.id}
              </strong>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Nama Lengkap</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {profile?.full_name || 'Tidak ada nama'}
              </strong>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Alamat Email</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {user?.email}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Peran Sistem (Role)</span>
              <div style={{ marginTop: '0.35rem' }}>
                <span className={`badge ${isAdmin ? 'badge-role-admin' : 'badge-role-user'}`}>
                  {isAdmin ? 'ADMINISTRATOR' : 'USER BIASA'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
