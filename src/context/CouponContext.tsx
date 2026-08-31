import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Coupon } from '../types';
import { 
  db, 
  COLLECTIONS, 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';

const STORAGE_KEY = 'lumen_coupons_cache_v2';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-lumen15',
    code: 'LUMEN15',
    description: 'Tüm lüks tasarım lambalarda %15 Hoş Geldin İndirimi',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 200,
    maxDiscountAmount: 500,
    active: true,
    usageCount: 42,
    usageLimit: 500,
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: 'coupon-hosgeldin500',
    code: 'HOSGELDIN50',
    description: '300 TL ve üzeri siparişlerde 50 TL Anında Nakit İndirimi',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 300,
    active: true,
    usageCount: 28,
    usageLimit: 250,
    createdAt: Date.now() - 86400000 * 15
  },
  {
    id: 'coupon-vip20',
    code: 'VIP20',
    description: 'Özel Tasarım & VIP Koleksiyonunda %20 İndirim',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 750,
    maxDiscountAmount: 1000,
    active: true,
    usageCount: 14,
    usageLimit: 100,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 'coupon-yaz2026',
    code: 'YAZ2026',
    description: 'Yeni Sezon Bahçe & Tavan Aydınlatmalarında %10 İndirim',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 150,
    active: true,
    usageCount: 65,
    usageLimit: 1000,
    createdAt: Date.now() - 86400000 * 5
  }
];

// Helper to strip undefined values so Firestore never rejects payloads
function cleanObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

// Load cached coupons from local storage
function loadCachedCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read coupons from localStorage:', e);
  }
  return DEFAULT_COUPONS;
}

// Save coupons to local storage cache
function saveCachedCoupons(coupons: Coupon[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.warn('Could not save coupons to localStorage:', e);
  }
}

export interface ApplyCouponResult {
  success: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
}

