import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, AlertCircle, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';

export const AuthScreen: React.FC = () => {
  const { login, signup, forgotPassword, resetPassword, isLoading } = useShop();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = getTranslation('hi');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(identifier.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid credentials');
        }
      } else if (mode === 'signup') {
        const res = await signup(identifier.trim(), password, shopName.trim());
        if (!res.success) {
          setErrorMessage(res.error || 'Signup failed');
        }
      } else if (mode === 'forgot') {
        if (!otpCode) {
          // Step 1 of forgot password: request code
          const res = await forgotPassword(identifier.trim());
          setInfoMessage(res.message || 'OTP sent! Use demo code 5544.');
          setOtpCode('5544');
        } else {
          // Step 2: reset password
          const res = await resetPassword(identifier.trim(), otpCode.trim(), newPassword);
          if (res.success) {
            setInfoMessage('Password successfully updated! Please log in.');
            setMode('login');
            setPassword('');
          } else {
            setErrorMessage(res.error || 'Failed to reset password');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    const res = await login('9876543210', 'shop123');
    if (!res.success) {
      // If demo account doesn't exist yet on clean start, sign up as demo
      await signup('9876543210', 'shop123', 'Verma Kirana Store');
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
          <div className="p-2.5 rounded-xl bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-2.5 rounded-xl bg-[#E7F0EA] text-[#1E4632] text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
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

          {/* Forgot password step 2 */}
          {mode === 'forgot' && otpCode && (
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
                  placeholder="नया पासवर्ड"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#1E4632] text-white font-bold text-sm hover:bg-[#2F6B4F] disabled:opacity-50 transition shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{t.loginBtn}</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{t.signupBtn}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{otpCode ? t.resetPasswordBtn : 'ओटीपी भेजें'}</span>
              </>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setOtpCode('');
                setErrorMessage('');
              }}
              className="w-full text-center text-xs text-[#726C60] hover:underline cursor-pointer"
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
