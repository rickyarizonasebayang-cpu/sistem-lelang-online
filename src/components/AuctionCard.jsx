import React from 'react';
import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { formatRupiah } from '../lib/supabase';
import { ArrowRight, Tag, ShieldCheck } from 'lucide-react';

export default function AuctionCard({ auction }) {
  const {
    id,
    title,
    description,
    image_url,
    starting_price,
    current_price,
    min_increment,
    start_time,
    end_time,
    status
  } = auction;

  // Determine current display status
  const now = new Date();
  const isEnded = status === 'ended' || new Date(end_time) <= now;
  const isUpcoming = status === 'upcoming' || new Date(start_time) > now;
  const isActive = !isEnded && !isUpcoming;

  const displayPrice = current_price || starting_price;

  return (
    <article className="auction-card">
      {/* Card Image */}
      <div className="auction-card-img-wrap">
        <img 
          src={image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'} 
          alt={title}
          className="auction-card-img"
          loading="lazy"
        />

        {/* Status Badge */}
        <div className="auction-card-badge">
          {isActive && (
            <span className="badge badge-active">
              <span className="live-dot" />
              <span>Sedang Berlangsung</span>
            </span>
          )}
          {isUpcoming && (
            <span className="badge badge-upcoming">
              <span>Akan Datang</span>
            </span>
          )}
          {isEnded && (
            <span className="badge badge-ended">
              <span>Selesai</span>
            </span>
          )}
        </div>

        {/* Countdown Overlay */}
        <div className="auction-card-timer">
          {isActive ? (
            <CountdownTimer targetDate={end_time} compact status="active" />
          ) : isUpcoming ? (
            <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
              Mulai: {new Date(start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>Lelang Berakhir</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="auction-card-body">
        <h3 className="auction-card-title" title={title}>
          {title}
        </h3>

        <p className="auction-card-desc">
          {description || 'Tidak ada deskripsi tambahan untuk barang ini.'}
        </p>

        {/* Pricing Box */}
        <div className="auction-price-box">
          <div>
            <div className="auction-price-label">
              {isActive ? 'Tawaran Tertinggi' : isEnded ? 'Harga Pemenang' : 'Harga Awal'}
            </div>
            <div className="auction-price-value">
              {formatRupiah(displayPrice)}
            </div>
          </div>

          <div className="auction-min-inc">
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Min. Kenaikan
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              +{formatRupiah(min_increment)}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Link 
          to={`/auction/${id}`} 
          className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <span>{isActive ? 'Pasang Tawaran' : 'Lihat Detail'}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