interface CouponContextType {
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string, currentSubtotal: number) => ApplyCouponResult;
  removeCoupon: () => void;
  recalculateDiscount: (currentSubtotal: number) => number;
  createCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Promise<string>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string, currentStatus: boolean) => Promise<void>;
  recordCouponUsage: (couponId: string) => Promise<void>;
  seedDefaultCoupons: () => Promise<void>;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const CouponProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(loadCachedCoupons);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const hasAttemptedAutoSeed = useRef(false);

  // Subscribe to coupons in Firestore with real-time updates
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(collection(db, COLLECTIONS.COUPONS));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;

          if (!snapshot.empty) {
            const list: Coupon[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              list.push({
                id: d.id,
                code: data.code || '',
                description: data.description || '',
                discountType: data.discountType || 'percentage',
                discountValue: Number(data.discountValue) || 0,
                minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
                maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
                usageCount: Number(data.usageCount) || 0,
                usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
                expiresAt: data.expiresAt ? Number(data.expiresAt) : undefined,
                active: data.active !== undefined ? Boolean(data.active) : true,
                createdAt: Number(data.createdAt) || Date.now()
              } as Coupon);
            });

            const sorted = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setCoupons(sorted);
            saveCachedCoupons(sorted);
          } else {
            // If Firestore is empty and hasn't been seeded yet, auto-seed default coupons
            if (!hasAttemptedAutoSeed.current) {
              hasAttemptedAutoSeed.current = true;
              seedDefaultCoupons().catch((err) => {
                console.warn('Auto-seed default coupons error:', err);
              });
            } else {
              setCoupons(prev => {
                const initial = prev.length > 0 ? prev : DEFAULT_COUPONS;
                saveCachedCoupons(initial);
                return initial;
              });
            }
          }
        },
        (error) => {
          console.warn('Coupons onSnapshot warning (using cached fallback):', error);
          setCoupons(prev => {
            const fallback = prev.length > 0 ? prev : loadCachedCoupons();
            saveCachedCoupons(fallback);
            return fallback;
          });
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Coupon subscription error:', err);
      const fallback = loadCachedCoupons();
      setCoupons(fallback);
      saveCachedCoupons(fallback);
    }
  }, []);

  const calculateDiscount = (coupon: Coupon, currentSubtotal: number): number => {
    if (!coupon || currentSubtotal <= 0) return 0;

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (currentSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, currentSubtotal);
    }
    return Math.round(discount);
  };

  const recalculateDiscount = (currentSubtotal: number): number => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return 0;
    }

    // Check if the current applied coupon still exists in latest active coupons
    const freshCoupon = coupons.find(c => c.code.toUpperCase() === appliedCoupon.code.toUpperCase());
    const couponToUse = freshCoupon || appliedCoupon;

    if (!couponToUse.active) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return 0;
    }

    if (couponToUse.minOrderAmount && currentSubtotal < couponToUse.minOrderAmount) {
      // Below min threshold
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return 0;
    }

    const calculated = calculateDiscount(couponToUse, currentSubtotal);
    setDiscountAmount(calculated);
    return calculated;
  };

  const applyCoupon = (code: string, currentSubtotal: number): ApplyCouponResult => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Lütfen geçerli bir indirim kodu girin.' };
    }

    // Find coupon in state or fallback list
    const found = coupons.find(
      (c) => c.code.trim().toUpperCase() === cleanCode
    ) || DEFAULT_COUPONS.find(
      (c) => c.code.trim().toUpperCase() === cleanCode
    );

    if (!found) {
      return { 
        success: false, 
        message: `"${cleanCode}" geçerli bir indirim kodu değil. Lütfen kontrol ediniz.` 
      };
    }

    if (!found.active) {
      return { 
        success: false, 
        message: `"${cleanCode}" indirim kodunun süresi dolmuş veya kampanya pasif hale getirilmiştir.` 
      };
    }

    if (found.expiresAt && found.expiresAt < Date.now()) {
      return { 
        success: false, 
        message: `"${cleanCode}" indirim kodunun geçerlilik tarihi sona ermiştir.` 
      };
    }

    if (found.usageLimit && (found.usageCount || 0) >= found.usageLimit) {
      return { 
        success: false, 
        message: `"${cleanCode}" indirim kodunun maksimum kullanım limitine (${found.usageLimit}) ulaşılmıştır.` 
      };
    }

    if (found.minOrderAmount && currentSubtotal < found.minOrderAmount) {
      return { 
        success: false, 
        message: `Bu indirim kodu en az ${found.minOrderAmount.toLocaleString('tr-TR')} TL tutarındaki sepetlerde geçerlidir.` 
      };
    }

    const calculated = calculateDiscount(found, currentSubtotal);
    setAppliedCoupon(found);
    setDiscountAmount(calculated);

    const desc = found.discountType === 'percentage' 
      ? `%${found.discountValue} İndirim` 
      : `${found.discountValue.toLocaleString('tr-TR')} TL İndirim`;

    return { 
      success: true, 
      message: `Tebrikler! "${found.code}" kodu başarıyla uygulandı (${desc}).`,
      coupon: found,
      discountAmount: calculated
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const createCoupon = async (couponData: Omit<Coupon, 'id' | 'createdAt'>): Promise<string> => {
    const rawPayload = {
      code: couponData.code.trim().toUpperCase(),
      description: couponData.description ? couponData.description.trim() : '',
      discountType: couponData.discountType || 'percentage',
      discountValue: Number(couponData.discountValue) || 0,
      minOrderAmount: couponData.minOrderAmount !== undefined && couponData.minOrderAmount > 0 ? Number(couponData.minOrderAmount) : undefined,
      maxDiscountAmount: couponData.maxDiscountAmount !== undefined && couponData.maxDiscountAmount > 0 ? Number(couponData.maxDiscountAmount) : undefined,
      usageLimit: couponData.usageLimit !== undefined && couponData.usageLimit > 0 ? Number(couponData.usageLimit) : undefined,
      expiresAt: couponData.expiresAt ? Number(couponData.expiresAt) : undefined,
      active: couponData.active !== undefined ? Boolean(couponData.active) : true,
      usageCount: 0,
      createdAt: Date.now()
    };

    // CRITICAL: Strip any undefined fields so Firestore addDoc never throws
    const cleanPayload = cleanObject(rawPayload);

    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.COUPONS), cleanPayload);
      const newCoupon: Coupon = {
        id: docRef.id,
        ...rawPayload
      };
      
      setCoupons(prev => {
        const next = [newCoupon, ...prev.filter(c => c.id !== docRef.id)];
        saveCachedCoupons(next);
        return next;
      });

      return docRef.id;
    } catch (err) {
      console.warn('Firestore addDoc error for coupon, persisting to local cache:', err);
      const localId = 'coupon-' + Date.now();
      const newCoupon: Coupon = {
        id: localId,
        ...rawPayload
      };
      
      setCoupons(prev => {
        const next = [newCoupon, ...prev];
        saveCachedCoupons(next);
        return next;
      });

      try {
        handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.COUPONS);
      } catch {
        // logged
      }

      return localId;
    }
  };

  const updateCoupon = async (id: string, couponData: Partial<Coupon>): Promise<void> => {
    const updates: Record<string, any> = {};

    if (couponData.code !== undefined) updates.code = couponData.code.trim().toUpperCase();
    if (couponData.description !== undefined) updates.description = couponData.description.trim();
    if (couponData.discountType !== undefined) updates.discountType = couponData.discountType;
    if (couponData.discountValue !== undefined) updates.discountValue = Number(couponData.discountValue);
    if (couponData.minOrderAmount !== undefined) {
      updates.minOrderAmount = couponData.minOrderAmount > 0 ? Number(couponData.minOrderAmount) : null;
    }
    if (couponData.maxDiscountAmount !== undefined) {
      updates.maxDiscountAmount = couponData.maxDiscountAmount > 0 ? Number(couponData.maxDiscountAmount) : null;
    }
    if (couponData.usageLimit !== undefined) {
      updates.usageLimit = couponData.usageLimit > 0 ? Number(couponData.usageLimit) : null;
    }
    if (couponData.expiresAt !== undefined) {
      updates.expiresAt = couponData.expiresAt ? Number(couponData.expiresAt) : null;
    }
    if (couponData.active !== undefined) updates.active = Boolean(couponData.active);
    if (couponData.usageCount !== undefined) updates.usageCount = Number(couponData.usageCount);

    const cleanUpdates = cleanObject(updates);

    // Update local state immediately
    setCoupons(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...couponData } : c);
      saveCachedCoupons(next);
      return next;
    });

    try {
      const docRef = doc(db, COLLECTIONS.COUPONS, id);
      await updateDoc(docRef, cleanUpdates);
    } catch (err) {
      console.warn('Firestore updateDoc error for coupon:', err);
    }
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    // Update local state immediately
    setCoupons(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCachedCoupons(next);
      return next;
    });

    try {
      const docRef = doc(db, COLLECTIONS.COUPONS, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDoc error for coupon:', err);
    }
  };

  const toggleCouponActive = async (id: string, currentStatus: boolean): Promise<void> => {
    await updateCoupon(id, { active: !currentStatus });
  };

  const recordCouponUsage = async (couponId: string): Promise<void> => {
    const target = coupons.find(c => c.id === couponId || c.code.toUpperCase() === couponId.toUpperCase());
    if (target) {
      const newCount = (target.usageCount || 0) + 1;
      await updateCoupon(target.id, { usageCount: newCount });
    }
  };

  const seedDefaultCoupons = async (): Promise<void> => {
    for (const c of DEFAULT_COUPONS) {
      try {
        const { id, ...data } = c;
        const clean = cleanObject({
          ...data,
          createdAt: Date.now()
        });
        await addDoc(collection(db, COLLECTIONS.COUPONS), clean);
      } catch (e) {
        console.warn('Seed error for coupon:', c.code, e);
      }
    }
  };

  return (
    <CouponContext.Provider
      value={{
        coupons,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        recalculateDiscount,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        recordCouponUsage,
        seedDefaultCoupons
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupons = (): CouponContextType => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupons must be used within a CouponProvider');
  }
  return context;
};
