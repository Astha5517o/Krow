import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Zap,
  Moon,
  Camera,
  ClipboardList,
  Edit2,
  Trash2,
  AlertCircle,
  Package,
  RefreshCw,
  Sparkles,
  Check,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { StockItem } from '../types';
import { getCategoriesByShopType, CategoryDef } from '../data/categories';
import { useBackHandler } from '../hooks/useBackHandler';

interface StockScreenProps {
  onOpenNightCount: () => void;
  onOpenScanBill: () => void;
  onOpenOrderList: () => void;
  prefillName?: string | null;
  onClearPrefill?: () => void;
}

export const StockScreen: React.FC<StockScreenProps> = ({
  onOpenNightCount,
  onOpenScanBill,
  onOpenOrderList,
  prefillName,
  onClearPrefill,
}) => {
  const { items, profile, addItem, updateItem, deleteItem, quickSell } = useShop();
  const lang = profile?.language || 'hi';
  const shopType = profile?.shopType || 'general_store';
  const t = getTranslation(lang);

  const categories = useMemo(() => getCategoriesByShopType(shopType), [shopType]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State for Add / Edit Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'general_items');
  const [unit, setUnit] = useState('packet');
  const [quantity, setQuantity] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [buyPrice, setBuyPrice] = useState('20');
  const [sellPrice, setSellPrice] = useState('25');
  const [packetSize, setPacketSize] = useState('');
  const [spoilQuickly, setSpoilQuickly] = useState(false);
  const [exchangeableOnSpoil, setExchangeableOnSpoil] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick sell custom qty modal
  const [quickSellItem, setQuickSellItem] = useState<StockItem | null>(null);
  const [customSellQty, setCustomSellQty] = useState('1');

  // Back button dismisses modals without restarting app
  useBackHandler(isModalOpen, () => {
    setIsModalOpen(false);
    setEditingItem(null);
  }, 'stockAddEditModal');
  useBackHandler(quickSellItem !== null, () => setQuickSellItem(null), 'stockQuickSellModal');

  // Handle prefill from voice or external action
  React.useEffect(() => {
    if (prefillName) {
      setEditingItem(null);
      setName(prefillName);
      setCategory(categories[0]?.id || 'general_items');
      setUnit('packet');
      setQuantity('12');
      setReorderLevel('4');
      setBuyPrice('20');
      setSellPrice('25');
      setPacketSize('');
      setSpoilQuickly(false);
      setExchangeableOnSpoil(false);
      setIsModalOpen(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillName, categories, onClearPrefill]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory(categories[0]?.id || 'general_items');
    setUnit('packet');
    setQuantity('10');
    setReorderLevel('4');
    setBuyPrice('');
    setSellPrice('');
    setPacketSize('');
    setSpoilQuickly(false);
    setExchangeableOnSpoil(false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setQuantity(item.quantity.toString());
    setReorderLevel(item.reorderLevel.toString());
    setBuyPrice(item.buyPrice.toString());
    setSellPrice(item.sellPrice.toString());
    setPacketSize(item.packetSize ? item.packetSize.toString() : '');
    setSpoilQuickly(item.spoilQuickly);
    setExchangeableOnSpoil(item.exchangeableOnSpoil);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter an item name');
      return;
    }
    const numQty = parseFloat(quantity) || 0;
    const numReorder = parseFloat(reorderLevel) || 0;
    const numBuy = parseFloat(buyPrice) || 0;
    const numSell = parseFloat(sellPrice) || 0;
    const numPacketSize = packetSize.trim() ? parseInt(packetSize, 10) : undefined;

    if (numSell < numBuy) {
      // friendly warning
      if (!confirm('Selling price is lower than buy price. Are you sure?')) {
        return;
      }
    }

    if (editingItem) {
      updateItem(editingItem.id, {
        name: name.trim(),
        category,
        unit: unit.trim() || 'piece',
        quantity: numQty,
        reorderLevel: numReorder,
        buyPrice: numBuy,
        sellPrice: numSell,
        packetSize: numPacketSize && numPacketSize > 1 ? numPacketSize : undefined,
        spoilQuickly,
        exchangeableOnSpoil: spoilQuickly ? exchangeableOnSpoil : false,
      });
    } else {
      addItem({
        name: name.trim(),
        category,
        unit: unit.trim() || 'piece',
        quantity: numQty,
        reorderLevel: numReorder,
        buyPrice: numBuy,
        sellPrice: numSell,
        packetSize: numPacketSize && numPacketSize > 1 ? numPacketSize : undefined,
        spoilQuickly,
        exchangeableOnSpoil: spoilQuickly ? exchangeableOnSpoil : false,
      });
    }

    setIsModalOpen(false);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="space-y-3 pb-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1E4632] tracking-tight">{t.navStock}</h2>
          <p className="text-xs text-[#726C60]">
            {items.length} {lang === 'hi' ? 'सामान दर्ज हैं' : lang === 'pa' ? 'ਸਮਾਨ ਦਰਜ ਹਨ' : 'items in inventory'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Scan Bill Button */}
          <button
            onClick={onOpenScanBill}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#2F6B4F] text-[#2F6B4F] text-xs font-bold hover:bg-[#E7F0EA] transition cursor-pointer"
            title="Scan Purchase Bill with AI"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.scanBillAction}</span>
            <Sparkles className="w-2.5 h-2.5 text-[#D9A62E]" />
          </button>

          {/* Night Count Button */}
          <button
            onClick={onOpenNightCount}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D9A62E] text-[#9A7016] text-xs font-bold hover:bg-[#FBF0D9] transition cursor-pointer"
            title="Batch count remaining stock at closing"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.nightCountAction}</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addItemBtn}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#726C60] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[#E4DFD2] bg-white text-xs sm:text-sm text-[#262421] placeholder:text-[#A29C8E] focus:border-[#1E4632] focus:outline-hidden shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#726C60] hover:text-[#262421]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#1E4632] text-white'
              : 'bg-white border border-[#E4DFD2] text-[#726C60] hover:text-[#262421]'
          }`}
        >
          {t.allCategories} ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#1E4632] text-white'
                  : 'bg-white border border-[#E4DFD2] text-[#726C60] hover:text-[#262421]'
              }`}
            >
              {cat.name[lang] || cat.name.en} ({count})
            </button>
          );
        })}
      </div>

      {/* Stock Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[#E4DFD2] text-center text-[#726C60] space-y-3">
          <Package className="w-10 h-10 mx-auto text-[#726C60]/40" />
          <p className="text-sm font-semibold text-[#262421]">
            {searchQuery
              ? lang === 'hi'
                ? 'कोई सामान नहीं मिला'
                : 'No items match your search'
              : lang === 'hi'
              ? 'दुकान में कोई सामान नहीं है'
              : 'No items in this category'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addItemBtn}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const margin = item.sellPrice - item.buyPrice;
            const marginPct = item.buyPrice > 0 ? Math.round((margin / item.buyPrice) * 100) : 0;
            const isLowStock = item.quantity <= item.reorderLevel;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E4DFD2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left info */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-[#262421]">{item.name}</h3>

                    {/* Spoil tag */}
                    {item.spoilQuickly && (
                      <span className="text-[10px] font-bold bg-[#FBF0D9] text-[#9A7016] px-1.5 py-0.2 rounded-md">
                        {item.exchangeableOnSpoil
                          ? lang === 'hi'
                            ? 'जल्दी ख़राब • सप्लायर बदलेगा'
                            : lang === 'pa'
                            ? 'ਤਾਜ਼ਾ ਮਾਲ • ਵਾਪਸੀ'
                            : 'Perishable • Exchanged'
                          : lang === 'hi'
                          ? 'जल्दी ख़राब • नुक़सान'
                          : lang === 'pa'
                          ? 'ਤਾਜ਼ਾ ਮਾਲ • ਨੁਕਸਾਨ'
                          : 'Perishable • Loss'}
                      </span>
                    )}

                    {/* Packet size badge */}
                    {item.packetSize && item.packetSize > 1 && (
                      <span className="text-[10px] font-bold bg-[#E7F0EA] text-[#1E4632] px-1.5 py-0.2 rounded-md">
                        {item.packetSize} / {lang === 'hi' ? 'गत्ता' : lang === 'pa' ? 'ਡੱਬਾ' : 'pkt'}
                      </span>
                    )}
                  </div>

                  {/* Pricing info */}
                  <div className="flex items-center gap-3 text-xs text-[#726C60]">
                    <span>
                      {t.buyPriceLabel}: <strong>₹{item.buyPrice}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {t.sellPriceLabel}: <strong className="text-[#1E4632]">₹{item.sellPrice}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-[#2F6B4F] font-semibold">
                      +{marginPct}% ({margin >= 0 ? `+₹${margin}` : `-₹${Math.abs(margin)}`})
                    </span>
                  </div>
                </div>

                {/* Right controls: Current stock + Sell actions + Edit */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4DFD2]/60">
                  {/* Stock count badge */}
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1">
                      <span
                        className={`text-base sm:text-lg font-extrabold ${
                          item.quantity <= 0
                            ? 'text-[#C1443B]'
                            : isLowStock
                            ? 'text-[#9A7016]'
                            : 'text-[#1E4632]'
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <span className="text-xs font-semibold text-[#726C60]">{item.unit}</span>
                    </div>
                    <span className="text-[10px] text-[#A29C8E]">
                      {isLowStock ? (
                        <span className="text-[#C1443B] font-bold">
                          {lang === 'hi' ? 'कम बचा है' : lang === 'pa' ? 'ਘੱਟ ਬਚਿਆ' : 'Low stock'}
                        </span>
                      ) : (
                        t.currentStock
                      )}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick Sell 1 Button */}
                    <button
                      onClick={() => quickSell(item.id, 1)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2F6B4F] text-white text-xs font-bold hover:bg-[#1E4632] transition cursor-pointer shadow-xs active:scale-95"
                      title={lang === 'hi' ? '1 बेचें' : lang === 'pa' ? '1 ਵੇਚੋ' : 'Sell 1'}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t.quickSellBtn}</span>
                    </button>

                    {/* Custom Sell Qty Button */}
                    <button
                      onClick={() => {
                        setQuickSellItem(item);
                        setCustomSellQty('2');
                      }}
                      className="px-2 py-1.5 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] text-xs font-bold text-[#726C60] hover:bg-[#E7F0EA] hover:text-[#1E4632] transition cursor-pointer"
                      title={lang === 'hi' ? 'गिनती बेचें' : lang === 'pa' ? 'ਗਿਣਤੀ ਵੇਚੋ' : 'Sell custom qty'}
                    >
                      {t.customSellBtn}
                    </button>

                    {/* Edit item */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-[#726C60] hover:bg-[#E7F0EA] hover:text-[#1E4632] transition cursor-pointer"
                      title={t.editItem}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete item */}
                    <button
                      onClick={() => {
                        if (confirm(`${t.confirmDeletePrompt} "${item.name}"?`)) {
                          deleteItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#726C60] hover:bg-[#F8E6E4] hover:text-[#C1443B] transition cursor-pointer"
                      title={t.deleteItem}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Sell Custom Qty Modal */}
      {quickSellItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-xl border border-[#E4DFD2]">
            <h3 className="font-bold text-sm text-[#1E4632] mb-1">{quickSellItem.name}</h3>
            <p className="text-xs text-[#726C60] mb-4">
              {lang === 'hi' ? 'बिक्री की गिनती लिखें:' : lang === 'pa' ? 'ਵਿਕਰੀ ਦੀ ਗਿਣਤੀ ਲਿਖੋ:' : 'Enter quantity sold:'}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                step="any"
                min="0.1"
                value={customSellQty}
                onChange={(e) => setCustomSellQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-lg font-bold text-center text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
              />
              <span className="text-xs font-bold text-[#726C60]">{quickSellItem.unit}</span>
            </div>

            {/* Price & profit calculation */}
            <div className="bg-[#FAF7F0] p-2.5 rounded-xl text-xs text-[#726C60] mb-4 space-y-1">
              <div className="flex justify-between">
                <span>{lang === 'hi' ? 'बिक्री राशि:' : lang === 'pa' ? 'ਵਿਕਰੀ ਰਕਮ:' : 'Sale Amount:'}</span>
                <strong className="text-[#262421]">
                  ₹{(parseFloat(customSellQty) || 0) * quickSellItem.sellPrice}
                </strong>
              </div>
              <div className="flex justify-between text-[#2F6B4F]">
                <span>{lang === 'hi' ? 'मुनाफ़ा:' : lang === 'pa' ? 'ਮੁਨਾਫ਼ਾ:' : 'Profit:'}</span>
                <strong>
                  +₹{Math.round((parseFloat(customSellQty) || 0) * (quickSellItem.sellPrice - quickSellItem.buyPrice) * 10) / 10}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuickSellItem(null)}
                className="py-2 rounded-xl border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={() => {
                  const qty = parseFloat(customSellQty) || 1;
                  quickSell(quickSellItem.id, qty);
                  setQuickSellItem(null);
                }}
                className="py-2 rounded-xl bg-[#2F6B4F] text-white text-xs font-bold hover:bg-[#1E4632]"
              >
                {lang === 'hi' ? 'बिक्री दर्ज करें' : lang === 'pa' ? 'ਵਿਕਰੀ ਦਰਜ ਕਰੋ' : 'Record Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E4DFD2] my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E4DFD2] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="font-bold text-base text-[#1E4632]">
                {editingItem ? t.editItemTitle : t.addNewItemTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#726C60] hover:bg-[#E4DFD2]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2 rounded-xl bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.itemNameLabel} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    shopType === 'stationery'
                      ? 'e.g. Classmate 4-Line Notebook, Reynolds 045 Blue Pen'
                      : 'e.g. Amul Taaza Milk 500ml, Parle-G 100g, Tata Salt 1kg'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              {/* Category & Custom Unit (Free text) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1">{t.categoryLabel}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] bg-white text-xs font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name[lang] || c.name.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free-text custom unit (MUST NOT BE A FIXED DROPDOWN) */}
                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1 truncate">
                    {lang === 'hi' ? 'नाप (लड्डी/पैकेट/किलो/पीस)' : lang === 'pa' ? 'ਨਾਪ (ਲੱਡੀ/ਪੈਕਟ/ਪੀਸ)' : 'Unit (Free text)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t.unitPlaceholder}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-xs font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stock Quantity & Reorder Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1">{t.currentQtyLabel}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1 truncate">
                    {lang === 'hi' ? 'कितने से कम पर मँगाएं?' : 'Alert below'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Buy Price & Sell Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1">{t.buyPriceLabel} (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E4632] mb-1">{t.sellPriceLabel} (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 rounded-xl border border-[#2F6B4F] text-sm font-bold text-[#1E4632] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Wholesale Packet Size (Optional: e.g. 4 soaps in 1 packet) */}
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4DFD2]">
                <label className="block text-xs font-bold text-[#262421] mb-0.5">{t.packetSizeLabel}</label>
                <p className="text-[11px] text-[#726C60] mb-2">{t.packetSizeHint}</p>
                <input
                  type="number"
                  min="2"
                  value={packetSize}
                  onChange={(e) => setPacketSize(e.target.value)}
                  placeholder="e.g. 4 (sold 1-1, but ordered in 4s), 12, 24"
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] bg-white text-xs font-semibold text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              {/* Two Plain Yes/No Spoilage Questions */}
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4DFD2] space-y-3">
                {/* Question 1: Does it spoil quickly? */}
                <div>
                  <p className="text-xs font-bold text-[#262421] mb-1.5">{t.spoilQuestion1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpoilQuickly(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        spoilQuickly
                          ? 'bg-[#1E4632] text-white border-[#1E4632]'
                          : 'bg-white border-[#E4DFD2] text-[#726C60] hover:bg-[#E7F0EA]'
                      }`}
                    >
                      {spoilQuickly && <Check className="w-3.5 h-3.5" />}
                      <span>{t.optionYes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSpoilQuickly(false);
                        setExchangeableOnSpoil(false);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        !spoilQuickly
                          ? 'bg-[#1E4632] text-white border-[#1E4632]'
                          : 'bg-white border-[#E4DFD2] text-[#726C60] hover:bg-[#E7F0EA]'
                      }`}
                    >
                      {!spoilQuickly && <Check className="w-3.5 h-3.5" />}
                      <span>{t.optionNo}</span>
                    </button>
                  </div>
                </div>

                {/* Question 2: If yes, can it be exchanged or pure loss? */}
                {spoilQuickly && (
                  <div className="pt-2 border-t border-[#E4DFD2]/60 animate-in fade-in">
                    <p className="text-xs font-bold text-[#262421] mb-1.5">{t.spoilQuestion2}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExchangeableOnSpoil(true)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          exchangeableOnSpoil
                            ? 'bg-[#2F6B4F] text-white border-[#2F6B4F]'
                            : 'bg-white border-[#E4DFD2] text-[#726C60] hover:bg-[#E7F0EA]'
                        }`}
                      >
                        {t.optionExchangeable}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExchangeableOnSpoil(false)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          !exchangeableOnSpoil
                            ? 'bg-[#C1443B] text-white border-[#C1443B]'
                            : 'bg-white border-[#E4DFD2] text-[#726C60] hover:bg-[#F8E6E4]'
                        }`}
                      >
                        {t.optionPureLoss}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DFD2] text-xs font-bold text-[#726C60] hover:bg-[#FAF7F0]"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] shadow-xs"
                >
                  {t.saveItemBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
