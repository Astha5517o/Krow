import React, { useState, useMemo } from 'react';
import { StockItem, CartItem, Language } from '../types';
import { playScanBeep, playSuccessChime } from '../utils/audio';

interface LooseWeightSellModalProps {
  language: Language;
  stockItems: StockItem[];
  preselectedItem?: StockItem;
  onAddToCart: (cartItem: CartItem) => void;
  onClose: () => void;
}

export const LooseWeightSellModal: React.FC<LooseWeightSellModalProps> = ({
  language,
  stockItems,
  preselectedItem,
  onAddToCart,
  onClose,
}) => {
  // Find loose or kg items in current stock
  const looseStockOptions = useMemo(() => {
    return stockItems.filter(
      (item) =>
        item.isLooseItem ||
        item.unit === 'किलो' ||
        item.unit.toLowerCase() === 'kg' ||
        item.name.toLowerCase().includes('खुली') ||
        item.name.toLowerCase().includes('नमकीन') ||
        item.name.toLowerCase().includes('भुजिया') ||
        item.name.toLowerCase().includes('सेव')
    );
  }, [stockItems]);

  // Selected or typed item state
  const [selectedStockId, setSelectedStockId] = useState<string>(
    preselectedItem?.id || (looseStockOptions.length > 0 ? looseStockOptions[0].id : 'custom')
  );
  const [customName, setCustomName] = useState<string>(
    preselectedItem ? preselectedItem.name : 'खुली नमकीन / भुजिया'
  );

  const activeStockItem = useMemo(() => {
    if (selectedStockId === 'custom') return undefined;
    return stockItems.find((i) => i.id === selectedStockId);
  }, [selectedStockId, stockItems]);

  // Rate configuration: standard ₹200/kg (= ₹10 per 50g) or derived from activeStockItem
  const initialRatePerKg = useMemo(() => {
    if (activeStockItem?.sellPrice && activeStockItem.sellPrice > 0) {
      if (activeStockItem.unit === 'किलो' || activeStockItem.unit.toLowerCase() === 'kg') {
        return activeStockItem.sellPrice;
      }
      if (activeStockItem.looseRatePer50g) {
        return activeStockItem.looseRatePer50g * 20;
      }
    }
    return 200; // Default ₹200 / kg = ₹10 / 50g
  }, [activeStockItem]);

  const [ratePerKg, setRatePerKg] = useState<number>(initialRatePerKg);
  const [customCostPerKg, setCustomCostPerKg] = useState<number>(
    activeStockItem?.buyPrice && (activeStockItem.unit === 'किलो' || activeStockItem.unit.toLowerCase() === 'kg')
      ? activeStockItem.buyPrice
      : 120 // Default ₹120 / kg wholesale buy price
  );

  // Input states (Weight in grams vs Total rupees)
  const [gramsInput, setGramsInput] = useState<string>('50'); // default 50g as requested
  const [rupeesInput, setRupeesInput] = useState<string>('10'); // default ₹10
  const [portionCount, setPortionCount] = useState<number>(1); // e.g. 1 packet of 50g

  // Sync inputs when grams change
  const handleGramsChange = (newGramsStr: string) => {
    setGramsInput(newGramsStr);
    const g = parseFloat(newGramsStr);
    if (!isNaN(g) && g > 0 && ratePerKg > 0) {
      const computedRs = Math.round((g / 1000) * ratePerKg);
      setRupeesInput(String(computedRs));
    }
  };

  // Sync inputs when rupees change
  const handleRupeesChange = (newRupeesStr: string) => {
    setRupeesInput(newRupeesStr);
    const rs = parseFloat(newRupeesStr);
    if (!isNaN(rs) && rs > 0 && ratePerKg > 0) {
      const computedGrams = Math.round((rs / ratePerKg) * 1000);
      setGramsInput(String(computedGrams));
    }
  };

  // Quick portion select helper
  const handleSelectQuickWeight = (grams: number) => {
    playScanBeep();
    setGramsInput(String(grams));
    const computedRs = Math.round((grams / 1000) * ratePerKg);
    setRupeesInput(String(computedRs));
  };

  // Quick rupee select helper
  const handleSelectQuickRupees = (rs: number) => {
    playScanBeep();
    setRupeesInput(String(rs));
    const computedGrams = Math.round((rs / ratePerKg) * 1000);
    setGramsInput(String(computedGrams));
  };

  // Calculations
  const finalGrams = parseFloat(gramsInput) || 0;
  const unitSellPrice = parseFloat(rupeesInput) || 0;
  const totalBill = unitSellPrice * portionCount;

  // Wholesale cost calculation
  const effectiveCostPerKg = activeStockItem?.buyPrice
    ? activeStockItem.unit === 'किलो' || activeStockItem.unit.toLowerCase() === 'kg'
      ? activeStockItem.buyPrice
      : customCostPerKg
    : customCostPerKg;

  const costPerPortion = (finalGrams / 1000) * effectiveCostPerKg;
  const totalCost = Math.round(costPerPortion * portionCount * 10) / 10;
  const netProfit = Math.max(0, Math.round((totalBill - totalCost) * 10) / 10);
  const profitMarginPercent =
    totalBill > 0 ? Math.round(((totalBill - totalCost) / totalBill) * 100) : 0;

  // Quantity in kg to deduct from stock (3 decimal places precision)
  const totalKgToDeduct = Math.round(((finalGrams * portionCount) / 1000) * 1000) / 1000;

  // Remaining stock calculation
  const currentStockKg = activeStockItem?.currentQuantity ?? 0;
  const remainingStockKg = Math.max(0, Math.round((currentStockKg - totalKgToDeduct) * 1000) / 1000);

  // Submit to Cart
  const handleConfirmAddToCart = () => {
    if (finalGrams <= 0 || unitSellPrice <= 0) return;

    playSuccessChime();

    const weightLabel =
      finalGrams >= 1000
        ? `${(finalGrams / 1000).toFixed(2).replace(/\.00$/, '')} किलो`
        : `${finalGrams} ग्राम`;

    const portionLabel =
      portionCount > 1
        ? `${portionCount} × ${weightLabel} (₹${unitSellPrice} प्रति)`
        : `${weightLabel}`;

    const displayName = activeStockItem
      ? `${activeStockItem.name}`
      : customName.trim() || 'खुली नमकीन';

    const cartItemData: CartItem = {
      item: activeStockItem || {
        id: 'loose-' + Date.now(),
        name: displayName,
        category: 'बिस्कुट व नमकीन',
        unit: 'किलो',
        currentQuantity: 999,
        reorderLevel: 1,
        buyPrice: Math.round(effectiveCostPerKg),
        sellPrice: Math.round(ratePerKg),
        isLooseItem: true,
        isPerishable: false,
        exchangeType: 'none',
        createdAt: new Date().toISOString(),
      },
      // If linked to stock item with kg, deduct exact kg (e.g. 0.05 kg for 50g)
      quantity: activeStockItem ? totalKgToDeduct : portionCount,
      sellPrice: unitSellPrice,
      buyPrice: costPerPortion,
      lineTotal: totalBill,
      lineProfit: netProfit,
      customName: `${displayName} (${portionLabel})`,
      weightGrams: finalGrams * portionCount,
      weightDisplay: portionLabel,
      isLooseSold: true,
    };

    onAddToCart(cartItemData);
    onClose();
  };

  return (
    <div
      id="loose-weight-modal-overlay"
      className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
    >
      <div
        id="loose-weight-modal-card"
        className="max-w-lg w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl flex flex-col overflow-hidden animate-scale-up max-h-[92vh]"
      >
        {/* HEADER */}
        <div className="px-4 py-3 bg-white border-b border-[#E4DFD2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F0EA] border border-[#2F6B4F]/30 text-[#1E4632] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">scale</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#262421] leading-tight">
                  {language === 'en' ? 'Open & Loose Weight Billing' : 'खुली नमकीन व वजन बिक्री'}
                </h2>
                <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                  50g = ₹10
                </span>
              </div>
              <p className="text-[11px] text-[#726C60] leading-none mt-0.5">
                {language === 'en'
                  ? 'Sell by weight (e.g. 50g for ₹10) from wholesale bulk pack'
                  : 'थोक पैकेट से खुला तौलकर 50g, 100g या रुपये अनुसार तुरंत बेचें'}
              </p>
            </div>
          </div>

          <button
            id="close-loose-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F0] text-[#726C60] hover:text-[#262421] hover:bg-[#EAE4D7] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* 1. Item Selection: Choose existing bulk item or custom */}
          <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-[#262421] flex items-center justify-between">
              <span>{language === 'en' ? 'Item to Sell' : 'सामान चुनें (थोक पैकेट)'}</span>
              {activeStockItem && (
                <span className="text-[11px] text-[#2F6B4F] font-semibold">
                  स्टॉक में शेष: {activeStockItem.currentQuantity} {activeStockItem.unit}
                </span>
              )}
            </label>

            {looseStockOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {looseStockOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedStockId(item.id);
                      if (item.unit === 'किलो' || item.unit.toLowerCase() === 'kg') {
                        setRatePerKg(item.sellPrice);
                        setCustomCostPerKg(item.buyPrice);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                      selectedStockId === item.id
                        ? 'bg-[#1E4632] text-white shadow-xs'
                        : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#4A453C] hover:bg-[#EAE4D7]'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-80 font-mono">
                      ({item.currentQuantity} {item.unit})
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedStockId('custom')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedStockId === 'custom'
                      ? 'bg-[#1E4632] text-white'
                      : 'bg-[#FAF7F0] border border-[#E4DFD2] text-[#4A453C] hover:bg-[#EAE4D7]'
                  }`}
                >
                  + अन्य खुला सामान
                </button>
              </div>
            )}

            {selectedStockId === 'custom' && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="जैसे: खुली नमकीन, रतलामी सेव, रोस्टेड मूंगफली"
                className="w-full h-10 px-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs text-[#262421] font-bold focus:outline-none focus:border-[#2F6B4F]"
              />
            )}

            {/* Rate Adjustment Bar */}
            <div className="pt-1.5 border-t border-[#E4DFD2] flex items-center justify-between text-xs text-[#726C60]">
              <span className="flex items-center gap-1">
                <span>बिक्री दर आधार:</span>
                <span className="font-extrabold text-[#1E4632]">
                  ₹{(ratePerKg / 20).toFixed(0)} प्रति 50g (₹{ratePerKg}/किलो)
                </span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[11px]">दर बदलें:</span>
                <input
                  type="number"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-16 h-7 px-1.5 text-center font-bold text-xs rounded-lg border border-[#E4DFD2] bg-[#FAF7F0]"
                  title="प्रति किलो बिक्री दर"
                />
                <span className="text-[11px]">₹/kg</span>
              </div>
            </div>
          </div>

          {/* 2. QUICK 1-TAP PORTIONS (FAST PRESETS) */}
          <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#262421] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-700">bolt</span>
                <span>{language === 'en' ? 'Quick 1-Tap Portions' : 'त्वरित 1-क्लिक वजन व रुपये चयन'}</span>
              </span>
              <span className="text-[10px] text-[#726C60]">टैप करते ही गणना होगी</span>
            </div>

            {/* Top Row: Most common Weights */}
            <div>
              <div className="text-[10px] text-[#726C60] font-semibold mb-1">
                {language === 'en' ? 'By Grams Weight:' : 'वजन (ग्राम) अनुसार:'}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {[
                  { g: 50, label: '50 ग्राम (₹10)', popular: true },
                  { g: 100, label: '100 ग्राम (₹20)' },
                  { g: 150, label: '150 ग्राम (₹30)' },
                  { g: 200, label: '200 ग्राम (₹40)' },
                  { g: 250, label: '250g / 1 पाव (₹50)' },
                  { g: 500, label: '500g / आधा किलो' },
                  { g: 1000, label: '1 किलो (₹200)' },
                ].map((preset) => {
                  const isSelected = finalGrams === preset.g;
                  return (
                    <button
                      key={preset.g}
                      type="button"
                      onClick={() => handleSelectQuickWeight(preset.g)}
                      className={`p-2 rounded-xl text-left border transition-all active:scale-95 flex flex-col justify-between min-h-[46px] ${
                        isSelected
                          ? 'bg-[#1E4632] text-white border-[#1E4632] shadow-xs'
                          : preset.popular
                          ? 'bg-[#E7F0EA] border-[#2F6B4F] text-[#1E4632] hover:bg-[#D5E6DA]'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#262421] hover:bg-[#EAE4D7]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-extrabold">{preset.g} ग्राम</span>
                        {preset.popular && !isSelected && (
                          <span className="text-[8px] bg-amber-500 text-white font-bold px-1 rounded">
                            खास
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold mt-0.5">
                        ₹{Math.round((preset.g / 1000) * ratePerKg)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: By Rupees ("10 rupaye ki namkeen de do") */}
            <div className="pt-2 border-t border-[#E4DFD2]">
              <div className="text-[10px] text-[#726C60] font-semibold mb-1">
                {language === 'en' ? 'By Rupee Demand ("Give ₹10 namkeen"):' : 'रुपये की मांग अनुसार ("₹10 की नमकीन"): '}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[10, 20, 30, 40, 50, 100].map((rs) => {
                  const isSelected = unitSellPrice === rs;
                  const g = Math.round((rs / ratePerKg) * 1000);
                  return (
                    <button
                      key={rs}
                      type="button"
                      onClick={() => handleSelectQuickRupees(rs)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#7a5900] text-white border-[#7a5900] shadow-xs'
                          : 'bg-[#FAF7F0] border-[#E4DFD2] text-[#4A453C] hover:bg-[#FBF0D9]'
                      }`}
                    >
                      <span>₹{rs} की</span>
                      <span className="text-[10px] opacity-80">({g}g)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. TWO-WAY INTERACTIVE CALCULATOR */}
          <div className="bg-white rounded-2xl border border-[#E4DFD2] p-3 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-[#262421] block">
              {language === 'en' ? 'Custom Weight & Price Calculator' : 'वजन व रुपये लाइव कैलकुलेटर'}
            </span>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Grams Input */}
              <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2]">
                <label className="text-[11px] font-bold text-[#726C60] block mb-1">
                  वजन (ग्राम)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    value={gramsInput}
                    onChange={(e) => handleGramsChange(e.target.value)}
                    placeholder="50"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#E4DFD2] bg-white text-base font-extrabold text-[#1E4632] focus:outline-none focus:border-[#2F6B4F]"
                  />
                  <span className="text-xs font-bold text-[#726C60]">ग्राम</span>
                </div>
              </div>

              {/* Rupees Input */}
              <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4DFD2]">
                <label className="text-[11px] font-bold text-[#726C60] block mb-1">
                  बिक्री मूल्य (रुपये)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-base font-extrabold text-[#7a5900]">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={rupeesInput}
                    onChange={(e) => handleRupeesChange(e.target.value)}
                    placeholder="10"
                    className="w-full h-9 px-2.5 rounded-lg border border-[#E4DFD2] bg-white text-base font-extrabold text-[#7a5900] focus:outline-none focus:border-[#7a5900]"
                  />
                </div>
              </div>
            </div>

            {/* Stepper for Multiple Packets of this weight */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E4DFD2]">
              <span className="text-xs text-[#726C60]">
                कितने पैकेट / पुड़िया? (जैसे 50g की 2 पुड़िया)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPortionCount((c) => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-sm text-[#262421] active:scale-90 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center font-extrabold text-xs text-[#1E4632]">
                  {portionCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPortionCount((c) => c + 1)}
                  className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#E4DFD2] font-bold text-sm text-[#262421] active:scale-90 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 4. TRANSPARENT PROFIT & BULK STOCK DEDUCTION SUMMARY */}
          <div className="bg-[#E7F0EA] rounded-2xl border border-[#2F6B4F]/30 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1E4632] flex items-center gap-1">
                <span className="material-symbols-outlined text-base">savings</span>
                <span>दुकानदार का मुनाफ़ा हिसाब:</span>
              </span>
              <span className="text-[11px] bg-[#2F6B4F] text-white font-extrabold px-2 py-0.5 rounded-full">
                {profitMarginPercent}% Margin
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[#2F6B4F]/20">
              <div className="bg-white/70 p-1.5 rounded-xl">
                <span className="text-[10px] text-[#726C60] block">ग्राहक बिल</span>
                <span className="text-sm font-extrabold text-[#262421]">₹{totalBill}</span>
              </div>
              <div className="bg-white/70 p-1.5 rounded-xl">
                <span className="text-[10px] text-[#726C60] block">थोक लागत</span>
                <span className="text-sm font-bold text-[#726C60]">₹{totalCost}</span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-[#2F6B4F]/40 shadow-2xs">
                <span className="text-[10px] text-[#1E4632] block font-bold">शुद्ध मुनाफ़ा</span>
                <span className="text-sm font-extrabold text-[#2F6B4F]">+₹{netProfit}</span>
              </div>
            </div>

            {/* Wholesale Stock Deduction Tracker */}
            {activeStockItem && (
              <div className="pt-1.5 border-t border-[#2F6B4F]/20 flex items-center justify-between text-[11px] text-[#1E4632]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">inventory_2</span>
                  <span>थोक पैकेट कटौती: <strong>{totalKgToDeduct} किलो</strong> ({finalGrams * portionCount}g)</span>
                </span>
                <span>शेष रहेगा: <strong>{remainingStockKg} किलो</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION BUTTON */}
        <div className="p-4 bg-white border-t border-[#E4DFD2] flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[11px] text-[#726C60] block">काउंटर पर देय राशि:</span>
            <span className="text-xl font-extrabold text-[#1E4632] font-display">
              ₹{totalBill}
            </span>
            <span className="text-[11px] text-[#2F6B4F] font-bold ml-1.5">
              (+₹{netProfit} मुनाफ़ा)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-[#E4DFD2] text-[#726C60] hover:text-[#262421] hover:bg-[#FAF7F0] text-xs font-bold transition-all"
            >
              रद्द करें
            </button>
            <button
              id="confirm-add-loose-btn"
              type="button"
              onClick={handleConfirmAddToCart}
              className="px-5 py-2.5 rounded-xl bg-[#1E4632] hover:bg-[#163324] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              <span>काउंटर बिल में जोड़ें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
