import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Chrome, Phone, ShieldCheck, RefreshCw, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmationResult } from '../lib/firebase';
import { isRootAdminEmail } from '../lib/adminConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAdmin?: () => void;
  promptTitle?: string;
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessAdmin,
  promptTitle,
  promptMessage,
}) => {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    sendPasswordReset,
    loginWithGoogle, 
    initRecaptcha, 
    sendPhoneOtp, 
    verifyPhoneOtp 
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Phone state
  const [phone, setPhone] = useState('+90');
  const [phoneName, setPhoneName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneStep, setPhoneStep] = useState<'enter_phone' | 'enter_otp'>('enter_phone');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setConfirmationResult(null);
      setPhoneStep('enter_phone');
      setOtpCode('');
      setResetSent(false);
      setMarketingConsent(false);
      setTab('login');
    }
  }, [isOpen]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      onClose();
      if (isRootAdminEmail(fbUser?.email) && onSuccessAdmin) {
        onSuccessAdmin();
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // user closed popup
      } else {
        setError('Google ile giriş yapılamadı: ' + (err.message || 'Lütfen tekrar deneyiniz.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
        onClose();
        if (isRootAdminEmail(email) && onSuccessAdmin) {
          onSuccessAdmin();
        }
      } else if (tab === 'register') {
        if (!name) {
          setError('Lütfen adınızı ve soyadınızı giriniz.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name, marketingConsent);
        onClose();
        if (isRootAdminEmail(email) && onSuccessAdmin) {
          onSuccessAdmin();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('E-posta/Şifre yöntemi henüz Firebase konsolunda aktif edilmemiş. Lütfen Google veya Telefon ile giriş yapmayı deneyiniz.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-posta veya şifre hatalı.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi ile zaten bir hesap mevcut.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifreniz en az 6 karakter olmalıdır.');
      } else {
        setError('İşlem tamamlanamadı: ' + (err.message || 'Lütfen bilgilerinizi kontrol ediniz.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Lütfen kayıtlı e-posta adresinizi giriniz.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email.trim());
      setResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Bu e-posta adresine kayıtlı bir hesap bulunamadı.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçerli bir e-posta adresi giriniz.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla sıfırlama talebi yapıldı. Lütfen birkaç dakika sonra tekrar deneyiniz.');
      } else {
        setError('Sıfırlama bağlantısı gönderilemedi: ' + (err.message || 'Lütfen e-posta adresinizi kontrol ediniz.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Format phone number to E.164 (+90...)
  const formatPhoneNumber = (input: string): string => {
    let clean = input.trim().replace(/\s+/g, '').replace(/[-()]/g, '');
    if (clean.startsWith('05')) {
      clean = '+9' + clean;
    } else if (clean.startsWith('5') && clean.length === 10) {
      clean = '+90' + clean;
    } else if (!clean.startsWith('+')) {
      clean = '+' + clean;
    }
    return clean;
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formatted = formatPhoneNumber(phone);
      if (formatted.length < 11) {
        setError('Lütfen geçerli bir telefon numarası giriniz (Örn: +90 5XX XXX XX XX veya 05XX XXX XX XX).');
        setLoading(false);
        return;
      }

      const verifier = initRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneOtp(formatted, verifier);
      setConfirmationResult(confirmation);
      setPhoneStep('enter_otp');
    } catch (err: any) {
      console.error('Phone OTP error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Telefon numarası formatı geçersiz. Lütfen uluslararası formatta giriniz (Örn: +905321234567).');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS kotası aşıldı. Lütfen daha sonra tekrar deneyiniz.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('Güvenlik doğrulaması (reCAPTCHA) başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.');
      } else {
        setError('SMS kodu gönderilemedi: ' + (err.message || 'Lütfen Firebase konsolundan Telefon Doğrulamasının açık olduğunu kontrol ediniz.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setError('Oturum süresi doldu. Lütfen tekrar kod isteyin.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await verifyPhoneOtp(confirmationResult, otpCode.trim(), phoneName.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Girdiğiniz 6 haneli SMS onay kodu hatalı.');
      } else if (err.code === 'auth/code-expired') {
        setError('SMS kodunun süresi dolmuş. Lütfen yeni bir kod isteyiniz.');
      } else {
        setError('Doğrulama başarısız oldu: ' + (err.message || 'Lütfen tekrar deneyiniz.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-default"
    >
      {/* Hidden container for Firebase Invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      <div 
        className="relative w-full max-w-md bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 glass-panel my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <span className="font-serif-luxury text-xl tracking-[0.2em] font-semibold text-white uppercase">
              LUMEN
            </span>
            <span className="text-[10px] text-[#C5A059] uppercase tracking-widest border-l border-white/10 pl-2">
              {promptTitle || (tab === 'forgot' ? 'Şifre Yenileme' : 'Müşteri Girişi')}
            </span>
          </div>
          <button
            id="close-auth-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Pencereyi Kapat"
            title="Kapat (ESC)"
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Prompt Banner (e.g. for Wishlist or Checkout) */}
        {promptMessage && (
          <div className="mx-5 mt-4 p-3.5 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl flex items-start gap-2.5 text-xs text-[#C5A059] animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <span className="leading-relaxed text-zinc-200">{promptMessage}</span>
          </div>
        )}

        {/* Auth Method Switcher (E-Posta vs Telefon) */}
        {tab !== 'forgot' && (
          <div className="grid grid-cols-2 bg-black/40 border-b border-white/10 p-1.5 text-xs font-semibold">
            <button
              id="method-email-btn"
              type="button"
              onClick={() => { setAuthMethod('email'); setError(null); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMethod === 'email'
                  ? 'bg-[#1D1D22] text-[#C5A059] border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-Posta</span>
            </button>

            <button
              id="method-phone-btn"
              type="button"
              onClick={() => { setAuthMethod('phone'); setError(null); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMethod === 'phone'
                  ? 'bg-[#1D1D22] text-[#C5A059] border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Telefon (SMS)</span>
            </button>
          </div>
        )}

        {/* Sub-tabs for Email mode */}
        {authMethod === 'email' && tab !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-white/10 text-xs uppercase tracking-wider font-semibold bg-white/[0.02]">
            <button
              id="tab-login-btn"
              onClick={() => { setTab('login'); setError(null); }}
              className={`py-3 transition-colors ${tab === 'login' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Giriş Yap
            </button>
            <button
              id="tab-register-btn"
              onClick={() => { setTab('register'); setError(null); }}
              className={`py-3 transition-colors ${tab === 'register' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Hesap Oluştur
            </button>
          </div>
        )}

        {tab === 'forgot' && (
          <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02] text-xs">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); setResetSent(false); }}
              className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Giriş Ekranına Dön</span>
            </button>
            <span className="text-[#C5A059] font-medium flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> Şifre Sıfırlama
            </span>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-emerald-300">Sıfırlama Bağlantısı Gönderildi</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed font-light">
                      <strong className="text-white font-mono">{email}</strong> adresine şifre sıfırlama e-postası iletildi. Lütfen gelen kutunuzu (ve spam/gereksiz klasörünü) kontrol ediniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setResetSent(false); }}
                    className="w-full mt-3 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Giriş Ekranına Dön
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#C5A059]" />
                      Şifrenizi mi unuttunuz?
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Lütfen hesabınıza kayıtlı e-posta adresinizi girin. Şifrenizi güvenli bir şekilde sıfırlayabileceğiniz bir bağlantı e-postası göndereceğiz.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Kayıtlı E-Posta Adresi *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e-posta@adresiniz.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    id="reset-password-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span>Bağlantı Gönderiliyor...</span>
                    ) : (
                      <>
                        <span>Sıfırlama Bağlantısı Gönder</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setError(null); }}
                      className="text-xs text-zinc-400 hover:text-[#C5A059] transition-colors"
                    >
                      ← Şifrenizi hatırladınız mı? <strong>Giriş yapın</strong>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* EMAIL FORM */}
          {authMethod === 'email' && tab !== 'forgot' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Ad Soyad *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  E-Posta Adresi *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e-posta@adresiniz.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">
                    Şifre *
                  </label>
                  {tab === 'login' && (
                    <button
                      id="forgot-password-btn"
                      type="button"
                      onClick={() => { setTab('forgot'); setError(null); setResetSent(false); }}
                      className="text-[11px] text-[#C5A059] hover:text-[#d6b26b] hover:underline transition-colors font-medium"
                    >
                      Şifremi Unuttum?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                {tab === 'register' && (
                  <label className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      id="register-marketing-consent-checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-black/50 text-[#C5A059] focus:ring-0 flex-shrink-0 cursor-pointer"
                    />
                    <span className="leading-relaxed text-[11px]">
                      Kampanya ve yeni ürün duyurularından e-posta ile haberdar olmak istiyorum. Onayımı dilediğim zaman geri çekebilirim.
                    </span>
                  </label>
                )}
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Lütfen Bekleyin...</span>
                ) : (
                  <>
                    <span>
                      {tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PHONE AUTH FLOW */}
          {authMethod === 'phone' && tab !== 'forgot' && (
            <div>
              {phoneStep === 'enter_phone' ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Ad Soyad (İsteğe Bağlı)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phoneName}
                        onChange={(e) => setPhoneName(e.target.value)}
                        placeholder="Adınız Soyadınız"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Cep Telefonu Numarası *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 555 123 4567"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none tracking-wider font-mono"
                      />
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Örnek: +90 532 000 0000 veya 0532 000 0000
                    </p>
                  </div>

                  <button
                    id="send-otp-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span>SMS Kodu Gönderiliyor...</span>
                    ) : (
                      <>
                        <span>SMS Onay Kodu Gönder</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-[#17171d] rounded-xl border border-white/10 text-xs flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase">Kod Gönderilen Numara</p>
                      <p className="text-[#C5A059] font-mono font-semibold">{phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhoneStep('enter_phone')}
                      className="text-[11px] text-zinc-400 hover:text-white underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Değiştir
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      6 Haneli SMS Doğrulama Kodu *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/15 rounded-xl text-center text-base tracking-[0.4em] font-mono text-[#C5A059] font-bold focus:border-[#C5A059] focus:outline-none"
                      />
                      <ShieldCheck className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    id="verify-otp-btn"
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Doğrulanıyor...</span>
                    ) : (
                      <>
                        <span>Doğrula ve Giriş Yap</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Google Sign In Alternative (only shown when not in forgot password mode) */}
          {tab !== 'forgot' && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="relative flex py-2 items-center mb-3">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase tracking-widest">veya</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5"
              >
                <Chrome className="w-4 h-4 text-[#C5A059]" />
                <span>Google ile Hızlı Giriş</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

