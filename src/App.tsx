import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { HomeDashboard } from './components/HomeDashboard';
import { StockScreen } from './components/StockScreen';
import { UdhaarScreen } from './components/UdhaarScreen';
import { VoiceModal } from './components/VoiceModal';
import { NightCountModal } from './components/NightCountModal';
import { ScanBillModal } from './components/ScanBillModal';
import { OrderListModal } from './components/OrderListModal';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AuthScreen } from './components/AuthScreen';
import { useBackHandler } from './hooks/useBackHandler';
import { setNavigationCallbacks } from './utils/navigationStack';

function AppContent() {
  const { activeScreen, setActiveScreen, profile, showToast } = useShop();
  const lang = profile?.language || 'hi';

  // Modal states
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isNightCountOpen, setIsNightCountOpen] = useState(false);
  const [isScanBillOpen, setIsScanBillOpen] = useState(false);
  const [isOrderListOpen, setIsOrderListOpen] = useState(false);
  const [stockPrefillName, setStockPrefillName] = useState<string | null>(null);

  // Configure back navigation interceptor:
  // 1. Prevents accidental app exit/refresh on single back click on home screen
  // 2. Warns the user to press back again within 2s if they actually want to exit
  useEffect(() => {
    setNavigationCallbacks({
      isHome: () => activeScreen === 'home',
      showExitToast: () => {
        showToast(
          lang === 'hi'
            ? 'ऐप से बाहर जाने के लिए दोबारा बैक दबाएं'
            : lang === 'pa'
            ? 'ਐਪ ਤੋਂ ਬਾਹਰ ਜਾਣ ਲਈ ਦੁਬਾਰਾ ਬੈਕ ਦਬਾਓ'
            : 'Press back again to exit the app',
          'info'
        );
      },
    });
  }, [activeScreen, lang, showToast]);

  // Back button closes modals first without restarting or leaving app
  useBackHandler(isVoiceOpen, () => setIsVoiceOpen(false), 'voiceModal');
  useBackHandler(isNightCountOpen, () => setIsNightCountOpen(false), 'nightCountModal');
  useBackHandler(isScanBillOpen, () => setIsScanBillOpen(false), 'scanBillModal');
  useBackHandler(isOrderListOpen, () => setIsOrderListOpen(false), 'orderListModal');

  // If user is on Stock or Udhaar screen, back button brings them back to Home
  useBackHandler(activeScreen !== 'home', () => setActiveScreen('home'), `screen_${activeScreen}`);

  // Directly show Main Application (Login system removed for testing experience)
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#262421] flex flex-col font-sans antialiased selection:bg-[#E7F0EA]">
      <ToastContainer />

      {/* Persistent Header */}
      <Header onOpenVoice={() => setIsVoiceOpen(true)} />

      {/* Main Content Area: Padding bottom ensures no overlap with the fixed bottom nav */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 pt-3.5 pb-20 sm:max-w-xl sm:px-6">
        {activeScreen === 'home' && (
          <HomeDashboard
            onOpenQuickSell={() => setActiveScreen('stock')}
            onOpenNightCount={() => setIsNightCountOpen(true)}
            onOpenScanBill={() => setIsScanBillOpen(true)}
            onOpenOrderList={() => setIsOrderListOpen(true)}
            onOpenAddCustomer={() => setActiveScreen('udhaar')}
          />
        )}

        {activeScreen === 'stock' && (
          <StockScreen
            onOpenNightCount={() => setIsNightCountOpen(true)}
            onOpenScanBill={() => setIsScanBillOpen(true)}
            onOpenOrderList={() => setIsOrderListOpen(true)}
            prefillName={stockPrefillName}
            onClearPrefill={() => setStockPrefillName(null)}
          />
        )}

        {activeScreen === 'udhaar' && <UdhaarScreen />}
      </main>

      {/* Modals */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectProduct={(name, action) => {
          if (action === 'add') {
            setActiveScreen('stock');
            setStockPrefillName(name);
          } else {
            setActiveScreen('stock');
          }
        }}
      />

      <NightCountModal
        isOpen={isNightCountOpen}
        onClose={() => setIsNightCountOpen(false)}
      />

      <ScanBillModal
        isOpen={isScanBillOpen}
        onClose={() => setIsScanBillOpen(false)}
      />

      <OrderListModal
        isOpen={isOrderListOpen}
        onClose={() => setIsOrderListOpen(false)}
      />

      {/* Persistent Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
