import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, doc, onSnapshot, setDoc, handleFirestoreError, OperationType } from '../lib/firebase';

export interface AnnouncementTemplate {
  id: string;
  name: string;
  text: string;
  bgColor: string;
  textColor: string;
  animation?: 'none' | 'marquee' | 'pulse' | 'shimmer' | 'bounce';
  speed?: 'slow' | 'normal' | 'fast';
  createdAt: number;
}

export interface SiteSettings {
  // Brand & Identity
  brandName: string;
  brandTagline: string;
  brandLogoUrl?: string;
  brandDescription: string;
  brandBadge: string;
  navAllProductsText: string;
  navCategoriesDropdownText: string;
  navContactText: string;
  searchModalPlaceholder: string;
  
  // Announcement bar
  announcementText: string;
  announcementActive: boolean;
  announcementBgColor: string;
  announcementTextColor: string;
  announcementAnimation: 'none' | 'marquee' | 'pulse' | 'shimmer' | 'bounce';
  announcementSpeed: 'slow' | 'normal' | 'fast';
  savedAnnouncementTemplates: AnnouncementTemplate[];

  // Category section text
  categorySectionBadge: string;
  categorySectionTitle: string;
  categorySectionDescription: string;
  categoryCardExploreText: string;
  
  // Product section text
  productSectionBadge: string;
  productSectionTitle: string;
  productSectionDescription: string;
  productFilterAllText: string;
  productSearchInputPlaceholder: string;
  productStockFilterText: string;
  productCardDetailBtnText: string;
  productCardAddBtnText: string;
  productCardAddedBtnText: string;
  productCardOutOfStockText: string;
  productCardPreorderText: string;
  productCardNewArrivalText: string;
  productEmptyStateTitle: string;
  productEmptyStateDesc: string;
  productEmptyNewsletterPlaceholder: string;
  productEmptyNewsletterBtnText: string;

  // Product detail modal & specs
  productDetailStoryTitle: string;
  productDetailTaxIncludedText: string;
  productDetailMaterialLabel: string;
  productDetailDimensionsLabel: string;
  productDetailLightSpecsLabel: string;
  productDetailWarrantyTitle: string;
  productDetailWarrantyText: string;
  productDetailShippingBanner: string;
  productDetailAddToCartText: string;
  productDetailInstantCheckoutText: string;

  // Cart drawer
  cartTitle: string;
  cartEmptyTitle: string;
  cartEmptyDesc: string;
  cartEmptyBtnText: string;
  cartFreeShippingReachedText: string;
  cartCheckoutBtnText: string;
  cartSecurityBadgeText: string;
  
  // Contact section text
  contactBadge: string;
  contactTitle: string;
  contactDescription: string;
  contactAddressTitle: string;
  contactAddressText: string;
  contactEmailTitle: string;
  contactEmailText: string;
  contactPhoneTitle: string;
  contactPhoneText: string;
  contactWorkingHoursTitle: string;
  contactWorkingHoursText: string;
  contactFormNameLabel: string;
  contactFormEmailLabel: string;
  contactFormPhoneLabel: string;
  contactFormTypeLabel: string;
  contactFormMessageLabel: string;
  contactFormSubmitBtnText: string;
  contactSuccessTitle: string;
  contactSuccessText: string;
  
  // Footer text
  footerBrandText: string;
  footerQualityBadge: string;
  footerCopyright: string;
  footerCol1Title: string;
  footerCol2Title: string;
  footerCol3Title: string;
  footerSecurityNote: string;
  footerCitiesText: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'LUMEN',
  brandTagline: "ATELIER D'ART",
  brandDescription: 'Lüks masa lambaları, heykelsi abajurlar, çocuk serileri ve mimari aydınlatma armatürleri. Işığın sanatsal formu.',
  brandBadge: 'Tescilli Özgün Tasarım & Seçkin Koleksiyon',
  navAllProductsText: 'Tüm Koleksiyon',
  navCategoriesDropdownText: 'Kategoriler',
  navContactText: 'Özel Tasarım & İletişim',
  searchModalPlaceholder: 'Lamba adı, pirinç, mermer, kategori ara...',
  
