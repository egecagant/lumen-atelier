import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Phone, Mail, FileCheck2, Instagram } from 'lucide-react';
import { Category } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { COMPANY } from '../lib/companyInfo';

interface FooterProps {
  categories: Category[];
  isAdmin: boolean;
}

export const Footer: React.FC<FooterProps> = () => {
  const { settings } = useSiteSettings();

  const brandDisplayName = settings.brandName || 'LUMEN';
  const brandTaglineDisplay = settings.brandTagline || "ATELIER D'ART";

  return (
    <footer className="bg-[#08080A] border-t border-white/10 text-zinc-400 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Col 1: Brand & Official Contact (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex flex-col group">
              {settings.brandLogoUrl ? (
                <img 
                  src={settings.brandLogoUrl} 
                  alt={brandDisplayName} 
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <>
                  <span className="font-serif-luxury text-2xl tracking-[0.25em] font-semibold text-white group-hover:text-[#C5A059] transition-colors uppercase leading-none">
                    {brandDisplayName}
                  </span>
                  <span className="text-[9px] tracking-[0.4em] text-[#C5A059] uppercase mt-1 font-light leading-none">
                    {brandTaglineDisplay}
                  </span>
                </>
              )}
            </Link>
            <p className="text-zinc-400 text-xs font-light leading-relaxed">
              {settings.footerBrandText || "Işığın heykelsi formlarla buluştuğu bağımsız tasarım ve zanaat atölyesi. Küçük partiler ve el işçiliğiyle üretilen aydınlatma koleksiyonları."}
            </p>

            {/* Official Company Contact Details & Instagram */}
            <div className="space-y-2.5 pt-2 text-[11px] text-zinc-400 font-light border-t border-white/5">
              <div>
                <a
                  href={COMPANY.instagramUrl || "https://instagram.com/lumenatelier"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LUMEN ATELIER Instagram sayfasını ziyaret edin"
                  className="inline-flex items-center gap-2 -ml-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-[#C5A059] border border-white/10 transition-all text-xs group cursor-pointer"
                >
                  <Instagram className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                  <span className="font-medium tracking-wide">{COMPANY.instagramHandle || '@lumenatelier'}</span>
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                <span className="leading-snug">{COMPANY.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <a href={`tel:${COMPANY.phone}`} className="hover:text-white transition-colors">{COMPANY.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">{COMPANY.email}</a>
              </div>
            </div>
          </div>

          {/* Col 2: Alışveriş & Atölye (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              Alışveriş & Atölye
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/koleksiyon/tum-urunler" className="hover:text-[#C5A059] transition-colors">
                  Tüm Koleksiyon
                </Link>
              </li>
              <li>
                <Link to="/hakkimizda" className="hover:text-[#C5A059] transition-colors">
                  Hakkımızda & Atölye
                </Link>
              </li>
              <li>
                <Link to="/teslimat-ve-iade" className="hover:text-[#C5A059] transition-colors">
                  Teslimat & İade Koşulları
                </Link>
              </li>
              <li>
                <Link to="/ozel-tasarim" className="hover:text-[#C5A059] transition-colors">
                  Özel Tasarım & Mimari
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Yasal & Tüketici Hakları (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Yasal & Tüketici Hakları</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/mesafeli-satis-sozlesmesi" className="hover:text-[#C5A059] transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link to="/on-bilgilendirme-formu" className="hover:text-[#C5A059] transition-colors">
                  Ön Bilgilendirme Formu
                </Link>
              </li>
              <li>
                <Link to="/cayma-formu" className="hover:text-[#C5A059] transition-colors">
                  Örnek Cayma Formu
                </Link>
              </li>
              <li>
                <Link to="/gizlilik-politikasi" className="hover:text-[#C5A059] transition-colors">
                  Gizlilik ve KVKK Politikası
                </Link>
              </li>
              <li>
                <Link to="/cerez-politikasi" className="hover:text-[#C5A059] transition-colors">
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link to="/kullanim-kosullari" className="hover:text-[#C5A059] transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Güvenli Ödeme & Lojistik (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              {settings.footerCol3Title || 'Güvenli Ödeme Altyapısı'}
            </h4>
            <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
              Tüm ödemeler PCI-DSS Seviye 1 sertifikalı iyzico altyapısı ve 3D Secure ile gerçekleşir. Kart bilgileriniz sunucularımızda tutulmaz.
            </p>

            {/* Payment Logos Strip */}
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
                Desteklenen Ödeme Yöntemleri
              </div>
              <div className="flex items-center gap-2.5">
                <img src="/payment/visa.svg" alt="Visa" className="h-6 w-auto object-contain opacity-80" />
                <img src="/payment/mastercard.svg" alt="Mastercard" className="h-6 w-auto object-contain opacity-80" />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/5">
              Kargo Çözüm Ortağı: <strong className="text-zinc-200">{COMPANY.carrier}</strong> (Sigortalı Taşımacılık)
            </div>
          </div>

        </div>

        {/* Bottom copyright (No duplicate legal links) */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-light">
          <p>© 2026 {COMPANY.brandName}. Tüm Hakları Saklıdır.</p>
          <p className="text-zinc-500 text-[10px] tracking-wide">
            Küçük Partilerde Zanaat Üretimi &amp; Mimari Aydınlatma
          </p>
        </div>
      </div>
    </footer>
  );
};

