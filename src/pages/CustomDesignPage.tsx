import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  PenTool, 
  Layers, 
  Hammer, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown,
  MessageSquare,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { db, COLLECTIONS, addDoc, collection } from '../lib/firebase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { COMPANY } from '../lib/companyInfo';
import { ContactMessage } from '../types';

export const CustomDesignPage: React.FC = () => {
  const { settings } = useSiteSettings();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: 'Konut & Villa Aydınlatma',
    subject: 'Özel Tasarım Lamba Projesi',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Check URL params for pre-filled product or request
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const urunParam = params.get('urun') || params.get('proje');
      if (urunParam) {
        setFormData(prev => ({
          ...prev,
          subject: `${urunParam} — Özel Tasarım Talebi`,
          message: `Merhaba, ${urunParam} adlı aydınlatma tasarımınız için özel boyut veya özel tasarım talebinde bulunmak istiyorum.`
        }));
      }
    } catch {
      // ignore
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    try {
      const newMessage: Omit<ContactMessage, 'id'> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        projectType: formData.projectType,
        subject: formData.subject,
        message: formData.message,
        status: 'new',
        createdAt: Date.now()
      };

      await addDoc(collection(db, COLLECTIONS.MESSAGES), newMessage);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        projectType: 'Konut & Villa Aydınlatma',
        subject: 'Özel Tasarım Lamba Projesi',
        message: ''
      });
    } catch (error) {
      console.warn('Custom design message submit error:', error);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      step: '01',
      icon: PenTool,
      title: 'Fikir & Talep',
      desc: 'Mekanınızın özellikleri, hayal ettiğiniz aydınlatma formu ve özel isteklerinizi formumuz aracılığıyla bize iletin.'
    },
    {
      step: '02',
      icon: Layers,
      title: 'Tasarım & Projelendirme',
      desc: 'Tasarım ekibimiz mekanınıza özel oranları ve teknik detayları değerlendirerek sizin için en ideal formu projelendirir.'
    },
    {
      step: '03',
      icon: Hammer,
      title: 'Usta El İşçiliği',
      desc: 'Onaylanan tasarımınız atölyemizde deneyimli zanaatkârlarımız tarafından kusursuz hassasiyetle üretilir.'
    },
    {
      step: '04',
      icon: ShieldCheck,
      title: 'Özenli Teslimat',
      desc: 'Tamamlanan aydınlatma tasarımınız özel korumalı ambalajıyla sigortalı olarak güvenle adresinize ulaştırılır.'
    }
  ];

  const faqs = [
    {
      q: 'Kişiye özel aydınlatma tasarım süreci nasıl işler?',
      a: 'Aşağıdaki formu doldurarak projenizin veya mekanınızın detaylarını bize iletmenizle süreç başlar. Tasarım ekibimiz talebinizi inceleyerek sizinle iletişime geçer ve size özel tasarım çözümleri geliştirilir.'
    },
    {
      q: 'Mevcut koleksiyonunuzdaki lambaların boyutlarını özelleştirebilir miyim?',
      a: 'Evet, koleksiyonumuzdaki lambaların ölçülerini veya özel mekan ihtiyaçlarınıza göre boyutlandırma seçeneklerini atölyemizle görüşerek talep edebilirsiniz.'
    },
    {
      q: 'Özel tasarım projelerinin üretim ve teslim süresi nedir?',
      a: 'Tasarımın karmaşıklığına ve el işçiliği detaylarına bağlı olarak özel üretim süreçlerimiz genellikle 2 ila 4 hafta arasında tamamlanmaktadır.'
    },
    {
      q: 'Mimari projeler veya toplu mekan aydınlatmaları için hizmet veriyor musunuz?',
      a: 'Evet; konutlar, villalar, restoranlar, oteller ve çalışma alanları için kapsamlı aydınlatma tasarımı ve özel üretim desteği sunuyoruz.'
    }
  ];

  return (
    <>
      <SEO 
        title="Özel Tasarım — Size Özel Işık Tasarımı & Proje Talebi"
        description="LUMEN olarak mekanlarınıza ve hayallerinize uyum sağlayan kişiye özel aydınlatma tasarımları gerçekleştiriyoruz. Özel tasarım projeleriniz için bize ulaşın."
      />

      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <div className="relative bg-[#0E0E12] border-b border-white/10 py-10 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/15 blur-[120px] rounded-full" />
          </div>

          <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-4 sm:mb-6">
              <Link to="/" className="hover:text-[#C5A059] transition-colors">
                Ana Sayfa
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[#C5A059] font-medium">
                Özel Tasarım
              </span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{settings.contactBadge || 'ÖZEL TASARIM & TALEP'}</span>
              </div>

              <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
                {settings.contactTitle || 'Size Özel Işık Tasarımı'}
              </h1>

              <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-zinc-300 font-light leading-relaxed">
                {settings.contactDescription || 'LUMEN olarak, mekanlarınıza ve hayallerinize uyum sağlayan kişiye özel aydınlatma tasarımları gerçekleştiriyoruz. Size özel aydınlatma tasarımı talepleriniz ve projeleriniz için ekibimizle iletişime geçebilirsiniz.'}
              </p>

              <div className="mt-6 sm:mt-8 flex flex-wrap gap-4">
                <a
                  href="#talep-formu"
                  className="px-6 py-3 rounded-full bg-[#C5A059] text-black font-semibold text-xs tracking-widest uppercase hover:bg-[#d8b56f] transition-all shadow-lg inline-flex items-center gap-2"
                >
                  <span>Talep Formunu Doldur</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Process Steps (2x2 grid on mobile) */}
        <section className="py-10 sm:py-16 border-b border-white/5">
          <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                Kişiye Özel Üretim Süreci
              </span>
              <h2 className="font-serif-luxury text-xl sm:text-3xl text-white mt-1.5">
                Fikirden Aydınlatan Sanat Eserine
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {steps.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={idx}
                    className="bento-card p-3.5 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden group sm:hover:border-[#C5A059]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-5">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-black/60 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="font-serif-luxury text-lg sm:text-2xl font-bold text-zinc-600">
                          {item.step}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-base font-semibold text-zinc-100 mb-1 sm:mb-2">
                        {item.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-400 font-light leading-relaxed line-clamp-3 sm:line-clamp-none">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Form & Contact Details Section */}
        <section id="talep-formu" className="py-10 sm:py-16 scroll-mt-20">
          <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
              
              {/* Left Column: Direct Contact Info */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <div>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                    Doğrudan İletişim
                  </span>
                  <h2 className="font-serif-luxury text-xl sm:text-3xl text-white mt-1">
                    Tasarım Ekibimize Ulaşın
                  </h2>
                  <p className="text-xs text-zinc-400 font-light mt-1.5 leading-relaxed">
                    Projeleriniz, mekan ölçüleriniz veya özel aydınlatma fikirleriniz için ekibimizle doğrudan iletişime geçebilirsiniz.
                  </p>
                </div>

                {/* Quick Notice */}
                <div className="p-3 sm:p-4 rounded-xl bg-[#C5A059]/5 border border-[#C5A059]/20 text-zinc-300 text-xs flex items-start gap-2.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-zinc-400 text-[11px] sm:text-xs">
                    Tasarım formunuz ekibimiz tarafından en geç 24 saat içinde detaylı olarak yanıtlanır.
                  </p>
                </div>
              </div>

              {/* Right Column: Custom Design Request Form with Contact Badges Below */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bento-card p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden">
                  
                  {submitted ? (
                    <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95">
                      <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 border border-[#C5A059] flex items-center justify-center mx-auto text-[#C5A059]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif-luxury text-xl text-white">
                        {settings.contactSuccessTitle || 'Talebiniz Atölyemize Ulaştı'}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                        {settings.contactSuccessDesc || settings.contactSuccessText || 'Aydınlatma tasarım uzmanımız en geç 24 saat içerisinde proje detayları için sizinle irtibata geçecektir.'}
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="mt-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 transition-colors"
                      >
                        Yeni Bir Talep Gönder
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="mb-2">
                        <h3 className="font-serif-luxury text-lg sm:text-xl text-white">
                          Özel Tasarım Talep Formu
                        </h3>
                        <p className="text-[11px] sm:text-xs text-zinc-400">
                          Aydınlatma projenizin detaylarını yazın, size özel çözümler sunalım.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                            {settings.contactFormNameLabel || 'Adınız Soyadınız *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Selin Aydın"
                            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                            {settings.contactFormEmailLabel || 'E-posta Adresiniz *'}
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="selin@studio.com"
                            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                            {settings.contactFormPhoneLabel || 'Telefon Numaranız'}
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+90 532 000 0000"
                            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                            Proje Türü
                          </label>
                          <select
                            value={formData.projectType}
                            onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                            className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                          >
                            <option value="Konut & Villa Aydınlatma">Konut & Villa</option>
                            <option value="Otel & Restoran Projesi">Otel & Restoran</option>
                            <option value="Ticari & Ofis Alanı">Ticari & Ofis</option>
                            <option value="Özel Heykelsi Lamba Siparişi">Heykel Lamba</option>
                            <option value="Ölçü Değişikliği / Özelleştirme">Ölçü Değişikliği</option>
                            <option value="Diğer Özel İstekler">Diğer</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                          {settings.contactFormMessageLabel || 'Proje Detayları & Özel İstekleriniz *'}
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tasarım talebiniz, mekan detayları ve özel isteklerinizi yazınız..."
                          className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-1 py-3 px-6 rounded-xl bg-[#C5A059] hover:bg-[#d8b56f] text-black font-semibold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{settings.contactFormSubmitBtnText || 'Talebi Gönder'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Direct Contact Badges below Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2.5 bento-card p-2.5 sm:p-3 rounded-xl">
                    <div className="p-1.5 rounded-lg bg-black/60 border border-[#C5A059]/30 text-[#C5A059] flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
                        {settings.contactAddressTitle || 'Showroom & Merkez'}
                      </span>
                      <p className="text-zinc-300 font-medium text-xs truncate" title={settings.contactAddressText || COMPANY.address}>
                        {settings.contactAddressText || COMPANY.address}
                      </p>
                    </div>
                  </div>

                  <a 
                    href={`mailto:${settings.contactEmailText || COMPANY.email}`}
                    className="flex items-center gap-2.5 bento-card p-2.5 sm:p-3 rounded-xl hover:border-[#C5A059]/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-black/60 border border-[#C5A059]/30 text-[#C5A059] flex-shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">E-Posta</span>
                      <p className="text-zinc-300 font-medium text-xs truncate">{settings.contactEmailText || COMPANY.email}</p>
                    </div>
                  </a>

                  <a 
                    href={COMPANY.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bento-card p-2.5 sm:p-3 rounded-xl hover:border-[#25D366]/50 transition-colors group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">
                        {settings.contactPhoneTitle || 'Müşteri Hattı & WhatsApp'}
                      </span>
                      <p className="text-zinc-300 font-medium text-xs truncate group-hover:text-emerald-400 transition-colors">
                        {settings.contactPhoneText || COMPANY.phone}
                      </p>
                    </div>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-10 sm:py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Merak Edilenler</span>
              </div>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl text-white mt-2">
                Sıkça Sorulan Sorular
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx}
                    className="bento-card rounded-xl border border-white/10 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 text-xs text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
