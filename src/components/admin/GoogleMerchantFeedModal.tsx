import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ShoppingBag, 
  Layers, 
  ArrowRight,
  Info,
  Globe,
  RefreshCw,
  Code,
  FileCode
} from 'lucide-react';
import { Product } from '../../types';
import { generateGoogleMerchantXml } from '../../lib/googleMerchantFeed';

interface GoogleMerchantFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const GoogleMerchantFeedModal: React.FC<GoogleMerchantFeedModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'guide' | 'code' | 'preview'>('url');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://lumenlatelier.com';
  const feedUrl = `${currentOrigin}/api/feeds/google-merchant.xml`;
  const xmlContent = generateGoogleMerchantXml(products, currentOrigin);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  const handleClientDownload = () => {
    try {
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'google-merchant-lumen.xml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(feedUrl + '?download=1', '_blank');
    }
  };

  const inStockCount = products.filter(p => p.stockStatus === 'in_stock' || (p.stockQuantity && p.stockQuantity > 0)).length;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0F0F12] border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 glass-panel my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-luxury text-base sm:text-lg text-white uppercase tracking-wider">
                  Google Merchant Center & Alışveriş Akışı
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Otomatik XML
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Google Shopping ve Google Alışveriş aramaları için %100 uyumlu RSS 2.0 XML veri akışı.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'url'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Akış Bağlantısı (Feed URL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3 Adımda Kurulum Rehberi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'code'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            XML Kodunu Gör & Kopyala
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Akış Özeti ({products.length} Ürün)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: Feed URL & Quick Actions */}
          {activeTab === 'url' && (
            <div className="space-y-5">
              
              {/* Stat overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  <div className="text-[11px] text-zinc-400">Toplam Yayındaki Ürün</div>
                  <div className="text-xl font-serif-luxury font-bold text-[#C5A059] mt-0.5">
                    {products.length} Adet
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  <div className="text-[11px] text-zinc-400">Stokta Bulunanlar</div>
                  <div className="text-xl font-serif-luxury font-bold text-emerald-400 mt-0.5">
                    {inStockCount} Adet
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  <div className="text-[11px] text-zinc-400">Akış Formatı</div>
                  <div className="text-xs font-mono font-bold text-zinc-200 mt-1">
                    Google XML (RSS 2.0)
                  </div>
                </div>
              </div>

              {/* Feed URL Box */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-zinc-300 font-bold flex items-center justify-between">
                  <span>Google Merchant XML Veri Akışı URL'si</span>
                  <span className="text-[11px] text-[#C5A059] font-normal lowercase">otomatik günlük senkronize</span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-mono text-[#C5A059] truncate select-all shadow-inner">
                    {feedUrl}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                      copiedUrl 
                        ? 'bg-emerald-500 text-black' 
                        : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black border border-[#C5A059]'
                    }`}
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClientDownload}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>XML Dosyasını İndir (.xml)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Code className="w-4 h-4 text-[#C5A059]" />
                  <span>XML Kodunu İncele</span>
                </button>

                <a
                  href="https://merchants.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-all ml-auto cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Merchant Center Paneli</span>
                </a>
              </div>

              {/* Notice Box */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex gap-3 leading-relaxed">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 font-semibold block mb-1">Otomatik Güncelleme Garantisi:</strong>
                  Sitenize yeni lamba eklediğinizde, fiyatları değiştirdiğinizde veya stok durumunu güncellediğinizde bu XML dosyası anında canlı olarak güncellenir. Google Merchant Center her gün bu linki otomatik tarar.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Step-by-Step Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h3 className="font-serif-luxury text-sm uppercase tracking-wider text-white">
                Google Merchant Center'a Akış Ekleme Adımları:
              </h3>

              <div className="space-y-3 text-xs">
                {/* Step 1 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-7 h-7 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-serif-luxury font-bold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-white text-xs">Merchant Center Hesabınıza Giriş Yapın</div>
                    <p className="text-zinc-400 leading-relaxed">
                      <a href="https://merchants.google.com/" target="_blank" rel="noreferrer" className="text-[#C5A059] hover:underline">merchants.google.com</a> adresine gidin. Sol menüden <strong>Ürünler (Products) &gt; Veri Akışları (Feeds)</strong> sekmesine tıklayın.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-7 h-7 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-serif-luxury font-bold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-white text-xs">Yeni Birincil Veri Akışı Oluşturun</div>
                    <p className="text-zinc-400 leading-relaxed">
                      Mavi <strong>"+" (Akış Ekle)</strong> butonuna basın. Hedef Ülke: <strong>Türkiye</strong>, Dil: <strong>Türkçe</strong> seçin.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3.5 items-start">
                  <div className="w-7 h-7 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-serif-luxury font-bold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-white text-xs">"Planlanmış Alma (Scheduled Fetch)" Yöntemini Seçin</div>
                    <p className="text-zinc-400 leading-relaxed">
                      Kurulum yöntemlerinde <strong>Planlanmış Alma</strong> seçeneğini işaretleyin. Dosya URL'si kutucuğuna yukarıdaki <code>{feedUrl}</code> linkini yapıştırın ve Alma Sıklığını <strong>Günlük (Daily)</strong> olarak ayarlayın.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Tebrikler! Google 15-30 dakika içinde ürünlerinizi tarayarak Google Shopping ve Ücretsiz Listelemelere dahil edecektir.</span>
              </div>
            </div>
          )}

          {/* TAB 3: Raw XML Code */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-300">
                  Google Merchant için üretilen tam standart XML akış içeriği:
                </div>
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Kopyalandı!' : 'Tüm XML Kodunu Kopyala'}</span>
                </button>
              </div>

              <div className="bg-black/80 border border-white/15 rounded-2xl p-4 max-h-80 overflow-y-auto font-mono text-[11px] text-emerald-300 select-all leading-relaxed whitespace-pre shadow-inner">
                {xmlContent}
              </div>
            </div>
          )}

          {/* TAB 4: Preview of products */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Akışta bulunan {products.length} ürün listelenmektedir:</span>
                <span className="text-[#C5A059]">Google Product Category: 654 (Lamps)</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {products.map((p) => (
                  <div key={p.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=100&q=80'} 
                        alt={p.name} 
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          ID: <span className="font-mono text-zinc-300">{p.id}</span> | Kategori: {p.categoryName || 'Aydınlatma'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-serif-luxury font-bold text-[#C5A059]">
                        {p.price} TRY
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {p.stockStatus === 'in_stock' ? 'Stokta Var' : 'Tükendi'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedUrl ? 'Kopyalandı!' : 'Feed Linkini Kopyala'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
