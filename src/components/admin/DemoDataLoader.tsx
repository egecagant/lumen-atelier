import React, { useState } from 'react';
import { Sparkles, Trash2, CheckCircle2, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { db, COLLECTIONS, addDoc, getDocs, deleteDoc, doc, collection } from '../../lib/firebase';
import { SAMPLE_CATEGORIES, SAMPLE_BANNERS, SAMPLE_PRODUCTS } from '../../lib/sampleData';

export const DemoDataLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<'seed' | 'clear' | null>(null);

  const handleSeedDemoData = async () => {
    setConfirmModal(null);
    setLoading(true);
    setStatusMessage('Kategoriler oluşturuluyor...');

    try {
      // 1. Seed Categories
      const categoryMap: Record<string, string> = {};
      for (const cat of SAMPLE_CATEGORIES) {
        const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), cat);
        categoryMap[cat.slug] = docRef.id;
      }

      // 2. Seed Banners
      setStatusMessage('Hero afişleri ekleniyor...');
      for (const banner of SAMPLE_BANNERS) {
        await addDoc(collection(db, COLLECTIONS.BANNERS), banner);
      }

      // 3. Seed Products
      setStatusMessage('Lüks lamba ürünleri ekleniyor...');
      const sampleProds = SAMPLE_PRODUCTS(categoryMap);
      for (const prod of sampleProds) {
        await addDoc(collection(db, COLLECTIONS.PRODUCTS), prod);
      }

      setStatusMessage('Tüm örnek koleksiyon başarıyla Firestore veritabanına yüklendi!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Yükleme sırasında hata: ' + (err.message || 'Veritabanı hatası'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    setConfirmModal(null);
    setLoading(true);
    setStatusMessage('Veritabanı temizleniyor...');

    try {
      // Delete products
      const prodDocs = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      for (const d of prodDocs.docs) {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, d.id));
      }

      // Delete categories
      const catDocs = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      for (const d of catDocs.docs) {
        await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, d.id));
      }

      // Delete banners
      const bannerDocs = await getDocs(collection(db, COLLECTIONS.BANNERS));
      for (const d of bannerDocs.docs) {
        await deleteDoc(doc(db, COLLECTIONS.BANNERS, d.id));
      }

      setStatusMessage('Tüm ürün ve kategoriler silindi. Vitrin artık tamamen temiz ve boş durumda!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Temizleme hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111114] p-5 rounded-2xl border border-zinc-800">
        <h3 className="font-sans text-xl sm:text-2xl font-bold text-zinc-100 uppercase tracking-wider">
          Veritabanı & Demo Koleksiyon Aracı
        </h3>
        <p className="text-xs text-zinc-400 font-light mt-0.5">
          İster tek tıkla örnek lüks lamba koleksiyonunu (çocuk lambaları, mermer lambaderler, pirinç armatürler) yükleyin, ister sıfırlayıp tamamen boş vitrinden kendi ürünlerinizi ekleyin.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-[#c5a880]/40 text-xs text-[#c5a880] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Seed Data */}
        <div className="p-6 rounded-2xl bg-[#111114] border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-sans text-lg font-bold text-zinc-100 uppercase tracking-wide">
              Örnek Koleksiyonu Yükle
            </h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Kategorileri (Çocuk Masa Lambası, Dekoratif Lamba, Aydınlatma vb.), yüksek çözünürlüklü lüks ürünleri ve ana sayfa slider bannerlarını anında Firestore'a yükler.
            </p>
          </div>

          <button
            onClick={() => setConfirmModal('seed')}
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] hover:bg-[#e4bd43] text-black text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Örnek Koleksiyonu Yükle</span>
          </button>
        </div>

        {/* Card 2: Reset to Empty State */}
        <div className="p-6 rounded-2xl bg-[#111114] border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-sans text-lg font-bold text-zinc-100 uppercase tracking-wide">
              Veritabanını Sıfırla (Boş Vitrin)
            </h4>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Tüm ürün, kategori ve afiş verilerini tamamen siler. Vitrini sıfır ürünle "Koleksiyon Yakında" boş durumuna getirir.
            </p>
          </div>

          <button
            onClick={() => setConfirmModal('clear')}
            disabled={loading}
            className="w-full py-3 bg-zinc-900 hover:bg-rose-950/60 text-rose-400 border border-zinc-800 hover:border-rose-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Tüm Verileri Temizle & Boş Bırak</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
              confirmModal === 'seed' 
                ? 'bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {confirmModal === 'seed' ? <Sparkles className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>

            <div>
              <h4 className="font-sans text-lg font-bold text-zinc-100">
                {confirmModal === 'seed' ? 'Örnek Koleksiyon Yüklensin mi?' : 'Tüm Veriler Silinsin mi?'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                {confirmModal === 'seed'
                  ? 'Kategoriler, ürünler ve ana sayfa afişleri Firestore veritabanına eklenecektir.'
                  : 'Veritabanındaki tüm ürünler ve kategoriler silinecektir.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl transition-all border border-zinc-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmModal === 'seed' ? handleSeedDemoData : handleClearAllData}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  confirmModal === 'seed'
                    ? 'bg-[#d4af37] hover:bg-[#e4bd43] text-black'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <span>{confirmModal === 'seed' ? 'Evet, Yükle' : 'Evet, Sıfırla'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
