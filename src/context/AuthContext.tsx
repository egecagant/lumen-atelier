import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  COLLECTIONS, 
  doc, 
  getDoc, 
  setDoc, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail
} from '../lib/firebase';
import { UserProfile, SavedAddress } from '../types';
import { isRootAdminEmail, ROOT_ADMIN_EMAILS } from '../lib/adminConfig';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  initRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, verificationCode: string, name?: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; phone?: string }) => Promise<void>;
  saveAddress: (address: Omit<SavedAddress, 'id'>, editAddressId?: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Clean any old local storage overrides
  useEffect(() => {
    try {
      localStorage.removeItem('lumen_admin_override');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const isRootAdmin = isRootAdminEmail(fbUser.email);
          let role: 'admin' | 'customer' = isRootAdmin ? 'admin' : 'customer';

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (data.role === 'admin' || isRootAdmin) {
              role = 'admin';
            }
            setUser({
              uid: fbUser.uid,
              email: fbUser.email || '',
              phone: data.phone || fbUser.phoneNumber || '',
              displayName: data.displayName || fbUser.displayName || fbUser.phoneNumber || 'Değerli Müşterimiz',
              savedAddresses: data.savedAddresses || [],
              role,
              createdAt: data.createdAt || Date.now(),
              updatedAt: data.updatedAt
            });
          } else {
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              displayName: fbUser.displayName || fbUser.phoneNumber || 'Değerli Müşterimiz',
              savedAddresses: [],
              role,
              createdAt: Date.now()
            };
            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
          }
        } catch (error) {
          console.warn('User profile fetch fallback:', error);
          const isRootAdmin = isRootAdminEmail(fbUser.email);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            phone: fbUser.phoneNumber || '',
            displayName: fbUser.displayName || fbUser.phoneNumber || fbUser.email?.split('@')[0] || 'Kullanıcı',
            savedAddresses: [],
            role: isRootAdmin ? 'admin' : 'customer',
            createdAt: Date.now()
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    const isRootAdmin = isRootAdminEmail(email);
    const profile: UserProfile = {
      uid: res.user.uid,
      email: res.user.email || '',
      displayName: name,
      role: isRootAdmin ? 'admin' : 'customer',
      createdAt: Date.now()
    };
    await setDoc(doc(db, COLLECTIONS.USERS, res.user.uid), profile);
    setUser(profile);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const initRecaptcha = (containerId: string) => {
    // Clear existing recaptcha verifier if any attached
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // ignore
      }
    }
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - will proceed with phone sign in
      }
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const sendPhoneOtp = async (phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  };

  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, verificationCode: string, name?: string) => {
    const result = await confirmationResult.confirm(verificationCode);
    const fbUser = result.user;
    if (name && fbUser) {
      await updateProfile(fbUser, { displayName: name });
    }
    const userDocRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        displayName: name || fbUser.displayName || fbUser.phoneNumber || 'Değerli Müşterimiz',
        role: 'customer',
        createdAt: Date.now()
      };
      await setDoc(userDocRef, profile);
      setUser(profile);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; phone?: string }) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');
    
    // If displayName is changing and auth.currentUser exists
    if (updates.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updates.displayName });
    }

    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const updatedUser: UserProfile = {
      ...user,
      ...(updates.displayName !== undefined && { displayName: updates.displayName }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      updatedAt: Date.now()
    };

    await setDoc(userDocRef, updatedUser, { merge: true });
    setUser(updatedUser);
  };

  const saveAddress = async (addressData: Omit<SavedAddress, 'id'>, editAddressId?: string) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

    let currentAddresses = [...(user.savedAddresses || [])];
    
    // If setting as default, clear other defaults
    if (addressData.isDefault || currentAddresses.length === 0) {
      currentAddresses = currentAddresses.map(addr => ({ ...addr, isDefault: false }));
      addressData.isDefault = true;
    }

    if (editAddressId) {
      // Edit existing
      currentAddresses = currentAddresses.map(addr => {
        if (addr.id === editAddressId) {
          return {
            ...addr,
            ...addressData,
            id: editAddressId
          };
        }
        return addr;
      });
    } else {
      // Create new
      const newAddress: SavedAddress = {
        id: 'addr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...addressData
      };
      currentAddresses.push(newAddress);
    }

    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const updatedUser: UserProfile = {
      ...user,
      savedAddresses: currentAddresses,
      updatedAt: Date.now()
    };

    await setDoc(userDocRef, updatedUser, { merge: true });
    setUser(updatedUser);
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

    const filtered = (user.savedAddresses || []).filter(a => a.id !== addressId);
    
    // If we deleted default address and have remaining, set first as default
    if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const updatedUser: UserProfile = {
      ...user,
      savedAddresses: filtered,
      updatedAt: Date.now()
    };

    await setDoc(userDocRef, updatedUser, { merge: true });
    setUser(updatedUser);
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

    const updatedAddresses = (user.savedAddresses || []).map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const updatedUser: UserProfile = {
      ...user,
      savedAddresses: updatedAddresses,
      updatedAt: Date.now()
    };

    await setDoc(userDocRef, updatedUser, { merge: true });
    setUser(updatedUser);
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
  };

  const isAdmin = !!user && (user.role === 'admin' || isRootAdminEmail(user.email));

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      loginWithEmail,
      loginWithGoogle,
      registerWithEmail,
      sendPasswordReset,
      initRecaptcha,
      sendPhoneOtp,
      verifyPhoneOtp,
      updateUserProfile,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
