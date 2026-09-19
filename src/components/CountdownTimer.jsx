import React, { useState, useEffect } from 'react';
import { calculateTimeLeft } from '../lib/supabase';
import { Clock, AlertCircle } from 'lucide-react';

export default function CountdownTimer({ targetDate, onEnd, compact = false, status = 'active' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const calculated = calculateTimeLeft(targetDate);
      setTimeLeft(calculated);

      if (calculated.isEnded) {
        clearInterval(timer);
        if (onEnd) onEnd();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onEnd]);

  if (status === 'ended' || timeLeft.isEnded) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <AlertCircle size={15} />
        <span>Waktu Habis (Selesai)</span>
      </div>
    );
  }

  // Format 2 digits
  const pad = (num) => String(num).padStart(2, '0');

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f8fafc' }}>
        <Clock size={14} style={{ color: '#f59e0b' }} />
        <span>
          {timeLeft.days > 0 ? `${timeLeft.days}h ` : ''}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // Expanded layout for Detail Page
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.65rem',
        minWidth: '50px'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{timeLeft.days}</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hari</span>
      </div>

      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.65rem',
        minWidth: '50px'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{pad(timeLeft.hours)}</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Jam</span>
      </div>

      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.65rem',
        minWidth: '50px'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{pad(timeLeft.minutes)}</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mnt</span>
      </div>

      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.4rem 0.65rem',
        minWidth: '50px'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{pad(timeLeft.seconds)}</span>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dtk</span>
      </div>
    </div>
  );
}
