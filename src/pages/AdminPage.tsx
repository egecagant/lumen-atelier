import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Product, Category, HeroBanner, Order, ContactMessage } from '../types';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

interface AdminPageProps {
  products: Product[];
  categories: Category[];
  banners: HeroBanner[];
  orders: Order[];
  messages: ContactMessage[];
  onOpenQuickView: (product: Product) => void;
  onOpenAuth: () => void;
}

const tabToUrlMap: Record<AdminTab, string> = {
  products: 'urunler',
  categories: 'kategoriler',
  banners: 'vitrin',
  coupons: 'kuponlar',
  orders: 'siparisler',
  users: 'kullanicilar',
};

const urlToTabMap: Record<string, AdminTab> = {
  urunler: 'products',
  products: 'products',
  kategoriler: 'categories',
  categories: 'categories',
  vitrin: 'banners',
  banner: 'banners',
  banners: 'banners',
  duyuru: 'banners',
  announcement: 'banners',
  announcements: 'banners',
  kupon: 'coupons',
  kuponlar: 'coupons',
  coupon: 'coupons',
  coupons: 'coupons',
  indirim: 'coupons',
  siparisler: 'orders',
  orders: 'orders',
  kullanicilar: 'users',
  kullanici: 'users',
  users: 'users',
  user: 'users',
  yetkiler: 'users',
};

export const AdminPage: React.FC<AdminPageProps> = ({
  products,
  categories,
  banners,
  orders,
  messages,
  onOpenQuickView,
  onOpenAuth,
}) => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  const currentTab: AdminTab = tab && urlToTabMap[tab] ? urlToTabMap[tab] : 'products';
  const isAnnouncementSubTab = tab === 'duyuru' || tab === 'announcement' || tab === 'announcements';

  const handleTabChange = (newTab: AdminTab) => {
    const slug = tabToUrlMap[newTab] || 'urunler';
    navigate(`/admin/${slug}`);
  };

  if (!isAdmin && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO title="Admin Yönetim Portalı" description="LUMEN Atelier Yönetici Paneli" />
      <AdminLayout
        products={products}
        categories={categories}
        banners={banners}
        orders={orders}
        messages={messages}
        initialTab={currentTab}
        initialSubTab={isAnnouncementSubTab ? 'announcement' : 'banners'}
        onTabChange={handleTabChange}
        onOpenQuickView={onOpenQuickView}
        onExitAdmin={() => navigate('/')}
      />
    </>
  );
};

