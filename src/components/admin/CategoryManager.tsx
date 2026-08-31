import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Layers, X, Check, ArrowUpRight, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Category, Product } from '../../types';
import { slugify } from '../../lib/format';
import { db, COLLECTIONS, addDoc, updateDoc, deleteDoc, doc, collection, handleFirestoreError, OperationType } from '../../lib/firebase';
import { compressImage } from '../../lib/imageCompressor';

interface CategoryManagerProps {
  categories: Category[];
  products: Product[];
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  products,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    order: categories.length + 1
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      order: categories.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setErrorMessage(null);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      order: cat.order || 1
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressedUrl = await compressImage(file, { maxDimension: 1000, initialQuality: 0.8, maxSizeBytes: 95 * 1024 });
      setFormData(prev => ({ ...prev, imageUrl: compressedUrl }));
    } catch (err) {
      console.error('Error compressing image:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const path = COLLECTIONS.CATEGORIES;

    try {
      const optimizedImageUrl = await compressImage(formData.imageUrl);
      const payload = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        description: formData.description,
        imageUrl: optimizedImageUrl,
        order: Number(formData.order) || 1
      };

      if (editingCategory) {
        await updateDoc(doc(db, COLLECTIONS.CATEGORIES, editingCategory.id), payload);
      } else {
        await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Category save error:', err);
      setErrorMessage('Kategori kaydedilirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
      try {
        handleFirestoreError(err, editingCategory ? OperationType.UPDATE : OperationType.CREATE, path);
      } catch (e) {
        // Logged error
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const path = `${COLLECTIONS.CATEGORIES}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Kategori silinirken bir hata oluştu.');
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (e) {
        // Logged error
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F12] p-6 rounded-3xl border border-white/10 glass-panel shadow-lg">
        <div>
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
            Kategori Yönetimi
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Dinamik alt kategoriler (Çocuk Masa Lambası, Dekoratif Lamba, Aydınlatma vb.)
          </p>
        </div>

        <button
          id="admin-add-category-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kategori Ekle</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const productCount = products.filter(p => p.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              className="group relative bg-[#0F0F12] border border-white/10 hover:border-[#C5A059]/50 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between glass-panel bento-card shadow-lg"
            >
              <div className="relative h-44 w-full bg-black overflow-hidden">
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-black/30" />
                
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold text-[#C5A059] border border-white/10">
                  Sıra: {cat.order || 1}
                </div>

                <div className="absolute top-3 right-3 bg-[#C5A059] text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg shadow">
                  {productCount} Ürün
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-sans text-lg text-white font-bold tracking-wide group-hover:text-[#C5A059] transition-colors">
                    {cat.name}
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-1">
                    Slug: /{cat.slug}
                  </span>
                  {cat.description && (
                    <p className="text-xs text-zinc-400 font-light line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 text-[#C5A059] hover:text-[#d6b26b] hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1 text-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(cat.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-white tracking-tight">Kategoriyi Sil?</h4>
            <p className="text-xs text-zinc-400">Bu kategori ve vitrindeki bağlantıları kaldırılacaktır.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-300 rounded-xl transition-colors border border-zinc-700"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold rounded-xl transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col glass-panel">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
              <h3 className="font-sans text-lg font-bold text-white uppercase tracking-wider">
                {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Tanımla'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="m-6 mb-0 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ ...prev, name, slug: slugify(name) }));
                  }}
                  placeholder="Örn: Çocuk Masa Lambası"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  URL Kısa Adı (Slug)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="cocuk-masa-lambasi"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium flex justify-between">
                  <span>Kapak Görseli URL</span>
                  <label className="cursor-pointer text-[#C5A059] hover:text-[#d6b26b] flex items-center gap-1 font-normal normal-case">
                    <Upload className="w-3 h-3" /> Dosyadan Yükle
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Açıklama
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategoriye dair kısa açıklama ve atmosfer..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Görüntülenme Sırası
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-28 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold uppercase rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'Güncelle' : 'Kategoriyi Ekle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

