import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Language } from '../types';
import { AppLogo } from './AppLogo';
import { recordUserRegistration, recordUserLoginInfo } from '../services/firestoreSyncService';

interface AuthModalProps {
  language: Language;
  onSuccess: (customShopName?: string, isNewUser?: boolean, user?: User) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ language, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [retryNotice, setRetryNotice] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setRetryNotice(false);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCred = await signInWithPopup(auth, provider);

      if (userCred.user) {
        const u = userCred.user;
        const isNewUser = (userCred as any)?._tokenResponse?.isNewUser || false;

        // Record User Registration & Login in Firestore
        if (isNewUser) {
          await recordUserRegistration(u.uid, {
            email: u.email || '',
            shopName: u.displayName ? `${u.displayName} की दुकान` : 'Krōw Store',
            ownerName: u.displayName || '',
            language,
            provider: 'google.com',
            logoUrl: u.photoURL || undefined,
          });
        } else {
          await recordUserLoginInfo(u.uid, u, {
            email: u.email || undefined,
            language,
          });
        }

        onSuccess(u.displayName || undefined, isNewUser, u);
      }
    } catch (err: any) {
      const code = err?.code || '';
      console.warn('Google auth status:', code);

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }

      if (code === 'auth/popup-blocked') {
        setRetryNotice(true);
        setErrorMsg(
          language === 'en'
            ? 'Browser blocked the login popup. Please click below to allow and retry.'
            : 'ब्राउज़र ने पॉपअप विंडो रोक दी। कृपया नीचे दिए बटन पर दोबारा क्लिक करें।'
        );
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg(
          language === 'en'
            ? 'Network error. Please check your internet connection.'
            : 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।'
        );
      } else {
        setErrorMsg(
          language === 'en'
            ? 'Unable to complete Google sign-in. Please try again.'
            : 'Google लॉगिन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#262421]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E4DFD2] animate-scale-up relative">
        {/* Close Button */}
        {onClose && (
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#726C60] flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-black text-[#262421] font-display tracking-tight">
            {language === 'en' ? 'Continue with Google' : 'Google से तुरंत शुरू करें'}
          </h2>
          <p className="text-xs text-[#726C60] mt-1.5 max-w-xs leading-relaxed">
            {language === 'en'
              ? 'One-click sign-in to securely save and access your shop inventory, khata, and udhaar anywhere.'
              : '1-क्लिक में सुरक्षित लॉगिन। आपका स्टॉक, बही-खाता और उधारी डेटा हमेशा सुरक्षित रहेगा।'}
          </p>
        </div>

        {/* Main Google Authentication Button */}
        <div className="space-y-4">
          <button
            id="google-primary-auth-btn"
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-13 bg-white hover:bg-[#F8FAFC] border-2 border-[#E4DFD2] hover:border-[#2F6B4F] text-[#1E293B] font-bold rounded-2xl text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer active:scale-98 transition-all disabled:opacity-60 relative overflow-hidden group"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-[#2F6B4F]">
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                <span>{language === 'en' ? 'Connecting to Google...' : 'Google से कनेक्ट हो रहा है...'}</span>
              </div>
            ) : (
              <>
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <span className="text-[14px]">
                  {language === 'en' ? 'Continue with Google' : 'Google के साथ जारी रखें'}
                </span>
              </>
            )}
          </button>

          {/* Error / Notice Display */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#F8E6E4] border border-[#C1443B]/30 text-xs text-[#C1443B] flex items-start gap-2 animate-scale-up">
              <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <div>{errorMsg}</div>
                {retryNotice && (
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="mt-1.5 text-xs font-bold text-[#1E4632] underline cursor-pointer"
                  >
                    {language === 'en' ? 'Click here to retry' : 'पुनः प्रयास करने के लिए यहाँ क्लिक करें'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Key Value Highlights */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4DFD2] space-y-2.5">
            <div className="text-[11px] font-bold text-[#262421] mb-1">
              {language === 'en' ? 'Why sign in with Google?' : 'Google साइन-इन के फायदे:'}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#524E45]">
              <span className="w-5 h-5 rounded-full bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center text-xs flex-shrink-0 font-bold">
                ✓
              </span>
              <span>
                {language === 'en'
                  ? 'Instant 1-Click login — no password to remember'
                  : '1-क्लिक में तुरंत लॉगिन — पासवर्ड याद रखने की जरूरत नहीं'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#524E45]">
              <span className="w-5 h-5 rounded-full bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center text-xs flex-shrink-0 font-bold">
                ✓
              </span>
              <span>
                {language === 'en'
                  ? 'Automatic real-time sync & continuous data safety'
                  : 'स्वचालित ऑटो-सिंक और स्थायी डेटा सुरक्षा'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#524E45]">
              <span className="w-5 h-5 rounded-full bg-[#E7F0EA] text-[#2F6B4F] flex items-center justify-center text-xs flex-shrink-0 font-bold">
                ✓
              </span>
              <span>
                {language === 'en'
                  ? 'Access your shop from any phone or computer'
                  : 'किसी भी फोन या कंप्यूटर से दुकान का बही-खाता खोलें'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#726C60] font-medium">
            <span className="material-symbols-outlined text-sm text-[#2F6B4F]">lock</span>
            <span>
              {language === 'en'
                ? 'Your business data is private and encrypted'
                : 'आपकी दुकान का डेटा पूर्णतः सुरक्षित और एन्क्रिप्टेड है'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
