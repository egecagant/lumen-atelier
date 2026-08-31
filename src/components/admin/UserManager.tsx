import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Crown,
  MapPin,
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '../../types';
import { 
  db, 
  COLLECTIONS, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType 
} from '../../lib/firebase';
import { isRootAdminEmail, ROOT_ADMIN_EMAILS } from '../../lib/adminConfig';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/format';

export const UserManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleToggleModalOpen, setIsRoleToggleModalOpen] = useState(false);

  // Target User States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<'admin' | 'customer'>('customer');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    uid?: string;
    displayName: string;
    email: string;
    phone: string;
    role: 'admin' | 'customer';
  }>({
    displayName: '',
    email: '',
    phone: '',
    role: 'customer',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener for users collection
  useEffect(() => {
    setLoading(true);
    const usersCollectionRef = collection(db, COLLECTIONS.USERS);

    const unsubscribe = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        const userList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          const isRoot = isRootAdminEmail(data.email);
          userList.push({
            ...data,
            uid: docSnap.id,
            // If email is in root admin list, display role as admin
            role: isRoot ? 'admin' : (data.role || 'customer'),
            createdAt: data.createdAt || Date.now()
          });
        });

        // Ensure root admins appear in the list even if they haven't logged in yet
        ROOT_ADMIN_EMAILS.forEach((rootEmail) => {
          const exists = userList.some(u => u.email.toLowerCase().trim() === rootEmail.toLowerCase().trim());
          if (!exists) {
            userList.push({
              uid: 'root_' + rootEmail.split('@')[0],
              email: rootEmail,
              displayName: rootEmail === 'batuhanesirger@gmail.com' ? 'Batuhan Esirger' : 'Ege Çağan (Kurucu)',
              role: 'admin',
              createdAt: Date.now()
            });
          }
        });

        // Sort: Admins first, then by registration date
        userList.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });

        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error('Users snapshot error:', error);
        setErrorMessage('Kullanıcı listesi alınırken hata oluştu: ' + error.message);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
        } catch {
          // handled
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Metric Computations
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalCustomers = users.filter(u => u.role !== 'admin').length;

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = 
      roleFilter === 'all' ? true :
      roleFilter === 'admin' ? u.role === 'admin' :
      u.role !== 'admin';

    return matchesSearch && matchesRole;
  });

  // Handlers
  const handleOpenAddModal = () => {
    setFormData({
      displayName: '',
      email: '',
      phone: '',
      role: 'customer',
    });
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'customer',
    });
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleOpenRoleToggleModal = (user: UserProfile) => {
    if (isRootAdminEmail(user.email)) {
      setErrorMessage('Kurucu yönetici hesabının yetkisi değiştirilemez.');
      return;
    }
    setSelectedUser(user);
    setTargetRole(user.role === 'admin' ? 'customer' : 'admin');
    setIsRoleToggleModalOpen(true);
  };

  const handleOpenDeleteModal = (user: UserProfile) => {
    if (isRootAdminEmail(user.email)) {
      setErrorMessage('Kurucu yönetici hesabı sistemden silinemez.');
      return;
    }
    if (user.uid === currentUser?.uid) {
      setErrorMessage('Kendi aktif yönetici hesabınızı silemezsiniz.');
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Submit Add User
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const email = formData.email.toLowerCase().trim();
      const isRoot = isRootAdminEmail(email);
      const assignedRole = isRoot ? 'admin' : formData.role;

      // Check if user already exists
      const existingUser = users.find(u => u.email.toLowerCase().trim() === email);
      const targetUid = existingUser && !existingUser.uid.startsWith('root_') 
        ? existingUser.uid 
        : 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const userDocRef = doc(db, COLLECTIONS.USERS, targetUid);
      const payload: UserProfile = {
        uid: targetUid,
        email,
        displayName: formData.displayName.trim() || email.split('@')[0],
        phone: formData.phone.trim() || undefined,
        role: assignedRole,
        savedAddresses: existingUser?.savedAddresses || [],
        createdAt: existingUser?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(userDocRef, payload, { merge: true });

      setSuccessMessage(`${payload.displayName} (${payload.email}) başarıyla ${assignedRole === 'admin' ? 'Yönetici' : 'Müşteri'} olarak eklendi.`);
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      console.error('Error adding user:', err);
      const msg = err instanceof Error ? err.message : 'Kullanıcı eklenirken bir hata oluştu.';
      setErrorMessage('İşlem başarısız: ' + msg);
      try {
        handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.USERS);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const isRoot = isRootAdminEmail(selectedUser.email);
      const assignedRole = isRoot ? 'admin' : formData.role;

      const userDocRef = doc(db, COLLECTIONS.USERS, selectedUser.uid);
      const updates = {
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || null,
        role: assignedRole,
        updatedAt: Date.now()
      };

      await updateDoc(userDocRef, updates);

      setSuccessMessage('Kullanıcı bilgileri başarıyla güncellendi.');
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      console.error('Error updating user:', err);
      const msg = err instanceof Error ? err.message : 'Kullanıcı güncellenirken hata oluştu.';
      setErrorMessage('Güncelleme başarısız: ' + msg);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.USERS}/${selectedUser.uid}`);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Role Toggle
  const handleConfirmRoleToggle = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, selectedUser.uid);
      await setDoc(userDocRef, {
        ...selectedUser,
        role: targetRole,
        updatedAt: Date.now()
      }, { merge: true });

      setSuccessMessage(`${selectedUser.displayName || selectedUser.email} kullanıcısının yetkisi "${targetRole === 'admin' ? 'Yönetici' : 'Müşteri'}" olarak değiştirildi.`);
      setIsRoleToggleModalOpen(false);
    } catch (err: unknown) {
      console.error('Error changing user role:', err);
      const msg = err instanceof Error ? err.message : 'Rol değiştirilirken hata oluştu.';
      setErrorMessage('Yetki değiştirilemedi: ' + msg);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.USERS}/${selectedUser.uid}`);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, selectedUser.uid);
      await deleteDoc(userDocRef);

      setSuccessMessage(`${selectedUser.displayName || selectedUser.email} kullanıcısı sistemden başarıyla silindi.`);
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      const msg = err instanceof Error ? err.message : 'Kullanıcı silinirken hata oluştu.';
      setErrorMessage('Kullanıcı silinemedi: ' + msg);
      try {
        handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.USERS}/${selectedUser.uid}`);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/30 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400/70 hover:text-emerald-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center justify-between shadow-lg shadow-rose-950/30 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-rose-400/70 hover:text-rose-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F12] p-6 rounded-3xl border border-white/10 glass-panel shadow-lg">
        <div>
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-white uppercase tracking-wider">
            Kullanıcılar ve Yetkiler
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Kayıtlı kullanıcıları görüntüleyin, yönetici yetkisi atayın veya yeni hesap ekleyin.
          </p>
        </div>

        <button
          id="add-user-btn"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, e-posta veya telefon ile ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-[#C5A059] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tümü ({totalUsers})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'admin'
                ? 'bg-[#C5A059] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Yöneticiler ({totalAdmins})</span>
          </button>
          <button
            onClick={() => setRoleFilter('customer')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'customer'
                ? 'bg-[#C5A059] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Müşteriler ({totalCustomers})</span>
          </button>
        </div>
      </div>

      {/* Users List / Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C5A059]" />
            <span className="text-xs uppercase tracking-wider">Kullanıcılar Yükleniyor...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Eşleşen Kullanıcı Bulunamadı</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Arama kriterlerinize uygun hesap bulunamadı. Aramayı sıfırlayabilir veya yeni bir kullanıcı ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black/60 border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-4 px-6">Kullanıcı</th>
                  <th className="py-4 px-6">İletişim</th>
                  <th className="py-4 px-6">Rol & Yetki</th>
                  <th className="py-4 px-6">Kayıt Tarihi</th>
                  <th className="py-4 px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((userItem) => {
                  const isRoot = isRootAdminEmail(userItem.email);
                  const isSelf = userItem.uid === currentUser?.uid || userItem.email.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim();
                  const isAdminUser = userItem.role === 'admin' || isRoot;

                  return (
                    <tr 
                      key={userItem.uid} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border shadow-inner ${
                            isAdminUser 
                              ? 'bg-gradient-to-br from-[#C5A059]/20 to-[#E6CA85]/10 border-[#C5A059]/40 text-[#C5A059]' 
                              : 'bg-zinc-800/80 border-white/10 text-zinc-300'
                          }`}>
                            {(userItem.displayName || userItem.email || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2 text-sm">
                              <span>{userItem.displayName || 'İsimsiz Kullanıcı'}</span>
                              {isRoot && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-bold uppercase tracking-wider" title="Kurucu Yönetici">
                                  <Crown className="w-3 h-3" />
                                  <span>Kurucu</span>
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded font-medium">
                                  (Siz)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              ID: {userItem.uid.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-zinc-200">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span>{userItem.email}</span>
                          </div>
                          {userItem.phone ? (
                            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                              <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                              <span>{userItem.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-600 italic">Telefon belirtilmemiş</div>
                          )}
                        </div>
                      </td>

                      {/* Role & Badges */}
                      <td className="py-4 px-6">
                        {isAdminUser ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059] font-bold text-xs shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>YÖNETİCİ</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-medium text-xs">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Müşteri</span>
                          </div>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDate(userItem.createdAt || Date.now())}</span>
                        </div>
                        {userItem.savedAddresses && userItem.savedAddresses.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{userItem.savedAddresses.length} Kayıtlı Adres</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role Toggle Button */}
                          {!isRoot && (
                            <button
                              onClick={() => handleOpenRoleToggleModal(userItem)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                isAdminUser
                                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10 hover:border-white/20'
                                  : 'bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30 hover:border-[#C5A059]/60'
                              }`}
                              title={isAdminUser ? 'Müşteri Rolüne Düşür' : 'Yönetici Yetkisi Ver'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>{isAdminUser ? 'Müşteri Yap' : 'Admin Yap'}</span>
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(userItem)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            title="Kullanıcıyı Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          {!isRoot && !isSelf && (
                            <button
                              onClick={() => handleOpenDeleteModal(userItem)}
                              className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                              title="Kullanıcıyı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD USER / ADMIN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6 sm:p-8 bg-[#0D0D0D] space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-sans font-bold text-white tracking-wide">Yeni Hesap Ekle</h3>
                  <p className="text-xs text-zinc-400">Yönetici veya müşteri olarak yeni kullanıcı tanımlayın</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  E-Posta Adresi *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Örn: kullanici@gmail.com"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Kullanıcı bu e-posta ile giriş yaptığında ya da kaydolduğunda tanımlanan yetkilere sahip olacaktır.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Telefon Numarası (Opsiyonel)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Örn: 0555 123 45 67"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                  Hesap Rolü & Yetki Düzeyi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.role === 'customer'
                        ? 'bg-white/10 border-white/30 shadow-md'
                        : 'bg-black/30 border-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <User className="w-4 h-4 text-zinc-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Müşteri</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Standart alışveriş hesabı</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.role === 'admin'
                        ? 'bg-[#C5A059]/15 border-[#C5A059]'
                        : 'bg-black/30 border-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#C5A059]">Yönetici (Admin)</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Tam yönetim paneli erişimi</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#E6CA85] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Kullanıcıyı Kaydet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6 sm:p-8 bg-[#0D0D0D] space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/5 text-white border border-white/10">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-sans font-bold text-white tracking-wide">Kullanıcıyı Düzenle</h3>
                  <p className="text-xs text-zinc-400">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-zinc-400 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0555 123 45 67"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-[#C5A059] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                  Rol & Yetki
                </label>
                {isRootAdminEmail(selectedUser.email) ? (
                  <div className="p-3 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-xs text-[#C5A059] flex items-center gap-2">
                    <Crown className="w-4 h-4 flex-shrink-0" />
                    <span>Kurucu yönetici hesabı her zaman yönetici yetkisine sahiptir.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData({ ...formData, role: 'customer' })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        formData.role === 'customer'
                          ? 'bg-white/10 border-white/30 shadow-md'
                          : 'bg-black/30 border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <User className="w-4 h-4 text-zinc-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">Müşteri</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Standart hesap</div>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        formData.role === 'admin'
                          ? 'bg-[#C5A059]/15 border-[#C5A059]'
                          : 'bg-black/30 border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-[#C5A059]">Yönetici (Admin)</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Yönetim yetkisi</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#E6CA85] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Değişiklikleri Kaydet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ROLE TOGGLE CONFIRMATION */}
      {isRoleToggleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-6 sm:p-8 bg-[#0D0D0D] space-y-6 shadow-2xl text-center">
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border shadow-lg ${
              targetRole === 'admin' 
                ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' 
                : 'bg-zinc-800 border-white/10 text-zinc-300'
            }`}>
              {targetRole === 'admin' ? <ShieldCheck className="w-8 h-8" /> : <User className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-sans font-bold text-white tracking-tight">
                {targetRole === 'admin' ? 'Yönetici Yetkisi Ver' : 'Müşteri Rolüne Döndür'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="font-semibold text-white">{selectedUser.displayName || selectedUser.email}</span>{' '}
                kullanıcısının rolünü{' '}
                <span className="font-bold text-[#C5A059] uppercase">{targetRole === 'admin' ? 'Yönetici (Admin)' : 'Müşteri'}</span>{' '}
                olarak değiştirmek üzeresiniz.
              </p>
              {targetRole === 'admin' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-left text-[11px] text-amber-300/90 mt-2">
                  💡 Yönetici olan kullanıcılar tüm ürünleri, siparişleri, indirim kuponlarını, vitrin içeriklerini ve kullanıcıları yönetebilir.
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRoleToggleModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRoleToggle}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#E6CA85] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Güncelleniyor...' : 'Evet, Değiştir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE USER CONFIRMATION */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-rose-500/30 p-6 sm:p-8 bg-[#0D0D0D] space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-rose-950/40 border border-rose-500/40 text-rose-400 shadow-lg shadow-rose-950/40">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-sans font-bold text-white tracking-tight">
                Kullanıcıyı Sil
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="font-semibold text-white">{selectedUser.displayName || selectedUser.email}</span> adlı kullanıcı kaydını kalıcı olarak silmek istediğinize emin misiniz?
              </p>
              <p className="text-[11px] text-rose-400/80">
                ⚠️ Bu işlem geri alınamaz. Kullanıcının profil ve adres kayıtları veritabanından silinecektir.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteUser}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-900/40 disabled:opacity-50"
              >
                {isSubmitting ? 'Siliniyor...' : 'Evet, Kullanıcıyı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
