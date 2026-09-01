import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Check, 
  Upload, 
  Layers, 
  Zap, 
  Ruler, 
  Eye,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Rss
} from 'lucide-react';
import { Product, Category, StockStatus } from '../../types';
import { formatCurrency, slugify } from '../../lib/format';
import { db, COLLECTIONS, addDoc, updateDoc, deleteDoc, doc, collection, handleFirestoreError, OperationType } from '../../lib/firebase';
import { compressImageFiles, optimizeImageList, estimatePayloadSize } from '../../lib/imageCompressor';
import { GoogleMerchantFeedModal } from './GoogleMerchantFeedModal';

interface ProductManagerProps {
  products: Product[];
  categories: Category[];
  onOpenQuickView: (product: Product) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  categories,
  onOpenQuickView,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: categories[0]?.id || '',
    price: 350,
    compareAtPrice: 0,
    shortDescription: '',
    description: '',
    stockStatus: 'in_stock' as StockStatus,
    stockQuantity: 10,
    dimensions: '',
    material: '',
    lightSpecs: '2700K Sıcak Beyaz | E27 Duy | LED',
    energyClass: 'A++',
    featured: false,
    isNewArrival: true,
    images: [] as string[]
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  const openCreateModal = () => {
    setEditingProduct(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || '',
      price: 450,
      compareAtPrice: 0,
      shortDescription: '',
      description: '',
      stockStatus: 'in_stock',
      stockQuantity: 12,
      dimensions: 'Y: 35cm | Çap: 20cm',
      material: 'Masif Pirinç, Üfleme Cam, Mermer',
      lightSpecs: '2700K Sıcak Amber | E27 LED Uyumlu',
      energyClass: 'A++',
      featured: true,
      isNewArrival: true,
      images: [
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80'
      ]
    });
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setErrorMessage(null);
    setFormData({
      name: prod.name,
      slug: prod.slug || slugify(prod.name),
      categoryId: prod.categoryId,
      price: prod.price,
      compareAtPrice: prod.compareAtPrice || 0,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      stockStatus: prod.stockStatus || 'in_stock',
      stockQuantity: prod.stockQuantity ?? 10,
      dimensions: prod.dimensions || '',
      material: prod.material || '',
      lightSpecs: prod.lightSpecs || '',
      energyClass: prod.energyClass || 'A++',
      featured: prod.featured || false,
      isNewArrival: prod.isNewArrival || false,
      images: prod.images && prod.images.length > 0 ? [...prod.images] : []
    });
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingImages(true);
    setErrorMessage(null);
    try {
      // Compress each image to ~80-95KB so multiple images comfortably fit in Firestore
      const compressedImages = await compressImageFiles(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressedImages]
      }));
    } catch (err) {
      console.error('Error compressing uploaded files:', err);
      setErrorMessage('Görseller yüklenirken bir sorun oluştu.');
    } finally {
      setIsCompressingImages(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || formData.price <= 0) {
      setErrorMessage('Lütfen ürün adı, kategori ve fiyat bilgilerini eksiksiz doldurun.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name || '';

    try {
      // Optimize existing images in formData to ensure no raw uncompressed data exceeds limit
      const optimizedImages = await optimizeImageList(
        formData.images.length > 0
          ? formData.images
          : ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80']
      );

      const payload = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        categoryId: formData.categoryId,
        categoryName,
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice) || 0,
        shortDescription: formData.shortDescription,
        description: formData.description,
        stockStatus: formData.stockStatus,
        stockQuantity: Number(formData.stockQuantity),
        dimensions: formData.dimensions,
        material: formData.material,
        lightSpecs: formData.lightSpecs,
        energyClass: formData.energyClass,
        featured: formData.featured,
        isNewArrival: formData.isNewArrival,
        images: optimizedImages,
        updatedAt: Date.now()
      };

      // Check document size limit (1MB = 1,048,576 bytes)
      const estimatedSize = estimatePayloadSize(payload);
      if (estimatedSize > 950 * 1024) {
        throw new Error(`Ürün verisi ve görselleri çok büyük (${(estimatedSize / 1024).toFixed(0)} KB). Lütfen birkaç görseli kaldırın veya daha küçük çözünürlük yükleyin.`);
      }

      if (editingProduct) {
        await updateDoc(doc(db, COLLECTIONS.PRODUCTS, editingProduct.id), payload);
      } else {
        await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
          ...payload,
          createdAt: Date.now()
        });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving product to Firestore:', err);
      let errMsg = err instanceof Error ? err.message : 'Ürün kaydedilirken bir hata oluştu.';
      if (errMsg.includes('permission') || errMsg.includes('insufficient')) {
        errMsg = 'Yetki Hatası: Ürün eklemek veya düzenlemek için yetkili yönetici hesabınızla aktif olarak oturum açmış olmanız gerekmektedir.';
      }
      setErrorMessage(errMsg);
      try {
        handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, COLLECTIONS.PRODUCTS);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Ürün silinemedi.');
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-zinc-800">
        <div>
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-zinc-100 uppercase tracking-wider">
            Ürün & Koleksiyon Yönetimi
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Tüm lüks tasarım lambalar, fiyatlandırma, çoklu görseller ve stok durumları.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-google-merchant-feed-btn"
            type="button"
            onClick={() => setIsFeedModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/15 hover:border-[#C5A059]/40 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            <Rss className="w-4 h-4 text-[#C5A059]" />
            <span>Google Merchant Feed (XML)</span>
          </button>

          <button
            id="admin-add-product-btn"
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#d4af37] hover:bg-[#e4bd43] text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl shadow-[#d4af37]/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Lamba Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111114] p-4 rounded-xl border border-zinc-850">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lamba adına göre ara..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-zinc-400 whitespace-nowrap">Kategori:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 py-2 px-3 focus:outline-none focus:border-[#c5a880]"
          >
            <option value="all">Tüm Kategoriler ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111114] rounded-2xl border border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-zinc-300">Henüz Ürün Bulunmuyor</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Lüks vitrininizi oluşturmak için "Yeni Lamba Ekle" butonuna tıklayarak ilk ürününüzü hemen ekleyin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0a0a0c] text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">Görsel</th>
                  <th className="py-3.5 px-4">Lamba Adı</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Fiyat</th>
                  <th className="py-3.5 px-4">Stok</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filtered.map((prod) => {
                  const img = prod.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=200&q=80';
                  return (
                    <tr key={prod.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-black border border-zinc-800" />
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-100">
                        <div className="flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {prod.featured && <Sparkles className="w-3 h-3 text-[#d4af37]" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{prod.slug}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {prod.categoryName || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#d4af37]">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-zinc-200">{prod.stockQuantity ?? 0} Adet</span>
                      </td>
                      <td className="py-3 px-4">
                        {prod.stockStatus === 'in_stock' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                            Stokta
                          </span>
                        ) : prod.stockStatus === 'preorder' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
                            Ön Sipariş
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 border border-rose-800 text-rose-300">
                            Tükendi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => onOpenQuickView(prod)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
                          title="Önizle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-prod-${prod.id}`}
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-[#c5a880] hover:text-[#d4af37] hover:bg-zinc-800 rounded transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-prod-${prod.id}`}
                          onClick={() => setDeleteConfirmId(prod.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-zinc-800 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-sans text-lg font-bold text-zinc-100">Bu Ürünü Silmek İstiyor Musunuz?</h4>
            <p className="text-xs text-zinc-400">Bu işlem ürünü Firestore veritabanından kalıcı olarak kaldıracaktır.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-xs text-white font-bold rounded-lg"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col glass-panel">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
              <h3 className="font-sans text-lg font-bold text-white uppercase tracking-wider">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Lüks Lamba Ekle'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="m-6 mb-0 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Row 1: Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Lamba Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        slug: slugify(name)
                      }));
                    }}
                    placeholder="Örn: Nero Marquina Mermer Lambader"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Kategori Seçimi *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#111114] text-zinc-200">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Prices & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    İndirimsiz Liste Fiyatı (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                    placeholder="Opsiyonel"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Stok Durumu & Adet
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.stockStatus}
                      onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as StockStatus })}
                      className="w-2/3 px-2.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none text-xs"
                    >
                      <option value="in_stock" className="bg-[#111114]">Stokta</option>
                      <option value="preorder" className="bg-[#111114]">Ön Sipariş</option>
                      <option value="out_of_stock" className="bg-[#111114]">Tükendi</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                      className="w-1/3 px-2 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Image Manager (Multiple URLs / Upload with automatic compression) */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="uppercase tracking-wider text-zinc-300 font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>Ürün Fotoğrafları Galerisi ({formData.images.length})</span>
                  </label>
                  <label className={`cursor-pointer text-[11px] text-[#C5A059] hover:text-[#d6b26b] flex items-center gap-1 font-normal ${isCompressingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isCompressingImages ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimize ediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Bilgisayardan Yükle</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isCompressingImages} className="hidden" />
                  </label>
                </div>

                {/* Add Image via URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Görsel web bağlantısı yapıştırın (https://...)"
                    className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold rounded-xl transition-colors"
                  >
                    Ekle
                  </button>
                </div>

                {/* Image Thumbnails list */}
                {formData.images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 bg-black shadow">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-900 text-rose-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-[#C5A059] text-center font-bold py-0.5">
                            Kapak
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 4: Descriptions */}
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Kısa Vurgu Açıklaması
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Örn: Masif pirinç gövde, 3 kademeli sıcak amber dimmerli ışık."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Detaylı Tasarım & Ürün Hikayesi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Materyallerin kökeni, ışık dağılımı, kullanım alanları ve tasarım felsefesi..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              {/* Row 5: Specifications (Dimensions, Material, Light Specs) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Materyal
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="Doğal Mermer, Masif Pirinç"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Boyutlar
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="Y: 35cm | Çap: 22cm"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Işık & Duy Özelliği
                  </label>
                  <input
                    type="text"
                    value={formData.lightSpecs}
                    onChange={(e) => setFormData({ ...formData, lightSpecs: e.target.value })}
                    placeholder="2700K Sıcak Işık | E27 LED"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Featured & New Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-[#C5A059]"
                  />
                  <span>Öne Çıkan Koleksiyon Parçası</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-[#C5A059]"
                  />
                  <span>Yeni Ürün Rozeti</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressingImages}
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'Değişiklikleri Kaydet' : 'Ürünü Yayınla'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Google Merchant Center Feed Modal */}
      <GoogleMerchantFeedModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        products={products}
      />
    </div>
  );
};
