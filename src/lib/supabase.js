import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Fallback dummy client if credentials aren't set yet
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Format angka ke mata uang Rupiah (IDR)
 * @param {number|string} amount 
 * @returns {string} Contoh: "Rp 15.000.000"
 */
export function formatRupiah(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format waktu ISO ke format tanggal & jam Indonesia
 * @param {string|Date} isoString 
 * @returns {string} Contoh: "20 Sep 2026, 14:30 WIB"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' WIB';
}

/**
 * Hitung sisa waktu mundur (countdown)
 * @param {string|Date} targetDate 
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isEnded: boolean }}
 */
export function calculateTimeLeft(targetDate) {
  const difference = +new Date(targetDate) - +new Date();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true, totalMs: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isEnded: false,
    totalMs: difference
  };
}

// ==============================================================================
// INITIAL SEED DATA FOR DEMO MODE (JIKA SUPABASE BELUM DIHUBUNGKAN)
// ==============================================================================
export const INITIAL_DEMO_AUCTIONS = [
  {
    id: 'demo-1',
    title: 'iPhone 15 Pro Max 256GB - Titanium Blue (BNIB)',
    description: 'Kondisi Baru (Brand New In Box), garansi resmi iBox Indonesia 1 tahun. Kapasitas 256GB dengan finishing Titanium Blue yang elegan.',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
    starting_price: 12000000,
    current_price: 14500000,
    min_increment: 100000,
    start_time: new Date(Date.now() - 3600000 * 4).toISOString(),
    end_time: new Date(Date.now() + 3600000 * 48).toISOString(),
    status: 'active',
    winner_id: null,
    payment_status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-2',
    title: 'Sony PlayStation 5 Digital Edition + DualSense Controller',
    description: 'PlayStation 5 edisi digital, termasuk 2 buah controller DualSense wireless dan kabel HDMI high-speed. Kondisi 98% mulus tanpa lecet.',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
    starting_price: 5000000,
    current_price: 6200000,
    min_increment: 50000,
    start_time: new Date(Date.now() - 3600000 * 12).toISOString(),
    end_time: new Date(Date.now() + 3600000 * 18).toISOString(),
    status: 'active',
    winner_id: null,
    payment_status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-3',
    title: 'Jam Tangan Mewah Seiko Prospex Diver Automatic',
    description: 'Edisi kolektor Seiko Prospex Diver 200M automatic movement. Bezel ceramic anti gores, water resistant 200 meter, full set kotak dan kartu garansi.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    starting_price: 3500000,
    current_price: 3500000,
    min_increment: 50000,
    start_time: new Date(Date.now() + 3600000 * 8).toISOString(),
    end_time: new Date(Date.now() + 3600000 * 72).toISOString(),
    status: 'upcoming',
    winner_id: null,
    payment_status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-4',
    title: 'MacBook Pro 14 M3 Max 36GB / 1TB SSD Space Black',
    description: 'Lelang unit Apple MacBook Pro 14 inci dengan chipset monster M3 Max, RAM 36GB, SSD 1TB. Battery health 100%, mulus like new.',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    starting_price: 25000000,
    current_price: 31000000,
    min_increment: 250000,
    start_time: new Date(Date.now() - 3600000 * 72).toISOString(),
    end_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'ended',
    winner_id: 'user-demo-1',
    payment_status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 90).toISOString()
  }
];

export const INITIAL_DEMO_BIDS = [
  {
    id: 'bid-1',
    auction_id: 'demo-1',
    user_id: 'user-demo-2',
    user_name: 'Budi Santoso',
    bid_amount: 13000000,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'bid-2',
    auction_id: 'demo-1',
    user_id: 'user-demo-1',
    user_name: 'Ahmad Fadillah',
    bid_amount: 14500000,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'bid-3',
    auction_id: 'demo-2',
    user_id: 'user-demo-1',
    user_name: 'Ahmad Fadillah',
    bid_amount: 5500000,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'bid-4',
    auction_id: 'demo-2',
    user_id: 'user-demo-2',
    user_name: 'Budi Santoso',
    bid_amount: 6200000,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'bid-5',
    auction_id: 'demo-4',
    user_id: 'user-demo-1',
    user_name: 'Ahmad Fadillah',
    bid_amount: 31000000,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];
