import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Image as ImageIcon, Eye, X, Check, Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { HeroBanner } from '../../types';
import { db, COLLECTIONS, addDoc, updateDoc, deleteDoc, doc, collection, handleFirestoreError, OperationType } from '../../lib/firebase';
import { compressImage } from '../../lib/imageCompressor';

interface BannerManagerProps {
  banners: HeroBanner[];
}

export const BannerManager: React.FC<BannerManagerProps> = ({ banners }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Hemen Satın Al',
    linkUrl: '#koleksiyon',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1920&q=85',
    active: true,
    order: banners.length + 1
  });

  const openCreateModal = () => {
    setEditingBanner(null);
    setErrorMessage(null);
    setFormData({
      title: '',
      subtitle: '',
      buttonText: 'Hemen Satın Al',
      linkUrl: '#koleksiyon',
      imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1920&q=85',
      active: true,
      order: banners.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setErrorMessage(null);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText || 'İNCELE',
      linkUrl: banner.linkUrl || '#koleksiyon',
      imageUrl: banner.imageUrl,
      active: banner.active ?? true,
      order: banner.order || 1
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      // Allow Ultra HD / Full HD banner resolution with high quality
      const compressedUrl = await compressImage(file, { 
        maxDimension: 2560, 
        initialQuality: 0.90, 
        maxSizeBytes: 650 * 1024 
      });
      setFormData(prev => ({ ...prev, imageUrl: compressedUrl }));
    } catch (err) {
      console.error('Error compressing banner image:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const toggleActive = async (banner: HeroBanner) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.BANNERS, banner.id), {
        active: !banner.active
      });
    } catch (err) {
      console.error('Error toggling banner active:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Use banner-specific high resolution profile
      const optimizedImageUrl = await compressImage(formData.imageUrl, {
        maxDimension: 2560,
        initialQuality: 0.90,
        maxSizeBytes: 650 * 1024
      });
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        buttonText: formData.buttonText,
        linkUrl: formData.linkUrl,
        imageUrl: optimizedImageUrl,
        active: formData.active,
        order: Number(formData.order) || 1
      };

      if (editingBanner) {
        await updateDoc(doc(db, COLLECTIONS.BANNERS, editingBanner.id), payload);
      } else {
        await addDoc(collection(db, COLLECTIONS.BANNERS), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving banner:', err);
      setErrorMessage('Banner kaydedilirken bir hata oluştu.');
      try {
        handleFirestoreError(err, editingBanner ? OperationType.UPDATE : OperationType.CREATE, COLLECTIONS.BANNERS);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.BANNERS, id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert('Banner silinemedi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-zinc-100 uppercase tracking-wider">
            Ana Sayfa Hero & Slider Yönetimi
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Ziyaretçileri karşılayan yüksek çözünürlüklü lüks afişler, başlıklar ve yönlendirme butonları.
          </p>
        </div>

        <button
          id="admin-add-banner-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#d4af37] hover:bg-[#e4bd43] text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl shadow-[#d4af37]/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Banner Ekle</span>
        </button>
      </div>

      {/* Banner Cards */}
      <div className="space-y-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className={`relative p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-center gap-6 bg-[#111114] ${
              b.active ? 'border-zinc-800' : 'border-zinc-850 opacity-60'
            }`}
          >
            {/* Banner Thumbnail Preview */}
            <div className="relative w-full md:w-64 h-36 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-zinc-800">
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 text-[10px] text-[#d4af37] font-semibold">
                Sıra: {b.order || 1}
              </div>
            </div>

            {/* Banner Meta Info */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  b.active ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {b.active ? 'Aktif Slayt' : 'Pasif'}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Link: {b.linkUrl}</span>
              </div>

              <h4 className="font-sans text-lg text-zinc-100 uppercase font-bold tracking-wide">
                {b.title}
              </h4>
              <p className="text-xs text-zinc-400 font-light">
                {b.subtitle}
              </p>
              <div className="text-[11px] text-[#c5a880] font-semibold">
                Buton: "{b.buttonText}"
              </div>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col items-center gap-2 self-end md:self-center">
              <button
                onClick={() => toggleActive(b)}
                className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  b.active ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
                }`}
              >
                {b.active ? 'Gizle' : 'Aktif Et'}
              </button>

              <button
                onClick={() => openEditModal(b)}
                className="p-2 text-[#c5a880] hover:text-[#d4af37] hover:bg-zinc-800 rounded transition-colors"
                title="Düzenle"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteConfirmId(b.id)}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-zinc-800 rounded transition-colors"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-[#111114] border border-dashed border-zinc-800 space-y-3">
            <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-zinc-300">Özel Banner Eklenmedi</h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Şu anda varsayılan estetik hero gösteriliyor. Dilediğiniz zaman "Yeni Banner Ekle" butonuyla dinamik slider afişleri yükleyebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-zinc-100">Bannerı Silmek İstiyor Musunuz?</h4>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-zinc-800 text-xs text-zinc-300 rounded-lg"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 text-xs text-white font-bold rounded-lg"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#0a0a0c]">
              <h3 className="font-sans text-lg font-bold text-zinc-100 uppercase tracking-wider">
                {editingBanner ? 'Bannerı Düzenle' : 'Yeni Hero Banner Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                  Banner Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: ASTRONOT KOZMİK MASA LAMBASI"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:border-[#c5a880] focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                  Alt Metin / Açıklama
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="El işçiliği pirinç, mermer ve amber camın lüks buluşması..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold flex justify-between">
                  <span>Banner Arka Plan Görseli URL *</span>
                  <label className="cursor-pointer text-[#c5a880] hover:text-[#d4af37] flex items-center gap-1 font-normal normal-case">
                    <Upload className="w-3 h-3" /> Dosyadan Yükle
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#c5a880]" />
                  <span>Önerilen: <strong>16:9</strong> veya <strong>21:9</strong> formatında 1920x1080 / 2560x1440 piksel yüksek çözünürlüklü görseller.</span>
                </p>
                {isCompressing && (
                  <div className="flex items-center gap-2 text-xs text-[#c5a880] mt-1.5 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Yüksek çözünürlüklü banner optimize ediliyor...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                    Buton Metni
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="KOLEKSİYONU KEŞFET"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                    Yönlendirme Linki
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="#koleksiyon"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                    Sıra Numarası
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-900 text-[#d4af37]"
                    />
                    <span className="font-semibold">Aktif Slayt Olarak Göster</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#d4af37] hover:bg-[#e4bd43] text-black font-bold uppercase rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBanner ? 'Güncelle' : 'Bannerı Ekle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
