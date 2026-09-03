import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { app };

// Helper to convert phone or email to standard Firebase Auth email identifier
export function toAuthEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Remove non-alphanumeric chars for clean phone handle
  const digits = trimmed.replace(/[^a-zA-Z0-9]/g, '');
  return `${digits || 'shop'}@krow.shop`;
}

// User-friendly Firebase Auth error mapper in Hindi & English
export function getAuthErrorMessage(errorCode: string, defaultMessage?: string, lang: 'hi' | 'en' | 'pa' = 'hi'): string {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return lang === 'hi'
        ? 'मोबाइल नंबर/ईमेल या पासवर्ड गलत है। कृपया पुनः जांचें।'
        : lang === 'pa'
        ? 'ਮੋਬਾਈਲ ਨੰਬਰ/ਈਮੇਲ ਜਾਂ ਪਾਸਵਰਡ ਗਲਤ ਹੈ।'
        : 'Incorrect mobile number/email or password.';
    case 'auth/wrong-password':
      return lang === 'hi'
        ? 'गलत पासवर्ड। कृपया सही पासवर्ड डालें या "पासवर्ड भूल गए?" चुनें।'
        : lang === 'pa'
        ? 'ਗਲਤ ਪਾਸਵਰਡ। ਕਿਰਪਾ ਕਰਕੇ "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?" ਚੁਣੋ।'
        : 'Incorrect password. Please try again or tap "Forgot password?".';
    case 'auth/email-already-in-use':
      return lang === 'hi'
        ? 'इस नंबर या ईमेल का खाता पहले से बना हुआ है। कृपया "लॉग इन करें" चुनें।'
        : lang === 'pa'
        ? 'ਇਸ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਦਾ ਖਾਤਾ ਪਹਿਲਾਂ ਹੀ ਬਣਿਆ ਹੋਇਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਲੌਗ ਇਨ ਕਰੋ।'
        : 'An account with this email or mobile number already exists. Please log in.';
    case 'auth/weak-password':
      return lang === 'hi'
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : lang === 'pa'
        ? 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।'
        : 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return lang === 'hi'
        ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर या सही ईमेल पता दर्ज करें।'
        : lang === 'pa'
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ 10-ਅੰਕੀ ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਈਮੇਲ ਪਤਾ ਦਰਜ ਕਰੋ।'
        : 'Please enter a valid 10-digit mobile number or email address.';
    case 'auth/network-request-failed':
      return lang === 'hi'
        ? 'इंटरनेट कनेक्शन नहीं मिल रहा है। कृपया अपना नेटवर्क जांचें।'
        : lang === 'pa'
        ? 'ਇੰਟਰਨੈਟ ਕੁਨੈਕਸ਼ਨ ਨਹੀਂ ਮਿਲ ਰਿਹਾ। ਕਿਰਪਾ ਕਰਕੇ ਨੈੱਟਵਰਕ ਚੈੱਕ ਕਰੋ।'
        : 'Network connection failed. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return lang === 'hi'
        ? 'ईमेल/पासवर्ड लॉगिन Firebase Console में अभी सक्रिय नहीं है। कृपया "Google से साइन इन करें" का उपयोग करें, या Firebase Console (Auth > Sign-in method) में Email/Password सक्षम करें।'
        : lang === 'pa'
        ? 'ਈਮੇਲ/ਪਾਸਵਰਡ ਲੌਗਇਨ ਅਜੇ ਸਮਰੱਥ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ Google ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ।'
        : 'Email/Password sign-in is not enabled in Firebase Console yet. Please use "Sign in with Google" or enable Email/Password in Firebase Console.';
    case 'auth/popup-closed-by-user':
      return lang === 'hi'
        ? 'साइन-इन पॉपअप विंडो बंद कर दी गई। कृपया पुनः प्रयास करें।'
        : lang === 'pa'
        ? 'ਸਾਈਨ-ਇਨ ਵਿੰਡੋ ਬੰਦ ਹੋ ਗਈ।'
        : 'Sign-in popup closed before completing. Please try again.';
    case 'auth/too-many-requests':
      return lang === 'hi'
        ? 'बहुत सारे गलत प्रयास हुए हैं। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
        : lang === 'pa'
        ? 'ਬਹੁਤ ਸਾਰੀਆਂ ਗਲਤ ਕੋਸ਼ਿਸ਼ਾਂ ਹੋਈਆਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਮਿੰਟਾਂ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
        : 'Access temporarily disabled due to many failed attempts. Please try again later.';
    default:
      return defaultMessage || (lang === 'hi' ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'An error occurred. Please try again.');
  }
}
