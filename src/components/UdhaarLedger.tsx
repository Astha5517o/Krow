import React, { useState, useMemo } from 'react';
import { Customer, CustomerTransaction, Language } from '../types';
import { translations } from '../translations';
import { getCustomerUdhaarStats, getAggregateUdhaarStats } from '../utils/udhaarUtils';
import { CalculationInfoModal, CalculationInfoData } from './CalculationInfoModal';

interface UdhaarLedgerProps {
  language: Language;
  customers: Customer[];
  transactions: Record<string, CustomerTransaction[]>;
  onAddTransaction: (customerId: string, type: 'credit' | 'payment', amount: number, note: string) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const UdhaarLedger: React.FC<UdhaarLedgerProps> = ({
  language,
  customers,
  transactions,
  onAddTransaction,
  onAddCustomer,
  onDeleteCustomer,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high' | 'old'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // Progressive disclosure calculation info modal
  const [activeCalculationInfo, setActiveCalculationInfo] = useState<CalculationInfoData | null>(null);

  // Modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState<'credit' | 'payment' | null>(null);

  // New customer form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState('');

  // Transaction form state
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');

  // Aggregate stats across all customers
  const aggregateStats = useMemo(() => {
    return getAggregateUdhaarStats(customers, transactions);
  }, [customers, transactions]);

  const collectedThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    let total = 0;
    Object.keys(transactions).forEach((custKey) => {
      const txList = transactions[custKey];
      if (Array.isArray(txList)) {
        txList.forEach((t) => {
          if (t.type === 'payment' && (!t.timestamp || t.timestamp >= oneWeekAgo)) {
            total += Number(t.amount) || 0;
          }
        });
      }
    });
    return total > 0 ? total : aggregateStats.totalMarketPaymentsEver;
  }, [transactions, aggregateStats.totalMarketPaymentsEver]);

  const totalMarketUdhaar = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch =
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.phone.includes(searchQuery) ||
        (cust.address && cust.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'high') {
        return cust.balance >= 2000;
      }
      if (filterType === 'old') {
        const thirtyDaysAgo = Date.now() - 30 * 86400000;
        return new Date(cust.createdAt).getTime() <= thirtyDaysAgo;
      }