  announcementText: '✨ Tüm Türkiye’ye Yurtiçi Kargo ile Hızlı Teslimat | Özel Tasarım Talepleri İçin İletişime Geçin',
  announcementActive: false,
  announcementBgColor: '#121215',
  announcementTextColor: '#C5A059',
  announcementAnimation: 'none',
  announcementSpeed: 'normal',
  savedAnnouncementTemplates: [
    {
      id: 'tpl-1',
      name: 'Hızlı Teslimat & Özel Tasarım Destek',
      text: '✨ Tüm Türkiye’ye Yurtiçi Kargo ile Hızlı Teslimat | Özel Tasarım Talepleri İçin İletişime Geçin',
      bgColor: '#121215',
      textColor: '#C5A059',
      animation: 'none',
      speed: 'normal',
      createdAt: 1700000000000
    }
  ],

  categorySectionBadge: 'Bento Koleksiyon Dizilimi',
  categorySectionTitle: 'Kategoriye Göre Keşfedin',
  categorySectionDescription: 'Yaşam alanlarınıza sıcaklık ve heykelsi bir estetik katmak için hazırlanan seçkin lamba grupları.',
  categoryCardExploreText: 'Koleksiyonu Keşfet',
  
  productSectionBadge: 'Lüks Aydınlatma Koleksiyonu',
  productSectionTitle: 'Tüm Ürünler',
  productSectionDescription: 'Yaşam alanlarınız için özenle tasarlanan modern ve heykelsi aydınlatma armatürleri.',
  productFilterAllText: 'Tümü',
  productSearchInputPlaceholder: 'Lamba veya materyal ara (pirinç, cam)...',
  productStockFilterText: 'Yalnızca Stokta',
  productCardDetailBtnText: 'Detay',
  productCardAddBtnText: 'Sepete',
  productCardAddedBtnText: 'Eklendi',
  productCardOutOfStockText: 'Tükendi',
  productCardPreorderText: 'Ön Sipariş',
  productCardNewArrivalText: 'Yeni Seri',
  productEmptyStateTitle: 'Yeni Koleksiyon Yakında',
  productEmptyStateDesc: 'Atölyemiz lüks tasarım aydınlatma koleksiyonları üzerinde titizlikle çalışıyor. Ürünler hazırlandıkça vitrinde yerini alacaktır.',
  productEmptyNewsletterPlaceholder: 'E-posta adresinizi bırakın (İlk siz öğrenin)',
  productEmptyNewsletterBtnText: 'Haber Ver',

  productDetailStoryTitle: 'Tasarım Hikâyesi',
  productDetailTaxIncludedText: 'KDV Dâhil',
  productDetailMaterialLabel: 'Materyal',
  productDetailDimensionsLabel: 'Boyutlar',
  productDetailLightSpecsLabel: 'Işık & Duy',
  productDetailWarrantyTitle: 'Garanti & Kalite',
  productDetailWarrantyText: '2 Yıl Atölye Garantisi',
  productDetailShippingBanner: 'Yurtiçi Kargo ile hızlı teslimat.',
  productDetailAddToCartText: 'Sepete Ekle',
  productDetailInstantCheckoutText: 'Hemen Satın Al',

  cartTitle: 'Alışveriş Sepeti',
  cartEmptyTitle: 'Sepetiniz Boş',
  cartEmptyDesc: 'Lüks tasarım aydınlatma koleksiyonumuzdan dilediğiniz lambayı sepetinize ekleyebilirsiniz.',
  cartEmptyBtnText: 'Koleksiyonu İncele',
  cartFreeShippingReachedText: 'Tebrikler! Siparişinize özel ücretsiz sigortalı kargo uygulandı.',
  cartCheckoutBtnText: 'Siparişi Tamamla & Güvenli Öde',
  cartSecurityBadgeText: 'PCI-DSS Seviye 1 & 3D Secure Korumalı Güvenli Ödeme',
  
