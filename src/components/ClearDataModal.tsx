import React, { useState } from 'react';
import { Language } from '../types';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (options: {
    clearStock: boolean;
    clearCustomers: boolean;
    clearSales: boolean;
    resetOnboarding: boolean;
  }) => void;
  language: Language;
}

type ClearMode = 'all' | 'transactions_only' | 'stock_only';

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  language,
}) => {
  const [selectedMode, setSelectedMode] = useState<ClearMode>('all');
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const content = {
    hi: {
      title: 'डेटा साफ़ करें (Clear Data)',
      warningBadge: 'चेतावनी: यह क्रिया वापस नहीं ली जा सकती',
      desc: 'आप अपनी दुकान का कौन सा डेटा हटाना चाहते हैं? कृपया विकल्प चुनें:',
      modeAll: 'सारा डेटा हटाएं (पूर्ण फ़ैक्टरी रीसेट)',
      modeAllDesc: 'सभी स्टॉक आइटम, उधार खाता, ग्राहक और बिक्री रिकॉर्ड पूरी तरह साफ़ हो जाएंगे।',
      modeTransactions: 'केवल बिक्री व उधार रिकॉर्ड हटाएं',
      modeTransactionsDesc: 'स्टॉक सूची बची रहेगी, लेकिन पुराने बिक्री बिल और ग्राहक उधार शून्य हो जाएंगे।',
      modeStock: 'केवल स्टॉक आइटम हटाएं',
      modeStockDesc: 'उधार खाता और ग्राहक बचेंगे, स्टॉक सूची खाली हो जाएगी।',
      typeToConfirm: 'पुष्टि के लिए नीचे CLEAR लिखें:',
      btnCancel: 'रद्द करें',
      btnClear: 'डेटा मिटाएं',
      clearing: 'मिटाया जा रहा है...',
    },
    pa: {
      title: 'ਡਾਟਾ ਸਾਫ਼ ਕਰੋ (Clear Data)',
      warningBadge: 'ਚੇਤਾਵਨੀ: ਇਹ ਕਾਰਵਾਈ ਵਾਪਸ ਨਹੀਂ ਲਈ ਜਾ ਸਕਦੀ',
      desc: 'ਤੁਸੀਂ ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਕਿਹੜਾ ਡਾਟਾ ਹਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਚੁਣੋ:',
      modeAll: 'ਸਾਰਾ ਡਾਟਾ ਹਟਾਓ (ਪੂਰਾ ਰੀਸੈਟ)',
      modeAllDesc: 'ਸਾਰੇ ਸਟਾਕ ਆਈਟਮ, ਉਧਾਰ ਖਾਤਾ, ਗਾਹਕ ਅਤੇ ਵਿਕਰੀ ਰਿਕਾਰਡ ਸਾਫ਼ ਹੋ ਜਾਣਗੇ।',
      modeTransactions: 'ਸਿਰਫ਼ ਵਿਕਰੀ ਤੇ ਉਧਾਰ ਰਿਕਾਰਡ ਹਟਾਓ',
      modeTransactionsDesc: 'ਸਟਾਕ ਰਹੇਗਾ, ਪੁਰਾਣੇ ਬਿਲ ਅਤੇ ਉਧਾਰ ਖਾਤਾ ਜ਼ੀਰੋ ਹੋ ਜਾਵੇਗਾ।',
      modeStock: 'ਸਿਰਫ਼ ਸਟਾਕ ਆਈਟਮ ਹਟਾਓ',
      modeStockDesc: 'ਸਟਾਕ ਖਾਲੀ ਹੋਵੇਗਾ, ਗਾਹਕ ਖਾਤਾ ਰਹੇਗਾ।',
      typeToConfirm: 'ਪੁਸ਼ਟੀ ਲਈ ਹੇਠਾਂ CLEAR ਲਿਖੋ:',
      btnCancel: 'ਰੱਦ ਕਰੋ',
      btnClear: 'ਡਾਟਾ ਮਿਟਾਓ',
      clearing: 'ਮਿਟਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
    },
    en: {
      title: 'Clear Store Data',
      warningBadge: 'Caution: This action is permanent and cannot be undone',
      desc: 'Select which store records you want to wipe or reset:',
      modeAll: 'Wipe All Store Data (Full Reset)',
      modeAllDesc: 'Deletes all inventory stock items, sales ledger, customers & udhaar accounts.',
      modeTransactions: 'Clear Sales & Udhaar Ledger Only',
      modeTransactionsDesc: 'Keeps your stock inventory list, but resets customer balances and sales history to ₹0.',
      modeStock: 'Clear Inventory Items Only',
      modeStockDesc: 'Wipes all stock products while preserving customer contacts and udhaar history.',
      typeToConfirm: 'Type CLEAR below to confirm deletion:',
      btnCancel: 'Cancel',
      btnClear: 'Permanently Clear Data',
      clearing: 'Clearing records...',
    },
    ja: {
      title: 'データを消去 (Clear Data)',
      warningBadge: '警告: この操作は取り消せません',
      desc: '削除するデータを選択してください:',
      modeAll: 'すべての店舗データを初期化',
      modeAllDesc: '全在庫アイテム、売上履歴、売掛台帳が完全に削除されます。',
      modeTransactions: '売上と掛売履歴のみ消去',
      modeTransactionsDesc: '在庫データは保持し、売上および未収残高のみ初期化します。',
      modeStock: '在庫アイテムのみ消去',
      modeStockDesc: '顧客と掛売台帳を残し、商品在庫のみ削除します。',
      typeToConfirm: '確認のため下に CLEAR と入力してください:',
      btnCancel: 'キャンセル',
      btnClear: 'データを消去する',
      clearing: '消去中...',
    },
  }[language] || {
    title: 'डेटा साफ़ करें (Clear Data)',
    warningBadge: 'चेतावनी: यह क्रिया वापस नहीं ली जा सकती',
    desc: 'आप अपनी दुकान का कौन सा डेटा हटाना चाहते हैं?',
    modeAll: 'सारा डेटा हटाएं (पूर्ण फ़ैक्टरी रीसेट)',
    modeAllDesc: 'सभी स्टॉक आइटम, उधार खाता, ग्राहक और बिक्री रिकॉर्ड साफ़ हो जाएंगे।',
    modeTransactions: 'केवल बिक्री व उधार रिकॉर्ड हटाएं',
    modeTransactionsDesc: 'स्टॉक सूची बची रहेगी, लेकिन पुराने बिक्री बिल और ग्राहक उधार शून्य हो जाएंगे।',
    modeStock: 'केवल स्टॉक आइटम हटाएं',
    modeStockDesc: 'उधार खाता और ग्राहक बचेंगे, स्टॉक सूची खाली हो जाएगी।',
    typeToConfirm: 'पुष्टि के लिए नीचे CLEAR लिखें:',
    btnCancel: 'रद्द करें',
    btnClear: 'डेटा मिटाएं',
    clearing: 'मिटाया जा रहा है...',
  };

  const isConfirmed = confirmInput.trim().toUpperCase() === 'CLEAR';

  const handleExecute = () => {
    if (!isConfirmed) return;
    setIsProcessing(true);

    setTimeout(() => {
      onConfirmClear({
        clearStock: selectedMode === 'all' || selectedMode === 'stock_only',
        clearCustomers: selectedMode === 'all',
        clearSales: selectedMode === 'all' || selectedMode === 'transactions_only',
        resetOnboarding: selectedMode === 'all',
      });
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">delete_forever</span>
            </div>
            <h3 className="text-base font-bold text-[#262421] font-display">
              {content.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#726C60] hover:bg-[#E7F0EA] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Warning Badge */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-800 font-medium">
          <span className="material-symbols-outlined text-red-600 text-base flex-shrink-0">
            warning
          </span>
          <span>{content.warningBadge}</span>
        </div>

        <p className="text-xs text-[#726C60] font-medium">{content.desc}</p>

        {/* Modes Selection */}
        <div className="space-y-2">
          {/* Mode 1: All Data */}
          <label
            onClick={() => setSelectedMode('all')}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              selectedMode === 'all'
                ? 'bg-red-50/50 border-red-400 ring-2 ring-red-400/20 shadow-xs'
                : 'bg-white border-[#E4DFD2] hover:bg-[#FAF7F0]'
            }`}
          >
            <input
              type="radio"
              name="clearMode"
              checked={selectedMode === 'all'}
              onChange={() => setSelectedMode('all')}
              className="mt-0.5 text-red-600 focus:ring-red-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#262421]">
                <span className="material-symbols-outlined text-red-600 text-[16px]">
                  restart_alt
                </span>
                <span>{content.modeAll}</span>
              </div>
              <p className="text-[11px] text-[#726C60] mt-0.5 leading-snug">
                {content.modeAllDesc}
              </p>
            </div>
          </label>

          {/* Mode 2: Transactions & Sales Only */}
          <label
            onClick={() => setSelectedMode('transactions_only')}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              selectedMode === 'transactions_only'
                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white border-[#E4DFD2] hover:bg-[#FAF7F0]'
            }`}
          >
            <input
              type="radio"
              name="clearMode"
              checked={selectedMode === 'transactions_only'}
              onChange={() => setSelectedMode('transactions_only')}
              className="mt-0.5 text-amber-600 focus:ring-amber-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#262421]">
                <span className="material-symbols-outlined text-amber-600 text-[16px]">
                  receipt_long
                </span>
                <span>{content.modeTransactions}</span>
              </div>
              <p className="text-[11px] text-[#726C60] mt-0.5 leading-snug">
                {content.modeTransactionsDesc}
              </p>
            </div>
          </label>

          {/* Mode 3: Stock Only */}
          <label
            onClick={() => setSelectedMode('stock_only')}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              selectedMode === 'stock_only'
                ? 'bg-orange-50/50 border-orange-400 ring-2 ring-orange-400/20 shadow-xs'
                : 'bg-white border-[#E4DFD2] hover:bg-[#FAF7F0]'
            }`}
          >
            <input
              type="radio"
              name="clearMode"
              checked={selectedMode === 'stock_only'}
              onChange={() => setSelectedMode('stock_only')}
              className="mt-0.5 text-orange-600 focus:ring-orange-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#262421]">
                <span className="material-symbols-outlined text-orange-600 text-[16px]">
                  inventory_2
                </span>
                <span>{content.modeStock}</span>
              </div>
              <p className="text-[11px] text-[#726C60] mt-0.5 leading-snug">
                {content.modeStockDesc}
              </p>
            </div>
          </label>
        </div>

        {/* Safety Text Confirmation Input */}
        <div className="mt-1">
          <label className="block text-xs font-bold text-[#262421] mb-1.5">
            {content.typeToConfirm}
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="CLEAR"
            className="w-full h-11 px-3 rounded-xl border border-red-300 bg-white font-mono font-bold text-sm tracking-wider text-center text-red-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 uppercase transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 border border-[#E4DFD2] bg-white hover:bg-[#FAF7F0] text-xs font-bold text-[#262421] rounded-xl transition-colors cursor-pointer"
          >
            {content.btnCancel}
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isProcessing}
            onClick={handleExecute}
            className={`flex-1 h-11 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 ${
              isConfirmed && !isProcessing
                ? 'bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer shadow-red-600/20'
                : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isProcessing ? 'sync' : 'delete'}
            </span>
            <span>{isProcessing ? content.clearing : content.btnClear}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
