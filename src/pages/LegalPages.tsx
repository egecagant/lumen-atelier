import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { COMPANY } from '../lib/companyInfo';

interface LegalShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export const LegalShell: React.FC<LegalShellProps> = ({
  title,
  subtitle,
  badge = 'Yasal Bilgilendirme',
  children
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    document.title = `${title} | ${COMPANY.brandName}`;
    
    // Update or create meta description
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', `${title} - ${COMPANY.brandName} yasal ve tüketici hakları bilgilendirme metni.`);
  }, [title]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-zinc-800 antialiased selection:bg-[#C5A059]/20 selection:text-zinc-900 pb-24">
      {/* Top Header Bar */}
      <div className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs text-zinc-500 overflow-x-auto scrollbar-none">
            <Link to="/" className="hover:text-zinc-900 font-medium transition-colors">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-medium truncate">{title}</span>
          </nav>

          <Link 
            to="/"
            className="text-xs font-serif-luxury tracking-widest text-[#9E7B36] hover:text-[#7A5E25] uppercase transition-colors shrink-0 pl-4"
          >
            {COMPANY.brandName}
          </Link>
        </div>
      </div>

      {/* Main Document Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        {/* Document Header */}
        <header className="mb-10 pb-8 border-b border-zinc-200">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#9E7B36] mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{badge}</span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl text-zinc-900 font-normal tracking-tight leading-tight mb-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-zinc-600 font-light leading-relaxed mb-4">
              {subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-light pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              Son Güncelleme: <strong className="font-medium text-zinc-700">{COMPANY.lastUpdated}</strong>
            </span>
            <span className="text-zinc-300">•</span>
            <span>{COMPANY.brandName}</span>
          </div>
        </header>

        {/* Content Box */}
        <article className="prose prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-700 space-y-6">
          {children}
        </article>

        {/* Document Footer Navigation */}
        <footer className="mt-16 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 {COMPANY.legalName} ({COMPANY.brandName}). Tüm Hakları Saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link to="/mesafeli-satis-sozlesmesi" className="hover:text-zinc-900 underline underline-offset-2">Sözleşme</Link>
            <Link to="/on-bilgilendirme-formu" className="hover:text-zinc-900 underline underline-offset-2">Ön Bilgilendirme</Link>
            <Link to="/gizlilik-politikasi" className="hover:text-zinc-900 underline underline-offset-2">Gizlilik & KVKK</Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

// 1. /hakkimizda - Hakkımızda
export const AboutPage: React.FC = () => {
  const companyFields = [
    { label: 'Hizmet Sağlayıcı / Ticaret Unvanı', value: COMPANY.legalName },
    { label: 'Marka Adı', value: COMPANY.brandName },
    { label: 'Tebligat & Atölye Adresi', value: COMPANY.address },
    { label: 'E-Posta Adresi', value: COMPANY.email },
    { label: 'Müşteri Hizmetleri Telefonu', value: COMPANY.phone },
    { label: 'Vergi Dairesi', value: COMPANY.taxOffice },
    { label: 'Vergi Kimlik Numarası', value: COMPANY.taxNumber },
    { label: 'MERSİS Numarası', value: COMPANY.mersisNo },
    { label: 'ETBİS Kayıt Numarası', value: COMPANY.etbisNo },
    { label: 'Resmi Web Sitesi', value: COMPANY.website },
    { label: 'Anlaşmalı Kargo Şirketi', value: COMPANY.carrier },
  ].filter(item => item.value && item.value.trim() !== '' && !item.value.includes('_____'));

  return (
    <LegalShell 
      title="Hakkımızda & Şirket Bilgileri"
      subtitle="6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca hizmet sağlayıcı kimlik ve iletişim bilgileri."
      badge="Atölye ve Kurumsal Kimlik"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-serif-luxury text-zinc-900 font-semibold">
          LUMEN ATELIER Marka Hikayesi
        </h2>
        <p>
          <strong>LUMEN ATELIER</strong>, heykelsi formlarla sıcak aydınlatma estetiğini buluşturan bağımsız bir tasarım ve zanaat atölyesidir. Seri imalatın tekdüzeliğine karşı, her bir aydınlatma objesini sınırlı adetlerde ve küçük partiler (small-batch) hâlinde üretiriz.
        </p>
        <p>
          Tasarım stüdyomuzda heykelsi kıvrımlar ile zengin malzeme kültürünü harmanlıyoruz. Seçkin doğal mineraller, fırınlanmış seramik kompozitler ve pirinç detaylar, atölyemizde özenli el yapımı işçilikle ışığın mekânla kurduğu şiirsel bir diyaloğa dönüşür.
        </p>
        <p>
          Ayrıca mimari projeler, oteller, konutlar ve koleksiyonerler için mekâna özgü özel ölçü ve formlarda <strong>kişiye özel aydınlatma tasarımı</strong> (bespoke) hizmeti sunmaktayız.
        </p>
      </section>

      <section className="pt-6 space-y-4">
        <h2 className="text-xl font-serif-luxury text-zinc-900 font-semibold">
          Resmi Firma & Hizmet Sağlayıcı Bilgileri
        </h2>
        <p className="text-xs text-zinc-500">
          6563 sayılı Kanun ve ilgili mevzuat uyarınca tüketicilerin ve ziyaretçilerin erişimine sunulan güncel kurumsal bilgiler tablosu aşağıdadır:
        </p>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <tbody className="divide-y divide-zinc-100">
              {companyFields.map((field, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-zinc-50/50' : 'bg-white'}>
                  <td className="py-3 px-4 font-medium text-zinc-600 w-2/5 border-r border-zinc-100">
                    {field.label}
                  </td>
                  <td className="py-3 px-4 text-zinc-900 font-semibold">
                    {field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-2">
        <div className="font-semibold flex items-center gap-1.5 text-amber-900">
          <AlertCircle className="w-4 h-4 text-[#9E7B36]" />
          <span>Müşteri İletişimi ve Ziyaret Randevuları</span>
        </div>
        <p>
          Atölyemiz üretim odaklı faaliyet gösterdiğinden, showroom ve tasarım danışmanlığı görüşmeleri için lütfen önceden <a href={`mailto:${COMPANY.email}`} className="underline font-semibold">{COMPANY.email}</a> veya <a href={`tel:${COMPANY.phone}`} className="underline font-semibold">{COMPANY.phone}</a> üzerinden randevu alınız.
        </p>
      </section>
    </LegalShell>
  );
};

// 2. /mesafeli-satis-sozlesmesi - Mesafeli Satış Sözleşmesi
export const DistanceSalesContractPage: React.FC = () => {
  return (
    <LegalShell 
      title="Mesafeli Satış Sözleşmesi"
      subtitle="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca düzenlenmiştir."
      badge="Yasal Sözleşme"
    >
      <div className="space-y-8">
        {/* Madde 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 1 — Taraflar
          </h2>
          <div className="space-y-2">
            <p><strong>1.1. SATICI BİLGİLERİ:</strong></p>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 text-xs sm:text-sm space-y-1.5">
              <div><strong>Unvan:</strong> {COMPANY.legalName} ({COMPANY.brandName})</div>
              <div><strong>Adres:</strong> {COMPANY.address}</div>
              <div><strong>Telefon:</strong> {COMPANY.phone}</div>
              <div><strong>E-Posta:</strong> {COMPANY.email}</div>
              <div><strong>Vergi Dairesi:</strong> {COMPANY.taxOffice}</div>
              {COMPANY.taxNumber && !COMPANY.taxNumber.includes('___') && (
                <div><strong>Vergi No:</strong> {COMPANY.taxNumber}</div>
              )}
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <p><strong>1.2. ALICI (TÜKETİCİ) BİLGİLERİ:</strong></p>
            <p className="text-xs text-zinc-600">
              Alıcı; {COMPANY.website} internet sitesinden sipariş veren, sipariş formunda adı-soyadı, teslimat adresi, telefon ve e-posta bilgileri kayıt altına alınan gerçek veya tüzel kişidir.
            </p>
          </div>
        </section>

        {/* Madde 2 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 2 — Konu
          </h2>
          <p>
            İşbu Sözleşme'nin konusu; ALICI'nın, SATICI'ya ait {COMPANY.website} alan adlı internet sitesinden elektronik ortamda siparişini yaptığı, sitede nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
          </p>
        </section>

        {/* Madde 3 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 3 — Sözleşme Konusu Ürün, Bedel ve Ödeme
          </h2>
          <p>
            3.1. Ürünlerin cinsi ve türü, miktarı, rengi, vergiler dâhil satış bedeli (adet x birim fiyat) ve kargo ücreti internet sitesindeki sipariş özetinde ve Alıcı'ya gönderilen sipariş teyit e-postasında açıkça gösterildiği gibidir.
          </p>
          <p>
            3.2. Sitede ilan edilen tüm fiyatlar Türk Lirası (TL) cinsindendir ve <strong>Katma Değer Vergisi (KDV) dâhildir</strong>.
          </p>
          <p>
            3.3. Taksitli ödemelerde Alıcı'nın bankası ile yaptığı sözleşme koşulları geçerlidir. Bankanın kampanya veya vade farkı uygulamaları Alıcı'nın kredi kartı ekstresine ayrıca yansıyabilir.
          </p>
          <p>
            3.4. Ödemeler TCMB lisanslı ve uluslararası PCI-DSS Seviye 1 güvenlik sertifikasyonuna sahip <strong>iyzico</strong> güvenli ödeme altyapısı (3D Secure) veya banka havalesi/EFT yöntemi ile tahsil edilir.
          </p>
        </section>

        {/* Madde 4 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 4 — Teslimat Şartları ve İfa Süresi
          </h2>
          <p>
            4.1. Ürünler, sipariş onayından itibaren heykelsi el işçiliği süreci göz önünde bulundurularak <strong>{COMPANY.deliveryDays}</strong> içerisinde anlaşmalı kargo şirketi olan <strong>{COMPANY.carrier}</strong>'ya hızlı teslimat için teslim edilir.
          </p>
          <p>
            4.2. Yasal azami teslim süresi mevzuat uyarınca 30 (otuz) gündür.
          </p>
          <p>
            4.3. Teslimat, Alıcı'nın sipariş formunda belirttiği teslimat adresine yapılır. Alıcı'nın teslimat sırasında adreste bulunmaması veya yanlış/eksik adres bildirmesi nedeniyle meydana gelebilecek gecikme ve masraflardan SATICI sorumlu tutulamaz.
          </p>
        </section>

        {/* Madde 5 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 5 — Cayma Hakkı
          </h2>
          <p>
            5.1. Tüketici (Alıcı), sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren <strong>14 (ondört) gün</strong> içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
          </p>
          <p>
            5.2. Cayma hakkının kullanılması için bu 14 günlük süre içinde SATICI'ya <a href={`mailto:${COMPANY.email}`} className="text-[#9E7B36] font-semibold underline">{COMPANY.email}</a> e-posta adresi üzerinden yazılı bildirimde bulunulması şarttır.
          </p>
        </section>

        {/* Madde 6 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 6 — Cayma Hakkının Kullanılamayacağı Hâller
          </h2>
          <p>
            Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca aşağıdaki durumlarda cayma hakkı kullanılamaz:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 pl-2">
            <li>Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda özel olarak üretilen veya özelleştirilen ürünler (Özel Tasarım / Bespoke aydınlatmalar, kişiye özel renklendirilen veya boyutlandırılan ürünler).</li>
            <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış ve montajı yapılmış elektrik aksamlı ürünler.</li>
          </ul>
        </section>

        {/* Madde 7 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 7 — İade Prosedürü ve Kargo Masrafı
          </h2>
          <p>
            7.1. Cayma hakkı kapsamında iade edilecek ürünler, SATICI'nın anlaşmalı olduğu <strong>{COMPANY.carrier}</strong> aracılığıyla gönderilmelidir.
          </p>
          <p className="p-3 bg-zinc-100 rounded-lg text-zinc-800 font-medium border border-zinc-200">
            7.2. <strong>İade Kargo Masrafı:</strong> Mesafeli Sözleşmeler Yönetmeliği hükümleri ve ön bilgilendirme koşulları gereğince, cayma hakkının keyfi kullanımında <strong>iade kargo bedeli ALICI'ya aittir</strong>.
          </p>
          <p>
            7.3. Ürünün ayıplı, hasarlı veya sipariş edilenden farklı çıkması durumunda tüm kargo masrafları SATICI tarafından karşılanır.
          </p>
          <p>
            7.4. Cayma bildiriminin ve iade edilen ürünün eksiksiz olarak satıcıya ulaşmasını takip eden 14 gün içinde ürün bedeli, Alıcı'nın ödeme yaptığı yöntemle (kredi kartına tek seferde veya banka hesabına) iade edilir.
          </p>
        </section>

        {/* Madde 8 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 8 — Ayıplı Mal ve Haklar
          </h2>
          <p>
            Teslim edilen üründe ayıp bulunması hâlinde Alıcı; sözleşmeden dönme, satış bedelinden indirim isteme, ücretsiz onarım isteme veya ürünün ayıpsız bir misli ile değiştirilmesini isteme seçimlik haklarına sahiptir.
          </p>
        </section>

        {/* Madde 9 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 9 — Garanti Şartları
          </h2>
          <p>
            {COMPANY.brandName} tarafından satışa sunulan tüm elektrikli aydınlatma armatürleri, elektrik ve duy aksamları üretim ve malzeme hatalarına karşı <strong>{COMPANY.warrantyYears} (iki) yıl</strong> süreyle atölye garantisi altındadır.
          </p>
        </section>

        {/* Madde 10 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 10 — Uyuşmazlıkların Çözümü
          </h2>
          <p>
            İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl belirlenen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki veya tüketici işleminin yapıldığı yerdeki <strong>Tüketici Hakem Heyetleri</strong> ile <strong>Tüketici Mahkemeleri</strong> yetkilidir.
          </p>
        </section>

        {/* Madde 11 */}
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Madde 11 — Yürürlük
          </h2>
          <p>
            Alıcı, internet sitesi üzerinden siparişi tamamladığında işbu Sözleşme'nin tüm koşullarını okuduğunu, anladığını ve kabul ettiğini elektronik ortamda onaylamış sayılır.
          </p>
        </section>
      </div>
    </LegalShell>
  );
};

// 3. /on-bilgilendirme-formu - Ön Bilgilendirme Formu
export const PreliminaryInfoFormPage: React.FC = () => {
  return (
    <LegalShell 
      title="Ön Bilgilendirme Formu"
      subtitle="Mesafeli Sözleşmeler Yönetmeliği m.5 gereğince, sipariş oluşturulmadan önce alıcıyı bilgilendirme amaçlı sunulur."
      badge="Sipariş Öncesi Zorunlu Bilgilendirme"
    >
      <div className="space-y-6">
        <p className="text-sm">
          Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca, tüketicinin sipariş teyidi vermeden önce sözleşme koşulları hakkında eksiksiz bilgilendirilmesini sağlamak amacıyla düzenlenmiştir.
        </p>

        {/* Tablo 1: Satıcı */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-100/70 px-4 py-2.5 font-semibold text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-200">
            1. Satıcı Kimlik ve İletişim Bilgileri
          </div>
          <div className="p-4 text-xs sm:text-sm space-y-2">
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-medium">Hizmet Sağlayıcı:</span>
              <span className="col-span-2 text-zinc-900 font-semibold">{COMPANY.legalName} ({COMPANY.brandName})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-medium">Adres:</span>
              <span className="col-span-2 text-zinc-800">{COMPANY.address}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 font-medium">Müşteri Destek Telefonu:</span>
              <span className="col-span-2 text-zinc-800">{COMPANY.phone}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500 font-medium">E-Posta:</span>
              <span className="col-span-2 text-zinc-800">{COMPANY.email}</span>
            </div>
          </div>
        </div>

        {/* Tablo 2: Temel Nitelikler & Fiyat */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-100/70 px-4 py-2.5 font-semibold text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-200">
            2. Ürün Nitelikleri, Fiyat ve Kargo Bilgileri
          </div>
          <div className="p-4 text-xs sm:text-sm space-y-2.5">
            <p>
              • Sözleşme konusu ürünün temel nitelikleri (türü, boyutu, duy tipi, rengi) sepette ve sipariş özeti ekranında yer almaktadır.
            </p>
            <p>
              • <strong>Fiyat:</strong> Sitede belirtilen ürün fiyatları Türk Lirası (TL) cinsinden olup <strong>KDV dâhildir</strong>.
            </p>
            <p>
              • <strong>Kargo Masrafı:</strong> Kampanya kapsamındaki ücretsiz kargo baremleri sepette açıkça gösterilir. Kargo ücreti sipariş toplamına ödeme adımında eklenir.
            </p>
          </div>
        </div>

        {/* Tablo 3: Ödeme ve Teslimat */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-100/70 px-4 py-2.5 font-semibold text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-200">
            3. Ödeme, Teslimat Şekli ve Süresi
          </div>
          <div className="p-4 text-xs sm:text-sm space-y-2.5">
            <p>
              • <strong>Ödeme Yöntemleri:</strong> Kredi kartı / banka kartı (iyzico PCI-DSS Seviye 1 ve 3D Secure) ve Banka Havalesi / EFT.
            </p>
            <p>
              • <strong>Teslimat Taşıyıcısı:</strong> Siparişler hızlı kargo ile <strong>{COMPANY.carrier}</strong> güvencesiyle sevk edilir.
            </p>
            <p>
              • <strong>Hazırlık ve Teslim Süresi:</strong> Sipariş tarihinden itibaren <strong>{COMPANY.deliveryDays}</strong> hazırlık süresi bulunur. Yasal azami teslim süresi 30 gündür.
            </p>
          </div>
        </div>

        {/* Tablo 4: Cayma Hakkı ve Masraflar */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden shadow-sm">
          <div className="bg-amber-100/80 px-4 py-2.5 font-semibold text-amber-950 text-xs uppercase tracking-wider border-b border-amber-200">
            4. Cayma Hakkı, İade Masrafı ve İstisnalar (Önemli)
          </div>
          <div className="p-4 text-xs sm:text-sm space-y-3 text-zinc-800">
            <p>
              • <strong>Cayma Süresi:</strong> Tüketici, malı teslim aldığı tarihten itibaren <strong>14 (ondört) gün</strong> içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.
            </p>
            <p className="p-3 bg-white rounded-lg border border-amber-300/80 font-medium text-zinc-900">
              • <strong>İade Taşıyıcısı ve Masrafı:</strong> İade işlemlerinde öngörülen taşıyıcı <strong>{COMPANY.carrier}</strong>'dur. Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince <strong>iade kargo bedeli ALICI'ya aittir</strong>. Ancak teslim anında hasarlı veya ayıplı olduğu tutanakla tespit edilen ürünlerin iade kargo masrafı SATICI'ya aittir.
            </p>
            <p>
              • <strong>Cayma Hakkının Geçerli Olmadığı Haller:</strong> Alıcı'nın özel talepleri doğrultusunda üretilen kişiye özel (bespoke) veya üzerinde değişiklik yapılan lambalarda cayma hakkı kullanılamaz.
            </p>
          </div>
        </div>

        {/* Tablo 5: Şikayet */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-100/70 px-4 py-2.5 font-semibold text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-200">
            5. Şikayet, İtiraz ve Çözüm Mercileri
          </div>
          <div className="p-4 text-xs sm:text-sm space-y-2">
            <p>
              Tüketici, siparişi ve ürünle ilgili her türlü şikayet ve itirazını öncelikle <a href={`mailto:${COMPANY.email}`} className="text-[#9E7B36] font-semibold underline">{COMPANY.email}</a> adresine iletebilir.
            </p>
            <p>
              Uyuşmazlık hâlinde Ticaret Bakanlığı tarafından belirlenen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki <strong>Tüketici Hakem Heyetleri</strong> veya <strong>Tüketici Mahkemeleri</strong> yetkilidir.
            </p>
          </div>
        </div>
      </div>
    </LegalShell>
  );
};

// 4. /cayma-formu - Örnek Cayma Formu
export const WithdrawalFormPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleTemplate = `KAYITLI E-POSTA / CAYMA BİLDİRİM FORMU
Kime: ${COMPANY.legalName} (${COMPANY.brandName})
E-Posta: ${COMPANY.email}
Adres: ${COMPANY.address}
Telefon: ${COMPANY.phone}

İşbu form ile aşağıda ayrıntıları verilen ürün/hizmetin satışına ilişkin sözleşmeden 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca cayma hakkımı kullandığımı beyan ederim.

Sipariş Numarası: [Sipariş No Yazınız]
Sipariş Tarihi: [GG/AA/YYYY]
Teslim Tarihi: [GG/AA/YYYY]
Cayma Hakkına Konu Mal/Hizmet: [Ürün Adı / Modeli / Adet]
İade Gerekçesi (İsteğe bağlı): [Belirtmek isterseniz yazınız]

Tüketicinin Adı ve Soyadı: [Adınız Soyadınız]
Tüketicinin Adresi: [Açık Adresiniz]
Tüketicinin Telefonu: [Telefon Numaranız]
Tüketicinin E-Posta Adresi: [E-Posta Adresiniz]
Geri Ödeme Yapılacak IBAN (Havale ile ödendiyse): [TR...]

Tarih: ${new Date().toLocaleDateString('tr-TR')}
İmza (Yalnızca kâğıt ortamında gönderilirse):`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(sampleTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <LegalShell 
      title="Örnek Cayma Formu"
      subtitle="Mesafeli Sözleşmeler Yönetmeliği Eki uyarınca tüketiciye sunulan standart cayma beyan şablonu."
      badge="Form & Dilekçe"
    >
      <div className="space-y-6">
        <p>
          Mesafeli Sözleşmeler Yönetmeliği gereğince, ürünün tarafınıza teslim edildiği tarihten itibaren 14 gün içerisinde cayma hakkınızı kullanabilirsiniz.
        </p>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5">
          <p className="font-semibold text-amber-900">
            ℹ️ Nasıl Gönderilir?
          </p>
          <p>
            Bu formu doldurup <strong>{COMPANY.email}</strong> adresine e-posta ile gönderebilirsiniz. <strong>Formu kullanmak zorunlu değildir</strong>; aynı bilgileri içeren serbest metin bir e-posta da yasal bildirim olarak yeterlidir.
          </p>
        </div>

        {/* Copy Action Card */}
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Kopyalanabilir Cayma Formu Şablonu
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Metni Kopyala</span>
                </>
              )}
            </button>
          </div>

          <pre className="font-mono text-xs sm:text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 select-all overflow-x-auto">
            {sampleTemplate}
          </pre>
        </div>

        <section className="space-y-3 pt-4 text-xs sm:text-sm text-zinc-600">
          <h3 className="font-serif-luxury text-base text-zinc-900 font-semibold">
            İade Öncesi Hatırlatmalar
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>Ürünlerin orijinal kutu ve aparatları ile birlikte eksiksiz paketlenmesi gerekir.</li>
            <li>İadeler anlaşmalı kargo şirketimiz <strong>{COMPANY.carrier}</strong> ile yapılmalıdır. İade kargo ücreti alıcıya aittir.</li>
            <li>Kişiye özel sipariş edilen ve özel ölçülendirilen aydınlatmalarda Yönetmelik gereği cayma hakkı geçerli değildir.</li>
          </ul>
        </section>
      </div>
    </LegalShell>
  );
};

// 5. /teslimat-ve-iade - Teslimat ve İade Şartları
export const DeliveryAndReturnPage: React.FC = () => {
  return (
    <LegalShell 
      title="Teslimat ve İade Şartları"
      subtitle="Siparişinizin hazırlanması, kargolanması, hasar tespiti ve iade süreçlerine ilişkin müşteri bilgilendirme rehberi."
      badge="Müşteri Rehberi"
    >
      <div className="space-y-8">
        {/* Teslimat */}
        <section className="space-y-3">
          <h2 className="text-xl font-serif-luxury font-semibold text-zinc-900">
            1. Gönderim ve Teslimat Aşamaları
          </h2>
          <p>
            Her {COMPANY.brandName} aydınlatması el işçiliğiyle hazırlandığından, siparişinizin onaylanmasının ardından titiz bir kalite kontrol ve hazırlık sürecinden geçer.
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 pl-1">
            <li>
              <strong>Kargo Şirketi:</strong> Tüm gönderilerimiz Türkiye genelinde anlaşmalı olduğumuz <strong>{COMPANY.carrier}</strong> güvencesiyle sigortalı olarak sevk edilir.
            </li>
            <li>
              <strong>Hazırlık Süresi:</strong> Atölye hazırlık süremiz <strong>{COMPANY.deliveryDays}</strong>dir. Paketiniz tamamlandığında hızlı kargo ile sevk edilir.
            </li>
            <li>
              <strong>Kargo Takibi:</strong> Siparişiniz kargoya verildiği an, sisteme kayıtlı e-posta adresinize ve telefonunuza Yurtiçi Kargo takip numaranız otomatik olarak iletilir.
            </li>
          </ul>
        </section>

        {/* Hasarlı Paket */}
        <section className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 space-y-3">
          <h3 className="font-semibold text-base text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#9E7B36] shrink-0" />
            <span>Kritik Uyarı: Hasarlı Paket Kontrolü ve Tutanak</span>
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed">
            Heykelsi lambalarımız özenle paketlenerek hızlı kargo ile sevk edilir. Lütfen kargo teslimatı anında paketi kuryenin yanında kontrol ediniz:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 pl-1">
            <li>Kolide ezilme, delinme, ıslanma veya kırık şüphesi varsa <strong>paketi teslim almayınız</strong>.</li>
            <li>Kargo görevlisine derhal <strong>"Hasar Tespit Tutanağı"</strong> düzenletiniz.</li>
            <li>Tutanak tutulan ve hasarlı teslim alınmayan ürünler için ek hiçbir masraf talep edilmeden <strong>birebir yenisi</strong> ivedilikle üretilip gönderilir.</li>
          </ul>
        </section>

        {/* 14 Gün Cayma */}
        <section className="space-y-3">
          <h2 className="text-xl font-serif-luxury font-semibold text-zinc-900">
            2. 14 Günlük Koşulsuz İade (Cayma Hakkı)
          </h2>
          <p>
            Müşteri memnuniyeti ilkemiz ve yasal mevzuat uyarınca, teslim aldığınız standart koleksiyon parçalarını <strong>14 gün içinde</strong> iade edebilirsiniz.
          </p>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-2 text-xs sm:text-sm">
            <div><strong>İade Şartları:</strong> Ürünün kullanılmamış, demonte edilmemiş, elektrik aksamına müdahale edilmemiş ve tüm orijinal kutu/ambalaj aparatlarıyla eksiksiz olması şarttır.</div>
            <div><strong>İade Kargo Masrafı:</strong> İade işlemlerinde <strong>iade kargo ücreti alıcıya aittir</strong>. Ürünler mutlaka {COMPANY.carrier} aracılığıyla gönderilmelidir.</div>
            <div><strong>Geri Ödeme:</strong> İade ürün atölyemize ulaşıp kontrolleri yapıldıktan sonra <strong>14 gün içinde</strong> ödemenin yapıldığı kredi kartına veya banka hesabına eksiksiz iade edilir. Bankaların ekstreye yansıtma süresi 2-10 iş günü sürebilmektedir.</div>
          </div>
        </section>

        {/* İstisnalar */}
        <section className="space-y-3">
          <h2 className="text-xl font-serif-luxury font-semibold text-zinc-900">
            3. Kişiye Özel Üretim İstisnası
          </h2>
          <p>
            Müşterinin talebiyle özel ölçülerde üretilen, mimari projeye uyarlanan veya kişiselleştirilmiş gravür/renk uygulanan <strong>özel tasarım aydınlatmalarda</strong> Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca cayma hakkı geçerli değildir.
          </p>
        </section>

        {/* Değişim */}
        <section className="space-y-3">
          <h2 className="text-xl font-serif-luxury font-semibold text-zinc-900">
            4. Değişim Prosedürü
          </h2>
          <p>
            Satın aldığınız ürünü koleksiyonumuzdaki başka bir model veya renk tonu ile değiştirmek isterseniz, 14 gün içinde <a href={`mailto:${COMPANY.email}`} className="text-[#9E7B36] font-semibold underline">{COMPANY.email}</a> üzerinden müşteri temsilcimizle iletişime geçebilirsiniz. Fiyat farkları mahsuplaşılır.
          </p>
        </section>
      </div>
    </LegalShell>
  );
};

// 6. /gizlilik-politikasi - KVKK Aydınlatma Metni & Veri Sahibi Başvuru Rehberi
export const KvkkApplicationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([
    'Kişisel verilerimin işlenip işlenmediğini öğrenmek istiyorum.'
  ]);

  const demandOptions = [
    'Kişisel verilerimin işlenip işlenmediğini öğrenmek istiyorum.',
    'Kişisel verilerim işlenmişse buna ilişkin bilgi talep ediyorum.',
    'Kişisel verilerimin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek istiyorum.',
    'Yurt içinde veya yurt dışında kişisel verilerimin aktarıldığı üçüncü kişileri bilmek istiyorum.',
    'Kişisel verilerimin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini talep ediyorum.',
    'KVKK m.7 uyarınca kişisel verilerimin silinmesini veya yok edilmesini talep ediyorum.',
    'Düzeltme ve silme işlemlerinin kişisel verilerimin aktarıldığı üçüncü kişilere bildirilmesini istiyorum.',
    'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhime bir sonucun ortaya çıkmasına itiraz ediyorum.'
  ];

  const toggleDemand = (opt: string) => {
    setSelectedDemands(prev => 
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  };

  const petitionTemplate = `6698 SAYILI KANUN KAPSAMINDA İLGİLİ KİŞİ (VERİ SAHİBİ) BAŞVURU DİLEKÇESİ

Kime: ${COMPANY.legalName} (${COMPANY.brandName})
E-Posta: ${COMPANY.email}
Adres: ${COMPANY.address}

6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 11. maddesi kapsamındaki haklarımı kullanmak üzere veri sorumlusu sıfatıyla tarafınıza başvurmaktayım.

1. BAŞVURU SAHİBİ BİLGİLERİ:
Adı ve Soyadı: [Adınız Soyadınız]
T.C. Kimlik No veya Sipariş No: [TC No veya Sipariş Numaranız]
Tebligata Esas Adres: [Açık Adresiniz]
E-Posta Adresi: [Kayıtlı E-Posta Adresiniz]
Telefon Numarası: [Telefon Numaranız]

2. TALEP KONUSU (İşaretlenen Maddeler):
${selectedDemands.map(d => `• ${d}`).join('\n')}

3. AÇIKLAMALAR (Varsa ek detaylar):
[Talebinize ilişkin ek detayları buraya yazabilirsiniz.]

Yukarıda belirttiğim taleplerimin KVKK’nın 13. maddesi uyarınca incelenerek en geç 30 (otuz) gün içinde tarafıma yazılı veya elektronik ortamda yanıtlanmasını arz ederim.

Tarih: ${new Date().toLocaleDateString('tr-TR')}
Başvuru Sahibi Adı Soyadı: [Adınız Soyadınız]
İmza:`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(petitionTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="kvkk-basvuru" className="mt-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-800 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#9E7B36]" />
        <h3 className="font-serif-luxury text-base text-zinc-900 font-semibold">
          İlgili Kişi (Veri Sahibi) Başvuru Rehberi ve Dilekçe Şablonu
        </h3>
      </div>

      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
        6698 sayılı KVKK’nın 11. maddesi kapsamındaki taleplerinizi (silme, düzeltme, bilgi alma vb.) aşağıdaki şablonu kullanarak doğrudan bize iletebilirsiniz:
      </p>

      <div className="p-3.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-700 space-y-1">
        <p className="font-semibold text-zinc-900">📬 Başvuru İletişim:</p>
        <p>
          Dilekçenizi sistemimize kayıtlı e-posta adresiniz üzerinden <strong>{COMPANY.email}</strong> adresine gönderebilirsiniz. Başvurularınız KVKK m.13 uyarınca <strong>en geç 30 gün içinde</strong> ücretsiz sonuçlandırılacaktır.
        </p>
      </div>

      {/* Talep Seçimi */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-900">Talep Konularını Seçiniz:</p>
        <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-zinc-200">
          {demandOptions.map((opt, i) => {
            const checked = selectedDemands.includes(opt);
            return (
              <label key={i} className="flex items-start gap-2.5 text-xs cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDemand(opt)}
                  className="mt-0.5 rounded border-zinc-300 text-[#9E7B36] focus:ring-0"
                />
                <span className={checked ? 'text-zinc-900 font-medium' : 'text-zinc-600'}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Dilekçe Metni */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-900">Hazır Başvuru Dilekçesi:</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Dilekçeyi Kopyala</span>
              </>
            )}
          </button>
        </div>

        <pre className="font-mono text-[11px] sm:text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-zinc-200 select-all max-h-56 overflow-y-auto">
          {petitionTemplate}
        </pre>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalShell 
      title="Gizlilik Politikası & KVKK Aydınlatma Metni"
      subtitle="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla aydınlatma metnidir."
      badge="KVKK ve Gizlilik"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            1. Veri Sorumlusunun Kimliği
          </h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla <strong>{COMPANY.legalName}</strong> (“{COMPANY.brandName}”) olarak kişisel verilerinizi kanuna uygun şekilde işlemekte ve korumaktayız.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            2. İşlenen Kişisel Veri Kategorileri
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600 pl-1 text-xs sm:text-sm">
            <li><strong>Kimlik Bilgisi:</strong> Ad, soyad, gerekirse T.C. kimlik numarası (fatura için).</li>
            <li><strong>İletişim Bilgisi:</strong> Telefon numarası, teslimat adresi, fatura adresi, e-posta adresi.</li>
            <li><strong>Müşteri İşlem & Sipariş:</strong> Sipariş geçmişi, sepet içeriği, iade kayıtları, talep ve şikayet bilgileri.</li>
            <li><strong>İşlem Güvenliği:</strong> IP adresi, internet sitesi giriş-çıkış oturum kayıtları.</li>
          </ul>
        </section>

        {/* Önemli Kart Bilgisi Vurgusu */}
        <section className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-2">
          <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Kredi Kartı ve Ödeme Güvenliği Güvencesi</span>
          </div>
          <p>
            <strong>Kredi kartı ve banka kartı bilgileriniz tarafımızca hiçbir şekilde görülmemekte, işlenmemekte ve sunucularımızda saklanmamaktadır.</strong> Tüm kartlı ödeme işlemleri TCMB lisanslı ve uluslararası PCI-DSS Seviye 1 güvenlik sertifikasyonuna sahip <strong>iyzico</strong> ödeme altyapısı üzerinden 3D Secure ve TLS şifreleme güvencesiyle bankanız arasında doğrudan gerçekleşir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri
          </h2>
          <p className="text-xs sm:text-sm">
            Verileriniz; KVKK’nın 5. maddesi uyarınca “Sözleşmenin kurulması ve ifası”, “Hukuki yükümlülüğün yerine getirilmesi (Vergi Usul Kanunu, e-ticaret mevzuatı)” ve “Meşru menfaat” hukuki sebeplerine dayalı olarak şu amaçlarla işlenir:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 pl-1 text-xs sm:text-sm">
            <li>Siparişlerinizin alınması, paketlenmesi ve adresinize teslimi,</li>
            <li>Fatura düzenlenmesi ve muhasebe kayıtlarının yasal süresince saklanması,</li>
            <li>Satış sonrası garanti, iade, değişim ve müşteri destek hizmetlerinin yürütülmesi,</li>
            <li>İşlem güvenliğinin sağlanması ve dolandırıcılığın (fraud) önlenmesi.</li>
          </ul>
          <p className="text-xs sm:text-sm text-zinc-600">
            * Kampanya, bülten ve pazarlama iletileri yalnızca Alıcı'nın açık rıza onay kutusunu işaretlemesi hâlinde gönderilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            4. Kişisel Verilerin Aktarılması
          </h2>
          <p className="text-xs sm:text-sm">
            Kişisel verileriniz, yalnızca siparişin ifası ve mevzuat gereksinimleri amacıyla sınırlı olmak üzere:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 pl-1 text-xs sm:text-sm">
            <li>Teslimatın yapılması için <strong>{COMPANY.carrier}</strong>'ya,</li>
            <li>Ödemelerin tahsili için <strong>iyzico</strong>'ya,</li>
            <li>Veritabanı barındırma ve güvenli oturum altyapısı için <strong>Google Firebase</strong>'e,</li>
            <li>Siber saldırı ve bot filtreleme için <strong>Cloudflare</strong>'e aktarılmaktadır. Altyapı teknolojileri gereği veriler bulut sunucularda güvenle işlenebilir.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            5. Veri Saklama Süreleri
          </h2>
          <p className="text-xs sm:text-sm">
            Sipariş, fatura ve ödeme kayıtları Vergi Usul Kanunu ve Türk Ticaret Kanunu uyarınca <strong>10 yıl</strong> boyunca yasal arşivlerde saklanır. Üyelik verileri ise hesabınız aktif olduğu müddetçe muhafaza edilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            6. Çerezler
          </h2>
          <p className="text-xs sm:text-sm">
            Sitemizde yalnızca oturum ve sepetin çalışması için zorunlu teknik depolama araçları kullanılmaktadır. Ayrıntılar için <Link to="/cerez-politikasi" className="text-[#9E7B36] font-semibold underline">Çerez Politikamızı</Link> inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            7. KVKK Kapsamındaki Haklarınız ve Veri Sahibi Başvuru Usulü
          </h2>
          <p className="text-xs sm:text-sm">
            KVKK'nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, silinmesini veya düzeltilmesini talep etme hakkına sahipsiniz. Talepleriniz 30 gün içinde ücretsiz yanıtlanır. Başvurunuzu aşağıdaki hazır dilekçe şablonunu kullanarak gerçekleştirebilirsiniz:
          </p>
          <KvkkApplicationSection />
        </section>
      </div>
    </LegalShell>
  );
};

// 7. /cerez-politikasi - Çerez Politikası
export const CookiePolicyPage: React.FC = () => {
  return (
    <LegalShell 
      title="Çerez Politikası"
      subtitle="Web sitemizde kullanılan teknik depolama araçları ve çerez yönetimi hakkında şeffaf bilgilendirme."
      badge="Gizlilik ve Çerezler"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Çerez (Cookie) Nedir?
          </h2>
          <p>
            Çerezler, bir internet sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Web protokolü (HTTP) doğası gereği "durum tutmayan" (stateless) bir yapıya sahip olduğundan; sepetinize eklediğiniz bir ürünün sayfa yenilendiğinde kaybolmaması veya giriş yaptığınızda oturumunuzun korunması gibi temel işlevler için tarayıcı belleği kullanılır.
          </p>
        </section>

        {/* Tablo */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Sitemizde Kullanılan Teknolojiler
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-100/80 text-zinc-900 font-semibold border-b border-zinc-200">
                  <th className="py-2.5 px-3">Adı</th>
                  <th className="py-2.5 px-3">Türü</th>
                  <th className="py-2.5 px-3">Kullanım Amacı</th>
                  <th className="py-2.5 px-3">Saklama Süresi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                <tr>
                  <td className="py-3 px-3 font-medium text-zinc-900">Firebase Auth Oturumu</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-semibold">Zorunlu</span></td>
                  <td className="py-3 px-3">Giriş yapmış kullanıcının oturumunun güvenle sürdürülmesi</td>
                  <td className="py-3 px-3 text-zinc-500">Çıkış yapılana kadar</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-3 px-3 font-medium text-zinc-900">Sepet Verisi (localStorage)</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-semibold">Zorunlu</span></td>
                  <td className="py-3 px-3">Sepete eklenen heykelsi lambaların sayfa yenilendiğinde kaybolmaması</td>
                  <td className="py-3 px-3 text-zinc-500">Tarayıcı temizlenene kadar</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-zinc-900">Katalog Önbelleği (localStorage)</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-semibold">Zorunlu</span></td>
                  <td className="py-3 px-3">Ürün ve kategori listelerinin anında hızlı yüklenmesi</td>
                  <td className="py-3 px-3 text-zinc-500">Tarayıcı temizlenene kadar</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-3 px-3 font-medium text-zinc-900">Cloudflare Güvenlik Çerezi</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-semibold">Zorunlu</span></td>
                  <td className="py-3 px-3">DDoS saldırılarını ve kötü niyetli bot trafiğini engelleme</td>
                  <td className="py-3 px-3 text-zinc-500">Oturum süresince</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Kullanılmayanlar Vurgusu */}
        <section className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-2">
          <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>Sitemizde Kullanılmayan Takip Araçları</span>
          </div>
          <p>
            {COMPANY.brandName} olarak ziyaretçilerimizin gizliliğine azami saygı duyuyoruz. Sitemizde analitik, reklam hedeflemesi veya siteler arası profil çıkarma amaçlı hiçbir üçüncü taraf kodu bulunmamaktadır. <strong>Google Analytics</strong> ve <strong>Meta (Facebook) Pixel</strong> gibi üçüncü taraf reklam ve davranışsal takip araçları sitemizde <u>kullanılmamaktadır</u>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Çerezlerin Yönetimi ve Engellenmesi
          </h2>
          <p className="text-xs sm:text-sm">
            Dilediğiniz zaman tarayıcınızın ayarlarından (Chrome, Safari, Firefox vb.) site verilerini ve yerel depolamayı silebilirsiniz. Ancak zorunlu teknik veriler engellendiğinde, sepete ürün ekleme ve üye girişi gibi temel alışveriş fonksiyonları çalışamayacaktır.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-consent'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Çerez Tercihlerini Yönet
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            Gelecekteki Değişiklik Taahhüdü
          </h2>
          <p className="text-xs sm:text-sm">
            İlerleyen dönemde isteğe bağlı analitik veya performans araçlarının devreye alınması gerekirse, bu sayfa güncellenecek, kullanıcılara açık rıza onay bandı gösterilecek ve ziyaretçinin açık onayı alınmadan hiçbir analitik çerez çalıştırılmayacaktır.
          </p>
        </section>
      </div>
    </LegalShell>
  );
};

// 8. /kvkk-basvuru - Veri Sahibi Başvuru Formu (Gizlilik ve KVKK Politikası içine entegredir)
export const KvkkApplicationPage: React.FC = () => {
  return <PrivacyPolicyPage />;
};

// 9. /kullanim-kosullari - Kullanım Koşulları
export const TermsOfServicePage: React.FC = () => {
  return (
    <LegalShell 
      title="Kullanım Koşulları"
      subtitle="Web sitemizin ziyaretine, içeriğine ve sipariş süreçlerine ilişkin genel hüküm ve şartlar."
      badge="Genel Şartlar"
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            1. Genel İlkeler ve Fikri Mülkiyet Hakları
          </h2>
          <p>
            {COMPANY.website} alan adlı internet sitesinde sunulan tüm heykelsi aydınlatma tasarımları, fotoğraflar, görsel materyaller, metinler, logolar ve yazılımlar <strong>{COMPANY.brandName}</strong> ({COMPANY.legalName}) mülkiyetindedir ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile korunmaktadır.
          </p>
          <p>
            Sitede yer alan hiçbir görsel veya tasarım, {COMPANY.brandName}'in yazılı izni olmaksızın kopyalanamaz, çoğaltılamaz, ticari amaçla kullanılamaz veya başka bir platformda yayınlanamaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            2. Üyelik ve Hesap Güvenliği
          </h2>
          <p>
            Kullanıcı, üyelik hesabı oluştururken verdiği bilgilerin doğru ve güncel olduğunu kabul eder. Hesap şifresinin güvenliğini sağlamak tamamen kullanıcının sorumluluğundadır. Hesabınız üzerinden gerçekleştirilen tüm işlemlerden hesap sahibi sorumlu tutulur.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            3. Ürün Fiyatlandırması ve Hatalı Fiyat Girişleri
          </h2>
          <p>
            Sitede sergilenen ürün fiyatları Türk Lirası cinsinden ve KDV dâhildir. {COMPANY.brandName}, teknik arızalar, sistemsel yazılım hataları veya bariz dizgi hataları nedeniyle gerçeğin çok altında veya hatalı görüntülenen ürün siparişlerini iptal etme, alıcıya bilgi vererek tahsil edilen tutarı eksiksiz iade etme hakkını saklı tutar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            4. Hizmet Kesintileri ve Sorumluluk Sınırı
          </h2>
          <p>
            Sitemizin kesintisiz veya hatasız çalışacağına dair mutlak bir taahhüt verilmemektedir. Sunucu bakımları, güncellemeler veya mücbir sebeplerden kaynaklı geçici erişim aksaklıklarından dolayı {COMPANY.brandName} sorumlu tutulamaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            5. Koşulların Değiştirilmesi
          </h2>
          <p>
            {COMPANY.brandName}, işbu Kullanım Koşulları'nı mevzuat değişiklikleri veya iş modeli gereksinimleri doğrultusunda tek taraflı olarak güncelleme hakkını saklı tutar. Güncellenen koşullar sitede yayınlandığı andan itibaren yürürlüğe girer.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif-luxury font-semibold text-zinc-900">
            6. Uygulanacak Hukuk ve Yetkili Mahkemeler
          </h2>
          <p>
            İşbu Kullanım Koşulları'nın uygulanmasında ve yorumlanmasında Türk Hukuku geçerlidir. Çıkabilecek her türlü uyuşmazlığın çözümünde İstanbul (Bakırköy) Tüketici Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
        </section>
      </div>
    </LegalShell>
  );
};

// Convenience aliases
export const DistanceSalesPage = DistanceSalesContractPage;
export const PreliminaryInfoPage = PreliminaryInfoFormPage;
export const ShippingReturnsPage = DeliveryAndReturnPage;
export const PrivacyPage = PrivacyPolicyPage;
export const TermsOfUsePage = TermsOfServicePage;

