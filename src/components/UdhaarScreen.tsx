import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  Clock,
  Trash2,
  X,
  Check,
  AlertCircle,
  Phone,
  MapPin,
  Send,
  Plus,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { getTranslation } from '../i18n/translations';
import { Customer } from '../types';

interface UdhaarScreenProps {
  // Can accept initial customer or trigger
}

export const UdhaarScreen: React.FC<UdhaarScreenProps> = () => {
  const { customers, totalUdhaarOwed, profile, addCustomer, updateCustomer, deleteCustomer, addUdhaarTransaction, showToast } =
    useShop();
  const lang = profile?.language || 'hi';
  const t = getTranslation(lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [addCustError, setAddCustError] = useState('');

  // Transaction Modal (Give credit or receive payment)
  const [txType, setTxType] = useState<'credit_given' | 'payment_received' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txError, setTxError] = useState('');

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const phoneMatch = c.phone.includes(searchQuery.trim());
      return nameMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  // Keep selectedCustomer updated with latest from context
  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find((c) => c.id === selectedCustomer.id) || null;
  }, [customers, selectedCustomer]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      setAddCustError(
        lang === 'hi'
          ? 'ग्राहक का नाम लिखना ज़रूरी है'
          : lang === 'pa'
          ? 'ਗਾਹਕ ਦਾ ਨਾਮ ਜ਼ਰੂਰੀ ਹੈ'
          : 'Customer name is required'
      );
      return;
    }
    const created = addCustomer(newCustName, newCustPhone, newCustAddress);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setAddCustError('');
    setSelectedCustomer(created);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !txType) return;
    const num = parseFloat(txAmount) || 0;
    if (num <= 0) {
      setTxError(
        lang === 'hi'
          ? 'कृपया सही राशि दर्ज करें'
          : lang === 'pa'
          ? 'ਸਹੀ ਰਕਮ ਦਰਜ ਕਰੋ'
          : 'Please enter a valid amount'
      );
      return;
    }

    addUdhaarTransaction(activeCustomer.id, txType, num, txNote);
    setTxType(null);
    setTxAmount('');
    setTxNote('');
    setTxError('');
  };

  // Pre-filled WhatsApp polite reminder message
  const handleSendWhatsAppReminder = (cust: Customer) => {
    const shopName = profile?.shopName || 'Krow Store';
    let message = '';
    if (lang === 'pa') {
      message = `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ ${cust.name}, *${shopName}* ਵੱਲੋਂ ਬੇਨਤੀ ਹੈ ਕਿ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ₹${cust.balance} ਬਾਕੀ ਹਨ। ਜਦੋਂ ਵੀ ਸਮਾਂ ਮਿਲੇ ਕਿਰਪਾ ਕਰਕੇ ਹਿਸਾਬ ਸਾਫ਼ ਕਰ ਦੇਵੋ ਜੀ। ਧੰਨਵਾਦ!`;
    } else if (lang === 'hi') {
      message = `नमस्ते ${cust.name} जी, *${shopName}* से विनम्र अनुरोध है कि आपके खाते में ₹${cust.balance} बाक़ी हैं। सुविधानुसार कृपया हिसाब कर लें। धन्यवाद!`;
    } else {
      message = `Hello ${cust.name}, polite reminder from *${shopName}* regarding outstanding balance of ₹${cust.balance}. Kindly clear at your convenience. Thank you!`;
    }

    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Udhaar Banner */}
      <div className="bg-[#F8E6E4] rounded-2xl p-4 border border-[#C1443B]/20 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#C1443B] uppercase tracking-wider">{t.totalUdhaarOwed}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262421] mt-0.5 tracking-tight">
            ₹{totalUdhaarOwed.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-[#726C60] mt-0.5">
            {customers.filter((c) => c.balance > 0).length} {lang === 'hi' ? 'ग्राहकों का बाक़ी' : 'customers due'}
          </p>
        </div>

        <button
          onClick={() => {
            setAddCustError('');
            setIsAddCustomerOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] transition cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.addCustomerBtn}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#726C60] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchCustomerPlaceholder}
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

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[#E4DFD2] text-center text-[#726C60] space-y-3">
          <p className="text-sm font-semibold text-[#262421]">
            {searchQuery
              ? lang === 'hi'
                ? 'इस नाम का कोई ग्राहक नहीं मिला।'
                : lang === 'pa'
                ? 'ਇਸ ਨਾਮ ਦਾ ਕੋਈ ਗਾਹਕ ਨਹੀਂ ਮਿਲਿਆ।'
                : 'No customers match your search.'
              : lang === 'hi'
              ? 'अभी खाते में कोई ग्राहक नहीं है।'
              : lang === 'pa'
              ? 'ਅਜੇ ਖਾਤੇ ਵਿੱਚ ਕੋਈ ਗਾਹਕ ਨਹੀਂ ਹੈ।'
              : 'No customers in your credit ledger yet.'}
          </p>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addCustomerBtn}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((cust) => {
            const hasDue = cust.balance > 0;

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E4DFD2] shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-[#1E4632]/40 transition group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-[#262421] group-hover:text-[#1E4632] truncate">
                      {cust.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#726C60] mt-0.5">
                    {cust.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#726C60]" />
                        {cust.phone}
                      </span>
                    )}
                    {cust.address && (
                      <span className="truncate hidden sm:inline text-[#A29C8E]">
                        • {cust.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-base sm:text-lg font-extrabold ${
                        hasDue ? 'text-[#C1443B]' : 'text-[#2F6B4F]'
                      }`}
                    >
                      {hasDue ? `₹${cust.balance.toLocaleString('en-IN')}` : t.balanceZero}
                    </span>
                    <p className="text-[10px] text-[#A29C8E]">
                      {hasDue ? t.balanceOwed : (lang === 'hi' ? 'कोई बाक़ी नहीं' : lang === 'pa' ? 'ਕੋਈ ਬਾਕੀ ਨਹੀਂ' : 'No dues')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#726C60] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Ledger Detail Modal */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E4DFD2] my-auto overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E4DFD2] flex items-center justify-between bg-[#1E4632] text-white">
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg truncate">{activeCustomer.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[#FAF7F0]/80 mt-0.5">
                  {activeCustomer.phone && <span>{activeCustomer.phone}</span>}
                  {activeCustomer.address && <span>• {activeCustomer.address}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Outstanding Balance Card */}
            <div className="p-4 bg-[#FAF7F0] border-b border-[#E4DFD2] flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#726C60] uppercase">{t.balanceOwed}</span>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    activeCustomer.balance > 0 ? 'text-[#C1443B]' : 'text-[#2F6B4F]'
                  }`}
                >
                  ₹{activeCustomer.balance.toLocaleString('en-IN')}
                </div>
              </div>

              {/* WhatsApp Reminder Button */}
              {activeCustomer.balance > 0 && (
                <button
                  onClick={() => handleSendWhatsAppReminder(activeCustomer)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.whatsappReminderBtn}</span>
                </button>
              )}
            </div>

            {/* Credit / Payment Action Buttons */}
            <div className="p-3 bg-white border-b border-[#E4DFD2] grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setTxType('credit_given');
                  setTxAmount('');
                  setTxNote('');
                  setTxError('');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F8E6E4] text-[#C1443B] border border-[#C1443B]/30 text-xs font-bold hover:bg-[#C1443B] hover:text-white transition cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{t.giveCreditBtn}</span>
              </button>

              <button
                onClick={() => {
                  setTxType('payment_received');
                  setTxAmount('');
                  setTxNote('');
                  setTxError('');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#E7F0EA] text-[#1E4632] border border-[#2F6B4F]/30 text-xs font-bold hover:bg-[#1E4632] hover:text-white transition cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{t.receivePaymentBtn}</span>
              </button>
            </div>

            {/* Transaction History */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              <h4 className="text-xs font-bold text-[#726C60] uppercase tracking-wider">
                {t.transactionHistoryTitle}
              </h4>

              {activeCustomer.transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#726C60]">
                  {t.noTransactionsYet}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCustomer.transactions.map((tx) => {
                    const isCredit = tx.type === 'credit_given';
                    const dateStr = new Date(tx.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl border border-[#E4DFD2] bg-[#FAF7F0] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit ? 'bg-[#F8E6E4] text-[#C1443B]' : 'bg-[#E7F0EA] text-[#1E4632]'
                            }`}
                          >
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#262421]">
                              {isCredit ? t.creditGivenLabel : t.paymentReceivedLabel}
                            </p>
                            {tx.note && <p className="text-[11px] text-[#726C60]">{tx.note}</p>}
                            <span className="text-[10px] text-[#A29C8E]">{dateStr}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-sm font-extrabold ${
                              isCredit ? 'text-[#C1443B]' : 'text-[#2F6B4F]'
                            }`}
                          >
                            {isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                          </div>
                          <span className="text-[10px] text-[#726C60]">
                            {lang === 'hi' ? 'बाक़ी था:' : lang === 'pa' ? 'ਬਾਕੀ ਸੀ:' : 'Bal:'} ₹{tx.balanceAfter}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Options: Delete customer */}
            <div className="p-3 border-t border-[#E4DFD2] bg-[#FAF7F0] flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(t.deleteCustomerConfirm)) {
                    deleteCustomer(activeCustomer.id);
                    setSelectedCustomer(null);
                  }
                }}
                className="flex items-center gap-1 text-xs text-[#C1443B] hover:text-[#912d26] font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteCustomerBtn}</span>
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-xl border border-[#E4DFD2] text-xs font-bold text-[#726C60] hover:bg-white"
              >
                {lang === 'hi' ? 'बंद करें' : lang === 'pa' ? 'ਬੰਦ ਕਰੋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Credit / Receive Payment Sub-Modal */}
      {txType && activeCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E4DFD2]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-[#1E4632]">
                {txType === 'credit_given' ? t.creditGivenLabel : t.paymentReceivedLabel}
              </h3>
              <button onClick={() => setTxType(null)} className="text-[#726C60] hover:text-[#262421]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#726C60] mb-4">
              {activeCustomer.name} (
              {lang === 'hi' ? 'मौजूदा बाक़ी:' : lang === 'pa' ? 'ਮੌਜੂਦਾ ਬਾਕੀ:' : 'Current due:'} ₹{activeCustomer.balance})
            </p>

            <form onSubmit={handleSaveTransaction} className="space-y-3">
              {txError && (
                <div className="p-2 rounded-lg bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{txError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.amountLabel} *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  autoFocus
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder={lang === 'hi' ? '₹ राशि' : lang === 'pa' ? '₹ ਰਕਮ' : '₹ Amount'}
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-lg font-bold text-[#1E4632] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.noteLabel}</label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={
                    txType === 'credit_given'
                      ? lang === 'hi'
                        ? 'जैसे 2 पैकेट दूध + 1 ब्रेड'
                        : lang === 'pa'
                        ? 'ਜਿਵੇਂ 2 ਪੈਕਟ ਦੁੱਧ + 1 ਬ੍ਰੈੱਡ'
                        : 'e.g. 2 Milk + 1 Bread'
                      : lang === 'hi'
                      ? 'जैसे नकद जमा किया, ऑनलाइन मिला'
                      : lang === 'pa'
                      ? 'ਜਿਵੇਂ ਨਕਦ ਮਿਲਿਆ, ਆਨਲਾਈਨ ਮਿਲਿਆ'
                      : 'e.g. Cash payment'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-xs text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTxType(null)}
                  className="py-2.5 rounded-xl border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className={`py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${
                    txType === 'credit_given' ? 'bg-[#C1443B] hover:bg-[#a93a32]' : 'bg-[#1E4632] hover:bg-[#2F6B4F]'
                  }`}
                >
                  {lang === 'hi' ? 'खाते में जोड़ें' : lang === 'pa' ? 'ਖਾਤੇ \'ਚ ਜੋੜੋ' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E4DFD2]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-[#1E4632]">{t.addCustomerBtn}</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-[#726C60] hover:text-[#262421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              {addCustError && (
                <div className="p-2 rounded-lg bg-[#F8E6E4] text-[#C1443B] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addCustError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.customerName} *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'जैसे: रमेश वर्मा (वर्मा जी)'
                      : lang === 'pa'
                      ? 'ਜਿਵੇਂ: ਰਮੇਸ਼ ਵਰਮਾ (ਵਰਮਾ ਜੀ)'
                      : 'e.g. Ramesh Verma'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.customerPhone}</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? '10 अंकों का मोबाइल नंबर'
                      : lang === 'pa'
                      ? '10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ'
                      : '10-digit mobile number'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">{t.customerAddress}</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'गली नंबर, मकान या निशानी'
                      : lang === 'pa'
                      ? 'ਗਲੀ ਨੰਬਰ, ਮਕਾਨ ਜਾਂ ਨਿਸ਼ਾਨੀ'
                      : 'House / Street / Landmark'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E4DFD2] text-sm text-[#262421] focus:border-[#1E4632] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="py-2.5 rounded-xl border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#1E4632] text-white text-xs font-bold hover:bg-[#2F6B4F] shadow-md"
                >
                  {lang === 'hi' ? 'ग्राहक जोड़ें' : lang === 'pa' ? 'ਗਾਹਕ ਜੋੜੋ' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
