import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionService } from '../lib/auctionService';
import { formatRupiah, formatDateTime } from '../lib/supabase';
import { Trophy, ArrowLeft, ExternalLink, Award, CheckCircle } from 'lucide-react';

export default function Winners() {
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const data = await auctionService.getAuctions({ status: 'ended' });
        setEndedAuctions(data);
      } catch (err) {
        console.error('Failed to load winners', err);
      } finally {
        setLoading(false);
      }
    };
    loadWinners();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1rem'
        }}>
          <Trophy size={16} />
          <span>Hasil & Arsip Lelang</span>
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Daftar Pemenang Lelang Resmi
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Transparansi penuh seluruh barang lelang yang telah berhasil ditutup beserta penawar pemenangnya.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="live-dot" style={{ margin: '0 auto 1rem', width: '14px', height: '14px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Memuat data pemenang...</p>
        </div>
      ) : endedAuctions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Award size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Belum Ada Lelang yang Berakhir</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Seluruh barang lelang saat ini masih aktif atau segera hadir.
          </p>
          <Link to="/" className="btn btn-primary btn-sm">
            Lihat Lelang Aktif
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {endedAuctions.map((item) => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '200px' }}>
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'} 
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <span className="badge badge-ended">Telah Selesai</span>
                </div>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Ditutup pada: {formatDateTime(item.end_time)}
                </div>

                {/* Winner Card Block */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginTop: 'auto',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Trophy size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24' }}>
                      Pemenang Lelang
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {item.winner?.full_name || item.winner?.email || (item.winner_id ? 'Pemenang Terverifikasi' : 'Tanpa Penawaran')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                    {formatRupiah(item.current_price)}
                  </div>
                </div>

                <Link to={`/auction/${item.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <span>Lihat Riwayat Penawaran</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
