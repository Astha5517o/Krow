import React, { useState } from 'react';
import {
  ClipboardList,
  X,
  Share2,
  Copy,
  Check,
  Send,
  Package,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { ReorderSuggestion } from '../types';

interface OrderListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderListModal: React.FC<OrderListModalProps> = ({ isOpen, onClose }) => {
  const { reorderSuggestions, profile, showToast } = useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  // Allow the shopkeeper to adjust order quantities before sending
  const [itemsToOrder, setItemsToOrder] = useState<
    Array<{
      id: string;
      name: string;
      unit: string;
      neededQuantity: number;
      packetSize?: number;
      packets: number;
      spoilQuickly: boolean;
    }>
  >(() => {
    return reorderSuggestions.map((s) => ({
      id: s.item.id,
      name: s.item.name,
      unit: s.item.unit,
      neededQuantity: s.neededQuantity,
      packetSize: s.item.packetSize,
      packets: s.packetsToOrder,
      spoilQuickly: s.item.spoilQuickly,
    }));
  });

  const [copied, setCopied] = useState(false);

  // Sync with reorder suggestions when opening
  React.useEffect(() => {
    if (isOpen) {
      setItemsToOrder(
        reorderSuggestions.map((s) => ({
          id: s.item.id,
          name: s.item.name,
          unit: s.item.unit,
          neededQuantity: s.neededQuantity,
          packetSize: s.item.packetSize,
          packets: s.packetsToOrder,
          spoilQuickly: s.item.spoilQuickly,
        }))
      );
      setCopied(false);
    }
  }, [isOpen, reorderSuggestions]);

  const handleUpdatePackets = (id: string, delta: number) => {
    setItemsToOrder((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newPackets = Math.max(1, it.packets + delta);
        const newQty = it.packetSize ? newPackets * it.packetSize : newPackets;
        return {
          ...it,
          packets: newPackets,
          neededQuantity: newQty,
        };
      })
    );
  };

  const handleRemove = (id: string) => {
    setItemsToOrder((prev) => prev.filter((it) => it.id !== id));
  };

  // Generate plain text formatted for WhatsApp
  const generateOrderText = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const shopName = profile?.shopName || 'Krow Shop';

    let text = `📦 *ऑर्डर पर्चा / Order List*\n`;
    text += `दुकान / Shop: *${shopName}*\n`;
    text += `तारीख / Date: ${today}\n\n`;

    if (itemsToOrder.length === 0) {
      text += `कोई माल नहीं है।\n`;
    } else {
      itemsToOrder.forEach((item, idx) => {
        if (item.packetSize && item.packetSize > 1) {
          text += `${idx + 1}. *${item.name}* - *${item.packets} पैकेट/गत्ते* (${item.packetSize} पीस प्रति पैकेट = ${item.neededQuantity} ${item.unit})\n`;
        } else {
          text += `${idx + 1}. *${item.name}* - *${item.neededQuantity} ${item.unit}*\n`;
        }
      });
    }

    text += `\nकृप्या माल जल्दी भिजवाएं। धन्यवाद!`;
    return text;
  };

  const handleCopyText = async () => {
    const text = generateOrderText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(t.copiedNotice);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast(
        lang === 'hi'
          ? 'कॉपी नहीं हो सका'
          : lang === 'pa'
          ? 'ਕਾਪੀ ਨਹੀਂ ਹੋ ਸਕਿਆ'
          : 'Could not copy to clipboard',
        'error'
      );
    }
  };

  const handleSendWhatsApp = () => {
    const text = generateOrderText();
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E4DFD2] my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4DFD2] flex items-center justify-between bg-[#1E4632] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#D9A62E]" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.orderListTitle}</h3>
              <p className="text-[11px] text-[#FAF7F0]/80">{t.orderListSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {itemsToOrder.length === 0 ? (
            <div className="py-8 text-center text-[#726C60]">
              <Package className="w-10 h-10 mx-auto text-[#2F6B4F]/40 mb-2" />
              <p className="text-xs font-bold text-[#1E4632]">{t.noItemsToOrder}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {itemsToOrder.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4DFD2] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#262421]">{item.name}</span>
                      {item.spoilQuickly && (
                        <span className="text-[9px] font-bold bg-[#FBF0D9] text-[#9A7016] px-1 py-0.2 rounded-sm">
                          {lang === 'hi' ? 'ताज़ा' : lang === 'pa' ? 'ਤਾਜ਼ਾ' : 'Perishable'}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#726C60] mt-0.5">
                      {item.packetSize && item.packetSize > 1 ? (
                        <span>
                          <strong className="text-[#1E4632]">{item.packets}</strong> {t.orderPacketCalculation}{' '}
                          {item.packetSize} = <strong>{item.neededQuantity}</strong> {item.unit} {t.unitsTotal}
                        </span>
                      ) : (
                        <span>
                          <strong className="text-[#1E4632]">{item.neededQuantity}</strong> {item.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity adjustments */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-[#E4DFD2] rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => handleUpdatePackets(item.id, -1)}
                        className="px-2 py-1 text-xs font-bold text-[#726C60] hover:bg-[#FAF7F0]"
                      >
                        -
                      </button>
                      <span className="px-2 py-1 text-xs font-bold text-[#1E4632] min-w-[24px] text-center">
                        {item.packets}
                      </span>
                      <button
                        onClick={() => handleUpdatePackets(item.id, 1)}
                        className="px-2 py-1 text-xs font-bold text-[#726C60] hover:bg-[#FAF7F0]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-[#726C60] hover:text-[#C1443B] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WhatsApp Text Preview Box */}
          {itemsToOrder.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-[#E4DFD2] text-[11px] text-[#726C60] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
              {generateOrderText()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E4DFD2] bg-[#FAF7F0] grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyText}
            disabled={itemsToOrder.length === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#2F6B4F] text-[#2F6B4F] text-xs font-bold hover:bg-[#E7F0EA] disabled:opacity-40 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#2F6B4F]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.copiedNotice : t.copyListBtn}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={itemsToOrder.length === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] disabled:opacity-40 transition cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>{t.sendWhatsAppBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
