import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Type, 
  Megaphone, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Layers, 
  Package, 
  ShieldCheck,
  ShoppingBag,
  Info,
  Loader2,
  FileText,
  SlidersHorizontal,
  Palette,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Plus,
  Paintbrush
} from 'lucide-react';
import { useSiteSettings, DEFAULT_SITE_SETTINGS, SiteSettings, AnnouncementTemplate } from '../../context/SiteSettingsContext';

type TabType = 'brand' | 'announcement' | 'categories' | 'products' | 'productDetail' | 'cart' | 'contact' | 'footer';

export const ContentEditor: React.FC = () => {
  const { settings, updateSettings, loading } = useSiteSettings();
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<TabType>('brand');
  const [newTemplateName, setNewTemplateName] = useState('');

  // Keep form data in sync if settings load from firestore
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCustomTemplate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const text = formData.announcementText?.trim();
    if (!text) {
      alert('Lütfen önce duyuru metni girin.');
      return;
    }
    const name = newTemplateName.trim() || `Şablon #${(formData.savedAnnouncementTemplates?.length || 0) + 1}`;
    const newTpl: AnnouncementTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      text,
      bgColor: formData.announcementBgColor || '#121215',
      textColor: formData.announcementTextColor || '#C5A059',
      createdAt: Date.now()
    };
    const updatedList = [newTpl, ...(formData.savedAnnouncementTemplates || [])];
    setFormData(prev => ({
      ...prev,
      savedAnnouncementTemplates: updatedList
    }));
    setNewTemplateName('');
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updatedList = (formData.savedAnnouncementTemplates || []).filter(t => t.id !== id);
    setFormData(prev => ({
      ...prev,
      savedAnnouncementTemplates: updatedList
    }));
  };

  const handleApplyTemplate = (tpl: { text: string; bgColor?: string; textColor?: string }, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setFormData(prev => ({
      ...prev,
      announcementText: tpl.text,
      announcementBgColor: tpl.bgColor || prev.announcementBgColor || '#121215',
      announcementTextColor: tpl.textColor || prev.announcementTextColor || '#C5A059'
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setFormData(DEFAULT_SITE_SETTINGS);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C5A059] mb-3" />
        <p>Site içerik ayarları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bento-card p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold mb-1">
            <Type className="w-4 h-4" />
            <span>KAPSAMLI CANLI İÇERİK & METİN EDİTÖRÜ</span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Tüm Site Metinlerini ve Buton Yazılarını Düzenleyin
          </h2>
          <p className="text-xs text-zinc-400 font-light mt-1 max-w-2xl">
            Menü butonlarından ürün kartlarına, sepet uyarılarından sipariş tamamlama yazılarına ve iletişim alanlarına kadar mağazadaki HER metni buradan özelleştirebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2"
            title="Varsayılanlara Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Kaydedildi!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Tüm site metinleri başarıyla güncellendi ve anında mağazada yayınlandı.</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
        <button
          onClick={() => setActiveSection('brand')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'brand' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Marka & Üst Menü</span>
        </button>

        <button
          onClick={() => setActiveSection('announcement')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'announcement' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Duyuru Bandı</span>
        </button>

        <button
          onClick={() => setActiveSection('categories')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'categories' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Kategori Bölümü</span>
        </button>

        <button
          onClick={() => setActiveSection('products')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'products' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Ürün Vitrini & Kartlar</span>
        </button>

        <button
          onClick={() => setActiveSection('productDetail')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'productDetail' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Ürün Detay Modalı</span>
        </button>

        <button
          onClick={() => setActiveSection('cart')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'cart' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Sepet & Ödeme</span>
        </button>

        <button
          onClick={() => setActiveSection('contact')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'contact' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>İletişim & Özel Tasarım</span>
        </button>

        <button
          onClick={() => setActiveSection('footer')}
          className={`px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'footer' ? 'bg-[#C5A059] text-black shadow-md' : 'glass-panel text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Altbilgi (Footer)</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: Brand & Header */}
        {activeSection === 'brand' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <Sparkles className="w-5 h-5 text-[#C5A059]" /> Marka Kimliği & Üst Menü Yazıları
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Marka İsmi (Logo Yazısı)
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="LUMEN"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Marka Alt Başlığı (Slogan)
                </label>
                <input
                  type="text"
                  value={formData.brandTagline}
                  onChange={(e) => handleChange('brandTagline', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="ATELIER D'ART"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Özel Logo Görseli (URL veya Dosya Yükleme)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                {formData.brandLogoUrl ? (
                  <div className="relative group bg-zinc-900 border border-white/10 rounded-lg p-2 flex items-center justify-center h-16 w-36 flex-shrink-0">
                    <img 
                      src={formData.brandLogoUrl} 
                      alt="Marka Logosu" 
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('brandLogoUrl', '')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow transition-colors"
                      title="Logoyu Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-36 flex-shrink-0 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-zinc-500 text-[11px] bg-white/[0.02]">
                    <span>Metin Logo Aktif</span>
                  </div>
                )}

                <div className="flex-1 w-full space-y-2">
                  <input
                    type="url"
                    value={formData.brandLogoUrl || ''}
                    onChange={(e) => handleChange('brandLogoUrl', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                    placeholder="https://... veya aşağıdan dosya seçin"
                  />
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-zinc-200 rounded-lg text-xs font-medium transition-colors border border-white/10">
                      <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Cihazdan Logo Dosyası Seç (.png, .svg, .webp)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                handleChange('brandLogoUrl', event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      (Boş bırakıldığında lüks tipografik LUMEN logosu kullanılır)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Marka Kısa Açıklaması
              </label>
              <textarea
                rows={2}
                value={formData.brandDescription}
                onChange={(e) => handleChange('brandDescription', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                placeholder="Lüks masa lambaları, heykelsi abajurlar..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Güven / Kalite Rozeti Metni
              </label>
              <input
                type="text"
                value={formData.brandBadge}
                onChange={(e) => handleChange('brandBadge', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                placeholder="%100 Orijinal Tasarım & Seçkin Koleksiyon"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold mb-4">
                Üst Gezinme Menüsü Buton Yazıları
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tüm Ürünler Butonu</label>
                  <input
                    type="text"
                    value={formData.navAllProductsText || 'Tüm Koleksiyon'}
                    onChange={(e) => handleChange('navAllProductsText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Kategoriler Menüsü Butonu</label>
                  <input
                    type="text"
                    value={formData.navCategoriesDropdownText || 'Kategoriler'}
                    onChange={(e) => handleChange('navCategoriesDropdownText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">İletişim Menü Butonu</label>
                  <input
                    type="text"
                    value={formData.navContactText || 'Özel Tasarım & İletişim'}
                    onChange={(e) => handleChange('navContactText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Arama Penceresi İpucu Metni (Placeholder)
              </label>
              <input
                type="text"
                value={formData.searchModalPlaceholder || 'Lamba adı, pirinç, mermer, kategori ara...'}
                onChange={(e) => handleChange('searchModalPlaceholder', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        )}

        {/* SECTION 2: Announcement Bar */}
        {activeSection === 'announcement' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-7 border border-white/10">
            {/* Header & Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-wide">
                  <Megaphone className="w-5 h-5 text-[#C5A059]" /> Üst Duyuru Bandı (Header Bar)
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Ziyaretçilerin mağazaya girdiğinde en üstte gördüğü lüks kampanya, bildirim ve duyuru çubuğu.
                </p>
              </div>

              {/* Fixed & Styled Switch Button */}
              <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  role="switch"
                  id="announcement-toggle-btn"
                  aria-checked={formData.announcementActive}
                  onClick={() => handleChange('announcementActive', !formData.announcementActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                    formData.announcementActive ? 'bg-[#C5A059]' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      formData.announcementActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-zinc-200 select-none">
                  {formData.announcementActive ? 'Aktif (Yayında)' : 'Pasif (Gizli)'}
                </span>
              </div>
            </div>

            {/* Announcement Text Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                  Duyuru Metni
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {formData.announcementText?.length || 0} karakter
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.announcementText}
                onChange={(e) => handleChange('announcementText', e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors"
                placeholder="✨ Tüm Türkiye’ye Ücretsiz Sigortalı Kargo | Özel Proje Talepleri İçin İletişime Geçin"
              />
            </div>

            {/* COLOR PALETTE & SELECTION SECTION */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs uppercase tracking-widest text-zinc-200 font-bold">
                    Duyuru Bandı Renk Seçimi
                  </h4>
                </div>
                <span className="text-[10px] text-zinc-400">Canlı olarak anında uygulanır</span>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950/70 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 font-semibold mb-0.5">
                      Arka Plan Rengi
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formData.announcementBgColor || '#121215'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.announcementBgColor || '#121215'}
                      onChange={(e) => handleChange('announcementBgColor', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/20 p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.announcementBgColor || '#121215'}
                      onChange={(e) => handleChange('announcementBgColor', e.target.value)}
                      className="w-24 bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/70 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 font-semibold mb-0.5">
                      Yazı & İkon Rengi
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formData.announcementTextColor || '#C5A059'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.announcementTextColor || '#C5A059'}
                      onChange={(e) => handleChange('announcementTextColor', e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/20 p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.announcementTextColor || '#C5A059'}
                      onChange={(e) => handleChange('announcementTextColor', e.target.value)}
                      className="w-24 bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOM USER TEMPLATES SECTION */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-xs uppercase tracking-widest text-zinc-200 font-bold">
                    Özel Şablonlarım
                  </h4>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {formData.savedAnnouncementTemplates?.length || 0} Kayıtlı Şablon
                </span>
              </div>

              {/* Save Current Template Form */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950/70 p-3 rounded-xl border border-white/10">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Şablon İsmi (Örn: Hafta Sonu İndirimi, Lansman...)"
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomTemplate}
                  className="px-4 py-2 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Şablonu Kaydet</span>
                </button>
              </div>

              {/* Saved Templates List */}
              {(!formData.savedAnnouncementTemplates || formData.savedAnnouncementTemplates.length === 0) ? (
                <div className="p-6 text-center rounded-xl bg-zinc-950/50 border border-dashed border-white/10">
                  <Bookmark className="w-6 h-6 text-zinc-600 mx-auto mb-1.5" />
                  <p className="text-xs text-zinc-400 font-light">Henüz kayıtlı özel şablonunuz bulunmuyor.</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Yukarıdaki kutudan duyuru metninizi ve renklerinizi istediğiniz zaman şablon olarak kaydedebilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.savedAnnouncementTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3.5 rounded-xl bg-zinc-950/90 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {tpl.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/30" 
                              style={{ backgroundColor: tpl.bgColor || '#121215' }}
                              title="Arka plan rengi"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/30" 
                              style={{ backgroundColor: tpl.textColor || '#C5A059' }}
                              title="Yazı rengi"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-300 line-clamp-2 bg-black/40 p-2 rounded-lg border border-white/5">
                          {tpl.text}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={(e) => handleApplyTemplate(tpl, e)}
                          className="px-3 py-1 bg-white/10 hover:bg-[#C5A059] text-zinc-200 hover:text-black rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Bu Şablonu Uygula</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Şablonu Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE BANNER PREVIEW */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs uppercase tracking-wider text-[#C5A059] font-bold">
                  Canlı Mağaza Önizlemesi
                </label>
                <span className="text-[10px] text-zinc-400">
                  {formData.announcementActive ? 'Mağazada Görünüyor' : 'Mağazada Gizli'}
                </span>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: formData.announcementBgColor || '#121215', 
                  color: formData.announcementTextColor || '#C5A059' 
                }}
                className="border border-white/10 rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium shadow-inner transition-colors duration-300"
              >
                <Sparkles 
                  className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" 
                  style={{ color: formData.announcementTextColor || '#C5A059' }} 
                />
                <span className="truncate">{formData.announcementText || '(Duyuru metni girilmedi)'}</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Category Section Texts */}
        {activeSection === 'categories' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <Layers className="w-5 h-5 text-[#C5A059]" /> Kategori Bölümü Başlık ve Açıklamaları
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Kategori Bölüm Rozeti
                </label>
                <input
                  type="text"
                  value={formData.categorySectionBadge}
                  onChange={(e) => handleChange('categorySectionBadge', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="BENTO KOLEKSİYON DİZİLİMİ"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Kategori Ana Başlığı
                </label>
                <input
                  type="text"
                  value={formData.categorySectionTitle}
                  onChange={(e) => handleChange('categorySectionTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Kategoriye Göre Keşfedin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Kategori Bölüm Açıklaması
              </label>
              <textarea
                rows={2}
                value={formData.categorySectionDescription}
                onChange={(e) => handleChange('categorySectionDescription', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                placeholder="Yaşam alanlarınıza sıcaklık ve heykelsi bir estetik katmak için..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Kategori Kartı Keşfet Butonu Yazısı
              </label>
              <input
                type="text"
                value={formData.categoryCardExploreText || 'Koleksiyonu Keşfet'}
                onChange={(e) => handleChange('categoryCardExploreText', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: Products Section Texts */}
        {activeSection === 'products' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <Package className="w-5 h-5 text-[#C5A059]" /> Ürün Vitrini & Kart Metinleri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Ürün Vitrin Rozeti
                </label>
                <input
                  type="text"
                  value={formData.productSectionBadge}
                  onChange={(e) => handleChange('productSectionBadge', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="LÜKS AYDINLATMA KOLEKSİYONU"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Ürün Vitrini Ana Başlığı
                </label>
                <input
                  type="text"
                  value={formData.productSectionTitle}
                  onChange={(e) => handleChange('productSectionTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Tüm Tasarımlar"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Ürün Vitrini Açıklaması
              </label>
              <textarea
                rows={2}
                value={formData.productSectionDescription}
                onChange={(e) => handleChange('productSectionDescription', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                placeholder="Yaşam alanlarınız için özenle tasarlanan modern ve heykelsi aydınlatma armatürleri."
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold mb-4">
                Ürün Kartı ve Filtre Yazıları
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tüm Ürünler Filtre Sekmesi</label>
                  <input
                    type="text"
                    value={formData.productFilterAllText || 'Tümü'}
                    onChange={(e) => handleChange('productFilterAllText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Arama Çubuğu Placeholder</label>
                  <input
                    type="text"
                    value={formData.productSearchInputPlaceholder || 'Lamba veya materyal ara...'}
                    onChange={(e) => handleChange('productSearchInputPlaceholder', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Stok Filtresi Kutucuğu</label>
                  <input
                    type="text"
                    value={formData.productStockFilterText || 'Yalnızca Stokta'}
                    onChange={(e) => handleChange('productStockFilterText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Detay Butonu</label>
                  <input
                    type="text"
                    value={formData.productCardDetailBtnText || 'Detay'}
                    onChange={(e) => handleChange('productCardDetailBtnText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Sepete Ekle Butonu</label>
                  <input
                    type="text"
                    value={formData.productCardAddBtnText || 'Sepete'}
                    onChange={(e) => handleChange('productCardAddBtnText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tükendi Rozeti</label>
                  <input
                    type="text"
                    value={formData.productCardOutOfStockText || 'Tükendi'}
                    onChange={(e) => handleChange('productCardOutOfStockText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Yeni Seri Rozeti</label>
                  <input
                    type="text"
                    value={formData.productCardNewArrivalText || 'Yeni Seri'}
                    onChange={(e) => handleChange('productCardNewArrivalText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
                Ürün Bulunamadı / Boş Liste Metinleri
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Boş Vitrin Başlığı</label>
                  <input
                    type="text"
                    value={formData.productEmptyStateTitle || 'Yeni Koleksiyon Yakında'}
                    onChange={(e) => handleChange('productEmptyStateTitle', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Bülten Buton Yazısı</label>
                  <input
                    type="text"
                    value={formData.productEmptyNewsletterBtnText || 'Haber Ver'}
                    onChange={(e) => handleChange('productEmptyNewsletterBtnText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Boş Vitrin Açıklama Metni</label>
                <textarea
                  rows={2}
                  value={formData.productEmptyStateDesc || ''}
                  onChange={(e) => handleChange('productEmptyStateDesc', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Product Detail Modal */}
        {activeSection === 'productDetail' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <Info className="w-5 h-5 text-[#C5A059]" /> Ürün Detay Modalı & Güvence Metinleri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Hikaye Başlığı</label>
                <input
                  type="text"
                  value={formData.productDetailStoryTitle || 'Tasarım Hikayesi'}
                  onChange={(e) => handleChange('productDetailStoryTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">KDV Notu</label>
                <input
                  type="text"
                  value={formData.productDetailTaxIncludedText || 'KDV Dâhil'}
                  onChange={(e) => handleChange('productDetailTaxIncludedText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Materyal Etiketi</label>
                <input
                  type="text"
                  value={formData.productDetailMaterialLabel || 'Materyal'}
                  onChange={(e) => handleChange('productDetailMaterialLabel', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Boyutlar Etiketi</label>
                <input
                  type="text"
                  value={formData.productDetailDimensionsLabel || 'Boyutlar'}
                  onChange={(e) => handleChange('productDetailDimensionsLabel', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Işık & Duy Etiketi</label>
                <input
                  type="text"
                  value={formData.productDetailLightSpecsLabel || 'Işık & Duy'}
                  onChange={(e) => handleChange('productDetailLightSpecsLabel', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Garanti Başlığı</label>
                <input
                  type="text"
                  value={formData.productDetailWarrantyTitle || 'Garanti & Kalite'}
                  onChange={(e) => handleChange('productDetailWarrantyTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Garanti Açıklaması
                </label>
                <input
                  type="text"
                  value={formData.productDetailWarrantyText || '2 Yıl Atölye Garantisi'}
                  onChange={(e) => handleChange('productDetailWarrantyText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Kargo & Güvenli Teslimat Bandı Metni
                </label>
                <input
                  type="text"
                  value={formData.productDetailShippingBanner || 'Özel ahşap sandıklı korumalı paketleme & ücretsiz sigortalı teslimat.'}
                  onChange={(e) => handleChange('productDetailShippingBanner', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Sepete Ekle Buton Metni
                </label>
                <input
                  type="text"
                  value={formData.productDetailAddToCartText || 'Sepete Ekle'}
                  onChange={(e) => handleChange('productDetailAddToCartText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Hızlı Satın Al (3D Secure) Buton Metni
                </label>
                <input
                  type="text"
                  value={formData.productDetailInstantCheckoutText || 'Hemen Al & 3D Secure ile Güvenli Öde'}
                  onChange={(e) => handleChange('productDetailInstantCheckoutText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Cart & Checkout */}
        {activeSection === 'cart' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <ShoppingBag className="w-5 h-5 text-[#C5A059]" /> Alışveriş Sepeti ve Ödeme Metinleri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Sepet Çekmecesi Başlığı
                </label>
                <input
                  type="text"
                  value={formData.cartTitle || 'Alışveriş Sepeti'}
                  onChange={(e) => handleChange('cartTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Boş Sepet Başlığı
                </label>
                <input
                  type="text"
                  value={formData.cartEmptyTitle || 'Sepetiniz Boş'}
                  onChange={(e) => handleChange('cartEmptyTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Boş Sepet Açıklama Yazısı
              </label>
              <textarea
                rows={2}
                value={formData.cartEmptyDesc || ''}
                onChange={(e) => handleChange('cartEmptyDesc', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Ücretsiz Kargo Kazanıldı Bildirimi
                </label>
                <input
                  type="text"
                  value={formData.cartFreeShippingReachedText || 'Tebrikler! Siparişinize özel ücretsiz sigortalı kargo uygulandı.'}
                  onChange={(e) => handleChange('cartFreeShippingReachedText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Ödemeye Geç / Siparişi Tamamla Buton Yazısı
                </label>
                <input
                  type="text"
                  value={formData.cartCheckoutBtnText || 'Siparişi Tamamla & Güvenli Öde'}
                  onChange={(e) => handleChange('cartCheckoutBtnText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Güvenlik Rozeti ve Ödeme Notu
              </label>
              <input
                type="text"
                value={formData.cartSecurityBadgeText || 'PCI-DSS Seviye 1 & 3D Secure Korumalı Güvenli Ödeme'}
                onChange={(e) => handleChange('cartSecurityBadgeText', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        )}

        {/* SECTION 7: Contact & Custom Order Section */}
        {activeSection === 'contact' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <MapPin className="w-5 h-5 text-[#C5A059]" /> İletişim, Adres ve Özel Tasarım Formu Metinleri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  İletişim Rozeti
                </label>
                <input
                  type="text"
                  value={formData.contactBadge}
                  onChange={(e) => handleChange('contactBadge', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="ÖZEL TASARIM & TALEP"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  İletişim Ana Başlığı
                </label>
                <input
                  type="text"
                  value={formData.contactTitle}
                  onChange={(e) => handleChange('contactTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Size Özel Işık Tasarımı"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                İletişim Açıklaması
              </label>
              <textarea
                rows={3}
                value={formData.contactDescription}
                onChange={(e) => handleChange('contactDescription', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Adres Başlığı & Metni
                </label>
                <input
                  type="text"
                  value={formData.contactAddressTitle}
                  onChange={(e) => handleChange('contactAddressTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-100 mb-2 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Showroom & Merkez"
                />
                <input
                  type="text"
                  value={formData.contactAddressText}
                  onChange={(e) => handleChange('contactAddressText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Yenimahalle Mah. Teyyareci Sadık Sok. No:50 A, 34142 Bakırköy / İstanbul"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> E-posta Başlığı & Adresi
                </label>
                <input
                  type="text"
                  value={formData.contactEmailTitle}
                  onChange={(e) => handleChange('contactEmailTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-100 mb-2 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Özel Tasarım & Sipariş İletişimi"
                />
                <input
                  type="text"
                  value={formData.contactEmailText}
                  onChange={(e) => handleChange('contactEmailText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#C5A059]"
                  placeholder="hello@lumenlatelier.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> Telefon / WhatsApp Başlığı & Numarası
                </label>
                <input
                  type="text"
                  value={formData.contactPhoneTitle}
                  onChange={(e) => handleChange('contactPhoneTitle', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-100 mb-2 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Müşteri Hattı & WhatsApp"
                />
                <input
                  type="text"
                  value={formData.contactPhoneText}
                  onChange={(e) => handleChange('contactPhoneText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#C5A059]"
                  placeholder="+90 537 267 53 86"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
                İletişim & Proje Talep Formu Etiketleri
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">İsim Soyisim Etiketi</label>
                  <input
                    type="text"
                    value={formData.contactFormNameLabel || 'Adınız Soyadınız *'}
                    onChange={(e) => handleChange('contactFormNameLabel', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">E-posta Etiketi</label>
                  <input
                    type="text"
                    value={formData.contactFormEmailLabel || 'E-posta Adresiniz *'}
                    onChange={(e) => handleChange('contactFormEmailLabel', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Telefon Etiketi</label>
                  <input
                    type="text"
                    value={formData.contactFormPhoneLabel || 'Telefon Numaranız'}
                    onChange={(e) => handleChange('contactFormPhoneLabel', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Proje Türü Etiketi</label>
                  <input
                    type="text"
                    value={formData.contactFormTypeLabel || 'Proje Türü'}
                    onChange={(e) => handleChange('contactFormTypeLabel', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Form Gönder Butonu Yazısı</label>
                  <input
                    type="text"
                    value={formData.contactFormSubmitBtnText || 'Özel Tasarım Talebi Gönder'}
                    onChange={(e) => handleChange('contactFormSubmitBtnText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Mesaj / İstekler Alanı Etiketi</label>
                <input
                  type="text"
                  value={formData.contactFormMessageLabel || 'Proje Detayları & Özel İstekleriniz *'}
                  onChange={(e) => handleChange('contactFormMessageLabel', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Başarı Mesajı Başlığı</label>
                  <input
                    type="text"
                    value={formData.contactSuccessTitle || 'Talebiniz Atölyemize Ulaştı'}
                    onChange={(e) => handleChange('contactSuccessTitle', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Başarı Mesajı Açıklaması</label>
                  <input
                    type="text"
                    value={formData.contactSuccessText || 'Aydınlatma tasarım uzmanımız en geç 24 saat içerisinde sizinle irtibata geçecektir.'}
                    onChange={(e) => handleChange('contactSuccessText', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: Footer Texts */}
        {activeSection === 'footer' && (
          <div className="bento-card p-6 sm:p-8 rounded-2xl space-y-6 border border-white/10">
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 tracking-wide">
              <ShieldCheck className="w-5 h-5 text-[#C5A059]" /> Altbilgi (Footer) Metinleri
            </h3>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                Footer Marka Açıklama Yazısı
              </label>
              <textarea
                rows={2}
                value={formData.footerBrandText}
                onChange={(e) => handleChange('footerBrandText', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  1. Sütun Başlığı
                </label>
                <input
                  type="text"
                  value={formData.footerCol1Title || 'Koleksiyonlar'}
                  onChange={(e) => handleChange('footerCol1Title', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  2. Sütun Başlığı
                </label>
                <input
                  type="text"
                  value={formData.footerCol2Title || 'Hizmetler & Destek'}
                  onChange={(e) => handleChange('footerCol2Title', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  3. Sütun Başlığı
                </label>
                <input
                  type="text"
                  value={formData.footerCol3Title || 'Güvenli Ödeme Altyapısı'}
                  onChange={(e) => handleChange('footerCol3Title', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Footer Kalite / Güvence Rozeti
                </label>
                <input
                  type="text"
                  value={formData.footerQualityBadge}
                  onChange={(e) => handleChange('footerQualityBadge', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                  placeholder="Tescilli Özgün Tasarım & 2 Yıl Garanti"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Telif Hakkı (Copyright) Metni
                </label>
                <input
                  type="text"
                  value={formData.footerCopyright}
                  onChange={(e) => handleChange('footerCopyright', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Güvenlik & Firestore Senkronizasyon Notu
                </label>
                <input
                  type="text"
                  value={formData.footerSecurityNote || 'Tüm ürün, metin ve siparişler gerçek zamanlı Firestore veritabanı ile senkronizedir.'}
                  onChange={(e) => handleChange('footerSecurityNote', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">
                  Şehirler / Atölye Lokasyonları
                </label>
                <input
                  type="text"
                  value={formData.footerCitiesText || 'İstanbul · Floransa · Zürih'}
                  onChange={(e) => handleChange('footerCitiesText', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#C5A059]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Değişiklikler Kaydedildi!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Tüm Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
