import { supabase, isSupabaseConfigured, INITIAL_DEMO_AUCTIONS, INITIAL_DEMO_BIDS } from './supabase';

// Local storage key for demo persistence
const DEMO_AUCTIONS_KEY = 'lelang_demo_auctions';
const DEMO_BIDS_KEY = 'lelang_demo_bids';
const DEMO_USERS_KEY = 'lelang_demo_users';

function getDemoAuctions() {
  const data = localStorage.getItem(DEMO_AUCTIONS_KEY);
  if (!data) {
    localStorage.setItem(DEMO_AUCTIONS_KEY, JSON.stringify(INITIAL_DEMO_AUCTIONS));
    return [...INITIAL_DEMO_AUCTIONS];
  }
  return JSON.parse(data);
}

function saveDemoAuctions(auctions) {
  localStorage.setItem(DEMO_AUCTIONS_KEY, JSON.stringify(auctions));
}

function getDemoBids() {
  const data = localStorage.getItem(DEMO_BIDS_KEY);
  if (!data) {
    localStorage.setItem(DEMO_BIDS_KEY, JSON.stringify(INITIAL_DEMO_BIDS));
    return [...INITIAL_DEMO_BIDS];
  }
  return JSON.parse(data);
}

function saveDemoBids(bids) {
  localStorage.setItem(DEMO_BIDS_KEY, JSON.stringify(bids));
}

function getDemoUsers() {
  const data = localStorage.getItem(DEMO_USERS_KEY);
  if (!data) {
    const initialUsers = [
      { id: 'user-demo-1', email: 'ahmad@example.com', full_name: 'Ahmad Fadillah', role: 'user', created_at: new Date().toISOString() },
      { id: 'user-demo-2', email: 'budi@example.com', full_name: 'Budi Santoso', role: 'user', created_at: new Date().toISOString() },
      { id: 'admin-demo-1', email: 'admin@lelanghub.com', full_name: 'Administrator Lelang', role: 'admin', created_at: new Date().toISOString() }
    ];
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }
  return JSON.parse(data);
}

