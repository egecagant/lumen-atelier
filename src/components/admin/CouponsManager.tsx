import React, { useState } from 'react';
import { 
  Percent, 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Coupon } from '../../types';
import { useCoupons } from '../../context/CouponContext';
import { formatCurrency, formatDate } from '../../lib/format';

export const CouponsManager: React.FC = () => {
  const { 
    coupons, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon, 
    toggleCouponActive,
    seedDefaultCoupons
  } = useCoupons();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minOrderAmount: 2000,
    maxDiscountAmount: 0,
    usageLimit: 500,
    expiresAtDate: '',
    active: true
  });

  const handleOpenCreateModal = (preset?: Partial<Coupon>) => {
    setEditingCoupon(null);
    setFormData({
      code: preset?.code || '',
      description: preset?.description || '',
      discountType: preset?.discountType || 'percentage',
      discountValue: preset?.discountValue || 15,
      minOrderAmount: preset?.minOrderAmount || 0,
      maxDiscountAmount: preset?.maxDiscountAmount || 0,
      usageLimit: preset?.usageLimit || 0,
      expiresAtDate: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    let dateStr = '';
    if (coupon.expiresAt) {
      dateStr = new Date(coupon.expiresAt).toISOString().split('T')[0];
    }
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      expiresAtDate: dateStr,
      active: coupon.active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      alert('Lütfen kupon kodunu girin.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Omit<Coupon, 'id' | 'createdAt'> = {
        code: cleanCode,
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        minOrderAmount: Number(formData.minOrderAmount) > 0 ? Number(formData.minOrderAmount) : undefined,
        maxDiscountAmount: Number(formData.maxDiscountAmount) > 0 ? Number(formData.maxDiscountAmount) : undefined,
        usageLimit: Number(formData.usageLimit) > 0 ? Number(formData.usageLimit) : undefined,
        expiresAt: formData.expiresAtDate ? new Date(formData.expiresAtDate).getTime() : undefined,
        active: formData.active
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
        setFeedbackMessage({ type: 'success', text: `"${cleanCode}" kuponu başarıyla güncellendi ve kaydedildi.` });
      } else {
        await createCoupon(payload);
        setFeedbackMessage({ type: 'success', text: `"${cleanCode}" kuponu başarıyla eklendi ve kalıcı olarak kaydedildi.` });
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error('Kupon kaydetme hatası:', err);
      setFeedbackMessage({ type: 'error', text: 'Kupon kaydedilirken bir hata oluştu: ' + (err?.message || 'Bilinmeyen hata') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && c.active;
    if (statusFilter === 'inactive') return matchesSearch && !c.active;
    return matchesSearch;
  });

  const activeCount = coupons.filter(c => c.active).length;
  const totalUses = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="bg-[#111114] border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A059] font-bold mb-2">
              <Percent className="w-4 h-4" />
              <span>Satış & Promosyon Yönetimi</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl text-white font-bold uppercase tracking-wide">
              İndirim Kuponları & Kodları
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl mt-1.5 leading-relaxed">
              Müşterilerinizin ödeme (checkout) ekranında kullanabileceği yüzdelik ve sabit nakit indirim kodlarını oluşturun, aktiflik durumunu ve minimum sepet limitlerini yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <button
              onClick={async () => {
                await seedDefaultCoupons();
                setFeedbackMessage({ type: 'success', text: 'Varsayılan kuponlar başarıyla senkronize edildi.' });
                setTimeout(() => setFeedbackMessage(null), 3000);
              }}
              className="px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              title="Varsayılan kampanya kuponlarını yükle"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Varsayılanları Yükle</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal()}
              className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kupon Oluştur</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-medium">{feedbackMessage.text}</span>
          </div>
        )}

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-850">
          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Toplam Kupon</span>
            <span className="font-sans text-2xl text-white font-bold tracking-tight">{coupons.length}</span>
          </div>
          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Aktif Kampanyalar</span>
            <span className="font-sans text-2xl text-emerald-400 font-bold tracking-tight">{activeCount}</span>
          </div>
          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Kullanım Sayısı</span>
            <span className="font-sans text-2xl text-[#C5A059] font-bold tracking-tight">{totalUses}</span>
          </div>
          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">Ödeme Entegrasyonu</span>
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Checkout Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Quick Template Presets */}
      <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-5 space-y-3">
        <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" /> Hızlı Şablonlarla Kupon Ekle:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleOpenCreateModal({
              code: 'LUMEN' + Math.floor(10 + Math.random() * 15),
              description: 'Yeni Sezon Tasarımlarında %15 İndirim',
              discountType: 'percentage',
              discountValue: 15,
              minOrderAmount: 250
            })}
            className="p-3 bg-black/40 hover:bg-zinc-900 border border-white/5 hover:border-[#C5A059]/40 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-bold text-zinc-200 group-hover:text-[#C5A059]">%15 Sezon İndirimi</div>
            <div className="text-[11px] text-zinc-400">Min. 250 TL sepet tutarı</div>
          </button>

          <button
            onClick={() => handleOpenCreateModal({
              code: 'HOSGELDIN' + Math.floor(100 + Math.random() * 900),
              description: 'İlk Siparişe Özel 50 TL Nakit İndirim',
              discountType: 'fixed',
              discountValue: 50,
              minOrderAmount: 300
            })}
            className="p-3 bg-black/40 hover:bg-zinc-900 border border-white/5 hover:border-[#C5A059]/40 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-bold text-zinc-200 group-hover:text-[#C5A059]">50 TL Nakit İndirim</div>
            <div className="text-[11px] text-zinc-400">Min. 300 TL sepet tutarı</div>
          </button>

          <button
            onClick={() => handleOpenCreateModal({
              code: 'MIMARLIK20',
              description: 'Proje ve Kurumsal Alımlara Özel %20 İndirim',
              discountType: 'percentage',
              discountValue: 20,
              minOrderAmount: 800
            })}
            className="p-3 bg-black/40 hover:bg-zinc-900 border border-white/5 hover:border-[#C5A059]/40 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-bold text-zinc-200 group-hover:text-[#C5A059]">%20 VIP / Mimarlık İndirimi</div>
            <div className="text-[11px] text-zinc-400">Min. 800 TL sepet tutarı</div>
          </button>

          <button
            onClick={() => handleOpenCreateModal({
              code: 'YAZ' + new Date().getFullYear(),
              description: 'Yaz Dönemi Aydınlatma Kampanyası %10',
              discountType: 'percentage',
              discountValue: 10,
              minOrderAmount: 150
            })}
            className="p-3 bg-black/40 hover:bg-zinc-900 border border-white/5 hover:border-[#C5A059]/40 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-bold text-zinc-200 group-hover:text-[#C5A059]">%10 Yaz Kampanyası</div>
            <div className="text-[11px] text-zinc-400">Min. 150 TL sepet tutarı</div>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111114] p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kupon kodu veya açıklama ara..."
            className="w-full sm:w-72 px-3.5 py-2 bg-black/40 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-[#C5A059] text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tümü ({coupons.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'inactive' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pasif ({coupons.length - activeCount})
          </button>
        </div>
      </div>

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 bg-[#111114] rounded-2xl border border-zinc-800">
            <Tag className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-zinc-300">Kupon Bulunamadı</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Arama kriterlerinize uygun kupon bulunamadı veya henüz bir indirim kodu oluşturulmadı.
            </p>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                coupon.active 
                  ? 'bg-[#111114] border-zinc-800 hover:border-[#C5A059]/40' 
                  : 'bg-[#0D0D10] border-zinc-900 opacity-65'
              }`}
            >
              <div>
                {/* Header: Code + Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-black border border-[#C5A059]/40 rounded-lg font-mono font-bold text-sm text-[#C5A059] tracking-wider flex items-center gap-1.5">
                      <span>{coupon.code}</span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Kodu Kopyala"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Active Toggle Pill */}
                  <button
                    onClick={() => toggleCouponActive(coupon.id, coupon.active)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${
                      coupon.active 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {coupon.active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 line-clamp-2 min-h-[32px] mb-4 font-light">
                  {coupon.description || 'Tüm alışverişlerde geçerli promosyon kuponu.'}
                </p>

                {/* Details Breakdown */}
                <div className="space-y-1.5 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">İndirim Oranı/Tutarı:</span>
                    <span className="font-bold text-white">
                      {coupon.discountType === 'percentage' 
                        ? `%${coupon.discountValue} İndirim` 
                        : `${formatCurrency(coupon.discountValue)} İndirim`}
                    </span>
                  </div>

                  {coupon.minOrderAmount ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Min. Sepet Tutarı:</span>
                      <span className="text-zinc-200">{formatCurrency(coupon.minOrderAmount)}</span>
                    </div>
                  ) : null}

                  {coupon.maxDiscountAmount ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Maks. İndirim:</span>
                      <span className="text-zinc-200">{formatCurrency(coupon.maxDiscountAmount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Kullanım:</span>
                    <span className="text-zinc-300">
                      {coupon.usageCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'kez kullanıldı'}
                    </span>
                  </div>

                  {coupon.expiresAt ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Bitiş Tarihi:</span>
                      <span className="text-zinc-300">{formatDate(coupon.expiresAt)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Geçerlilik:</span>
                      <span className="text-emerald-400 font-medium">Süresiz</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-850">
                <span className="text-[10px] text-zinc-400">
                  {formatDate(coupon.createdAt)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(coupon)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCoupon(coupon)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Coupon Confirmation Modal */}
      {deleteConfirmCoupon && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-sans text-lg font-bold text-zinc-100">Kuponu Silmek İstiyor Musunuz?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="font-mono text-[#C5A059] font-bold">{deleteConfirmCoupon.code}</span> indirim kodu silinecektir.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmCoupon(null)}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl transition-all border border-zinc-700 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!deleteConfirmCoupon) return;
                  setIsDeleting(true);
                  try {
                    await deleteCoupon(deleteConfirmCoupon.id);
                    setFeedbackMessage({ type: 'success', text: `"${deleteConfirmCoupon.code}" kuponu silindi.` });
                    setTimeout(() => setFeedbackMessage(null), 3000);
                  } finally {
                    setIsDeleting(false);
                    setDeleteConfirmCoupon(null);
                  }
                }}
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
                    <span>Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-panel">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-sans text-base font-bold text-white uppercase tracking-wider">
                  {editingCoupon ? 'Kuponu Düzenle' : 'Yeni İndirim Kuponu Ekle'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                  Kupon Kodu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Örn: LUMEN20, YAZ2026, VIP500"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 font-mono tracking-wider focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                  Kampanya Açıklaması
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Örn: 2.500 TL ve üzeri alışverişlerde %15 indirim"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    İndirim Türü *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  >
                    <option value="percentage">Yüzdelik (%)</option>
                    <option value="fixed">Sabit Tutar (TL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    İndirim Değeri * {formData.discountType === 'percentage' ? '(%)' : '(TL)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    Min. Sepet Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    placeholder="0 = Limitsiz"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    Maks. İndirim Limiti (TL)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    placeholder="0 = Sınırsız"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    Kullanım Limiti (Adet)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    placeholder="500"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase tracking-wider mb-1 font-medium">
                    Son Kullanma Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAtDate}
                    onChange={(e) => setFormData({ ...formData, expiresAtDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active-check"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded bg-black border-white/10 text-[#C5A059] focus:ring-0"
                />
                <label htmlFor="coupon-active-check" className="text-zinc-300 font-medium cursor-pointer">
                  Kuponu hemen aktif olarak vitrine aç
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 glass-panel text-zinc-300 hover:bg-white/10 rounded-xl transition-colors"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>{editingCoupon ? 'Güncelle' : 'Kuponu Kaydet'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
