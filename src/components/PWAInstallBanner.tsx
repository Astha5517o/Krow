import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';
import { Language } from '../types';

interface PWAInstallBannerProps {
  language?: Language;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ language = 'hi' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('krow_pwa_banner_dismissed') === 'true';
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running standalone as installed app, or explicitly dismissed in this session
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show if browser supports direct install OR is iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('krow_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      setDismissed(true);
    }
  };

  const content = {
    hi: {
      title: 'Krow मोबाइल ऐप इंस्टॉल करें',
      sub: 'बिना इंटरनेट तेज़ बिलिंग और एक-क्लिक होमस्क्रीन एक्सेस',
      btn: 'इंस्टॉल करें',
      iosTitle: 'iPhone / iPad पर इंस्टॉल करें',
      step1: 'सफारी ब्राउज़र में नीचे शेयर बटन दबाएं',
      step2: 'सूची में "Add to Home Screen" (होम स्क्रीन पर जोड़ें) चुनें',
      step3: 'ऊपर दाईं तरफ "Add" दबाएं',
      close: 'बंद करें',
    },
    pa: {
      title: 'Krow ਮੋਬਾਈਲ ਐਪ ਇੰਸਟਾਲ ਕਰੋ',
      sub: 'ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਤੇਜ਼ ਬਿਲਿੰਗ ਅਤੇ ਹੋਮਸਕ੍ਰੀਨ ਐਕਸੈਸ',
      btn: 'ਇੰਸਟਾਲ ਕਰੋ',
      iosTitle: 'iPhone / iPad ਤੇ ਇੰਸਟਾਲ ਕਰੋ',
      step1: 'ਸਫਾਰੀ ਵਿੱਚ ਹੇਠਾਂ ਸ਼ੇਅਰ ਬਟਨ ਦਬਾਓ',
      step2: 'ਸੂਚੀ ਵਿੱਚ "Add to Home Screen" ਚੁਣੋ',
      step3: 'ਉੱਪਰ "Add" ਦਬਾਓ',
      close: 'ਬੰਦ ਕਰੋ',
    },
    en: {
      title: 'Install Krow Mobile App',
      sub: 'One-tap home screen access & instant offline billing',
      btn: 'Install App',
      iosTitle: 'Install on iPhone / iPad',
      step1: 'Tap the Share icon at the bottom of Safari',
      step2: 'Scroll down and select "Add to Home Screen"',
      step3: 'Tap "Add" in the top right corner',
      close: 'Got it',
    },
    ja: {
      title: 'Krow アプリをインストール',
      sub: 'ホーム画面からワンタップ起動 & オフライン対応',
      btn: 'インストール',
      iosTitle: 'iPhone / iPad でのインストール',
      step1: 'Safari 下部の「共有」アイコンをタップ',
      step2: '「ホーム画面に追加」を選択',
      step3: '右上の「追加」をタップして完了',
      close: '閉じる',
    },
  }[language] || {
    title: 'Krow मोबाइल ऐप इंस्टॉल करें',
    sub: 'बिना इंटरनेट तेज़ बिलिंग और एक-क्लिक होमस्क्रीन एक्सेस',
    btn: 'इंस्टॉल करें',
    iosTitle: 'iPhone / iPad पर इंस्टॉल करें',
    step1: 'सफारी ब्राउज़र में नीचे शेयर बटन दबाएं',
    step2: 'सूची में "Add to Home Screen" चुनें',
    step3: 'ऊपर "Add" दबाएं',
    close: 'बंद करें',
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#0E3522] via-[#16422C] to-[#0E3522] text-white px-4 py-2.5 shadow-md border-b border-[#2F6B4F]/40 animate-fade-in relative z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogo size="xs" />
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5 truncate">
                <span>{content.title}</span>
                <span className="bg-[#D97706] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[#A3D9BE] leading-tight truncate mt-0.5">
                {content.sub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="bg-[#D97706] hover:bg-[#B45309] active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isIOS ? 'ios_share' : 'install_mobile'}
              </span>
              <span>{content.btn}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-[#A3D9BE] hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] p-5 shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AppLogo size="xs" />
                <h4 className="text-sm font-bold text-[#16291E]">{content.iosTitle}</h4>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-[#726C60] hover:bg-[#E7F0EA]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 py-1 text-xs text-[#262421]">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-[#E4DFD2]">
                <div className="w-6 h-6 rounded-full bg-[#E7F0EA] text-[#2F6B4F] font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold">{content.step1}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#726C60] mt-0.5">
                    <span className="material-symbols-outlined text-sm text-[#2F6B4F]">ios_share</span>
                    (Share icon)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-[#E4DFD2]">
                <div className="w-6 h-6 rounded-full bg-[#E7F0EA] text-[#2F6B4F] font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold">{content.step2}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#726C60] mt-0.5">
                    <span className="material-symbols-outlined text-sm text-[#2F6B4F]">add_box</span>
                    (Add to Home Screen)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-[#E4DFD2]">
                <div className="w-6 h-6 rounded-full bg-[#E7F0EA] text-[#2F6B4F] font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold">{content.step3}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 bg-[#2F6B4F] text-white font-bold rounded-xl text-xs hover:bg-[#1E4632] transition-colors shadow-xs"
            >
              {content.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
