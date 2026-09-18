import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { StockItem, Language, StoreType } from '../types';
import { publishStoreCatalog } from '../services/publicCatalogService';

interface ShareStockModalProps {
  storeId: string;
  shopName: string;
  storeType: StoreType;
  phone?: string;
  stockItems: StockItem[];
  language: Language;
  onOpenCustomerPreview: () => void;
  onClose: () => void;
}

export const ShareStockModal: React.FC<ShareStockModalProps> = ({
  storeId,
  shopName,
  storeType,
  phone,
  stockItems,
  language,
  onOpenCustomerPreview,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Construct shareable link with query parameters
  const shareableUrl = `${window.location.origin}?view=public-stock&store=${encodeURIComponent(
    storeId
  )}`;

  useEffect(() => {
    // Generate QR Code
    QRCode.toDataURL(
      shareableUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#16291E',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );

    // Auto sync sanitized catalog to Firestore
    handleSyncToPublic();
  }, [shareableUrl]);

  const handleSyncToPublic = async () => {
    setPublishing(true);
    try {
      await publishStoreCatalog(storeId, shopName, storeType, phone, stockItems);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (e) {
      console.warn('Sync notice:', e);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `नमस्ते! हमारे ${shopName || 'दुकान'} में क्या-क्या सामान उपलब्ध है, यहाँ लाइव देखें:\n${shareableUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>दुकान काउंटर QR कोड - ${shopName}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            padding: 40px;
            color: #16291E;
            background: #fff;
          }
          .card {
            border: 3px solid #2F6B4F;
            border-radius: 24px;
            padding: 40px 30px;
            max-width: 480px;
            margin: 0 auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          h1 {
            font-size: 28px;
            margin: 0 0 8px;
            color: #2F6B4F;
          }
          p.sub {
            font-size: 16px;
            color: #4A5D52;
            margin: 0 0 24px;
          }
          img.qr {
            width: 260px;
            height: 260px;
            border: 2px dashed #2F6B4F;
            padding: 8px;
            border-radius: 16px;
          }
          .tag {
            display: inline-block;
            background: #EBF3EE;
            color: #2F6B4F;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 20px 0 10px;
          }
          .footer {
            font-size: 13px;
            color: #888;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="tag">📲 अपने मोबाइल से स्कैन करें</span>
          <h1>${shopName || 'हमारी दुकान'}</h1>
          <p class="sub">देखें काउंटर पर अभी क्या-क्या सामान उपलब्ध है!</p>
          <img class="qr" src="${qrDataUrl}" alt="QR Code" />
          <p style="font-size: 14px; font-weight: bold; color: #16291E; margin-top: 16px;">
            लाइव स्टॉक सूची • ताज़ा सामान • समय की बचत
          </p>
          <div class="footer">
            दुकान काउंटर पर चस्पा करें • krow
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="max-w-md w-full max-h-[92vh] bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2F6B4F] text-2xl">qr_code_2</span>
            <div>
              <h2 className="text-base font-bold text-[#16291E]">
                {language === 'en'
                  ? 'Customer Live Stock Link & QR'
                  : 'ग्राहक लाइव स्टॉक लिंक व QR कोड'}
              </h2>
              <p className="text-[11px] text-[#6B7C72]">
                {language === 'en'
                  ? 'Share on WhatsApp Status or print for counter'
                  : 'WhatsApp स्टेटस पर लगाएं या काउंटर पर प्रिंट करके चिपकाएं'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] hover:bg-[#E4DFD2] flex items-center justify-center text-[#4A5D52] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Privacy Guarantee Banner */}
          <div className="bg-[#EBF3EE] border border-[#2F6B4F]/30 p-3 rounded-2xl flex items-start gap-2 text-xs text-[#16291E]">
            <span className="material-symbols-outlined text-[#2F6B4F] text-lg shrink-0">
              verified_user
            </span>
            <div>
              <span className="font-bold block text-[#2F6B4F]">100% सुरक्षित सार्वजनिक दृश्य</span>
              <p className="text-[11px] text-[#4A5D52] mt-0.5">
                ग्राहकों को केवल सामान का नाम, कैटेगरी और उपलब्धता दिखेगी। आपकी खरीद कीमत (Wholesale Price),
                मुनाफ़ा मार्जिन और री-ऑर्डर लेवल हमेशा पूर्णतः गुप्त रहते हैं।
              </p>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E4DFD2] shadow-xs text-center space-y-3">
            <h3 className="text-sm font-extrabold text-[#16291E]">{shopName}</h3>
            <p className="text-[11px] text-[#6B7C72]">
              ग्राहक अपने फोन के कैमरे से स्कैन करके लाइव स्टॉक देख सकते हैं
            </p>

            {qrDataUrl ? (
              <div className="inline-block p-2 rounded-2xl bg-white border-2 border-dashed border-[#2F6B4F]/40 shadow-sm">
                <img src={qrDataUrl} alt="Store QR Code" className="w-52 h-52 mx-auto rounded-xl" />
              </div>
            ) : (
              <div className="w-52 h-52 mx-auto bg-[#FAF7F0] rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-2xl text-[#2F6B4F]">
                  sync
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrintPoster}
                className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#16291E] text-xs font-bold rounded-xl border border-[#E4DFD2] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm text-[#2F6B4F]">print</span>
                <span>काउंटर पोस्टर प्रिंट करें</span>
              </button>
              <button
                type="button"
                onClick={onOpenCustomerPreview}
                className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#E4DFD2] text-[#2F6B4F] text-xs font-bold rounded-xl border border-[#E4DFD2] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>ग्राहक दृश्य देखें</span>
              </button>
            </div>
          </div>

          {/* Share Link Box */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#E4DFD2] space-y-2">
            <span className="text-xs font-bold text-[#16291E] block">वेबसाइट लिंक</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-[#FAF7F0] border border-[#E4DFD2] text-[11px] px-3 py-2 rounded-xl text-[#4A5D52] font-mono select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-[#2F6B4F] hover:bg-[#23533D] text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>{copied ? 'कॉपी हो गया' : 'कॉपी'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 mt-2"
            >
              <span className="material-symbols-outlined text-base">share</span>
              <span>WhatsApp स्टेटस / चैट पर शेयर करें</span>
            </button>
          </div>

          {/* Sync Status Button */}
          <div className="flex items-center justify-between text-xs px-1 text-[#6B7C72]">
            <span>
              {publishing
                ? 'सिंक हो रहा है...'
                : publishSuccess
                ? '✓ लाइव स्टॉक अपडेटेड'
                : `कुल ${stockItems.length} सामान लाइव`}
            </span>
            <button
              type="button"
              onClick={handleSyncToPublic}
              className="text-[#2F6B4F] font-bold hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-xs">refresh</span>
              <span>अभी रिफ्रेश करें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
