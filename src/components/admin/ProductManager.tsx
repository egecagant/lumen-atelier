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
  Rss,
  Star,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Palette,
  RotateCcw,
  Link as LinkIcon,
  CheckCircle2,
  Crop,
  Sliders
} from 'lucide-react';
import { Product, Category, StockStatus, ProductColorOption } from '../../types';
import { formatCurrency, slugify } from '../../lib/format';
import { db, COLLECTIONS, addDoc, updateDoc, deleteDoc, doc, collection, handleFirestoreError, OperationType } from '../../lib/firebase';
import { compressImageFiles, optimizeImageList, estimatePayloadSize } from '../../lib/imageCompressor';
import { GoogleMerchantFeedModal } from './GoogleMerchantFeedModal';
import { ImageCropperModal } from './ImageCropperModal';

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
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Image Preview & Edit State
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editImageUrlValue, setEditImageUrlValue] = useState<string>('');

  // Image Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [cropperTargetIdx, setCropperTargetIdx] = useState<number | null>(null);
  const [cropperImageUrl, setCropperImageUrl] = useState<string>('');

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
    bulbType: 'E27 Standart Vidalı Duy',
    powerConsumption: '8W LED (220V)',
    cableLength: '180 cm Tekstil Örgülü Kablo',
    energyClass: 'A++',
    featured: false,
    isNewArrival: true,
    images: [] as string[],
    colors: [] as ProductColorOption[]
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  // Color option inputs
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#d4af37');
  const [newColorImageUrl, setNewColorImageUrl] = useState('');

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
      bulbType: 'E27 Standart Vidalı Duy',
      powerConsumption: '8W LED Ampul (220V)',
      cableLength: '180 cm Tekstil Örgülü Kablo',
      energyClass: 'A++',
      featured: true,
      isNewArrival: true,
      images: [
        'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80'
      ],
      colors: []
    });
    setImageUrlInput('');
    setNewColorName('');
    setNewColorHex('#d4af37');
    setNewColorImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setErrorMessage(null);
    
    // Normalize existing colors (whether they were strings or objects)
    const normalizedColors: ProductColorOption[] = (prod.colors || []).map(c => {
      if (typeof c === 'string') {
        return { name: c, hex: '#C5A059' };
      }
      return c;
    });

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
      bulbType: prod.bulbType || 'E27 Standart Vidalı Duy',
      powerConsumption: prod.powerConsumption || '8W LED (220V)',
      cableLength: prod.cableLength || '180 cm Tekstil Örgülü Kablo',
      energyClass: prod.energyClass || 'A++',
      featured: prod.featured || false,
      isNewArrival: prod.isNewArrival || false,
      images: prod.images && prod.images.length > 0 ? [...prod.images] : [],
      colors: normalizedColors
    });
    setImageUrlInput('');
    setNewColorName('');
    setNewColorHex('#d4af37');
    setNewColorImageUrl('');
    setIsModalOpen(true);
  };

  // Image actions
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const openCropperForImage = (index: number) => {
    const targetUrl = formData.images[index];
    if (!targetUrl) return;
    setCropperTargetIdx(index);
    setCropperImageUrl(targetUrl);
    setIsCropperOpen(true);
  };

  const handleSaveCroppedImage = (croppedDataUrl: string) => {
    if (cropperTargetIdx === null) {
      // Add as new image
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, croppedDataUrl]
      }));
    } else {
      // Replace existing image at target index
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages[cropperTargetIdx] = croppedDataUrl;
        return { ...prev, images: newImages };
      });
    }
    setIsCropperOpen(false);
    setCropperTargetIdx(null);
    setCropperImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
    if (editingImageIndex === index) {
      setEditingImageIndex(null);
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      const [target] = newImages.splice(index, 1);
      newImages.unshift(target);
      return { ...prev, images: newImages };
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const targetIdx = direction === 'left' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[targetIdx];
      newImages[targetIdx] = temp;
      return { ...prev, images: newImages };
    });
  };

  const openEditImageModal = (index: number) => {
    setEditingImageIndex(index);
    setEditImageUrlValue(formData.images[index] || '');
  };

  const handleSaveEditedImage = () => {
    if (editingImageIndex === null || !editImageUrlValue.trim()) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[editingImageIndex] = editImageUrlValue.trim();
      return { ...prev, images: newImages };
    });
    setEditingImageIndex(null);
    setEditImageUrlValue('');
  };

  const handleReplaceImageFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingImages(true);
    try {
      const [compressed] = await compressImageFiles([file]);
      if (compressed) {
        setFormData(prev => {
          const newImages = [...prev.images];
          newImages[index] = compressed;
          return { ...prev, images: newImages };
        });
      }
      setEditingImageIndex(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Görsel güncellenirken hata oluştu.');
    } finally {
      setIsCompressingImages(false);
      e.target.value = '';
    }
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
      e.target.value = '';
    }
  };

  // Color options actions
  const handleAddCustomColor = () => {
    if (!newColorName.trim()) return;
    const exists = formData.colors.some(c => c.name.toLowerCase() === newColorName.trim().toLowerCase());
    if (exists) {
      setErrorMessage(`"${newColorName.trim()}" rengi zaten mevcut.`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: newColorName.trim(),
          hex: newColorHex || '#C5A059',
          imageUrl: newColorImageUrl.trim() || undefined
        }
      ]
    }));
    setNewColorName('');
    setNewColorImageUrl('');
  };

  const handleRemoveColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, idx) => idx !== index)
    }));
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
          : ['https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80']
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
        bulbType: formData.bulbType,
        powerConsumption: formData.powerConsumption,
        cableLength: formData.cableLength,
        energyClass: formData.energyClass,
        featured: formData.featured,
        isNewArrival: formData.isNewArrival,
        images: optimizedImages,
        colors: formData.colors,
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

  const handleQuickStatusChange = async (id: string, newStatus: StockStatus) => {
    try {
      setUpdatingStatusId(id);
      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, id), {
        stockStatus: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Error changing product status:', err);
      alert('Ürün durumu güncellenemedi.');
    } finally {
      setUpdatingStatusId(null);
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
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#d4af37] hover:bg-[#e4bd43] text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm border border-[#d4af37] transition-all cursor-pointer"
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
                        <div className="relative inline-block">
                          <select
                            value={prod.stockStatus || 'in_stock'}
                            disabled={updatingStatusId === prod.id}
                            onChange={(e) => handleQuickStatusChange(prod.id, e.target.value as StockStatus)}
                            className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 pr-6 border cursor-pointer appearance-none transition-all focus:outline-none ${
                              prod.stockStatus === 'in_stock'
                                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900/90'
                                : prod.stockStatus === 'coming_soon'
                                ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/30'
                                : prod.stockStatus === 'preorder'
                                ? 'bg-amber-950/80 border-amber-700 text-amber-300 hover:bg-amber-900/90'
                                : 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900/90'
                            } ${updatingStatusId === prod.id ? 'opacity-50 cursor-wait' : ''}`}
                            title="Durumu doğrudan buradan değiştirebilirsiniz"
                          >
                            <option value="in_stock" className="bg-[#141418] text-emerald-300">Stokta</option>
                            <option value="coming_soon" className="bg-[#141418] text-[#C5A059]">Yakında Gelecek</option>
                            <option value="preorder" className="bg-[#141418] text-amber-300">Ön Sipariş</option>
                            <option value="out_of_stock" className="bg-[#141418] text-rose-300">Tükendi</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-current opacity-70">
                            {updatingStatusId === prod.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span className="text-[9px]">▼</span>
                            )}
                          </div>
                        </div>
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
                      <option value="coming_soon" className="bg-[#111114]">Yakında Gelecek</option>
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

              {/* Row 3: Image Manager (Multiple URLs / Upload with automatic compression + Live Previews & Editing) */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="uppercase tracking-wider text-zinc-200 font-medium flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                      <span>Ürün Fotoğraf Galerisi ({formData.images.length})</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      İlk görsel varsayılan kapak fotoğrafıdır. Sıralayabilir, büyüterek önizleyebilir veya değiştirebilirsiniz.
                    </p>
                  </div>
                  <label className={`cursor-pointer text-[11px] text-[#C5A059] hover:text-[#d6b26b] flex items-center gap-1 font-medium bg-black/40 px-3 py-1.5 rounded-lg border border-[#C5A059]/30 transition-all ${isCompressingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isCompressingImages ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimize ediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fotoğraf Yükle</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isCompressingImages} className="hidden" />
                  </label>
                </div>

                {/* Add Image via URL with Live Preview */}
                <div className="flex gap-2 items-center">
                  {imageUrlInput.trim() && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#C5A059]/50 bg-black flex-shrink-0 relative group">
                      <img src={imageUrlInput.trim()} alt="Önizleme" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Görsel web bağlantısı yapıştırın (https://...)"
                    className="flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold rounded-xl transition-colors text-xs whitespace-nowrap"
                  >
                    Galeriye Ekle
                  </button>
                </div>

                {/* Interactive Image Thumbnails Gallery with Full Controls */}
                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {formData.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`relative group rounded-2xl overflow-hidden border transition-all bg-black flex flex-col ${
                          idx === 0 ? 'border-[#C5A059] ring-1 ring-[#C5A059]/50' : 'border-white/15 hover:border-white/40'
                        }`}
                      >
                        {/* Image Thumbnail Box */}
                        <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => setPreviewZoomImage(img)}>
                          <img 
                            src={img} 
                            alt={`Ürün Görseli ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />

                          {/* Cover Badge */}
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 bg-[#C5A059] text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 z-10">
                              <Star className="w-2.5 h-2.5 fill-black" />
                              <span>Ana Kapak</span>
                            </span>
                          ) : (
                            <span className="absolute top-2 left-2 bg-black/70 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                              #{idx + 1}
                            </span>
                          )}

                          {/* Click to Zoom Overlay on Hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-white flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-white/20">
                              <Maximize2 className="w-3 h-3" />
                              <span>Büyüt</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Control Bar under thumbnail */}
                        <div className="p-1.5 bg-[#121216] border-t border-white/10 flex items-center justify-between gap-1">
                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, 'left')}
                              title="Sola / Öne Taşı"
                              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === formData.images.length - 1}
                              onClick={() => handleMoveImage(idx, 'right')}
                              title="Sağa / Arkaya Taşı"
                              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Actions (Make Cover / Crop & Frame / Edit / Delete) */}
                          <div className="flex items-center gap-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleMakeCover(idx)}
                                title="Kapak Fotoğrafı Yap"
                                className="px-1.5 py-0.5 text-[9px] text-[#C5A059] hover:bg-[#C5A059]/10 rounded border border-[#C5A059]/30 transition-colors cursor-pointer"
                              >
                                Kapak Yap
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openCropperForImage(idx)}
                              title="Karede Konumlandır & Kırp"
                              className="p-1 text-zinc-400 hover:text-[#C5A059] hover:bg-[#C5A059]/10 rounded transition-colors cursor-pointer"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditImageModal(idx)}
                              title="Görseli Değiştir veya URL Güncelle"
                              className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Görseli Kaldır"
                              className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-black/20 text-zinc-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#C5A059]" />
                    <p className="text-xs">Henüz ürün fotoğrafı eklenmedi.</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Yukarıdaki bağlantı alanından veya 'Fotoğraf Yükle' butonundan görsel ekleyin.</p>
                  </div>
                )}
              </div>

              {/* Row 3.5: Color Options Manager (Renk Seçenekleri & Varyantlar - Sadece Kullanıcının Eklediği Özel Renkler) */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="uppercase tracking-wider text-zinc-200 font-medium flex items-center gap-1.5 text-xs">
                      <Palette className="w-4 h-4 text-[#C5A059]" />
                      <span>Renk & Gövde Seçenekleri ({formData.colors.length})</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Müşterilerinizin ürün detayında seçebileceği renk seçeneklerini belirleyin.
                    </p>
                  </div>
                </div>

                {/* Custom Color Adder Row */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="flex items-center gap-2">
                    {/* Color Swatch Picker */}
                    <div className="relative flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-xl">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        title="Renk Tonu Seçin"
                      />
                      <span className="font-mono text-[10px] text-zinc-400 uppercase">{newColorHex}</span>
                    </div>

                    {/* Color Name Input */}
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                      placeholder="Renk Adı (Örn: Antik Bronz, Saf Amber, Mat Siyah)"
                      className="flex-1 min-w-[170px] px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    {/* Optional Linked Image URL */}
                    <input
                      type="url"
                      value={newColorImageUrl}
                      onChange={(e) => setNewColorImageUrl(e.target.value)}
                      placeholder="Opsiyonel Renk Görseli URL'si"
                      className="flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none text-xs"
                    />

                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold rounded-xl transition-colors text-xs whitespace-nowrap cursor-pointer"
                    >
                      Renk Ekle
                    </button>
                  </div>
                </div>

                {/* Added Colors List */}
                {formData.colors.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.colors.map((color, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-zinc-200 group hover:border-[#C5A059]/40 transition-colors"
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0 shadow-sm" 
                          style={{ backgroundColor: color.hex || '#C5A059' }} 
                        />
                        <span className="font-medium text-xs text-zinc-100">{color.name}</span>
                        
                        {color.imageUrl && (
                          <div className="w-4 h-4 rounded overflow-hidden border border-white/20" title="Özel Görsel Bağlı">
                            <img src={color.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveColor(cIdx)}
                          className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                          title="Rengi Kaldır"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">Henüz renk seçeneği eklenmedi (tek standart model).</p>
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

              {/* Technical Specifications Row (Legal & Consumer Specs) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Duy Tipi (bulbType)
                  </label>
                  <input
                    type="text"
                    value={formData.bulbType || ''}
                    onChange={(e) => setFormData({ ...formData, bulbType: e.target.value })}
                    placeholder="E27 Standart Vidalı Duy"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Güç Tüketimi (powerConsumption)
                  </label>
                  <input
                    type="text"
                    value={formData.powerConsumption || ''}
                    onChange={(e) => setFormData({ ...formData, powerConsumption: e.target.value })}
                    placeholder="8W Enerji Tasarruflu LED (220V)"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Kablo Uzunluğu & Tipi (cableLength)
                  </label>
                  <input
                    type="text"
                    value={formData.cableLength || ''}
                    onChange={(e) => setFormData({ ...formData, cableLength: e.target.value })}
                    placeholder="180 cm Tekstil Örgülü Kablo"
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

      {/* Full-Screen Image Zoom / Inspector Preview Modal */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-[#0E0E11] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-2 text-zinc-300 text-xs">
                <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                <span className="font-semibold text-white">Yüksek Çözünürlüklü Görsel Önizleme</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Stage */}
            <div className="p-4 flex-1 flex items-center justify-center overflow-auto bg-black/40 min-h-[300px] max-h-[70vh]">
              <img 
                src={previewZoomImage} 
                alt="Önizleme" 
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl border border-white/10" 
              />
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-zinc-400">
              <span className="truncate max-w-md text-[11px] font-mono">{previewZoomImage}</span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="px-4 py-1.5 bg-[#C5A059] text-black font-semibold rounded-xl hover:bg-[#d6b26b] transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Image Edit / Replace Modal */}
      {editingImageIndex !== null && (
        <div 
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEditingImageIndex(null)}
        >
          <div 
            className="w-full max-w-md bg-[#0F0F12] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-semibold text-white text-sm">Görseli Değiştir veya Düzenle (#{editingImageIndex + 1})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingImageIndex(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Image Preview & Crop Trigger */}
            <div className="space-y-2">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center relative group">
                <img 
                  src={editImageUrlValue || formData.images[editingImageIndex]} 
                  alt="Önizleme" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLElement).style.opacity = '0.3'; }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetIdx = editingImageIndex;
                  const targetUrl = editImageUrlValue || formData.images[targetIdx];
                  setEditingImageIndex(null);
                  if (targetUrl) {
                    setCropperTargetIdx(targetIdx);
                    setCropperImageUrl(targetUrl);
                    setIsCropperOpen(true);
                  }
                }}
                className="w-full py-2.5 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
              >
                <Crop className="w-4 h-4" />
                <span>Görseli Kare İçinde Kırp & Konumlandır</span>
              </button>
            </div>

            {/* Replace by File */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                Bilgisayardan Yeni Dosya Yükle:
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-black/40 hover:bg-white/5 border border-dashed border-white/20 rounded-xl text-xs text-zinc-300 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-[#C5A059]" />
                <span>Yeni Görsel Seç</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleReplaceImageFile(editingImageIndex, e)} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Or Edit URL */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                veya Web Bağlantısını (URL) Güncelle:
              </label>
              <input
                type="url"
                value={editImageUrlValue}
                onChange={(e) => setEditImageUrlValue(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none text-xs"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingImageIndex(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveEditedImage}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Görseli Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Image Cropper & Square Framing Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          setCropperTargetIdx(null);
          setCropperImageUrl('');
        }}
        imageUrl={cropperImageUrl}
        onSaveCrop={handleSaveCroppedImage}
        aspectRatio="1:1"
        title="Ürün Görselini Kare Çerçevede Konumlandır & Kırp"
      />
    </div>
  );
};
