import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const ContactSection: React.FC = () => {
  const { settings } = useSiteSettings();

  return (
    <section id="iletisim" className="relative py-10 sm:py-16 bg-[#0A0A0A] border-t border-white/10 scroll-mt-20">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Brand Story & Title */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#C5A059] mb-1.5 font-semibold">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059]" />
                <span>{settings.contactBadge || 'ÖZEL TASARIM & İLETİŞİM'}</span>
              </div>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                {settings.contactTitle || 'Size Özel Işık Tasarımı'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-xl">
              {settings.contactDescription || 'LUMEN olarak, mekanlarınıza ve hayallerinize uyum sağlayan kişiye özel aydınlatma tasarımları gerçekleştiriyoruz. Size özel talepleriniz ve projeleriniz için atölyemizle doğrudan iletişime geçebilirsiniz.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/ozel-tasarim"
                className="px-6 py-3 rounded-full bg-[#C5A059] text-black font-semibold text-xs tracking-widest uppercase hover:bg-[#d8b56f] transition-all shadow-lg inline-flex items-center gap-2"
              >
                <span>Özel Tasarım Sürecini İncele</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Direct Contact Cards Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bento-card p-4 rounded-2xl sm:col-span-2 flex items-start gap-3.5 border border-white/10">
              <div className="p-2.5 rounded-xl bg-black/60 border border-[#C5A059]/30 text-[#C5A059] flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                  {settings.contactAddressTitle || 'Showroom & Atölye'}
                </span>
                <p className="text-zinc-200 font-medium text-xs sm:text-sm mt-0.5">
                  {settings.contactAddressText || 'Abdi İpekçi Caddesi No: 42, Nişantaşı / İstanbul'}
                </p>
              </div>
            </div>

            <a 
              href={`mailto:${settings.contactEmailText || 'hello@lumenatelier.com'}`}
              className="bento-card p-4 rounded-2xl flex items-start gap-3.5 border border-white/10 sm:hover:border-[#C5A059]/50 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-black/60 border border-[#C5A059]/30 text-[#C5A059] flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                  {settings.contactEmailTitle || 'E-Posta İletişimi'}
                </span>
                <p className="text-zinc-200 font-medium text-xs sm:text-sm mt-0.5 truncate">
                  {settings.contactEmailText || 'hello@lumenatelier.com'}
                </p>
              </div>
            </a>

            <a 
              href={`tel:${(settings.contactPhoneText || '+902128402025').replace(/\s+/g, '')}`}
              className="bento-card p-4 rounded-2xl flex items-start gap-3.5 border border-white/10 sm:hover:border-[#C5A059]/50 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-black/60 border border-[#C5A059]/30 text-[#C5A059] flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                  {settings.contactPhoneTitle || 'Telefon & WhatsApp'}
                </span>
                <p className="text-zinc-200 font-medium text-xs sm:text-sm mt-0.5 truncate">
                  {settings.contactPhoneText || '+90 (212) 840 20 25'}
                </p>
              </div>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