  contactBadge: 'Özel Tasarım & Talep',
  contactTitle: 'Size Özel Işık Tasarımı',
  contactDescription: 'LUMEN olarak, mekanlarınıza ve hayallerinize uyum sağlayan kişiye özel aydınlatma tasarımları gerçekleştiriyoruz. Size özel aydınlatma tasarımı talepleriniz ve projeleriniz için ekibimizle iletişime geçebilirsiniz.',
  contactAddressTitle: 'Showroom & Merkez',
  contactAddressText: 'Yenimahalle Mah. Teyyareci Sadık Sok. No:50 A, 34142 Bakırköy / İstanbul',
  contactEmailTitle: 'Özel Tasarım & Sipariş İletişimi',
  contactEmailText: 'hello@lumenlatelier.com',
  contactPhoneTitle: 'Müşteri Hattı',
  contactPhoneText: '+90 537 267 53 86',
  contactWorkingHoursTitle: '',
  contactWorkingHoursText: '',
  contactFormNameLabel: 'Adınız Soyadınız *',
  contactFormEmailLabel: 'E-posta Adresiniz *',
  contactFormPhoneLabel: 'Telefon Numaranız',
  contactFormTypeLabel: 'Proje Türü',
  contactFormMessageLabel: 'Proje Detayları & Özel İstekleriniz *',
  contactFormSubmitBtnText: 'Özel Tasarım Talebi Gönder',
  contactSuccessTitle: 'Talebiniz Atölyemize Ulaştı',
  contactSuccessText: 'Aydınlatma tasarım uzmanımız en geç 24 saat içerisinde proje detayları için sizinle irtibata geçecektir.',
  
