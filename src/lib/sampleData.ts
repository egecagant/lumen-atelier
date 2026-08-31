import { Category, Product, HeroBanner } from '../types';

export const SAMPLE_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Çocuk Masa Lambası',
    slug: 'cocuk-masa-lambasi',
    description: 'Yaratıcı, göz yormayan ve sıcak ışık veren özel tasarım çocuk odası aydınlatmaları.',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    order: 1,
    createdAt: Date.now() - 500000
  },
  {
    name: 'Dekoratif Lamba',
    slug: 'dekoratif-lamba',
    description: 'Heykelsi formlar, pirinç detaylar ve amber camın büyüleyici atmosferik ışığı.',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    order: 2,
    createdAt: Date.now() - 400000
  },
  {
    name: 'Aydınlatma',
    slug: 'aydinlatma',
    description: 'Modern mekanlar için mimari sarkıt, lambader ve aplik çözümleri.',
    imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80',
    order: 3,
    createdAt: Date.now() - 300000
  },
  {
    name: 'Masa Lambaları',
    slug: 'masa-lambalari',
    description: 'Çalışma alanlarını ve komodinleri taçlandıran ergonomik ve zarif armatürler.',
    imageUrl: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80',
    order: 4,
    createdAt: Date.now() - 200000
  }
];

export const SAMPLE_BANNERS: Omit<HeroBanner, 'id'>[] = [
  {
    title: 'IŞIĞIN HEYKELSİ ZARAFETİ',
    subtitle: 'Masif pirinç, İtalyan mermeri ve sıcak amber camın zamansız buluşması.',
    buttonText: 'Hemen Satın Al',
    linkUrl: '#koleksiyon',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1920&q=85',
    active: true,
    order: 1,
    createdAt: Date.now() - 100000
  },
  {
    title: 'AURA KOLEKSİYONU: DOKUNMATİK AMBİYANS',
    subtitle: 'Minimalist geometrik hatlar, 3 kademeli sıcak ışık modu ve kablosuz lüks.',
    buttonText: 'Hemen Satın Al',
    linkUrl: '#koleksiyon',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1920&q=85',
    active: true,
    order: 2,
    createdAt: Date.now() - 90000
  },
  {
    title: 'ÇOCUK ODALARI İÇİN MASALSI AYDINLIK',
    subtitle: 'Göz dostu difüzyon lensi ve sıcak dostane formlarla tasarlanmış çocuk lambaları.',
    buttonText: 'Hemen Satın Al',
    linkUrl: '#koleksiyon',
    imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1920&q=85',
    active: true,
    order: 3,
    createdAt: Date.now() - 80000
  }
];

export const SAMPLE_PRODUCTS = (categoryMap: Record<string, string>): Omit<Product, 'id'>[] => [
  {
    name: 'Astronot Kozmik Çocuk Masa Lambası',
    slug: 'astronot-kozmik-cocuk-masa-lambasi',
    description: 'Yumuşak silikon doku ve sıcak LED ışık teknolojisi ile çocukların uyku ve ders saatlerine eşlik eden büyülü bir tasarım. Ayarlanabilir kask vizörü ve nefes alan gece modu ile karanlık korkusuna son verir.',
    shortDescription: 'Göz korumalı sıcak LED, 3 kademeli gece lambası modu.',
    price: 345,
    compareAtPrice: 420,
    categoryId: categoryMap['cocuk-masa-lambasi'] || '',
    categoryName: 'Çocuk Masa Lambası',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80'
    ],
    stockStatus: 'in_stock',
    stockQuantity: 18,
    dimensions: 'Y: 28cm | G: 16cm | D: 14cm',
    material: 'Mat Reçine, BPA-Free Yumuşak Silikon, Optik Akrilik',
    lightSpecs: '2700K Sıcak Işık | 5W Entegre LED | USB-C Şarj Edilebilir',
    energyClass: 'A++',
    featured: true,
    isNewArrival: true,
    createdAt: Date.now() - 70000
  },
  {
    name: 'Nero Marquina Mermer & Pirinç Heykelsi Lamba',
    slug: 'nero-marquina-mermer-pirinc-heykelsi-lamba',
    description: 'İspanya’dan ithal tek parça damarlı Nero Marquina siyah mermer blok üzerine oturtulmuş fırçalanmış masif pirinç silindir. Yaşam alanlarında sanatsal bir odak noktası oluşturur.',
    shortDescription: 'Doğal siyah mermer gövde, fırçalanmış pirinç başlık.',
    price: 1890,
    compareAtPrice: 2250,
    categoryId: categoryMap['dekoratif-lamba'] || '',
    categoryName: 'Dekoratif Lamba',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80'
    ],
    stockStatus: 'in_stock',
    stockQuantity: 6,
    dimensions: 'Y: 42cm | Taban Çapı: 22cm',
    material: 'Doğal Nero Marquina Mermer, Masif Pirinç',
    lightSpecs: '2200K - 2700K Dimmerli Amber LED | E27 Duy | 8W Vintage Filament',
    energyClass: 'A+',
    featured: true,
    isNewArrival: true,
    createdAt: Date.now() - 60000
  },
  {
    name: 'Amber Glow Üfleme Cam Sarkıt Avize',
    slug: 'amber-glow-ufleme-cam-sarkit-avize',
    description: 'Bal rengi organik formlu zarif amber cam kubbe ve antrasit detaylar. Işığı homojen yayarak yemek masası ve salonlarda davetkar bir sıcaklık yaratır.',
    shortDescription: 'Organik formlu zarif amber cam, antrasit askı aparatı.',
    price: 1420,
    categoryId: categoryMap['aydinlatma'] || '',
    categoryName: 'Aydınlatma',
    images: [
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
    ],
    stockStatus: 'in_stock',
    stockQuantity: 12,
    dimensions: 'Cam Çapı: 35cm | Ayarlanabilir Kablo: 150cm',
    material: 'Bohemya Amber Camı, Mat Siyah Çelik',
    lightSpecs: '2700K Sıcak Işık | Maks. 40W E27 | Triyak Dimmer Uyumlu',
    energyClass: 'A++',
    featured: true,
    isNewArrival: false,
    createdAt: Date.now() - 50000
  },
  {
    name: 'Sombre Mantar Dokunmatik Kablosuz Masa Lambası',
    slug: 'sombre-mantar-dokunmatik-kablosuz-masa-lambasi',
    description: 'Kablosuz özgürlük sunan şarjlı taşınabilir masa lambası. 3 kademeli dokunmatik hassasiyet, IP54 su sıçramalarına dayanıklılık ve 18 saate kadar kesintisiz çalışma performansı.',
    shortDescription: 'Taşınabilir şarjlı lamba, 3 seviyeli dokunmatik karartma.',
    price: 580,
    compareAtPrice: 690,
    categoryId: categoryMap['masa-lambalari'] || '',
    categoryName: 'Masa Lambaları',
    images: [
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
    ],
    stockStatus: 'in_stock',
    stockQuantity: 24,
    dimensions: 'Y: 24cm | Şapka Çapı: 16cm',
    material: 'Eloksallı Bronz Alüminyum, Buzlu Difüzör',
    lightSpecs: '3000K & 2200K Çift Renk | 4000mAh Lityum Pil | Type-C Hızlı Şarj',
    energyClass: 'A+++',
    featured: false,
    isNewArrival: true,
    createdAt: Date.now() - 40000
  }
];
