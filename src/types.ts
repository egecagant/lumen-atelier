export type StockStatus = 'in_stock' | 'out_of_stock' | 'preorder';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryName?: string;
  images: string[];
  stockStatus: StockStatus;
  stockQuantity: number;
  dimensions?: string;
  material?: string;
  lightSpecs?: string; // e.g. "2700K Sıcak Beyaz | E27 Duy | 12W LED Uyumlu"
  energyClass?: string; // e.g. "A++"
  featured?: boolean;
  isNewArrival?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  linkUrl: string;
  imageUrl: string;
  active: boolean;
  order: number;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SavedAddress {
  id: string;
  title: string; // e.g. "Ev Adresim", "Ofis / İş Yeri", "Yazlık"
  fullName: string;
  phone: string;
  city: string;
  district: string;
  postalCode?: string;
  addressLine: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'customer';
  phone?: string;
  savedAddresses?: SavedAddress[];
  createdAt: number;
  updatedAt?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  active: boolean;
  usageCount?: number;
  usageLimit?: number;
  expiresAt?: number;
  createdAt: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  invoiceType?: 'individual' | 'corporate';
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  idNumber?: string;
  orderNote?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  appliedCoupon?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
  paymentMethodDiscount?: number;
  shipping: number;
  total: number;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'iyzico' | 'stripe' | 'bank_transfer' | 'cash_on_delivery';
  iyzicoPaymentId?: string;
  iyzicoToken?: string;
  stripePaymentId?: string;
  bankTransferReference?: string;
  notes?: string;
  adminNote?: string;
  createdAt: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  projectType?: string; // e.g. "Konut Projesi", "Özel Tasarım Lamba", "Özel Tasarım", "Diğer"
  status: 'new' | 'in_progress' | 'completed';
  createdAt: number;
}