export const auctionService = {
  /**
   * Mengambil daftar lelang dengan filter status & search
   */
  async getAuctions({ status = 'all', search = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('auctions')
        .select('*, winner:profiles!winner_id(id, full_name, email)')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      // Demo Mode
      let list = getDemoAuctions();
      
      // Auto-update status based on current time
      const now = new Date();
      list = list.map(item => {
        let currentStatus = item.status;
        if (new Date(item.end_time) <= now) {
          currentStatus = 'ended';
        } else if (new Date(item.start_time) <= now) {
          currentStatus = 'active';
        } else {
          currentStatus = 'upcoming';
        }
        return { ...item, status: currentStatus };
      });
      saveDemoAuctions(list);

      if (status !== 'all') {
        list = list.filter(item => item.status === status);
      }
      if (search) {
        list = list.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
      }
      return list;
    }
  },

  /**
   * Mengambil detail satu lelang beserta daftar penawarannya
   */
  async getAuctionById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('*, winner:profiles!winner_id(id, full_name, email)')
        .eq('id', id)
        .single();

      if (auctionError) throw auctionError;

      // Fetch bids
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('*, bidder:profiles(id, full_name, email)')
        .eq('auction_id', id)
        .order('bid_amount', { ascending: false });

      if (bidsError) console.warn('Error fetching bids:', bidsError);

      return {
        ...auction,
        bids: bids || []
      };
    } else {
      // Demo Mode
      const auctions = getDemoAuctions();
      const auction = auctions.find(a => String(a.id) === String(id));
      if (!auction) throw new Error('Barang lelang tidak ditemukan');

      const allBids = getDemoBids();
      const bids = allBids
        .filter(b => String(b.auction_id) === String(id))
        .sort((a, b) => b.bid_amount - a.bid_amount);

      return {
        ...auction,
        bids
      };
    }
  },

  /**
   * Mengajukan tawaran baru (Bidding)
   */
  async placeBid({ auctionId, bidAmount, user, profile }) {
    if (!user) throw new Error('Silakan login terlebih dahulu untuk mengajukan tawaran.');

    const amount = Number(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal tawaran tidak valid.');
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Coba panggil Database Function RPC 'place_bid' (penanganan transaksi atomik)
      try {
        const { data, error } = await supabase.rpc('place_bid', {
          p_auction_id: auctionId,
          p_bid_amount: amount
        });

        if (error) {
          // Jika error datang dari exception di Postgres
          throw new Error(error.message);
        }
        return data;
      } catch (rpcErr) {
        // Fallback jika fungsi SQL rpc belum di-deploy di Supabase
        if (rpcErr.message.includes('function') && rpcErr.message.includes('does not exist')) {
          // Fallback manual insert
          const { data: curAuction } = await supabase
            .from('auctions')
            .select('*')
            .eq('id', auctionId)
            .single();

          if (!curAuction) throw new Error('Lelang tidak ditemukan');
          const minAllowed = Number(curAuction.current_price) + Number(curAuction.min_increment);
          if (amount < minAllowed) {
            throw new Error(`Tawaran minimal adalah Rp ${minAllowed.toLocaleString('id-ID')}`);
          }

          // Insert bid
          const { data: bidData, error: bidInsertErr } = await supabase
            .from('bids')
            .insert({
              auction_id: auctionId,
              user_id: user.id,
              bid_amount: amount
            })
            .select()
            .single();

          if (bidInsertErr) throw bidInsertErr;

          // Update auction
          await supabase
            .from('auctions')
            .update({
              current_price: amount,
              winner_id: user.id,
              status: 'active'
            })
            .eq('id', auctionId);

          return bidData;
        }
        throw rpcErr;
      }
    } else {
      // Demo Mode Bidding
      const auctions = getDemoAuctions();
      const index = auctions.findIndex(a => String(a.id) === String(auctionId));
      if (index === -1) throw new Error('Lelang tidak ditemukan');

      const auction = auctions[index];
      const now = new Date();
      if (new Date(auction.end_time) <= now || auction.status === 'ended') {
        throw new Error('Lelang ini telah berakhir.');
      }
      if (new Date(auction.start_time) > now) {
        throw new Error('Lelang ini belum dimulai.');
      }

      const minAllowed = Number(auction.current_price || auction.starting_price) + Number(auction.min_increment);
      if (amount < minAllowed) {
        throw new Error(`Tawaran harus lebih tinggi dari Rp ${Number(auction.current_price).toLocaleString('id-ID')} dan minimal Rp ${minAllowed.toLocaleString('id-ID')}`);
      }

      // Add to bids
      const allBids = getDemoBids();
      const newBid = {
        id: 'bid-' + Date.now(),
        auction_id: auctionId,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'Pengguna',
        bid_amount: amount,
        created_at: new Date().toISOString()
      };
      allBids.unshift(newBid);
      saveDemoBids(allBids);

      // Update auction
      auctions[index].current_price = amount;
      auctions[index].winner_id = user.id;
      auctions[index].status = 'active';
      saveDemoAuctions(auctions);

      return newBid;
    }
  },

  /**
   * Membuat lelang baru (Admin)
   */
  async createAuction(auctionData, user) {
    const payload = {
      title: auctionData.title,
      description: auctionData.description,
      image_url: auctionData.image_url,
      starting_price: Number(auctionData.starting_price),
      current_price: Number(auctionData.starting_price),
      min_increment: Number(auctionData.min_increment || 50000),
      start_time: new Date(auctionData.start_time).toISOString(),
      end_time: new Date(auctionData.end_time).toISOString(),
      status: new Date(auctionData.start_time) > new Date() ? 'upcoming' : 'active',
      created_by: user?.id,
      payment_status: 'pending'
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('auctions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const auctions = getDemoAuctions();
      const newAuction = {
        id: 'demo-' + Date.now(),
        ...payload,
        created_at: new Date().toISOString()
      };
      auctions.unshift(newAuction);
      saveDemoAuctions(auctions);
      return newAuction;
    }
  },

  /**
   * Mengupdate data lelang (Admin)
   */
  async updateAuction(id, auctionData) {
    const payload = {
      title: auctionData.title,
      description: auctionData.description,
      image_url: auctionData.image_url,
      starting_price: Number(auctionData.starting_price),
      min_increment: Number(auctionData.min_increment),
      start_time: new Date(auctionData.start_time).toISOString(),
      end_time: new Date(auctionData.end_time).toISOString(),
      status: auctionData.status
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('auctions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const auctions = getDemoAuctions();
      const index = auctions.findIndex(a => String(a.id) === String(id));
      if (index === -1) throw new Error('Lelang tidak ditemukan');

      auctions[index] = { ...auctions[index], ...payload };
      saveDemoAuctions(auctions);
      return auctions[index];
    }
  },

  /**
   * Menghapus lelang (Admin)
   */
  async deleteAuction(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } else {
      let auctions = getDemoAuctions();
      auctions = auctions.filter(a => String(a.id) !== String(id));
      saveDemoAuctions(auctions);
      return true;
    }
  },

  /**
   * Mengubah status pembayaran pemenang lelang (pending, paid, cancelled)
   */
  async updatePaymentStatus(auctionId, paymentStatus) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('auctions')
        .update({ payment_status: paymentStatus })
        .eq('id', auctionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const auctions = getDemoAuctions();
      const index = auctions.findIndex(a => String(a.id) === String(auctionId));
      if (index !== -1) {
        auctions[index].payment_status = paymentStatus;
        saveDemoAuctions(auctions);
        return auctions[index];
      }
      throw new Error('Lelang tidak ditemukan');
    }
  },

  /**
   * Menutup lelang secara manual dan menentukan pemenang berdasarkan bid tertinggi
   */
  async endAuctionManually(auctionId) {
    if (isSupabaseConfigured && supabase) {
      // Find top bid
      const { data: topBids } = await supabase
        .from('bids')
        .select('user_id')
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false })
        .limit(1);

      const topBidderId = topBids && topBids.length > 0 ? topBids[0].user_id : null;

      const { data, error } = await supabase
        .from('auctions')
        .update({
          status: 'ended',
          winner_id: topBidderId,
          end_time: new Date().toISOString()
        })
        .eq('id', auctionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const auctions = getDemoAuctions();
      const index = auctions.findIndex(a => String(a.id) === String(auctionId));
      if (index === -1) throw new Error('Lelang tidak ditemukan');

      const bids = getDemoBids()
        .filter(b => String(b.auction_id) === String(auctionId))
        .sort((a, b) => b.bid_amount - a.bid_amount);

      const winnerId = bids.length > 0 ? bids[0].user_id : null;
      auctions[index].status = 'ended';
      auctions[index].winner_id = winnerId;
      auctions[index].end_time = new Date().toISOString();
      saveDemoAuctions(auctions);
      return auctions[index];
    }
  },

  /**
   * Mengambil riwayat bid user sendiri dan lelang yang dimenangkan
   */
  async getUserActivity(userId) {
    if (isSupabaseConfigured && supabase) {
      // 1. My bids
      const { data: bids } = await supabase
        .from('bids')
        .select('*, auction:auctions(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // 2. Won auctions
      const { data: wonAuctions } = await supabase
        .from('auctions')
        .select('*')
        .eq('winner_id', userId)
        .eq('status', 'ended')
        .order('end_time', { ascending: false });

      return {
        myBids: bids || [],
        wonAuctions: wonAuctions || []
      };
    } else {
      const allBids = getDemoBids();
      const allAuctions = getDemoAuctions();

      const userBids = allBids
        .filter(b => b.user_id === userId)
        .map(b => ({
          ...b,
          auction: allAuctions.find(a => String(a.id) === String(b.auction_id))
        }))
        .filter(b => b.auction);

      const wonAuctions = allAuctions.filter(
        a => a.winner_id === userId && a.status === 'ended'
      );

      return {
        myBids: userBids,
        wonAuctions
      };
    }
  },

  /**
   * Mengambil semua riwayat bid sistem (untuk Admin)
   */
  async getAllBids() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bids')
        .select('*, auction:auctions(id, title), bidder:profiles(id, full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } else {
      const bids = getDemoBids();
      const auctions = getDemoAuctions();
      const users = getDemoUsers();

      return bids.map(b => ({
        ...b,
        auction: auctions.find(a => String(a.id) === String(b.auction_id)),
        bidder: users.find(u => u.id === b.user_id) || { full_name: b.user_name || 'Pengguna' }
      }));
    }
  },

  /**
   * Mengambil daftar semua user (Admin)
   */
  async getUsers() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } else {
      return getDemoUsers();
    }
  },

  /**
   * Mengubah role user (user <-> admin)
   */
  async updateUserRole(userId, newRole) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      let users = getDemoUsers();
      users = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
      return users.find(u => u.id === userId);
    }
  },

  /**
   * Berlangganan Realtime updates untuk auction & bids
   */
  subscribeToAuction(auctionId, onUpdate) {
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`auction-${auctionId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bids', filter: `auction_id=eq.${auctionId}` },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
          () => onUpdate()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return () => {};
  }
};
