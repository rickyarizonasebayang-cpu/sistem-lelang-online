import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../lib/auctionService';
import { formatRupiah, formatDateTime } from '../lib/supabase';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import { 
  ArrowLeft, Clock, ShieldCheck, Tag, Trophy, History, 
  TrendingUp, AlertCircle, CheckCircle2, User, ChevronRight, Zap
} from 'lucide-react';

export default function AuctionDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDetail = async () => {
    try {
      const data = await auctionService.getAuctionById(id);
      setAuction(data);
      
      // Hitung rekomendasi minimal bid berikutnya
      const current = Number(data.current_price || data.starting_price);
      const inc = Number(data.min_increment || 50000);
      setBidAmount(current + inc);
    } catch (err) {
      console.error('Error loading auction detail:', err);
      setToast({ type: 'error', message: err.message || 'Gagal memuat detail lelang' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();

    // Subscribe to realtime updates
    const unsubscribe = auctionService.subscribeToAuction(id, () => {
      fetchDetail();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!user) {
      setToast({ type: 'error', message: 'Silakan login terlebih dahulu untuk mengajukan tawaran.' });
      return;
    }

    const currentPrice = Number(auction.current_price || auction.starting_price);
    const minIncrement = Number(auction.min_increment || 50000);
    const minRequired = currentPrice + minIncrement;
    const numericBid = Number(bidAmount);

    if (isNaN(numericBid) || numericBid <= currentPrice) {
      setToast({
        type: 'error',
        message: `Tawaran ditolak! Nominal harus lebih besar dari tawaran tertinggi saat ini (${formatRupiah(currentPrice)}).`
      });
      return;
    }

    if (numericBid < minRequired) {
      setToast({
        type: 'error',
        message: `Tawaran ditolak! Minimal kenaikan tawaran adalah ${formatRupiah(minIncrement)} (Minimal tawaran: ${formatRupiah(minRequired)}).`
      });
      return;
    }

    try {
      setSubmitting(true);
      await auctionService.placeBid({
        auctionId: id,
        bidAmount: numericBid,
        user,
        profile
      });

      setToast({
        type: 'success',
        message: `Tawaran Anda sebesar ${formatRupiah(numericBid)} berhasil diajukan!`
      });

      await fetchDetail();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Gagal mengajukan tawaran. Silakan coba lagi.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = (amount) => {
    const currentPrice = Number(auction.current_price || auction.starting_price);
    const minIncrement = Number(auction.min_increment || 50000);
    const base = Math.max(Number(bidAmount) || 0, currentPrice + minIncrement);
    setBidAmount(base + amount);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="live-dot" style={{ margin: '0 auto 1rem', width: '14px', height: '14px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat data lelang...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--accent-danger)', margin: '0 auto 1rem' }} />
        <h2>Barang Lelang Tidak Ditemukan</h2>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const now = new Date();
  const isEnded = auction.status === 'ended' || new Date(auction.end_time) <= now;
  const isUpcoming = auction.status === 'upcoming' || new Date(auction.start_time) > now;
  const isActive = !isEnded && !isUpcoming;

  const currentPrice = Number(auction.current_price || auction.starting_price);
  const minIncrement = Number(auction.min_increment || 50000);
  const minRequiredBid = currentPrice + minIncrement;

  // Cek apakah user yang sedang login adalah penawar tertinggi saat ini
  const topBid = auction.bids && auction.bids.length > 0 ? auction.bids[0] : null;
  const isCurrentTopBidder = user && topBid && topBid.user_id === user.id;
  const isUserWinner = isEnded && user && (auction.winner_id === user.id || (topBid && topBid.user_id === user.id));

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Toast Notification */}
      <div className="toast-container">
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>

      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={16} />
          <span>Katalog Lelang</span>
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
          {auction.title}
        </span>
      </div>

      {/* Banner Pemenang (Jika Lelang Sudah Berakhir) */}
      {isEnded && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.15))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <Trophy size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: '#fbbf24' }}>
              Lelang Ini Telah Selesai
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Pemenang lelang:{' '}
              <strong style={{ color: '#f8fafc' }}>
                {topBid?.bidder?.full_name || topBid?.user_name || auction.winner?.full_name || 'Tidak ada penawaran'}
              </strong>{' '}
              dengan penawaran akhir <strong style={{ color: '#fbbf24' }}>{formatRupiah(currentPrice)}</strong>.
            </p>
          </div>
          {isUserWinner && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              Selamat! Anda Adalah Pemenang Lelang Ini 🎉
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Gambar & Info Kiri, Form & Histori Kanan */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Kolom Kiri: Foto & Detail Deskripsi */}
        <div>
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, marginBottom: '2rem' }}>
            <img 
              src={auction.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80'} 
              alt={auction.title}
              style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
            />
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={20} style={{ color: '#6366f1' }} />
              <span>Deskripsi Barang</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {auction.description || 'Tidak ada deskripsi rinci untuk barang ini.'}
            </p>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Waktu Dimulai:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(auction.start_time)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Waktu Berakhir:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(auction.end_time)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Panel Bidding & Riwayat Live */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            {/* Header info barang */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {isActive && (
                <span className="badge badge-active">
                  <span className="live-dot" />
                  <span>Sedang Berlangsung</span>
                </span>
              )}
              {isUpcoming && <span className="badge badge-upcoming">Akan Datang</span>}
              {isEnded && <span className="badge badge-ended">Selesai</span>}
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '1.25rem', lineHeight: 1.3 }}>
              {auction.title}
            </h1>

            {/* Timer Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} />
                <span>{isActive ? 'Sisa Waktu Penawaran:' : isUpcoming ? 'Waktu Menuju Mulai:' : 'Status Waktu:'}</span>
              </div>
              <CountdownTimer 
                targetDate={isActive ? auction.end_time : auction.start_time} 
                onEnd={fetchDetail}
                status={auction.status}
              />
            </div>

            {/* Price Info Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Harga Awal
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {formatRupiah(auction.starting_price)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {isActive ? 'Tawaran Tertinggi Saat Ini' : 'Harga Akhir'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  {formatRupiah(currentPrice)}
                </div>
              </div>
            </div>

            {/* Info Penawar Tertinggi Saat Ini */}
            {topBid && isActive && (
              <div style={{
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: isCurrentTopBidder ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isCurrentTopBidder ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={15} style={{ color: isCurrentTopBidder ? '#34d399' : 'var(--text-muted)' }} />
                <span>
                  Penawar tertinggi:{' '}
                  <strong>
                    {isCurrentTopBidder ? 'Anda (Memimpin!) 🚀' : (topBid?.bidder?.full_name || topBid?.user_name || 'Penawar')}
                  </strong>
                </span>
              </div>
            )}

            {/* Form Bidding (Hanya Tampil Jika Lelang Aktif) */}
            {isActive ? (
              <form onSubmit={handlePlaceBid}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Nominal Tawaran Anda (IDR)</label>
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                      Min: {formatRupiah(minRequiredBid)}
                    </span>
                  </div>

                  <input 
                    type="number"
                    className="form-control"
                    placeholder={`Contoh: ${minRequiredBid}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minRequiredBid}
                    step={minIncrement}
                    required
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Tambah Cepat (+Rp):
                  </span>
                  <div className="quick-bid-group">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickAdd(50000)}
                    >
                      +50 Ribu
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickAdd(100000)}
                    >
                      +100 Ribu
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickAdd(500000)}
                    >
                      +500 Ribu
                    </button>
                  </div>
                </div>

                {user ? (
                  <button 
                    type="submit" 
                    className="btn btn-gold btn-lg" 
                    style={{ width: '100%' }}
                    disabled={submitting}
                  >
                    <TrendingUp size={18} />
                    <span>{submitting ? 'Memproses Penawaran...' : 'Kirim Tawaran Sekarang'}</span>
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <span>Login untuk Melakukan Penawaran</span>
                  </Link>
                )}

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                  * Tawaran bersifat mengikat. Sistem otomatis menolak tawaran di bawah atau sama dengan harga tertinggi.
                </p>
              </form>
            ) : isUpcoming ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <Clock size={24} style={{ color: '#38bdf8', margin: '0 auto 0.5rem' }} />
                <h4 style={{ color: '#38bdf8', marginBottom: '0.25rem' }}>Lelang Belum Dimulai</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Penawaran akan dibuka saat countdown timer mencapai waktu mulai lelang.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(148, 163, 184, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <Trophy size={24} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
                <h4 style={{ color: '#cbd5e1', marginBottom: '0.25rem' }}>Lelang Telah Berakhir</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Barang lelang ini sudah resmi ditutup untuk penawaran baru.
                </p>
              </div>
            )}
          </div>

          {/* Tabel Riwayat Live Bidding */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: '#6366f1' }} />
                <span>Riwayat Penawaran ({auction.bids?.length || 0})</span>
              </h3>
              {isActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#10b981' }}>
                  <span className="live-dot" />
                  <span>Live Update</span>
                </div>
              )}
            </div>

            {auction.bids && auction.bids.length > 0 ? (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Penawar</th>
                      <th>Nominal</th>
                      <th>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auction.bids.map((b, idx) => {
                      const isMe = user && b.user_id === user.id;
                      const bidderName = b.bidder?.full_name || b.user_name || (b.bidder?.email ? b.bidder.email.split('@')[0] : 'Penawar');
                      return (
                        <tr key={b.id || idx} style={{ background: idx === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {idx === 0 && <Trophy size={14} style={{ color: '#f59e0b' }} />}
                              <span style={{ fontWeight: idx === 0 ? 700 : 500 }}>
                                {bidderName} {isMe && <span style={{ color: '#38bdf8' }}>(Anda)</span>}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: idx === 0 ? '#fbbf24' : 'var(--text-primary)' }}>
                            {formatRupiah(b.bid_amount)}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {formatDateTime(b.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Belum ada penawaran untuk barang ini. Jadilah penawar pertama!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
