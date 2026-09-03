import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, AlertCircle, Sparkles, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

export const AuthScreen: React.FC = () => {
  const { login, signup, signInWithGoogle, forgotPassword, resetPassword } = useShop();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const t = getTranslation('hi');

  const validateInputs = (): string | null => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return 'कृपया मोबाइल नंबर या ईमेल दर्ज करें।';
    }

    if (cleanId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanId)) {
        return 'ईमेल का प्रारूप सही नहीं है (उदाहरण: shop@krow.in)।';
      }
    } else {
      const digits = cleanId.replace(/\D/g, '');
      if (digits.length < 10) {
        return 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।';
      }
    }

    if (mode === 'signup') {
      if (!shopName.trim()) {
        return 'कृपया अपनी दुकान का नाम दर्ज करें।';
      }
      if (!password || password.length < 6) {
        return 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।';
      }
    }

    if (mode === 'login') {
      if (!password) {
        return 'कृपया अपना पासवर्ड दर्ज करें।';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (mode !== 'forgot' || !otpCode) {
      const clientValidationErr = validateInputs();
      if (clientValidationErr) {
        setErrorMessage(clientValidationErr);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(identifier.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'लॉग इन नहीं हो पाया। कृपया मोबाइल/ईमेल और पासवर्ड पुनः जांचें।');
        }
      } else if (mode === 'signup') {
        const res = await signup(identifier.trim(), password, shopName.trim());
        if (!res.success) {
          setErrorMessage(res.error || 'खाता नहीं बन सका। कृपया विवरण पुनः जांचें।');
        }
      } else if (mode === 'forgot') {
        if (!otpCode) {
          // Request reset link/code
          const res = await forgotPassword(identifier.trim());
          if (res.success) {
            setInfoMessage(res.message);
            if (res.isEmail) {
              setIsEmailSent(true);
            } else {
              setOtpCode('5544');
            }
          } else {
            setErrorMessage(res.message);
          }
        } else {
          // Confirm reset password
          if (!newPassword || newPassword.length < 6) {
            setErrorMessage('नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
            setIsSubmitting(false);
            return;
          }
          const res = await resetPassword(identifier.trim(), otpCode.trim(), newPassword);
          if (res.success) {
            setInfoMessage('पासवर्ड सफलतापूर्वक अपडेट हो गया! कृपया नए पासवर्ड से लॉग इन करें।');
            setMode('login');
            setPassword('');
            setOtpCode('');
            setNewPassword('');
          } else {
            setErrorMessage(res.error || 'पासवर्ड रीसेट नहीं हो पाया। कृपया पुनः प्रयास करें।');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'कनेक्शन त्रुटि हुई। कृपया अपना इंटरनेट जांचें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setInfoMessage('');
    const res = await login('9876543210', 'shop123');
    if (!res.success) {
      await signup('9876543210', 'shop123', 'वर्मा किराना स्टोर');
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setInfoMessage('');
    const res = await signInWithGoogle();
    if (!res.success) {
      setErrorMessage(res.error || 'Google साइन-इन विफल रहा।');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E4DFD2] space-y-5">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#1E4632] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              <path
                d="M 32 46 C 32 26, 68 26, 68 46"
                fill="none"
                stroke="#FAF7F0"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path d="M 50 31 Q 50 20 50 17" fill="none" stroke="#FAF7F0" strokeWidth="3" strokeLinecap="round" />
              <path d="M 50 24 C 43 23, 39 17, 43 13 C 48 13, 50 21, 50 24 Z" fill="#FAF7F0" />
              <path d="M 50 21 C 56 19, 62 14, 59 10 C 53 10, 50 18, 50 21 Z" fill="#D9A62E" />
              <polygon points="24,45 76,45 69,77 31,77" fill="#FAF7F0" />
              <line x1="31" y1="55" x2="69" y2="55" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
              <line x1="34" y1="66" x2="66" y2="66" stroke="#1E4632" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1E4632] tracking-tight">Krow</h1>
            <p className="text-xs text-[#726C60] font-medium">{t.tagline}</p>
          </div>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl border border-[#E4DFD2] bg-white hover:bg-[#FAF7F0] text-[#262421] text-xs font-bold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google से 1-क्लिक में साइन इन करें</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-[#E4DFD2]" />
          <span className="text-[11px] text-[#726C60] font-medium uppercase tracking-wider">या मोबाइल / ईमेल</span>
          <div className="flex-1 h-px bg-[#E4DFD2]" />
        </div>

        {/* Tab switch between Login & Signup */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setInfoMessage('');
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                mode === 'login' ? 'bg-[#1E4632] text-white shadow-xs' : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              {t.loginBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setInfoMessage('');
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                mode === 'signup' ? 'bg-[#1E4632] text-white shadow-xs' : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              {t.signupBtn}
            </button>
          </div>
        )}

        {/* Error / Info messages */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-2 border border-[#EBBBB6]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-2.5 rounded-xl bg-[#E7F0EA] text-[#1E4632] text-xs flex items-center gap-2 border border-[#C5DDCB]">
            {isEmailSent ? <Mail className="w-4 h-4 shrink-0 text-[#1E4632]" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E4632]" />}
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">{t.shopNameLabel}</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="वर्मा किराना स्टोर"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
              />
            </div>
          )}

          {(!isEmailSent || mode !== 'forgot') && (
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">{t.identifierLabel}</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 या shop@krow.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#262421]">{t.passwordLabel}</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                      setInfoMessage('');
                      setIsEmailSent(false);
                    }}
                    className="text-[11px] text-[#2F6B4F] hover:underline cursor-pointer"
                  >
                    {t.forgotPasswordLink}
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
              />
            </div>
          )}

          {/* Forgot password step 2 (for phone OTP) */}
          {mode === 'forgot' && otpCode && !isEmailSent && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.resetCodeLabel}</label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="5544"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.newPasswordLabel}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="नया पासवर्ड (कम से कम 6 अक्षर)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>
            </>
          )}

          {(!isEmailSent || mode !== 'forgot') && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#1E4632] text-white font-bold text-sm hover:bg-[#2F6B4F] disabled:opacity-50 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'लॉग इन हो रहा है...' : t.loginBtn}</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'खाता बन रहा है...' : t.signupBtn}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'कृपया प्रतीक्षा करें...'
                      : otpCode
                      ? t.resetPasswordBtn
                      : 'पासवर्ड रीसेट लिंक/कोड भेजें'}
                  </span>
                </>
              )}
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setOtpCode('');
                setIsEmailSent(false);
                setErrorMessage('');
                setInfoMessage('');
              }}
              className="w-full text-center text-xs text-[#726C60] hover:underline cursor-pointer pt-1"
            >
              लॉगिन पर वापस जाएं
            </button>
          )}
        </form>

        {/* 1-Click Demo Login button */}
        <div className="pt-2 border-t border-[#E4DFD2]/60">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl border border-[#D9A62E] bg-[#FBF0D9] text-[#9A7016] text-xs font-bold hover:bg-[#D9A62E] hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.demoAccountBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
