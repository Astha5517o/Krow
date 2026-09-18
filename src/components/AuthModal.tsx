import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Language } from '../types';
import { translations } from '../translations';
import { AppLogo } from './AppLogo';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  language: Language;
  onSuccess: (shopName?: string) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ language, onSuccess, onClose }) => {
  const t = translations[language];
  // Default to Sign Up mode if user is creating an account
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);

  const consoleProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  const getLocalizedError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/operation-not-allowed') {
      if (language === 'pa') {
        return 'Firebase Console ਵਿੱਚ Email/Password ਪ੍ਰਦਾਤਾ ਸਮਰੱਥ (Enable) ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਗੂਗਲ ਨਾਲ 1-ਕਲਿੱਕ ਵਿੱਚ ਖਾਤਾ ਬਣਾਓ ਜਾਂ ਕੰਸੋਲ ਵਿੱਚ Enable ਕਰੋ।';
      }
      if (language === 'en') {
        return 'Email/Password account creation is disabled in Firebase Console. Please use 1-Click Google Sign-Up or enable Email/Password in Console.';
      }
      return 'Firebase Console में Email/Password खाता निर्माण अक्षम है। कृपया नीचे 1-क्लिक Google से तुरंत खाता बनाएं या Console में चालू करें।';
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return language === 'pa'
        ? 'ਗਲਤ ਈਮੇਲ ਜਾਂ ਪਾਸਵਰਡ'
        : language === 'en'
        ? 'Invalid email or password'
        : 'गलत ईमेल या पासवर्ड';
    }

    if (code === 'auth/email-already-in-use') {
      return language === 'pa'
        ? 'ਇਹ ਈਮੇਲ ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰਡ ਹੈ। ਅਸੀਂ ਲੌਗਇਨ ਟੈਬ ਖੋਲ੍ਹ ਦਿੱਤੀ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ।'
        : language === 'en'
        ? 'Email is already registered. Switched to Login tab, please enter your password.'
        : 'यह ईमेल पहले से पंजीकृत है। हमने लॉगिन टैब खोल दिया है, कृपया पासवर्ड दर्ज करें।';
    }

    if (code === 'auth/weak-password') {
      return language === 'pa'
        ? 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ'
        : language === 'en'
        ? 'Password must be at least 6 characters'
        : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए';
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return language === 'pa'
        ? 'ਗੂਗਲ ਲੌਗਇਨ ਵਿੰਡੋ ਬੰਦ ਕਰ ਦਿੱਤੀ ਗਈ ਸੀ'
        : language === 'en'
        ? 'Sign-in popup was closed before completing'
        : 'साइन-इन विंडो पूरी होने से पहले बंद हो गई';
    }

    if (code === 'auth/popup-blocked') {
      return language === 'pa'
        ? 'ਬ੍ਰਾਊਜ਼ਰ ਨੇ ਪੌਪਅੱਪ ਬਲਾਕ ਕਰ ਦਿੱਤਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੌਪਅੱਪ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ।'
        : language === 'en'
        ? 'Popup was blocked by your browser. Please allow popups for this site.'
        : 'ब्राउज़र ने पॉपअप ब्लॉक कर दिया है। कृपया एड्रेस बार में पॉपअप की अनुमति दें।';
    }

    if (code === 'auth/network-request-failed') {
      return language === 'pa'
        ? 'ਨੈੱਟਵਰਕ ਸਮੱਸਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਇੰਟਰਨੈੱਟ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ।'
        : language === 'en'
        ? 'Network error. Please check your internet connection.'
        : 'नेटवर्क समस्या। कृपया अपना इंटरनेट कनेक्शन जांचें।';
    }

    return language === 'pa'
      ? `ਪ੍ਰਮਾਣੀਕਰਨ ਵਿੱਚ ਰੁਕਾਵਟ (${code || 'ਅਣਜਾਣ ਗਲਤੀ'})`
      : language === 'en'
      ? `Authentication error: ${err.message || code || 'Please try again'}`
      : `प्रमाणीकरण में त्रुटि: ${err.message || code || 'कृपया पुनः प्रयास करें'}`;
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setOperationNotAllowed(false);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      onSuccess(shopName.trim() || undefined);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      console.warn('Google auth status:', code);
      setErrorMsg(getLocalizedError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setOperationNotAllowed(false);
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email.trim()) {
          setErrorMsg(
            language === 'pa'
              ? 'ਕਿਰਪਾ ਕਰਕੇ ਈਮੇਲ ਦਰਜ ਕਰੋ'
              : language === 'en'
              ? 'Please enter your email'
              : 'कृपया ईमेल दर्ज करें'
          );
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, email.trim());
        setInfoMsg(t.resetPasswordSent);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Create account with email & password
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(shopName.trim() || undefined);
      } else {
        // Sign in with email & password
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess();
      }
    } catch (err: any) {
      const code = err?.code || '';

      // Gracefully handle operation-not-allowed
      if (code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        setErrorMsg(getLocalizedError(err));
        setLoading(false);
        return;
      }

      // Gracefully handle email already in use by auto-switching to sign in tab
      if (code === 'auth/email-already-in-use') {
        setIsSignUp(false);
        setInfoMsg(
          language === 'pa'
            ? `ਇਹ ਈਮੇਲ (${email.trim()}) ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰਡ ਹੈ। ਅਸੀਂ ਲੌਗਇਨ ਟੈਬ ਖੋਲ੍ਹ ਦਿੱਤੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ ਜਾਂ Google ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ।`
            : language === 'en'
            ? `This email (${email.trim()}) is already registered. Switched to Login tab. Please enter your password or sign in with Google.`
            : `यह ईमेल (${email.trim()}) पहले से पंजीकृत है। हमने लॉगिन टैब खोल दिया है। कृपया पासवर्ड डालकर लॉगिन करें या Google से साइन इन करें।`
        );
        setErrorMsg('');
        setLoading(false);
        return;
      }

      console.warn('Auth status notice:', code);
      setErrorMsg(getLocalizedError(err));
    } finally {
      setLoading(false);
    }
  };

  const isGmail = email.trim().toLowerCase().endsWith('@gmail.com');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#262421]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E4DFD2] animate-scale-up relative">
        {/* Close Button when modal is displayed to already signed in user */}
        {onClose && (
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            type="button"
            aria-label={t.btnCancel}
          >
            ✕
          </button>
        )}

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="mb-2.5">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#262421] font-display tracking-tight">
            {isForgotPassword
              ? t.btnForgotPassword
              : isSignUp
              ? language === 'pa'
                ? 'ਨਵਾਂ ਦੁਕਾਨ ਖਾਤਾ ਬਣਾਓ'
                : language === 'en'
                ? 'Create New Shop Account'
                : 'दुकान का नया खाता बनाएं'
              : language === 'pa'
              ? 'ਦੁਕਾਨਦਾਰ ਲੌਗਇਨ'
              : language === 'en'
              ? 'Shopkeeper Login'
              : 'दुकानदार लॉगिन'}
          </h2>
          <p className="text-xs text-[#726C60] mt-1 max-w-xs leading-relaxed">
            {isSignUp
              ? language === 'pa'
                ? '1-ਕਲਿੱਕ ਵਿੱਚ ਮੁਫ਼ਤ ਖਾਤਾ ਬਣਾਓ ਅਤੇ ਆਪਣੀ ਦੁਕਾਨ ਨੂੰ ਡਿਜੀਟਲ ਕਰੋ'
                : language === 'en'
                ? 'Create your free account in 1-click & digitize your shop'
                : '1-क्लिक में मुफ्त खाता बनाएं और अपनी दुकान को डिजिटल करें'
              : language === 'pa'
              ? 'ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਸਟਾਕ, ਬਹੀ-ਖਾਤਾ ਅਤੇ ਉਧਾਰੀ ਸੁਰੱਖਿਅਤ ਰੱਖੋ'
              : language === 'en'
              ? 'Secure your shop inventory, khata ledger, and customer dues'
              : 'अपनी दुकान का स्टॉक, बही-खाता और उधारी सुरक्षित रखें'}
          </p>
        </div>

        {/* Primary Tabs: [नया खाता बनाएं (Create Account)] vs [लॉगिन करें (Sign In)] */}
        {!isForgotPassword && (
          <div className="grid grid-cols-2 p-1 mb-5 bg-[#FAF7F0] rounded-2xl border border-[#E4DFD2]">
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
                setInfoMsg('');
                setOperationNotAllowed(false);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSignUp
                  ? 'bg-[#2F6B4F] text-white shadow-xs'
                  : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              <span>✨</span>
              <span>
                {language === 'pa'
                  ? 'ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ'
                  : language === 'en'
                  ? 'Create Account'
                  : 'नया खाता बनाएं'}
              </span>
            </button>

            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
                setInfoMsg('');
                setOperationNotAllowed(false);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isSignUp
                  ? 'bg-[#2F6B4F] text-white shadow-xs'
                  : 'text-[#726C60] hover:text-[#262421]'
              }`}
            >
              <span>🔑</span>
              <span>
                {language === 'pa'
                  ? 'ਲੌਗਇਨ ਕਰੋ'
                  : language === 'en'
                  ? 'Sign In'
                  : 'लॉगिन करें'}
              </span>
            </button>
          </div>
        )}

        {/* Operation Not Allowed Interactive Recovery Card */}
        {operationNotAllowed && (
          <div className="mb-5 p-4 rounded-2xl bg-[#FFF9E6] border-2 border-[#D97706]/50 text-[#92400E] flex flex-col gap-3 animate-scale-up">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-xl flex-shrink-0 text-[#D97706] mt-0.5">warning</span>
              <div className="text-xs font-semibold leading-relaxed">
                {language === 'pa'
                  ? 'Firebase Console ਵਿੱਚ Email/Password ਖਾਤਾ ਨਿਰਮਾਣ ਅਜੇ ਚਾਲੂ ਨਹੀਂ ਹੈ।'
                  : language === 'en'
                  ? 'Email/Password account creation is not yet enabled in your Firebase Console.'
                  : 'Firebase Console में Email/Password खाता निर्माण अभी चालू नहीं है।'}
              </div>
            </div>

            {/* Step by Step instructions */}
            <div className="bg-white/80 rounded-xl p-3 text-[11px] text-[#78350F] flex flex-col gap-1.5 border border-[#FDE68A]">
              <div className="font-bold text-[#92400E]">
                {language === 'pa' ? 'ਈਮੇਲ ਖਾਤਾ ਚਾਲੂ ਕਰਨ ਦੇ ਕਦਮ:' : language === 'en' ? 'To enable Email/Password:' : 'ईमेल खाता चालू करने के 2 आसान कदम:'}
              </div>
              <div>1. <a href={consoleProvidersUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1D4ED8] underline">Firebase Console खोलें ↗</a></div>
              <div>2. 'Email/Password' प्रदाता पर क्लिक करें और 'Enable' दबाकर Save करें।</div>
            </div>

            {/* 1-Click Instant Google Alternative */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-11 bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSignUp ? 'Google से तुरंत 1-क्लिक में खाता बनाएं' : 'Google से तुरंत 1-क्लिक में लॉगिन करें'}</span>
            </button>
          </div>
        )}

        {/* General Error Message */}
        {errorMsg && !operationNotAllowed && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F8E6E4] border border-[#C1443B]/30 text-xs font-medium text-[#C1443B] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Info / Notice Message */}
        {infoMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#E7F0EA] border border-[#2F6B4F]/30 text-xs font-semibold text-[#2F6B4F] flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">check_circle</span>
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="mt-1 h-9 bg-white border border-[#2F6B4F] text-[#2F6B4F] hover:bg-[#2F6B4F] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{language === 'pa' ? 'ਜਾਂ ਗੂਗਲ ਨਾਲ ਜਾਰੀ ਰੱਖੋ' : language === 'en' ? 'Or continue with Google' : 'या सीधे Google से जारी रखें'}</span>
            </button>
          </div>
        )}

        {/* PRIMARY RECOMMENDED 1-CLICK OPTION (GOOGLE) */}
        {!isForgotPassword && (
          <div className="mb-5 p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#2F6B4F]/30 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E4632] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F6B4F] animate-pulse"></span>
                {isSignUp
                  ? language === 'pa'
                    ? '1-ਕਲਿੱਕ ਵਿੱਚ ਖਾਤਾ ਬਣਾਓ (ਸਭ ਤੋਂ ਆਸਾਨ)'
                    : language === 'en'
                    ? '1-Click Instant Sign-Up (Recommended)'
                    : '1-क्लिक में तुरंत खाता बनाएं (अनुशंसित)'
                  : language === 'pa'
                  ? '1-ਕਲਿੱਕ ਵਿੱਚ ਲੌਗਇਨ ਕਰੋ'
                  : language === 'en'
                  ? '1-Click Instant Sign-In'
                  : '1-क्लिक में तुरंत लॉगिन करें'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#2F6B4F]">
                100% Free
              </span>
            </div>

            <button
              id="google-primary-auth-btn"
              onClick={handleGoogleAuth}
              disabled={loading}
              type="button"
              className="w-full py-3.5 px-4 bg-white hover:bg-[#F4EFE6] active:scale-[0.98] border-2 border-[#2F6B4F] text-[#262421] font-bold rounded-xl text-sm flex items-center justify-center gap-3 shadow-xs transition-all touch-manipulation cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div className="flex flex-col items-start text-left">
                <span className="text-[#1E4632] font-extrabold text-sm leading-tight">
                  {isSignUp
                    ? language === 'pa'
                      ? 'ਗੂਗਲ ਨਾਲ ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ'
                      : language === 'en'
                      ? 'Create Account with Google'
                      : 'Google से नया खाता बनाएं'
                    : language === 'pa'
                    ? 'ਗੂਗਲ ਨਾਲ ਲੌਗਇਨ ਕਰੋ'
                    : language === 'en'
                    ? 'Sign In with Google'
                    : 'Google से लॉगिन करें'}
                </span>
                <span className="text-[10px] font-normal text-[#726C60]">
                  {language === 'pa'
                    ? 'ਕੋਈ ਪਾਸਵਰਡ ਯਾਦ ਰੱਖਣ ਦੀ ਲੋੜ ਨਹੀਂ'
                    : language === 'en'
                    ? 'Instant activation • No password needed'
                    : 'बिना पासवर्ड के तुरंत चालू • 100% सुरक्षित'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Divider */}
        {!isForgotPassword && (
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 border-t border-[#E4DFD2]"></div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-[#726C60] uppercase tracking-wider">
              {isSignUp
                ? language === 'pa'
                  ? 'ਜਾਂ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਨਾਲ ਰਜਿਸਟਰ ਕਰੋ'
                  : language === 'en'
                  ? 'Or register with email & password'
                  : 'या ईमेल और पासवर्ड से रजिस्टर करें'
                : language === 'pa'
                ? 'ਜਾਂ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਨਾਲ ਲੌਗਇਨ ਕਰੋ'
                : language === 'en'
                ? 'Or login with email & password'
                : 'या ईमेल और पासवर्ड से लॉगिन करें'}
            </span>
          </div>
        )}

        {/* EMAIL & PASSWORD FORM */}
        <form onSubmit={handleEmailAuthSubmit} className="flex flex-col gap-3">
          {isSignUp && !isForgotPassword && (
            <div>
              <label className="block text-xs font-bold text-[#262421] mb-1">
                {t.shopNameLabel} <span className="text-[#C1443B]">*</span>
              </label>
              <input
                id="auth-shop-name-input"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t.shopNamePlaceholder}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs text-[#262421] placeholder-[#A29C8E] focus:outline-none focus:border-[#2F6B4F] focus:bg-white transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#262421] mb-1">
              {t.emailOrPhoneLabel} <span className="text-[#C1443B]">*</span>
            </label>
            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoComplete="email"
              className="w-full h-11 px-3.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs text-[#262421] placeholder-[#A29C8E] focus:outline-none focus:border-[#2F6B4F] focus:bg-white transition-colors"
            />
            {isGmail && (
              <div className="mt-1.5 p-2 rounded-lg bg-[#EBF3FF] border border-[#BFDBFE] flex items-center justify-between text-[11px] text-[#1D4ED8]">
                <span>💡 Google ID खोजी गई!</span>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="font-bold underline hover:text-[#1E40AF] cursor-pointer"
                >
                  {isSignUp ? 'Google से तुरंत खाता बनाएं →' : 'Google से 1-क्लिक लॉगिन →'}
                </button>
              </div>
            )}
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#262421]">
                  {t.passwordLabel} <span className="text-[#C1443B]">*</span>
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                      setInfoMsg('');
                      setOperationNotAllowed(false);
                    }}
                    className="text-[11px] font-bold text-[#2F6B4F] hover:underline cursor-pointer"
                  >
                    {t.btnForgotPassword}
                  </button>
                )}
              </div>
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs text-[#262421] placeholder-[#A29C8E] focus:outline-none focus:border-[#2F6B4F] focus:bg-white transition-colors"
              />
              {isSignUp && (
                <p className="text-[10px] text-[#726C60] mt-1">
                  {language === 'pa' ? 'ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰ' : language === 'en' ? 'Minimum 6 characters' : 'कम से कम 6 अक्षर होने चाहिए'}
                </p>
              )}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 bg-[#2F6B4F] hover:bg-[#1E4632] active:scale-[0.98] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 touch-manipulation cursor-pointer text-xs"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isForgotPassword ? (
              <span>{t.btnSendResetLink}</span>
            ) : isSignUp ? (
              <span>📝 {language === 'pa' ? 'ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ' : language === 'en' ? 'Create Account' : 'नया खाता बनाएं'}</span>
            ) : (
              <span>🔑 {t.btnLogin}</span>
            )}
          </button>
        </form>

        {/* Bottom Switcher */}
        <div className="mt-4 pt-3 border-t border-[#E4DFD2] text-center text-xs text-[#726C60]">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg('');
                setInfoMsg('');
                setOperationNotAllowed(false);
              }}
              className="font-bold text-[#2F6B4F] hover:underline cursor-pointer"
              type="button"
            >
              {t.btnBackToLogin}
            </button>
          ) : isSignUp ? (
            <div>
              <span>{language === 'pa' ? 'ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ? ' : language === 'en' ? 'Already have an account? ' : 'पहले से खाता बना हुआ है? '}</span>
              <button
                id="auth-switch-to-login"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg('');
                  setInfoMsg('');
                  setOperationNotAllowed(false);
                }}
                className="font-bold text-[#2F6B4F] hover:underline cursor-pointer ml-1"
                type="button"
              >
                {t.btnLogin}
              </button>
            </div>
          ) : (
            <div>
              <span>{language === 'pa' ? 'ਨਵਾਂ ਖਾਤਾ ਚਾਹੀਦਾ ਹੈ? ' : language === 'en' ? "Don't have an account? " : 'नया खाता बनाना चाहते हैं? '}</span>
              <button
                id="auth-switch-to-signup"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg('');
                  setInfoMsg('');
                  setOperationNotAllowed(false);
                }}
                className="font-bold text-[#2F6B4F] hover:underline cursor-pointer ml-1"
                type="button"
              >
                {t.btnSignup}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
