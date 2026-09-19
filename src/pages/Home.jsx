import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionService } from '../lib/auctionService';
import { isSupabaseConfigured } from '../lib/supabase';
import AuctionCard from '../components/AuctionCard';
import { Search, Gavel, Flame, Clock, Trophy, Sparkles, Filter, Database, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const data = await auctionService.getAuctions({
        status: statusFilter,
        search: searchQuery
      });
      setAuctions(data);
    } catch (err) {
      console.error('Failed to load auctions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, [statusFilter, searchQuery]);

  return (
    <div>
      {/* Notice Banner jika Supabase belum dihubungkan */}
      {!isSupabaseConfigured && (
        <div className="banner-notice">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Database size={16} style={{ color: '#fbbf24' }} />
            <span>
              <strong>Mode Pratinjau Lokal (Demo Aktif):</strong> Anda dapat langsung mencoba seluruh fitur lelang & admin. Hubungkan kredensial Supabase Anda di file <code>.env</code> untuk mengaktifkan database live PostgreSQL.
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '4.5rem 0 3.5rem',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 70%)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={16} />
            <span>Sistem Bidding Daring Realtime & Terpercaya</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Temukan Barang Impian dengan <span className="gold-gradient-text">Harga Terbaik</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Ikuti lelang produk elektronik original, gadget flagship, dan koleksi berharga. Sistem penawaran adil, transparan, dan terproteksi langsung hingga palu diketuk.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#katalog" className="btn btn-primary btn-lg">
              <Gavel size={18} />
              <span>Jelajah Lelang Sekarang</span>
            </a>
            <Link to="/winners" className="btn btn-secondary btn-lg">
              <Trophy size={18} />
              <span>Lihat Hasil & Pemenang</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            marginTop: '3.5rem',
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Transparansi Penawaran</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>Realtime</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sinkronisasi Live Bid</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>Aman</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Row-Level Security (RLS)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Katalog Section */}
      <section id="katalog" className="container" style={{ paddingTop: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Daftar Barang Lelang
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Pilih barang, periksa status lelang, dan tentukan tawaran terbaik Anda.
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari barang lelang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="tabs-header">
          <button 
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Semua Lelang
          </button>
          <button 
            className={`tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span className="live-dot" />
            Sedang Berlangsung
          </button>
          <button 
            className={`tab-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setStatusFilter('upcoming')}
          >
            <Clock size={16} />
            Akan Datang
          </button>
          <button 
            className={`tab-btn ${statusFilter === 'ended' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ended')}
          >
            <Trophy size={16} />
            Telah Selesai
          </button>
        </div>

        {/* Auction Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="live-dot" style={{ margin: '0 auto 1rem', width: '14px', height: '14px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Memuat barang lelang...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Gavel size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Tidak Ada Lelang yang Ditemukan</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
              Tidak ada barang lelang yang cocok dengan filter atau kata kunci pencarian Anda saat ini.
            </p>
            <button 
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="auction-grid">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
