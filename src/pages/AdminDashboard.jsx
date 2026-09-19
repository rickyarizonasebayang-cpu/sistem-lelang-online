import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../lib/auctionService';
import { formatRupiah, formatDateTime } from '../lib/supabase';
import Toast from '../components/Toast';
import { 
  ShieldCheck, PlusCircle, Edit3, Trash2, Users, Gavel, 
  History, Trophy, CheckCircle, XCircle, AlertCircle, X, 
  DollarSign, Clock, Check
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('auctions'); // 'auctions' | 'bids' | 'winners' | 'users'
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    starting_price: '',
    min_increment: '50000',
    start_time: '',
    end_time: '',
    status: 'active'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [auctionsData, bidsData, usersData] = await Promise.all([
        auctionService.getAuctions({ status: 'all' }),
        auctionService.getAllBids(),
        auctionService.getUsers()
      ]);
      setAuctions(auctionsData);
      setBids(bidsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setToast({ type: 'error', message: 'Gagal memuat data dashboard admin' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    const now = new Date();
    const tomorrow = new Date(Date.now() + 86400000 * 2);
    
    // Format to datetime-local (YYYY-MM-DDTHH:mm)
    const formatForInput = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingAuction(null);
    setFormData({
      title: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
      starting_price: '1000000',
      min_increment: '50000',
      start_time: formatForInput(now),
      end_time: formatForInput(tomorrow),
      status: 'active'
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item) => {
    const formatForInput = (d) => {
      const date = new Date(d);
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setEditingAuction(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      image_url: item.image_url || '',
      starting_price: String(item.starting_price),
      min_increment: String(item.min_increment),
      start_time: formatForInput(item.start_time),
      end_time: formatForInput(item.end_time),
      status: item.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAuction) {
        await auctionService.updateAuction(editingAuction.id, formData);
        setToast({ type: 'success', message: 'Data lelang berhasil diperbarui!' });
      } else {
        await auctionService.createAuction(formData, user);
        setToast({ type: 'success', message: 'Lelang baru berhasil dibuat!' });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Gagal menyimpan data lelang' });
    }
  };

  const handleDeleteAuction = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus lelang "${title}"?`)) {
      try {
        await auctionService.deleteAuction(id);
        setToast({ type: 'success', message: `Lelang "${title}" berhasil dihapus.` });
        await loadData();
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Gagal menghapus lelang' });
      }
    }
  };

  const handleEndNow = async (id) => {
    if (window.confirm('Tutup lelang ini sekarang dan tentukan pemenang?')) {
      try {
        await auctionService.endAuctionManually(id);
        setToast({ type: 'success', message: 'Lelang berhasil ditutup dan pemenang telah ditentukan!' });
        await loadData();
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Gagal menutup lelang' });
      }
    }
  };

  const handlePaymentChange = async (auctionId, status) => {
    try {
      await auctionService.updatePaymentStatus(auctionId, status);
      setToast({ type: 'success', message: `Status pembayaran diubah menjadi "${status.toUpperCase()}"` });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Ubah peran ${targetUser.full_name || targetUser.email} menjadi ${newRole.toUpperCase()}?`)) {
      try {
        await auctionService.updateUserRole(targetUser.id, newRole);
        setToast({ type: 'success', message: `Peran berhasil diubah menjadi ${newRole.toUpperCase()}` });
        await loadData();
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      }
    }
  };

  const activeCount = auctions.filter(a => a.status === 'active').length;
  const endedCount = auctions.filter(a => a.status === 'ended').length;

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Toast Notification */}
      <div className="toast-container">
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>

      {/* Header Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Dashboard Administrator
            </h1>
            <span className="badge badge-role-admin">ADMINISTRATOR</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Kelola data lelang, riwayat penawaran, penentuan pemenang, dan peran pengguna
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-gold btn-md">
          <PlusCircle size={18} />
          <span>Buat Lelang Baru</span>
        </button>
      </div>

      {/* Statistik Cepat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Pengguna</span>
            <Users size={20} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{users.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pengguna terdaftar</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Lelang</span>
            <Gavel size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{auctions.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{activeCount} sedang aktif</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tawaran</span>
            <History size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{bids.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tercatat di sistem</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lelang Selesai</span>
            <Trophy size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{endedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Telah ada pemenang</div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'auctions' ? 'active' : ''}`}
          onClick={() => setActiveTab('auctions')}
        >
          <Gavel size={16} />
          <span>Kelola Lelang ({auctions.length})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`}
          onClick={() => setActiveTab('bids')}
        >
          <History size={16} />
          <span>Semua Riwayat Bid ({bids.length})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`}
          onClick={() => setActiveTab('winners')}
        >
          <Trophy size={16} />
          <span>Pemenang & Pembayaran ({endedCount})</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Kelola Pengguna ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: KELOLA LELANG */}
      {activeTab === 'auctions' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Daftar Semua Barang Lelang</h2>
            <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              <span>Tambah Lelang</span>
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Harga Awal</th>
                  <th>Bid Tertinggi</th>
                  <th>Min. Kenaikan</th>
                  <th>Waktu Berakhir</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=100&q=80'} 
                          alt={item.title}
                          style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <span style={{ fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td>{formatRupiah(item.starting_price)}</td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {formatRupiah(item.current_price || item.starting_price)}
                    </td>
                    <td>+{formatRupiah(item.min_increment)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDateTime(item.end_time)}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'active' ? 'badge-active' :
                        item.status === 'upcoming' ? 'badge-upcoming' : 'badge-ended'
                      }`}>
                        {item.status === 'active' ? 'Aktif' :
                         item.status === 'upcoming' ? 'Akan Datang' : 'Selesai'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item.status === 'active' && (
                          <button 
                            onClick={() => handleEndNow(item.id)}
                            className="btn btn-gold btn-sm"
                            title="Tutup Sekarang & Tentukan Pemenang"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Tutup
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEditModal(item)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Lelang"
                          style={{ padding: '0.35rem' }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAuction(item.id, item.title)}
                          className="btn btn-danger btn-sm"
                          title="Hapus Lelang"
                          style={{ padding: '0.35rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SEMUA RIWAYAT BID */}
      {activeTab === 'bids' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Seluruh Riwayat Penawaran Sistem
          </h2>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Barang Lelang</th>
                  <th>Penawar</th>
                  <th>Nominal Penawaran</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(b.created_at)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {b.auction?.title || 'Barang Lelang'}
                    </td>
                    <td>
                      {b.bidder?.full_name || b.user_name || b.bidder?.email || 'Pengguna'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {formatRupiah(b.bid_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PEMENANG & PEMBAYARAN */}
      {activeTab === 'winners' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Daftar Pemenang Lelang & Pengelolaan Status Pembayaran
          </h2>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Barang Lelang</th>
                  <th>Harga Akhir</th>
                  <th>Pemenang</th>
                  <th>Status Bayar</th>
                  <th>Ubah Status Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {auctions.filter(a => a.status === 'ended').map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Selesai: {formatDateTime(item.end_time)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {formatRupiah(item.current_price)}
                    </td>
                    <td>
                      {item.winner?.full_name || item.winner?.email || (item.winner_id ? 'Pemenang Terdaftar' : 'Tanpa Penawar')}
                    </td>
                    <td>
                      <span className={`badge badge-${item.payment_status || 'pending'}`}>
                        {item.payment_status === 'paid' ? 'LUNAS' :
                         item.payment_status === 'cancelled' ? 'BATAL' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-control"
                        value={item.payment_status || 'pending'}
                        onChange={(e) => handlePaymentChange(item.id, e.target.value)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                      >
                        <option value="pending">Pending (Menunggu)</option>
                        <option value="paid">Paid (Lunas)</option>
                        <option value="cancelled">Cancelled (Dibatalkan)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA PENGGUNA */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Daftar Pengguna & Hak Akses
          </h2>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Pengguna</th>
                  <th>Email</th>
                  <th>Terdaftar</th>
                  <th>Peran Saat Ini</th>
                  <th>Aksi Peran</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name || '-'}</td>
                    <td>{u.email}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(u.created_at)}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}>
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleUserRole(u)}
                        className={`btn btn-sm ${u.role === 'admin' ? 'btn-secondary' : 'btn-gold'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {u.role === 'admin' ? 'Jadikan User Biasa' : 'Jadikan Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT LELANG */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingAuction ? 'Edit Data Lelang' : 'Buat Barang Lelang Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Barang Lelang *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Contoh: iPhone 15 Pro Max 256GB"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL Foto Barang *</label>
                  <input 
                    type="url" 
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Lengkap</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    placeholder="Jelaskan kondisi barang, kelengkapan, garansi, dll..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Harga Awal (IDR) *</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="1000000"
                      value={formData.starting_price}
                      onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kenaikan Minimal Bid (IDR) *</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="50000"
                      value={formData.min_increment}
                      onChange={(e) => setFormData({ ...formData, min_increment: e.target.value })}
                      required
                      min="1000"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Waktu Mulai *</label>
                    <input 
                      type="datetime-local" 
                      className="form-control"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Waktu Berakhir *</label>
                    <input 
                      type="datetime-local" 
                      className="form-control"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {editingAuction && (
                  <div className="form-group">
                    <label className="form-label">Status Lelang</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="upcoming">Upcoming (Akan Datang)</option>
                      <option value="active">Active (Sedang Berlangsung)</option>
                      <option value="ended">Ended (Selesai)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-gold">
                  {editingAuction ? 'Simpan Perubahan' : 'Terbitkan Lelang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
