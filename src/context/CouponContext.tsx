import React, { createContext, useContext, useState, useEffect } from 'react';
import { Coupon } from '../types';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../lib/api';
import { 
  db, 
  COLLECTIONS, 
  collection, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';

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
  applyCoupon: (code: string, currentSubtotal: number) => Promise<ApplyCouponResult>;
  removeCoupon: () => void;
  recalculateDiscount: (currentSubtotal: number) => number;
  createCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt'>) => Promise<string>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCouponActive: (id: string, currentStatus: boolean) => Promise<void>;
  recordCouponUsage: (couponId: string) => Promise<void>;
  seedDefaultCoupons: () => Promise<void>;
}

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

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export const CouponProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  // Coupons list is ONLY populated for authenticated administrators in admin panel
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // When admin logs in, load coupons for administrative dashboard management only
  useEffect(() => {
    if (!isAdmin) {
      setCoupons([]);
      return;
    }

    let isMounted = true;
    const fetchAdminCoupons = async () => {
      try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.COUPONS));
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
        }
      } catch (err) {
        console.warn('[CouponContext] Admin coupons fetch warning:', err);
      }
    };

    fetchAdminCoupons();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

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

    if (appliedCoupon.minOrderAmount && currentSubtotal < appliedCoupon.minOrderAmount) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return 0;
    }

    const calculated = calculateDiscount(appliedCoupon, currentSubtotal);
    setDiscountAmount(calculated);
    return calculated;
  };

  // Securely validate coupon against the backend endpoint (IP rate limited, Admin SDK verified)
  const applyCoupon = async (code: string, currentSubtotal: number): Promise<ApplyCouponResult> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Lütfen geçerli bir indirim kodu girin.' };
    }

    try {
      const response = await fetch(getApiUrl('/api/coupons/validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: cleanCode,
          subtotal: currentSubtotal
        })
      });

      const data = await response.json();

      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount || 0);
        return {
          success: true,
          message: data.message || `"${cleanCode}" kodu başarıyla uygulandı.`,
          coupon: data.coupon,
          discountAmount: data.discountAmount || 0
        };
      }

      return {
        success: false,
        message: data.message || 'İndirim kodu geçersiz veya süresi dolmuş.'
      };
    } catch (networkErr) {
      console.error('[applyCoupon] Validation request error:', networkErr);
      return {
        success: false,
        message: 'İndirim kodu doğrulanırken sunucuya ulaşılamadı. Lütfen tekrar deneyiniz.'
      };
    }
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
      
      setCoupons(prev => [newCoupon, ...prev.filter(c => c.id !== docRef.id)]);
      return docRef.id;
    } catch (err) {
      console.warn('Firestore addDoc error for coupon:', err);
      const localId = 'coupon-' + Date.now();
      const newCoupon: Coupon = {
        id: localId,
        ...rawPayload
      };
      
      setCoupons(prev => [newCoupon, ...prev]);

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
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...couponData } : c));

    try {
      const docRef = doc(db, COLLECTIONS.COUPONS, id);
      await updateDoc(docRef, cleanUpdates);
    } catch (err) {
      console.warn('Firestore updateDoc error for coupon:', err);
    }
  };

  const deleteCoupon = async (id: string): Promise<void> => {
    // Update local state immediately
    setCoupons(prev => prev.filter(c => c.id !== id));

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
    const defaultTemplates: Array<Omit<Coupon, 'id'>> = [
      {
        code: 'LUMEN15',
        description: 'Tüm lüks tasarım lambalarda %15 Hoş Geldin İndirimi',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 200,
        maxDiscountAmount: 500,
        active: true,
        usageCount: 0,
        usageLimit: 500,
        createdAt: Date.now()
      },
      {
        code: 'HOSGELDIN50',
        description: '300 TL ve üzeri siparişlerde 50 TL Anında Nakit İndirimi',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 300,
        active: true,
        usageCount: 0,
        usageLimit: 250,
        createdAt: Date.now()
      }
    ];

    for (const data of defaultTemplates) {
      try {
        const clean = cleanObject({
          ...data,
          createdAt: Date.now()
        });
        await addDoc(collection(db, COLLECTIONS.COUPONS), clean);
      } catch (e) {
        console.warn('Seed error for coupon:', data.code, e);
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