      return true;
    });
  }, [customers, searchQuery, filterType]);

  // Selected customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  const activeCustomerTransactions = useMemo(() => {
    if (!activeCustomer) return [];
    return transactions[activeCustomer.id] || [];
  }, [transactions, activeCustomer]);

  const activeCustStats = useMemo(() => {
    if (!activeCustomer) return null;
    return getCustomerUdhaarStats(activeCustomer, activeCustomerTransactions);
  }, [activeCustomer, activeCustomerTransactions]);

  // Send WhatsApp reminder
  const handleSendReminder = (cust: Customer) => {
    const text =
      language === 'pa'
        ? `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ${cust.name} ਜੀ, ਤੁਹਾਡੇ ਵੱਲੋਂ ਦੁਕਾਨ ਦਾ ਕੁੱਲ ਬਕਾਇਆ ਉਧਾਰ ₹${cust.balance.toLocaleString('en-IN')} ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਜਲਦੀ ਭੁਗਤਾਨ ਕਰਨ ਦੀ ਕ੍ਰਿਪਾਲਤਾ ਕਰੋ ਜੀ। ਧੰਨਵਾਦ! — Krow`
        : language === 'en'
        ? `Hello ${cust.name}, this is a gentle reminder that your pending balance at the shop is ₹${cust.balance.toLocaleString('en-IN')}. Kindly clear it at your earliest convenience. Thank you!`
        : `नमस्ते ${cust.name} जी, आपकी दुकान पर कुल बकाया उधारी ₹${cust.balance.toLocaleString('en-IN')} है। कृपया समय निकालकर हिसाब चुकता कर दें। धन्यवाद! — Krow`;

    const encoded = encodeURIComponent(text);
    const phoneClean = cust.phone.replace(/\D/g, '');
    const phoneWithCountry = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !showTransactionModal) return;

    const numAmount = parseFloat(txAmount);
    if (!numAmount || numAmount <= 0) return;

    onAddTransaction(
      activeCustomer.id,
      showTransactionModal,
      numAmount,
      txNote.trim() || (showTransactionModal === 'credit' ? 'उधार सामान' : 'नकद जमा')
    );

    setTxAmount('');
    setTxNote('');
    setShowTransactionModal(null);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    onAddCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '9800000000',
      address: newCustAddress.trim() || undefined,
      balance: parseFloat(newCustBalance) || 0,
      lastTransactionDate: 'आज',
      lastTransactionAmount: parseFloat(newCustBalance) || 0,
      lastTransactionType: (parseFloat(newCustBalance) || 0) > 0 ? 'credit' : undefined,
    });

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustBalance('');
    setShowAddCustomerModal(false);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fade-in">
      {/* 1. Market Udhaar Summary Card (Stitch Screen 14) */}
      <div className="bg-white border border-[#E4DFD2] rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#726C60] uppercase tracking-wide">
            {t.udhaarTotalMarketTitle}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E7F0EA] text-[#1E4632] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              <span>{t.udhaarRepaidBadge(aggregateStats.aggregateRepaidPercent)}</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setActiveCalculationInfo({
                  type: 'udhaarRepaid',
                  title: t.infoUdhaarRepaidTitle,
                  formula: `(कुल जमा रकम ÷ कुल दिया गया उधार) × 100`,
                  explanation: t.infoUdhaarRepaidDesc,
                  statsBreakdown: [
                    {
                      label: language === 'en' ? 'Total Payments Received' : 'कुल जमा रकम',
                      value: `₹${aggregateStats.totalMarketPaymentsEver.toLocaleString('en-IN')}`,
                      color: 'text-[#2F6B4F]',
                    },
                    {
                      label: language === 'en' ? 'Total Credit Ever Given' : 'कुल दिया गया उधार',
                      value: `₹${aggregateStats.totalMarketCreditEver.toLocaleString('en-IN')}`,
                    },
                    {
                      label: language === 'en' ? 'Pending Balance to Collect' : 'वसूलना बाकी',
                      value: `₹${aggregateStats.totalPendingBalance.toLocaleString('en-IN')}`,
                      color: 'text-[#C1443B]',
                    },
                    {
                      label: language === 'en' ? 'Repaid Rate' : 'वसूली दर',
                      value: `${aggregateStats.aggregateRepaidPercent}%`,
                      color: 'text-[#2F6B4F]',
                    },
                  ],
                  example:
                    language === 'en'
                      ? `E.g., Out of ₹${aggregateStats.totalMarketCreditEver.toLocaleString('en-IN')} total credit ever given, ₹${aggregateStats.totalMarketPaymentsEver.toLocaleString('en-IN')} has been repaid (${aggregateStats.aggregateRepaidPercent}%).`
                      : `उदाहरण: अब तक दिए गए ₹${aggregateStats.totalMarketCreditEver.toLocaleString('en-IN')} के कुल उधार में से ₹${aggregateStats.totalMarketPaymentsEver.toLocaleString('en-IN')} वापस मिल चुके हैं (${aggregateStats.aggregateRepaidPercent}%)।`,
                })
              }
              className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 text-[#726C60] hover:text-[#2F6B4F] flex items-center justify-center transition-colors text-xs"
              aria-label="गणना सूत्र देखें"
              title="हिसाब समझें"
            >
              <span className="material-symbols-outlined text-[13px]">info</span>
            </button>
          </div>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold text-[#C1443B] tracking-tight font-display">
          ₹{totalMarketUdhaar.toLocaleString('en-IN')}
        </div>

        {/* Repayment Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#FAF7F0] h-2 rounded-full overflow-hidden border border-[#E4DFD2]">
            <div
              className="bg-[#2F6B4F] h-full rounded-full transition-all duration-500"
              style={{ width: `${aggregateStats.aggregateRepaidPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#726C60]">
            <span>
              {language === 'en'
                ? `₹${aggregateStats.totalMarketPaymentsEver.toLocaleString('en-IN')} collected of ₹${aggregateStats.totalMarketCreditEver.toLocaleString('en-IN')} total credit`
                : `₹${aggregateStats.totalMarketPaymentsEver.toLocaleString('en-IN')} वसूल / ₹${aggregateStats.totalMarketCreditEver.toLocaleString('en-IN')} कुल उधार`}
            </span>
            <span className="font-bold text-[#1E4632]">{aggregateStats.aggregateRepaidPercent}%</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E4DFD2] flex items-center justify-between text-xs text-[#726C60]">
          <span>{customers.length} {t.regularCustomersLabel}</span>
          <span className="font-bold text-[#2F6B4F]">{t.collectedThisWeek}: ₹{collectedThisWeek.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 2. Search & Voice Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#726C60] text-xl">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchCustomerPlaceholder}
          className="w-full h-12 pl-11 pr-11 rounded-2xl bg-white border border-[#E4DFD2] text-sm text-[#262421] placeholder-[#A29C8E] focus:outline-none focus:border-[#2F6B4F] shadow-2xs"
        />
        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#726C60] text-xl cursor-pointer hover:text-[#2F6B4F]">
          mic
        </span>
      </div>

      {/* 3. Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <button
          onClick={() => setFilterType('all')}
          className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            filterType === 'all'
              ? 'bg-[#2F6B4F] text-white shadow-2xs'
              : 'bg-white border border-[#E4DFD2] text-[#726C60]'
          }`}
          type="button"
        >
          <span>{t.filterAllCustomers} ({customers.length})</span>
        </button>

        <button
          onClick={() => setFilterType('high')}
          className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            filterType === 'high'
              ? 'bg-[#C1443B] text-white shadow-2xs'
              : 'bg-white border border-[#E4DFD2] text-[#726C60]'
          }`}
          type="button"
        >
          <span>{t.filterHighCredit} (₹2,000+)</span>
        </button>

        <button
          onClick={() => setFilterType('old')}
          className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            filterType === 'old'
              ? 'bg-[#D9A62E] text-white shadow-2xs'
              : 'bg-white border border-[#E4DFD2] text-[#726C60]'
          }`}
          type="button"
        >
          <span>{t.filterOlder30Days}</span>
        </button>
      </div>

      {/* 4. Active Customer Ledger Card (Stitch Screen 14) */}
      {activeCustomer && (
        <div className="bg-white rounded-3xl border border-[#E4DFD2] p-4 shadow-sm flex flex-col gap-3">
          {/* Customer Profile Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F0EA] text-[#1E4632] flex items-center justify-center text-xl font-bold font-display flex-shrink-0">
                {activeCustomer.name.charAt(0)}
              </div>

              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-[#262421] truncate">
                  {activeCustomer.name}
                </h3>
                {activeCustomer.address && (
                  <span className="text-xs text-[#726C60] truncate">
                    {activeCustomer.address}
                  </span>
                )}
                <span className="text-xs text-[#A29C8E]">
                  📱 {activeCustomer.phone}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[11px] text-[#726C60] block">
                {t.customerDueLabel}
              </span>
              <span className="text-2xl font-extrabold text-[#C1443B] font-display">
                ₹{activeCustomer.balance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Active Customer Repayment Transparency Row */}
          {activeCustStats && (
            <div className="bg-[#FAF7F0] border border-[#E4DFD2] rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E4632] bg-[#E7F0EA] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>{t.udhaarRepaidBadge(activeCustStats.repaidPercent)}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCalculationInfo({
                      type: 'customerRepaid',
                      title:
                        language === 'en'
                          ? `${activeCustomer.name}'s Udhaar Repayment Rate`
                          : `${activeCustomer.name} का उधार वसूली प्रतिशत`,
                      formula: `(जमा ₹${activeCustStats.totalPaymentsEver.toLocaleString(
                        'en-IN'
                      )} ÷ कुल उधार ₹${activeCustStats.totalCreditEver.toLocaleString(
                        'en-IN'
                      )}) × 100`,
                      explanation:
                        language === 'en'
                          ? `${activeCustomer.name} has repaid ₹${activeCustStats.totalPaymentsEver.toLocaleString(
                              'en-IN'
                            )} out of ₹${activeCustStats.totalCreditEver.toLocaleString(
                              'en-IN'
                            )} total credit ever extended (${activeCustStats.repaidPercent}%).`
                          : `${activeCustomer.name} ने अब तक लिए गए कुल ₹${activeCustStats.totalCreditEver.toLocaleString(
                              'en-IN'
                            )} के उधार में से ₹${activeCustStats.totalPaymentsEver.toLocaleString(
                              'en-IN'
                            )} वापस चुका दिए हैं (${activeCustStats.repaidPercent}%)।`,
                      statsBreakdown: [
                        {
                          label:
                            language === 'en'
                              ? 'Total Payments Received'
                              : 'कुल जमा रकम',
                          value: `₹${activeCustStats.totalPaymentsEver.toLocaleString(
                            'en-IN'
                          )}`,
                          color: 'text-[#2F6B4F]',
                        },
                        {
                          label:
                            language === 'en'
                              ? 'Total Credit Ever Given'
                              : 'कुल दिया गया उधार',
                          value: `₹${activeCustStats.totalCreditEver.toLocaleString(
                            'en-IN'
                          )}`,
                        },
                        {
                          label:
                            language === 'en'
                              ? 'Current Outstanding Due'
                              : 'वर्तमान बकाया',
                          value: `₹${activeCustStats.pendingBalance.toLocaleString(
                            'en-IN'
                          )}`,
                          color: 'text-[#C1443B]',
                        },
                        {
                          label:
                            language === 'en' ? 'Repaid Rate' : 'चुकता दर',
                          value: `${activeCustStats.repaidPercent}%`,
                          color: 'text-[#2F6B4F]',
                        },
                      ],
                    })
                  }
                  className="w-4 h-4 rounded-full bg-black/5 hover:bg-black/10 text-[#726C60] flex items-center justify-center text-xs"
                  aria-label="जानकारी"
                  title="हिसाब समझें"
                >
                  <span className="material-symbols-outlined text-[12px]">info</span>
                </button>
              </div>
              <span className="text-[11px] text-[#726C60]">
                {language === 'en'
                  ? `₹${activeCustStats.totalPaymentsEver.toLocaleString(
                      'en-IN'
                    )} paid / ₹${activeCustStats.totalCreditEver.toLocaleString(
                      'en-IN'
                    )} total`
                  : `₹${activeCustStats.totalPaymentsEver.toLocaleString(
                      'en-IN'
                    )} जमा / ₹${activeCustStats.totalCreditEver.toLocaleString(
                      'en-IN'
                    )} कुल`}
              </span>
            </div>
          )}

          {/* Action Buttons: Add Udhaar, Record Payment, WhatsApp, Call */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setShowTransactionModal('credit')}
              className="h-11 rounded-xl bg-[#F8E6E4] hover:bg-[#fad4d1] text-[#C1443B] border border-[#C1443B]/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation"
              type="button"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{t.btnAddUdhaar}</span>
            </button>

            <button
              onClick={() => setShowTransactionModal('payment')}
              className="h-11 rounded-xl bg-[#E7F0EA] hover:bg-[#d8e8dc] text-[#1E4632] border border-[#2F6B4F]/30 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all touch-manipulation"
              type="button"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{t.btnRecordPayment}</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => handleSendReminder(activeCustomer)}
              className="col-span-4 h-11 rounded-xl bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all touch-manipulation"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>{t.btnRemindWhatsApp}</span>
            </button>

            <a
              href={`tel:${activeCustomer.phone}`}
              className="col-span-1 h-11 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] hover:bg-[#E4DFD2] text-[#262421] flex items-center justify-center active:scale-95 transition-all"
              title="फोन करें"
            >
              <span className="material-symbols-outlined text-xl">call</span>
            </a>
          </div>

          {/* Recent Ledger History */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#E4DFD2]">
            <span className="text-xs font-bold text-[#726C60] uppercase tracking-wide">
              {t.recentLedgerHistory}
            </span>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {activeCustomerTransactions.length === 0 ? (
                <div className="text-xs text-[#A29C8E] py-2 text-center">
                  अभी तक कोई पुराना लेन-देन दर्ज नहीं है।
                </div>
              ) : (
                activeCustomerTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[#262421]">
                          {tx.note}
                        </span>
                        <span className="text-[11px] text-[#A29C8E]">
                          {tx.date}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-extrabold text-sm font-display ${
                            isCredit ? 'text-[#C1443B]' : 'text-[#2F6B4F]'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-[#726C60] block">
                          {isCredit ? 'उधार दिया' : 'रुपये जमा'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Other Customer Accounts List */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-[#726C60] uppercase tracking-wide">
            {t.otherCustomerAccountsTitle}
          </h4>
          <span className="text-xs text-[#A29C8E]">
            {t.sortByAmount}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {filteredCustomers.map((cust) => {
            const isSelected = cust.id === activeCustomer?.id;
            const isOlderThan30 = new Date(cust.createdAt).getTime() <= (Date.now() - 30 * 86400000);

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomerId(cust.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#E7F0EA]/60 border-[#2F6B4F] shadow-2xs'
                    : 'bg-white border-[#E4DFD2] hover:bg-[#FAF7F0]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E4DFD2] text-[#262421] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {cust.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-[#262421] truncate">
                        {cust.name}
                      </span>
                      {isOlderThan30 && (
                        <span className="text-[10px] font-bold text-[#7a5900] bg-[#FBF0D9] px-1.5 py-0.2 rounded-md">
                          30 दिन पुराना
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#726C60] truncate">
                      {cust.address || cust.phone} • {t.lastSeenPrefix} {cust.lastTransactionDate || 'हाल ही में'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-extrabold text-[#C1443B] font-display">
                      ₹{cust.balance.toLocaleString('en-IN')}
                    </span>
                    {(() => {
                      const cStats = getCustomerUdhaarStats(cust, transactions[cust.id] || []);
                      return (
                        <span className="text-[10px] font-bold text-[#1E4632] bg-[#E7F0EA] px-1.5 py-0.2 rounded-md">
                          {cStats.repaidPercent}% {language === 'en' ? 'repaid' : 'चुकता'}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="material-symbols-outlined text-[#726C60] text-lg">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button: Add New Customer */}
      <button
        onClick={() => setShowAddCustomerModal(true)}
        className="fixed bottom-20 right-4 z-30 h-14 px-5 rounded-full bg-[#2F6B4F] hover:bg-[#1E4632] text-white font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all touch-manipulation"
        type="button"
      >
        <span className="material-symbols-outlined text-2xl">person_add</span>
        <span className="text-sm">{t.btnAddNewCustomer}</span>
      </button>

      {/* Modal: Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#262421] font-display">
                {t.newCustomerModalTitle}
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 rounded-full bg-white text-[#726C60] flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.customerNameLabel} *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="जैसे: राकेश शर्मा"
                  required
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.customerPhoneLabel}
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.customerAddressLabel}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="जैसे: मकान नंबर 12, मंदिर के सामने"
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.initialBalanceLabel}
                </label>
                <input
                  type="number"
                  value={newCustBalance}
                  onChange={(e) => setNewCustBalance(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 h-11 rounded-xl bg-white border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#2F6B4F] text-white text-xs font-bold shadow-xs"
                >
                  {t.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Give Credit (+) or Record Payment (-) */}
      {showTransactionModal && activeCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="max-w-md w-full bg-[#FAF7F0] rounded-3xl border border-[#E4DFD2] shadow-2xl p-5 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#262421] font-display">
                {showTransactionModal === 'credit' ? t.recordUdhaarTitle : t.recordPaymentTitle}
              </h3>
              <button
                onClick={() => setShowTransactionModal(null)}
                className="w-8 h-8 rounded-full bg-white text-[#726C60] flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E4DFD2] flex items-center justify-between">
              <span className="text-xs font-bold text-[#262421]">
                {activeCustomer.name}
              </span>
              <span className="text-xs text-[#726C60]">
                मौजूदा बकाया: <strong className="text-[#C1443B]">₹{activeCustomer.balance}</strong>
              </span>
            </div>

            <form onSubmit={handleSaveTransaction} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.amountLabel} *
                </label>
                <input
                  type="number"
                  step="any"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="500"
                  autoFocus
                  required
                  className="w-full h-12 px-3 rounded-xl border border-[#E4DFD2] bg-white text-lg font-bold text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  {t.noteLabel}
                </label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full h-11 px-3 rounded-xl border border-[#E4DFD2] bg-white text-sm text-[#262421] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(null)}
                  className="flex-1 h-12 rounded-xl bg-white border border-[#E4DFD2] text-xs font-bold text-[#726C60]"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className={`flex-1 h-12 rounded-xl text-white text-xs font-bold shadow-xs ${
                    showTransactionModal === 'credit'
                      ? 'bg-[#C1443B] hover:bg-[#a8352d]'
                      : 'bg-[#2F6B4F] hover:bg-[#1E4632]'
                  }`}
                >
                  {t.btnConfirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progressive Disclosure Calculation Info Modal */}
      {activeCalculationInfo && (
        <CalculationInfoModal
          data={activeCalculationInfo}
          language={language}
          onClose={() => setActiveCalculationInfo(null)}
        />
      )}
    </div>
  );
};
