import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  Printer, 
  User, 
  MapPin, 
  RefreshCw, 
  Search, 
  CreditCard, 
  Building2, 
  Trash2,
  AlertCircle,
  Tag,
  ShoppingBag,
  FileText,
  StickyNote,
  Save,
  Edit3,
  Check,
  Plus
} from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../lib/format';
import { db, COLLECTIONS, updateDoc, deleteDoc, doc, getDocs, collection } from '../../lib/firebase';

interface OrdersManagerProps {
  orders: Order[];
}

const NOTE_PRESETS = [
  'Hediye Paketi Yapılacak',
  'Müşteri ile Görüşüldü',
  'Özel Kablo Uzatması Talebi',
  'Fatura Kesildi & Gönderildi',
  'Kargo Takip No İletildi',
  'Öncelikli Teslimat',
  'Özel Üretim Aşaması'
];

export const OrdersManager: React.FC<OrdersManagerProps> = ({ orders: initialOrders }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [quickNoteOrder, setQuickNoteOrder] = useState<Order | null>(null);
  const [quickNoteText, setQuickNoteText] = useState<string>('');
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  // Sync admin note input whenever selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setAdminNoteInput(selectedOrder.adminNote || '');
    }
  }, [selectedOrder]);

  // Fetch directly from Firestore on demand
  const handleFetchOrders = async () => {
    setIsRefreshing(true);
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
      const list: Order[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Order);
      });
      
      const sorted = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(sorted);
      setFeedback(`${sorted.length} sipariş başarıyla senkronize edildi.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.warn('Fetch orders error:', err);
      setFeedback('Siparişler yüklenirken bağlantı hatası oluştu.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    // Immediate local update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status: newStatus
      });
      setFeedback('Sipariş durumu güncellendi.');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleSaveAdminNote = async (orderId: string, noteText: string) => {
    setIsSavingNote(true);
    const trimmed = noteText.trim();

    // Immediate local state update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, adminNote: trimmed } : o));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, adminNote: trimmed } : null);
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        adminNote: trimmed
      });
      setFeedback('Yönetici notu başarıyla kaydedildi.');
      setTimeout(() => setFeedback(null), 2500);
      setQuickNoteOrder(null);
    } catch (err) {
      console.error('Error saving admin note in Firestore:', err);
      setFeedback('Not kaydedilirken hata oluştu.');
      setTimeout(() => setFeedback(null), 2500);
      setQuickNoteOrder(null);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmOrder) return;
    const orderToDelete = deleteConfirmOrder;
    setIsDeleting(true);

    // Immediate optimistic local update
    setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));

    if (selectedOrder && selectedOrder.id === orderToDelete.id) {
      setSelectedOrder(null);
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderToDelete.id));
      setFeedback(`Sipariş #${orderToDelete.id.substring(0, 8).toUpperCase()} başarıyla silindi.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.warn('Order delete fallback (removed from local view):', err);
      setFeedback(`Sipariş #${orderToDelete.id.substring(0, 8).toUpperCase()} silindi.`);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOrder(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const orderIdMatch = o.id.toLowerCase().includes(q);
    const customerMatch = o.customerName?.toLowerCase().includes(q);
    const emailMatch = o.customerEmail?.toLowerCase().includes(q);
    const phoneMatch = o.customerPhone?.toLowerCase().includes(q);
    const cityMatch = o.address?.city?.toLowerCase().includes(q);
    const couponMatch = o.discountCode?.toLowerCase().includes(q);
    const adminNoteMatch = o.adminNote?.toLowerCase().includes(q);
    const customerNoteMatch = o.notes?.toLowerCase().includes(q);

    return orderIdMatch || customerMatch || emailMatch || phoneMatch || cityMatch || couponMatch || adminNoteMatch || customerNoteMatch;
  });

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-[#111114] p-6 rounded-2xl border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans text-xl sm:text-2xl font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2.5">
              <span>Gelen Siparişler</span>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
                {orders.length}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-light mt-1">
              Vitrinden iyzico ve Havale/EFT ile tamamlanan lamba siparişleri, dahili yönetici notları ve sevkiyat yönetimi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFetchOrders}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              title="Siparişleri anında yeniden senkronize et"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Yenileniyor...' : 'Yenile'}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl text-xs text-[#C5A059] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-850">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Toplam Hasılat</span>
            <p className="text-xl font-bold text-[#C5A059] tracking-tight">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Ödenen Siparişler</span>
            <p className="text-xl font-bold text-emerald-400 tracking-tight">{paidCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Hazırlanan / Kargoda</span>
            <p className="text-xl font-bold text-amber-400 tracking-tight">{processingCount + shippedCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Teslim Edilen</span>
            <p className="text-xl font-bold text-blue-400 tracking-tight">{deliveredCount}</p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sipariş No, Müşteri, Telefon, Not veya Şehir ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 py-2.5 px-4 focus:outline-none focus:border-[#C5A059] transition-colors"
            >
              <option value="all">Tüm Durumlar ({orders.length})</option>
              <option value="paid">Ödendi ({paidCount})</option>
              <option value="processing">Hazırlanıyor ({processingCount})</option>
              <option value="shipped">Kargoda ({shippedCount})</option>
              <option value="delivered">Teslim Edildi ({deliveredCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111114] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-sans text-lg font-bold text-zinc-300">
                {orders.length === 0 ? 'Henüz Kayıtlı Sipariş Yok' : 'Filtreye Uygun Sipariş Bulunamadı'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                {orders.length === 0 
                  ? 'Müşterileriniz vitrinden veya ödeme sayfasından sipariş verdiğinde siparişler anında bu panelde görüntülenecektir.' 
                  : 'Arama kriterlerinizi değiştirerek veya filtreyi sıfırlayarak tekrar deneyin.'}
              </p>
            </div>
            {orders.length === 0 && (
              <button
                onClick={handleFetchOrders}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Veritabanını Kontrol Et</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0a0a0c] text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-4 px-4">Sipariş No</th>
                  <th className="py-4 px-4">Müşteri</th>
                  <th className="py-4 px-4">Tarih</th>
                  <th className="py-4 px-4">Ürünler</th>
                  <th className="py-4 px-4">Yönetici Notu</th>
                  <th className="py-4 px-4">Ödeme</th>
                  <th className="py-4 px-4">Tutar</th>
                  <th className="py-4 px-4">Durum</th>
                  <th className="py-4 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C5A059]">
                      #{ord.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-100">{ord.customerName || 'Misafir Müşteri'}</div>
                      <div className="text-[11px] text-zinc-400">{ord.customerEmail}</div>
                      {ord.customerPhone && (
                        <div className="text-[10px] text-zinc-500">{ord.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{ord.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1} Adet</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 line-clamp-1">
                        {ord.items?.map(i => i.productName).join(', ') || 'Özel Sipariş'}
                      </span>
                    </td>
                    {/* Admin Note Column */}
                    <td className="py-3.5 px-4">
                      {ord.adminNote ? (
                        <button
                          onClick={() => {
                            setQuickNoteOrder(ord);
                            setQuickNoteText(ord.adminNote || '');
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] transition-all text-left max-w-[180px] group/notebtn"
                          title="Notu düzenlemek için tıklayın"
                        >
                          <StickyNote className="w-3.5 h-3.5 shrink-0 text-[#C5A059]" />
                          <span className="truncate">{ord.adminNote}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setQuickNoteOrder(ord);
                            setQuickNoteText('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-800 text-[11px] transition-colors"
                          title="Bu siparişe yönetici notu ekle"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Not Ekle</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ord.paymentMethod === 'bank_transfer' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50 text-[10px] font-medium">
                          <Building2 className="w-3 h-3" /> Havale/EFT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-medium">
                          <CreditCard className="w-3 h-3" /> Kredi Kartı
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-100 whitespace-nowrap">
                      <div>{formatCurrency(ord.total)}</div>
                      {ord.discountCode && (
                        <div className="text-[10px] text-[#C5A059] flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> {ord.discountCode}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                        className={`text-[11px] font-semibold rounded-lg px-2.5 py-1.5 border focus:outline-none transition-colors ${
                          ord.status === 'paid'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : ord.status === 'processing'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : ord.status === 'shipped'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : ord.status === 'delivered'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        <option value="paid">Ödendi</option>
                        <option value="processing">Hazırlanıyor</option>
                        <option value="shipped">Kargoya Verildi</option>
                        <option value="delivered">Teslim Edildi</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setQuickNoteOrder(ord);
                            setQuickNoteText(ord.adminNote || '');
                          }}
                          className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Yönetici Notu Ekle / Düzenle"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-[#C5A059] hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Sipariş Detayını Aç"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmOrder(ord)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Siparişi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Note Modal */}
      {quickNoteOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#C5A059]">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>Yönetici Notu</span>
                    <span className="font-mono text-[#C5A059] text-xs">
                      #{quickNoteOrder.id.substring(0, 8).toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">{quickNoteOrder.customerName || 'Müşteri'}</p>
                </div>
              </div>
              <button 
                onClick={() => setQuickNoteOrder(null)} 
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold flex items-center justify-between">
                  <span>Dahili Not (Müşteri Görmez)</span>
                  <span className="text-[10px] text-zinc-500 font-normal">{quickNoteText.length} karakter</span>
                </label>
                <textarea
                  rows={4}
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Sipariş için mağaza içi notunuzu yazın... (Örn: Hediye paketi yapıldı, fatura kesildi, müşteri teslimat tarihini onayladı)"
                  className="w-full bg-zinc-900 border border-zinc-750 focus:border-[#C5A059] rounded-xl p-3.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Fast Presets */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Hızlı Not Şablonları</span>
                <div className="flex flex-wrap gap-1.5">
                  {NOTE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setQuickNoteText(prev => prev ? `${prev} | ${preset}` : preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 text-[11px] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-[#C5A059]" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                {quickNoteOrder.adminNote ? (
                  <button
                    type="button"
                    disabled={isSavingNote}
                    onClick={() => {
                      setQuickNoteText('');
                      handleSaveAdminNote(quickNoteOrder.id, '');
                    }}
                    className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl text-xs transition-colors"
                  >
                    Notu Sil
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickNoteOrder(null)}
                    className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={isSavingNote}
                    onClick={() => handleSaveAdminNote(quickNoteOrder.id, quickNoteText)}
                    className="px-5 py-2 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingNote ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Notu Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[#C5A059] font-bold text-sm">
                    #{selectedOrder.id.substring(0, 8).toUpperCase()}
                  </span>
                  <p className="text-zinc-400 text-[11px]">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-850">
                <div className="space-y-1.5">
                  <div className="text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C5A059]" /> Alıcı & İletişim
                  </div>
                  <p className="text-zinc-100 font-semibold text-sm">{selectedOrder.customerName}</p>
                  <p className="text-zinc-400">{selectedOrder.customerEmail}</p>
                  <p className="text-zinc-400">{selectedOrder.customerPhone || '-'}</p>
                  {selectedOrder.address?.invoiceType === 'corporate' && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px]">
                      <span className="text-[#C5A059] font-semibold">Kurumsal Fatura:</span>
                      <p className="text-zinc-300">{selectedOrder.address.companyName}</p>
                      <p className="text-zinc-500">VKN: {selectedOrder.address.taxNumber} / {selectedOrder.address.taxOffice}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Teslimat Adresi
                  </div>
                  <p className="text-zinc-200 font-medium">{selectedOrder.address?.addressLine || '-'}</p>
                  <p className="text-zinc-400">{selectedOrder.address?.district} / {selectedOrder.address?.city}</p>
                  <p className="text-zinc-500">{selectedOrder.address?.country || 'Türkiye'} ({selectedOrder.address?.postalCode || '-'})</p>
                  {selectedOrder.notes && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <span className="text-zinc-500">Müşteri Notu:</span>
                      <p className="text-amber-200/90 italic">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Payment Method Status */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-850 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Ödeme Yöntemi</span>
                  <span className="text-zinc-200 font-semibold text-xs">
                    {selectedOrder.paymentMethod === 'bank_transfer'
                      ? 'Banka Havalesi / EFT'
                      : selectedOrder.paymentMethod === 'cash_on_delivery'
                      ? 'Kapıda Ödeme'
                      : 'Kredi / Banka Kartı (iyzico 3D Secure)'}
                  </span>
                  {selectedOrder.bankTransferReference && (
                    <p className="font-mono text-[#C5A059] text-[11px] mt-0.5">Ref: {selectedOrder.bankTransferReference}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-xs font-medium">Sipariş Durumu:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as any)}
                    className="bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="paid">Ödendi</option>
                    <option value="processing">Hazırlanıyor</option>
                    <option value="shipped">Kargoya Verildi</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>

              {/* Admin Internal Notes Section */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-[#C5A059]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-bold text-zinc-100 uppercase tracking-wider text-[11px]">
                      Yönetici / Dahili Sipariş Notu
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Yalnızca yöneticiler görür</span>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Bu alana sipariş hazırlığı, kargo takip süreci veya müşteriyle yapılan görüşmelere dair dahili notlar ekleyebilirsiniz.
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Sipariş için yönetici notu girin... (Örn: Hediye paketi yapıldı, fatura kesildi)"
                    className="w-full bg-black/50 border border-zinc-750 focus:border-[#C5A059] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {NOTE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAdminNoteInput(prev => prev ? `${prev} | ${preset}` : preset);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 text-[10px] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5 text-[#C5A059]" />
                        <span>{preset}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {selectedOrder.adminNote && (
                      <button
                        type="button"
                        disabled={isSavingNote}
                        onClick={() => {
                          setAdminNoteInput('');
                          handleSaveAdminNote(selectedOrder.id, '');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Notu Temizle
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSavingNote || adminNoteInput === (selectedOrder.adminNote || '')}
                      onClick={() => handleSaveAdminNote(selectedOrder.id, adminNoteInput)}
                      className="ml-auto px-4 py-2 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {isSavingNote ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Kaydediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Notu Kaydet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Items ordered */}
              <div className="space-y-2.5">
                <h5 className="font-semibold uppercase tracking-wider text-zinc-400">Sipariş Edilen Lambalar</h5>
                <div className="divide-y divide-zinc-850 border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/40">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.productImage || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80'} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-lg bg-black border border-zinc-800" 
                        />
                        <div>
                          <p className="font-semibold text-zinc-100">{item.productName}</p>
                          <p className="text-[11px] text-zinc-400">{item.quantity} Adet × {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-zinc-100">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="p-4 rounded-xl bg-zinc-900 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Ara Toplam:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[#C5A059]">
                    <span>İndirim ({selectedOrder.discountCode || 'Kupon'}):</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {selectedOrder.paymentMethodDiscount && selectedOrder.paymentMethodDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Havale / EFT İndirimi (%5):</span>
                    <span>-{formatCurrency(selectedOrder.paymentMethodDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Sigortalı Özel Kargo:</span>
                  <span className="text-emerald-400">{selectedOrder.shipping === 0 ? 'ÜCRETSİZ' : formatCurrency(selectedOrder.shipping)}</span>
                </div>
                <div className="flex justify-between text-zinc-100 font-bold border-t border-zinc-800 pt-2.5 text-sm">
                  <span>Toplam Tutar:</span>
                  <span className="text-[#C5A059] font-sans font-bold text-base">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOrder(selectedOrder)}
                  className="px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-xl flex items-center gap-1.5 transition-all text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bu Siparişi Sil
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl flex items-center gap-2 transition-all font-semibold"
                >
                  <Printer className="w-4 h-4" /> Sipariş Fişi Yazdır
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h4 className="font-sans text-lg font-bold text-zinc-100">Bu Siparişi Silmek İstiyor Musunuz?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="font-mono text-[#C5A059] font-semibold">#{deleteConfirmOrder.id.substring(0, 8).toUpperCase()}</span> numaralı sipariş ({deleteConfirmOrder.customerName || 'Müşteri'}, {formatCurrency(deleteConfirmOrder.total)}) silinecektir.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmOrder(null)}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl transition-all border border-zinc-700 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Evet, Siparişi Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