  footerBrandText: 'Özel tasarım masa lambaları, heykelsi abajurlar, çocuk serileri ve mimari aydınlatma armatürleri. Işığın sanatsal formu.',
  footerQualityBadge: 'Tescilli Özgün Tasarım & 2 Yıl Garanti',
  footerCopyright: '© 2026 LUMEN. Tüm Hakları Saklıdır.',
  footerCol1Title: 'Koleksiyonlar',
  footerCol2Title: 'Hizmetler & Destek',
  footerCol3Title: 'Yönetim & Güvenlik',
  footerSecurityNote: 'Tüm ürün, metin ve siparişler gerçek zamanlı Firestore veritabanı ile senkronizedir.',
  footerCitiesText: 'İstanbul · Floransa · Zürih',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function sanitizeSettings(data: Partial<SiteSettings>): SiteSettings {
  const merged = { ...DEFAULT_SITE_SETTINGS, ...data };
  
  if (merged.contactBadge && (merged.contactBadge.includes('MİMARİ') || merged.contactBadge.includes('MIMARI'))) {
    merged.contactBadge = 'ÖZEL TASARIM & TALEP';
  }
  if (merged.contactTitle && (merged.contactTitle.includes('Mekanınıza Özel') || merged.contactTitle === 'Özel Tasarım')) {
    merged.contactTitle = 'Size Özel Işık Tasarımı';
  }
  if (merged.contactDescription && (merged.contactDescription.includes('pirinç dökümler') || merged.contactDescription.includes('Mimari projeleriniz') || merged.contactDescription.includes('standart armatürlerin'))) {
    merged.contactDescription = 'LUMEN olarak, mekanlarınıza ve hayallerinize uyum sağlayan kişiye özel aydınlatma tasarımları gerçekleştiriyoruz. Size özel aydınlatma tasarımı talepleriniz ve projeleriniz için ekibimizle iletişime geçebilirsiniz.';
  }
  if (merged.navContactText && (merged.navContactText.includes('Mimari') || merged.navContactText.includes('MİMARİ'))) {
    merged.navContactText = 'Özel Tasarım & İletişim';
  }
  if (merged.contactFormSubmitBtnText && merged.contactFormSubmitBtnText.includes('Danışman')) {
    merged.contactFormSubmitBtnText = 'Özel Tasarım Talebi Gönder';
  }
  if (merged.contactWorkingHoursTitle && merged.contactWorkingHoursTitle.includes('Danışman')) {
    merged.contactWorkingHoursTitle = '';
    merged.contactWorkingHoursText = '';
  }
  if (merged.announcementText && merged.announcementText.includes('Mimari')) {
    merged.announcementText = '✨ Tüm Türkiye’ye Ücretsiz Sigortalı Kargo | Özel Tasarım Talepleri İçin İletişime Geçin';
  }
  if (!merged.contactEmailText || merged.contactEmailText === 'contact@lumen-lighting.com' || merged.contactEmailText === 'hello@lumenatelier.com') {
    merged.contactEmailText = 'hello@lumenlatelier.com';
  }
  if (!merged.brandName || merged.brandName === 'LUMEN ATELIER' || merged.brandName === "LUMEN L'atelier") {
    merged.brandName = 'LUMEN';
  }
  if (!merged.brandTagline || merged.brandTagline === 'AYDINLATMA & TASARIM') {
    merged.brandTagline = "ATELIER D'ART";
  }
  if (!merged.footerQualityBadge || merged.footerQualityBadge.includes('%100 Kalite')) {
    merged.footerQualityBadge = 'Tescilli Özgün Tasarım & 2 Yıl Garanti';
  }
  if (!merged.contactAddressText || merged.contactAddressText.includes('Nişantaşı') || merged.contactAddressText.includes('Abdi İpekçi')) {
    merged.contactAddressText = 'Yenimahalle Mah. Teyyareci Sadık Sok. No:50 A, 34142 Bakırköy / İstanbul';
  }
  if (!merged.contactAddressTitle || merged.contactAddressTitle === 'Showroom & Atölye') {
    merged.contactAddressTitle = 'Showroom & Merkez';
  }
  if (!merged.contactPhoneText || merged.contactPhoneText.includes('840 20 25') || merged.contactPhoneText.includes('000 00 00') || merged.contactPhoneText.includes('212')) {
    merged.contactPhoneText = '+90 537 267 53 86';
  }
  if (!merged.contactPhoneTitle || merged.contactPhoneTitle.includes('& WhatsApp')) {
    merged.contactPhoneTitle = 'Müşteri Hattı';
  }
  if (!merged.announcementText || merged.announcementText.includes('Ücretsiz Sigortalı Kargo') || merged.announcementText.includes('Ücretsiz Kargo')) {
    merged.announcementText = '✨ Tüm Türkiye’ye Yurtiçi Kargo ile Hızlı Teslimat | Özel Tasarım Talepleri İçin İletişime Geçin';
  }
  if (!merged.productDetailShippingBanner || merged.productDetailShippingBanner.includes('ahşap') || merged.productDetailShippingBanner.includes('koruyucu') || merged.productDetailShippingBanner.includes('ücretsiz kargo') || merged.productDetailShippingBanner.includes('ücretsiz teslimat')) {
    merged.productDetailShippingBanner = 'Yurtiçi Kargo ile hızlı teslimat.';
  }
  if (!merged.footerCopyright || merged.footerCopyright.includes("L'atelier") || merged.footerCopyright.includes("Ege Çağan Tokgöz")) {
    merged.footerCopyright = '© 2026 LUMEN ATELIER. Tüm Hakları Saklıdır.';
  }

  return merged;
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const local = localStorage.getItem('lumen_site_settings');
      return local ? sanitizeSettings(JSON.parse(local)) : DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'site_content');
    const unsubscribe = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<SiteSettings>;
        const sanitized = sanitizeSettings(data);
        setSettings(sanitized);
        try {
          localStorage.setItem('lumen_site_settings', JSON.stringify(sanitized));
          // If Firestore had old values, update Firestore to match sanitized
          if (
            data.contactTitle?.includes('Mekanınıza Özel') ||
            data.contactBadge?.includes('MİMARİ') ||
            data.contactDescription?.includes('pirinç dökümler') ||
            data.contactFormSubmitBtnText?.includes('Danışman') ||
            data.contactAddressText?.includes('Nişantaşı') ||
            data.contactAddressText?.includes('Abdi İpekçi') ||
            data.contactPhoneText?.includes('840 20 25') ||
            data.contactPhoneText?.includes('212') ||
            data.contactAddressTitle === 'Showroom & Atölye'
          ) {
            setDoc(settingsDocRef, sanitized, { merge: true }).catch(() => {});
          }
        } catch {
          // ignore
        }
      } else {
        // Init default settings in Firestore
        setDoc(settingsDocRef, DEFAULT_SITE_SETTINGS).catch((e) => {
          console.warn('Initial site settings setup in firestore:', e);
        });
      }
      setLoading(false);
    }, (error) => {
      console.warn('Firestore settings snapshot error, using local fallback:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem('lumen_site_settings', JSON.stringify(merged));
      const settingsDocRef = doc(db, 'settings', 'site_content');
      await setDoc(settingsDocRef, merged, { merge: true });
    } catch (error) {
      console.error('Error updating site settings:', error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/site_content');
      } catch {
        // error logged
      }
      throw error;
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return ctx;
};
