-- ==============================================================================
-- SISTEM LELANG ONLINE - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Jalankan skrip ini pada Supabase Dashboard -> SQL Editor
-- Skrip ini akan membuat tabel, fungsi, RLS policies, dan contoh data awal.
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL PROFILES (Terkoneksi dengan auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 3. TABEL AUCTIONS (Barang Lelang)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starting_price NUMERIC NOT NULL CHECK (starting_price >= 0),
  current_price NUMERIC NOT NULL CHECK (current_price >= starting_price),
  min_increment NUMERIC NOT NULL DEFAULT 50000 CHECK (min_increment > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON public.auctions(end_time);

-- ==============================================================================
-- 4. TABEL BIDS (Riwayat Penawaran)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bid_amount NUMERIC NOT NULL CHECK (bid_amount > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON public.bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON public.bids(bid_amount DESC);

-- ==============================================================================
-- 5. TRIGGER: AUTO INSERT PROFILE DARI AUTH.USERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. FUNGSI CEK ROLE ADMIN (HELPER UNTUK RLS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 7. FUNGSI TRANSAKSI BIDDING AMAN & ATOMIK (MENCEGAH RACE CONDITION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.place_bid(
  p_auction_id UUID,
  p_bid_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_auction RECORD;
  v_user_id UUID;
  v_min_allowed NUMERIC;
  v_bid_id UUID;
  v_user_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Anda harus login untuk mengajukan penawaran lelang.';
  END IF;

  -- Kunci baris lelang untuk menjamin transaksi aman
  SELECT * INTO v_auction
  FROM public.auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barang lelang tidak ditemukan.';
  END IF;

  -- Periksa status dan waktu
  IF now() < v_auction.start_time THEN
    RAISE EXCEPTION 'Lelang ini belum dimulai.';
  END IF;

  IF now() >= v_auction.end_time OR v_auction.status = 'ended' THEN
    UPDATE public.auctions SET status = 'ended' WHERE id = p_auction_id;
    RAISE EXCEPTION 'Lelang ini telah berakhir.';
  END IF;

  -- Validasi nominal bid: harus lebih tinggi dari harga sekarang + kenaikan minimal
  v_min_allowed := v_auction.current_price + v_auction.min_increment;
  IF p_bid_amount < v_min_allowed THEN
    RAISE EXCEPTION 'Tawaran tidak sah. Minimal tawaran berikutnya adalah Rp % (kenaikan minimal Rp %)',
      to_char(v_min_allowed, 'FM999,999,999,999'),
      to_char(v_auction.min_increment, 'FM999,999,999,999');
  END IF;

  -- Simpan riwayat bid
  INSERT INTO public.bids (auction_id, user_id, bid_amount)
  VALUES (p_auction_id, v_user_id, p_bid_amount)
  RETURNING id INTO v_bid_id;

  -- Update harga tertinggi dan calon pemenang
  UPDATE public.auctions
  SET current_price = p_bid_amount,
      winner_id = v_user_id,
      status = 'active'
  WHERE id = p_auction_id;

  RETURN json_build_object(
    'success', true,
    'bid_id', v_bid_id,
    'auction_id', p_auction_id,
    'current_price', p_bid_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. FUNGSI REKAP / SELESAIKAN LELANG YANG SUDAH JATUH TEMPO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.finalize_ended_auctions()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
  v_top_bid RECORD;
BEGIN
  -- Cari lelang yang sudah lewat end_time tapi status belum 'ended'
  FOR r IN 
    SELECT id, starting_price FROM public.auctions 
    WHERE end_time <= now() AND status != 'ended'
    FOR UPDATE
  LOOP
    -- Cari bid tertinggi
    SELECT user_id, bid_amount INTO v_top_bid
    FROM public.bids
    WHERE auction_id = r.id
    ORDER BY bid_amount DESC, created_at ASC
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.auctions
      SET status = 'ended',
          winner_id = v_top_bid.user_id,
          payment_status = 'pending'
      WHERE id = r.id;
    ELSE
      -- Tidak ada penawaran
      UPDATE public.auctions
      SET status = 'ended',
          winner_id = NULL
      WHERE id = r.id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  -- Update lelang yang sudah waktunya mulai tapi masih 'upcoming'
  UPDATE public.auctions
  SET status = 'active'
  WHERE start_time <= now() AND end_time > now() AND status = 'upcoming';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
-- Siapapun dapat membaca profil (untuk menampilkan nama penawar lelang)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Pengguna hanya dapat memperbarui profil miliknya sendiri, atau Admin
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- POLICIES: AUCTIONS
-- Siapapun dapat melihat daftar lelang
DROP POLICY IF EXISTS "Auctions are viewable by everyone" ON public.auctions;
CREATE POLICY "Auctions are viewable by everyone"
  ON public.auctions FOR SELECT
  USING (true);

-- Hanya admin yang dapat menambah lelang baru
DROP POLICY IF EXISTS "Admin can insert auctions" ON public.auctions;
CREATE POLICY "Admin can insert auctions"
  ON public.auctions FOR INSERT
  WITH CHECK (public.is_admin());

-- Hanya admin yang dapat mengedit lelang secara langsung
-- (Catatan: function place_bid & finalize_ended_auctions memakai SECURITY DEFINER)
DROP POLICY IF EXISTS "Admin can update auctions" ON public.auctions;
CREATE POLICY "Admin can update auctions"
  ON public.auctions FOR UPDATE
  USING (public.is_admin());

-- Hanya admin yang dapat menghapus lelang
DROP POLICY IF EXISTS "Admin can delete auctions" ON public.auctions;
CREATE POLICY "Admin can delete auctions"
  ON public.auctions FOR DELETE
  USING (public.is_admin());

-- POLICIES: BIDS
-- Siapapun dapat melihat riwayat bid lelang
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
CREATE POLICY "Bids are viewable by everyone"
  ON public.bids FOR SELECT
  USING (true);

-- User terdaftar dapat membuat bid (baik via insert langsung atau fungsi place_bid)
DROP POLICY IF EXISTS "Authenticated users can insert bids" ON public.bids;
CREATE POLICY "Authenticated users can insert bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. REALTIME CONFIGURATION
-- ==============================================================================
-- Mengaktifkan pengiriman event realtime untuk bids dan auctions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- ==============================================================================
-- 11. DATA AWAL / SEED DUMMY UNTUK PENGUJIAN
-- ==============================================================================
INSERT INTO public.auctions (
  title, 
  description, 
  image_url, 
  starting_price, 
  current_price, 
  min_increment, 
  start_time, 
  end_time, 
  status
)
VALUES 
(
  'iPhone 15 Pro Max 256GB - Titanium Blue (BNIB)',
  'Kondisi Baru (Brand New In Box), garansi resmi iBox Indonesia 1 tahun. Kapasitas 256GB dengan finishing Titanium Blue yang elegan.',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
  12000000,
  12000000,
  100000,
  now() - interval '1 hour',
  now() + interval '2 days',
  'active'
),
(
  'Sony PlayStation 5 Digital Edition + DualSense Controller',
  'PlayStation 5 edisi digital, termasuk 2 buah controller DualSense wireless dan kabel HDMI high-speed. Kondisi 98% mulus tanpa lecet.',
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
  5000000,
  5500000,
  50000,
  now() - interval '2 hours',
  now() + interval '1 day',
  'active'
),
(
  'Jam Tangan Mewah Seiko Prospex Diver Automatic',
  'Edisi kolektor Seiko Prospex Diver 200M automatic movement. Bezel ceramic anti gores, water resistant 200 meter, full set kotak dan kartu garansi.',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
  3500000,
  3500000,
  50000,
  now() + interval '5 hours',
  now() + interval '3 days',
  'upcoming'
),
(
  'MacBook Pro 14 M3 Max 36GB / 1TB SSD Space Black',
  'Lelang unit Apple MacBook Pro 14 inci dengan chipset monster M3 Max, RAM 36GB, SSD 1TB. Battery health 100%, mulus like new.',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
  25000000,
  27500000,
  250000,
  now() - interval '3 days',
  now() - interval '1 hour',
  'ended'
)
ON CONFLICT DO NOTHING;
