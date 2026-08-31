import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SavedAddress, Order } from '../types';
import { 
  db, 
  COLLECTIONS, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../lib/firebase';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  LogOut, 
  Save, 
  X,
  Building2,
  Home,
  Briefcase
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import { SEO } from '../components/SEO';

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
  'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin',
  'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
  'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan',
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

interface ProfilePageProps {
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth }) => {
  const { 
    user, 
    loading: authLoading, 
    isAdmin, 
    updateUserProfile, 
    saveAddress, 
    deleteAddress, 
    setDefaultAddress,
    logout 
  } = useAuth();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');

  // Profile Edit State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Address Modal / Form State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressTitle, setAddressTitle] = useState('Ev');
  const [addressFullName, setAddressFullName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressCity, setAddressCity] = useState('İstanbul');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sync user details to local form state
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Fetch orders for this user
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    try {
      // Query orders where userId == user.uid
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orderList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(orderList);
        setOrdersLoading(false);
      }, (error) => {
        console.warn('User orders fetch fallback (querying by email):', error);
        // Fallback: Query by email if composite index or userId query is not yet indexed
        if (user.email) {
          const emailQuery = query(
            collection(db, COLLECTIONS.ORDERS),
            where('customerEmail', '==', user.email)
          );
          onSnapshot(emailQuery, (snap) => {
            const emailOrders = snap.docs.map(d => ({
              id: d.id,
              ...d.data()
            })) as Order[];
            emailOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(emailOrders);
            setOrdersLoading(false);
          }, () => {
            setOrdersLoading(false);
          });
        } else {
          setOrdersLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Orders subscription error:', e);
      setOrdersLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      await updateUserProfile({
        displayName: displayName.trim() || undefined,
        phone: phone.trim() || undefined
      });
      setProfileSuccessMsg('Profil bilgileriniz ve telefon numaranız başarıyla güncellendi.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressTitle('Ev');
    setAddressFullName(user?.displayName || '');
    setAddressPhone(user?.phone || '');
    setAddressCity('İstanbul');
    setAddressDistrict('');
    setAddressPostalCode('');
    setAddressLine('');
    setAddressIsDefault((user?.savedAddresses?.length || 0) === 0);
    setAddressFormError(null);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressTitle(addr.title || 'Ev');
    setAddressFullName(addr.fullName || '');
    setAddressPhone(addr.phone || '');
    setAddressCity(addr.city || 'İstanbul');
    setAddressDistrict(addr.district || '');
    setAddressPostalCode(addr.postalCode || '');
    setAddressLine(addr.addressLine || '');
    setAddressIsDefault(!!addr.isDefault);
    setAddressFormError(null);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFullName.trim() || !addressPhone.trim() || !addressLine.trim() || !addressDistrict.trim()) {
      setAddressFormError('Lütfen zorunlu alanları (Ad Soyad, Telefon, İlçe, Açık Adres) doldurunuz.');
      return;
    }

    setSavingAddress(true);
    setAddressFormError(null);

    try {
      await saveAddress({
        title: addressTitle.trim() || 'Adresim',
        fullName: addressFullName.trim(),
        phone: addressPhone.trim(),
        city: addressCity.trim(),
        district: addressDistrict.trim(),
        postalCode: addressPostalCode.trim() || undefined,
        addressLine: addressLine.trim(),
        isDefault: addressIsDefault
      }, editingAddressId || undefined);

      setIsAddressModalOpen(false);
    } catch (err: any) {
      setAddressFormError(err.message || 'Adres kaydedilemedi.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
    } catch (err: any) {
      console.error('Adres silme hatası:', err);
    }
  };

  // If user is not logged in, show elegant login prompt
  if (!user && !authLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <SEO title="Hesabım & Profilim" description="LUMEN Atelier Müşteri Portalı" />
        <div className="max-w-md w-full bg-[#111115] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl glass-panel">
          <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mx-auto text-[#C5A059]">
            <User className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-serif-luxury text-2xl text-white uppercase tracking-wider">Müşteri Hesabı</h2>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Profilinizi görüntülemek, telefon numarası ve teslimat adreslerinizi yönetmek, geçmiş siparişlerinizi takip etmek için lütfen giriş yapın.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              id="profile-login-trigger-btn"
              onClick={onOpenAuth}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Giriş Yap / Hesap Oluştur</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Vitrini Keşfetmeye Devam Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  const savedAddresses = user?.savedAddresses || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 px-4 sm:px-6 lg:px-8">
      <SEO title="Hesabım & Profilim" description="LUMEN Atelier Müşteri Portalı ve Kayıtlı Adresler" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-[#111115] border border-white/10 rounded-3xl p-6 sm:p-8 glass-panel relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#1F1F24] to-[#141418] border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shadow-inner font-serif-luxury text-2xl font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'L')}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-serif-luxury text-white font-medium tracking-wide">
                    {user?.displayName || 'Değerli Müşterimiz'}
                  </h1>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full font-medium border border-[#C5A059]/30 uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> Yönetici
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    {user?.email || 'E-posta tanımlı değil'}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                      {user.phone}
                    </span>
                  )}
                  {user?.createdAt && (
                    <span className="flex items-center gap-1.5 text-zinc-500 hidden sm:flex">
                      <Clock className="w-3.5 h-3.5" />
                      Üyelik: {formatDate(user.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto pt-2 md:pt-0">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/urunler')}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-[#C5A059] border border-[#C5A059]/30 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Paneli</span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Oturumu Kapat"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-2 sm:gap-6 overflow-x-auto pb-1 text-xs uppercase tracking-wider font-semibold">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Kişisel Bilgilerim</span>
          </button>

          <button
            id="tab-addresses-btn"
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Kayıtlı Adreslerim ({savedAddresses.length})</span>
          </button>

          <button
            id="tab-orders-btn"
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Sipariş Geçmişim ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL INFORMATION & PHONE NUMBER */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111115] border border-white/10 rounded-3xl p-6 sm:p-8 glass-panel space-y-6">
              <div>
                <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">İletişim & Profil Bilgileri</h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Sipariş teslimatı ve faturalandırma işlemlerinizde kullanılacak temel bilgilerinizi güncelleyebilirsiniz.
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Ad Soyad *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Örn: Ege Çağan"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Telefon Numarası *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0532 123 45 67 veya +90 532..."
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                      />
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Kargo teslimat bildirimleri için kullanılır.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Kayıtlı E-Posta Adresi
                  </label>
                  <div className="relative opacity-80">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/5 rounded-xl text-xs text-zinc-400 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Güvenliğiniz için ana hesap e-posta adresi değiştirilemez.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="save-profile-btn"
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <span>Kaydediliyor...</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Değişiklikleri Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick summary sidebar */}
            <div className="space-y-6">
              <div className="bg-[#111115] border border-white/10 rounded-3xl p-6 glass-panel space-y-4">
                <h4 className="font-serif-luxury text-sm text-white uppercase tracking-wider">Hesap Özeti</h4>
                
                <div className="space-y-3 text-xs divide-y divide-white/5">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">Kayıtlı Adresler:</span>
                    <span className="font-semibold text-zinc-200">{savedAddresses.length} Adet</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">Toplam Sipariş:</span>
                    <span className="font-semibold text-zinc-200">{orders.length} Adet</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400">Müşteri Statüsü:</span>
                    <span className="text-[#C5A059] font-medium">LUMEN Atelier VIP</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-300 font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Adresleri Yönet</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#17171C] to-[#101014] border border-[#C5A059]/20 text-xs space-y-2">
                <p className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  Güvenli Veri Saklama
                </p>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Adres ve telefon bilgileriniz 256-bit SSL ve Google Cloud Firestore veri tabanında güvenle şifrelenir; yalnızca sipariş teslimat süreçlerinde kullanılır.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">Kayıtlı Teslimat Adreslerim</h3>
                <p className="text-xs text-zinc-400 font-light mt-1">
                  Sipariş verirken tek tıkla teslimat adresinizi seçin, form doldurmakla vakit kaybetmeyin.
                </p>
              </div>

              <button
                id="add-new-address-btn"
                onClick={openNewAddressModal}
                className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Adres Ekle</span>
              </button>
            </div>

            {savedAddresses.length === 0 ? (
              <div className="bg-[#111115] border border-white/10 rounded-3xl p-12 text-center space-y-4 glass-panel">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <MapPin className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-serif-luxury text-white">Henüz Kayıtlı Adresiniz Yok</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Alışverişlerinizi hızlandırmak için ev, iş yeri veya mimari proje şantiyesi gibi teslimat adreslerinizi kaydedin.
                  </p>
                </div>
                <button
                  onClick={openNewAddressModal}
                  className="px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>İlk Adresinizi Ekleyin</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-[#111115] border rounded-3xl p-6 glass-panel flex flex-col justify-between transition-all relative group ${
                      addr.isDefault 
                        ? 'border-[#C5A059]/60 shadow-[0_0_25px_rgba(197,160,89,0.1)]' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Address Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-white/5 text-[#C5A059] border border-white/10">
                            {addr.title.toLowerCase().includes('iş') || addr.title.toLowerCase().includes('ofis') ? (
                              <Briefcase className="w-4 h-4" />
                            ) : addr.title.toLowerCase().includes('şantiye') || addr.title.toLowerCase().includes('proje') ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <Home className="w-4 h-4" />
                            )}
                          </span>
                          <span className="font-semibold text-zinc-100 text-sm">{addr.title}</span>
                        </div>

                        {addr.isDefault && (
                          <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-full font-semibold border border-[#C5A059]/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#C5A059]" /> Varsayılan
                          </span>
                        )}
                      </div>

                      {/* Recipient details */}
                      <div className="space-y-1.5 text-xs text-zinc-300 mb-4">
                        <p className="font-semibold text-white">{addr.fullName}</p>
                        <p className="text-zinc-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {addr.phone}
                        </p>
                        <p className="text-zinc-300 font-light leading-relaxed pt-1 text-[13px]">
                          {addr.addressLine}
                        </p>
                        <p className="text-zinc-400 font-medium text-xs">
                          {addr.district} / {addr.city} {addr.postalCode ? `(${addr.postalCode})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-zinc-400 hover:text-[#C5A059] text-[11px] transition-colors"
                        >
                          Varsayılan Yap
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Ana Adres</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditAddressModal(addr)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Adresi Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Adresi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">Sipariş Geçmişim</h3>
              <p className="text-xs text-zinc-400 font-light mt-1">
                Verdiğiniz siparişlerin durumunu, kargo bilgilerini ve fatura detaylarını takip edin.
              </p>
            </div>

            {ordersLoading ? (
              <div className="py-16 text-center text-xs text-zinc-500">
                Siparişleriniz yükleniyor...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#111115] border border-white/10 rounded-3xl p-12 text-center space-y-4 glass-panel">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-serif-luxury text-white">Henüz Siparişiniz Bulunmuyor</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Koleksiyonumuzdaki el işçiliği pirinç ve mermer aydınlatma tasarımlarını keşfetmek için vitrinimizi ziyaret edin.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <span>Koleksiyonu Keşfet</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColors = {
                    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    processing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    shipped: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  };

                  const statusLabels = {
                    paid: 'Ödeme Alındı',
                    processing: 'Hazırlanıyor',
                    shipped: 'Kargoya Verildi',
                    delivered: 'Teslim Edildi',
                    cancelled: 'İptal Edildi'
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-[#111115] border border-white/10 rounded-3xl p-6 glass-panel space-y-4 hover:border-white/20 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-zinc-400 font-semibold">
                            Sipariş #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${statusColors[order.status] || 'bg-zinc-800 text-zinc-300'}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          <span className="font-serif-luxury font-bold text-sm text-[#C5A059]">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/5">
                            <img
                              src={item.productImage || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=150&q=80'}
                              alt=""
                              className="w-12 h-12 object-cover rounded-xl bg-black shrink-0 border border-white/10"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-200 truncate">{item.productName}</p>
                              <p className="text-[11px] text-zinc-400">{item.quantity} Adet × {formatCurrency(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery address snapshot */}
                      {order.address && (
                        <div className="pt-2 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                            Teslimat: {order.address.fullName} - {order.address.district} / {order.address.city}
                          </span>

                          <span className="text-[11px] text-zinc-500">
                            Ödeme Yöntemi: {order.paymentMethod === 'stripe' ? 'Kredi Kartı' : order.paymentMethod === 'bank_transfer' ? 'Havale / EFT' : 'Kapıda Ödeme'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#121216] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl glass-panel relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif-luxury text-base sm:text-lg text-white uppercase tracking-wider">
                  {editingAddressId ? 'Adresi Düzenle' : 'Yeni Teslimat Adresi Ekle'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {addressFormError}
              </div>
            )}

            <form onSubmit={handleSaveAddressSubmit} className="space-y-4 text-xs">
              {/* Title & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Adres Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressTitle}
                    onChange={(e) => setAddressTitle(e.target.value)}
                    placeholder="Örn: Evim, Ofis, Yazlık"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Alıcı Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFullName}
                    onChange={(e) => setAddressFullName(e.target.value)}
                    placeholder="Örn: Ege Çağan"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  İletişim Telefonu *
                </label>
                <input
                  type="tel"
                  required
                  value={addressPhone}
                  onChange={(e) => setAddressPhone(e.target.value)}
                  placeholder="0532 000 00 00"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              {/* City & District & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    İl *
                  </label>
                  <select
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#17171C] border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  >
                    {TURKISH_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    İlçe *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressDistrict}
                    onChange={(e) => setAddressDistrict(e.target.value)}
                    placeholder="Örn: Beşiktaş"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    placeholder="34353"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              {/* Address Line */}
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  Açık Adres (Mahalle, Cadde, Sokak, Kapı No) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Örn: Bebek Mah. İnşirah Cad. No: 12 Daire: 4"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-zinc-100 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              {/* Default checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-default-addr-checkbox"
                  checked={addressIsDefault}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer"
                />
                <label htmlFor="is-default-addr-checkbox" className="text-zinc-300 cursor-pointer">
                  Bu adresi varsayılan teslimat adresi olarak ayarla
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  id="address-modal-save-btn"
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {savingAddress ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingAddressId ? 'Güncelle' : 'Adresi Kaydet'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
