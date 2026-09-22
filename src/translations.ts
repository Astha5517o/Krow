import { Language } from './types';

export interface Translations {
  appName: string;
  appTagline: string;
  appSubBadge: string;
  // Navigation
  navHome: string;
  navStock: string;
  navUdhaar: string;
  // Common Buttons & Actions
  btnContinue: string;
  btnSave: string;
  btnCancel: string;
  btnDelete: string;
  btnEdit: string;
  btnAdd: string;
  btnSell: string;
  btnSendWhatsApp: string;
  btnPrint: string;
  btnRetry: string;
  btnConfirm: string;
  btnConfirmAddToStock: string;
  btnRetakePhoto: string;
  btnUploadBill: string;
  btnTakePhoto: string;
  btnUseSampleBill: string;
  btnSearch: string;
  // Onboarding
  onboardingStep1Title: string;
  onboardingStep1Badge: string;
  onboardingStep2Title: string;
  onboardingStep2Badge: string;
  onboardingTrustTip: string;
  storeTypeKiranaTitle: string;
  storeTypeKiranaDesc: string;
  storeTypeGeneralStoreTitle: string;
  storeTypeGeneralStoreDesc: string;
  storeTypeStationeryTitle: string;
  storeTypeStationeryDesc: string;
  storeTypeUniformTitle: string;
  storeTypeUniformDesc: string;
  storeTypeGiftShopTitle: string;
  storeTypeGiftShopDesc: string;
  storeDropdownLabel: string;
  storeDropdownPlaceholder: string;
  selectedTag: string;
  changeLaterNote: string;
  // Home Dashboard
  todayNetProfit: string;
  growthBadge: string;
  weekNetProfit: string;
  totalStockItems: string;
  availableStock: string;
  runningOutSoon: string;
  totalMarketUdhaar: string;
  remainingToCollect: string;
  onCustomersCount: string;
  counterQuickActions: string;
  actionQuickSell: string;
  actionScanBill: string;
  actionAddItem: string;
  actionNightCount: string;
  needsAttentionSection: string;
  alertsCountSuffix: string;
  sellByTonight: string;
  stockEmpty: string;
  limitedStock: string;
  leftUnits: string;
  reorderLevelLabel: string;
  // Stock List
  stockListTitle: string;
  searchStockPlaceholder: string;
  filterAll: string;
  orderListAction: string;
  addNewItem: string;
  emptyStockMsg: string;
  // Add/Edit Item
  addItemTitle: string;
  editItemTitle: string;
  mainDetailsSection: string;
  itemNameLabel: string;
  itemNamePlaceholder: string;
  categoryLabel: string;
  unitSection: string;
  unitTypeLabel: string;
  unitTypePlaceholder: string;
  unitHelperHint: string;
  packSizeLabel: string;
  packSizePlaceholder: string;
  stockQtyAlertSection: string;
  currentShopStockLabel: string;
  reorderLevelAlertLabel: string;
  reorderHelperHint: string;
  pricingSection: string;
  costPriceLabel: string;
  sellPriceLabel: string;
  profitMarginLabel: string;
  profitableDealBadge: string;
  expirySection: string;
  perishableOption: string;
  perishableOptionDesc: string;
  exchangeableOption: string;
  exchangeableOptionDesc: string;
  pureLossOption: string;
  pureLossOptionDesc: string;
  regularNonPerishableOption: string;
  regularOptionDesc: string;
  supplierNameLabel: string;
  supplierNamePlaceholder: string;
  saveItemBtn: string;
  // Night Count
  nightCountTitle: string;
  nightCountHeaderTitle: string;
  nightCountHeaderDesc: string;
  pendingCountBadge: string;
  pendingCountLabel: string;
  itemsTallyDoneMsg: string;
  morningStockLabel: string;
  calculatedSalesLabel: string;
  enterRemainingStockLabel: string;
  perishableWarning: string;
  markExpiryReturn: string;
  closeDayAndSaveCount: string;
  saveCountBtn: string;
  estimatedDailyProfitLabel: string;
  itemsCheckingCount: string;
  supplierReturnLabel: string;
  soldCountLabel: string;
  // Order List
  orderListHeaderTitle: string;
  orderListHeaderDesc: string;
  orderListSummaryTitle: string;
  estimatedPaymentLabel: string;
  wholesaleSavingsIncluded: string;
  packOrderLabel: string;
  costLabel: string;
  stockLeftPrefix: string;
  sendOrderViaWhatsAppBtn: string;
  printOrPdfBtn: string;
  emptyOrderListMsg: string;
  // Multi-Wholesaler Order Hub
  wholesalerRationTab: string;
  wholesalerTobaccoTab: string;
  wholesalerDailyVanTab: string;
  wholesalerAllTab: string;
  rationSlipNotice: string;
  tobaccoAgencySlipNotice: string;
  dailySalesmanNotice: string;
  markOrderGivenBtn: string;
  orderGivenRecordedBadge: string;
  receiveStockFromVanBtn: string;
  stockReceivedSuccessMsg: string;
  slipViewMode: string;
  listViewMode: string;
  copySlipBtn: string;
  slipCopiedToast: string;
  orderSlipShopTitle: string;
  wholesalerVendorLabel: string;
  deliveryMethodLabel: string;
  methodSendSlip: string;
  methodDailySalesman: string;
  suggestWholesaleSupplier: string;
  addWholesalerTitle: string;
  wholesalerPhoneLabel: string;
  wholesalerTimingLabel: string;
  // Wholesale Bill Scanner
  billScanHeaderTitle: string;
  billScanWarningBanner: string;
  billScanWarningDesc: string;
  wholesaleVendorLabel: string;
  scannedItemsCountSuffix: string;
  itemsFoundInBillTitle: string;
  tapToEditHint: string;
  qtyColLabel: string;
  billRateColLabel: string;
  lineTotalColLabel: string;
  rateFairBadge: string;
  rateCheaperBadge: string;
  rateCheckBadge: string;
  selectPaymentMode: string;
  paymentModeCash: string;
  paymentModeCredit: string;
  totalInvoiceAmount: string;
  totalTaxIncluded: string;
  scanFailureMsg: string;
  scanningWaitMsg: string;
  uncertainFieldWarning: string;
  // Udhaar Ledger
  udhaarTotalMarketTitle: string;
  recoveryProgressBadge: string;
  udhaarRepaidBadge: (percent: number) => string;
  regularCustomersLabel: string;
  collectedThisWeek: string;
  // Trust & Calculation Transparency
  infoTodayProfitTitle: string;
  infoTodayProfitDesc: string;
  infoWeekProfitTitle: string;
  infoWeekProfitDesc: string;
  infoMarginTitle: string;
  infoMarginDesc: string;
  infoUdhaarRepaidTitle: string;
  infoUdhaarRepaidDesc: string;
  searchCustomerPlaceholder: string;
  filterAllCustomers: string;
  filterHighCredit: string;
  filterOlder30Days: string;
  customerDueLabel: string;
  recentLedgerHistory: string;
  viewFullLedger: string;
  btnAddUdhaar: string;
  btnRecordPayment: string;
  btnRemindWhatsApp: string;
  otherCustomerAccountsTitle: string;
  sortByAmount: string;
  btnAddNewCustomer: string;
  lastSeenPrefix: string;
  viewHisabBtn: string;
  newCustomerModalTitle: string;
  customerNameLabel: string;
  customerPhoneLabel: string;
  customerAddressLabel: string;
  initialBalanceLabel: string;
  recordUdhaarTitle: string;
  recordPaymentTitle: string;
  amountLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  deleteCustomerConfirm: string;
  // Auth
  authTitle: string;
  authSubtitle: string;
  emailOrPhoneLabel: string;
  passwordLabel: string;
  btnLogin: string;
  btnSignup: string;
  btnForgotPassword: string;
  btnLogout: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  resetPasswordSent: string;
  btnDemoLogin: string;
  profileTitle: string;
  shopNameLabel: string;
  ownerLabel: string;
  // Extended UI Keys for Complete Language Consistency
  profitLabel: string;
  sellQuantityLabel: string;
  customerBillTotal: string;
  directProfit: string;
  ratePerUnit: string;
  remainingUnits: string;
  morningStock: string;
  soldUnits: string;
  allItems: string;
  todayEstimatedProfit: string;
  orderAction: string;
  sufficientStock: string;
  todaySalesCount: string;
  units: string;
  itemsChecked: string;
  supplierReturn: string;
  sendWhatsApp: string;
  whatsappOrderHeader: string;
  whatsappEstimatedTotal: string;
  whatsappOrderFooter: string;
  btnBackToLogin: string;
  btnSendResetLink: string;
  googleSignInBtn: string;
  orDivider: string;
  scanWholesaleBillTitle: string;
  scanWholesaleBillDesc: string;
  uncertainHandwriting: string;
  btnDone: string;
  btnChange: string;
  creditGiven: string;
  paymentReceived: string;
  noTransactionsYet: string;
  callButtonTitle: string;
  todayLabel: string;
  recentLabel: string;
  defaultCreditNote: string;
  defaultPaymentNote: string;
  currentDueLabel: string;
  customerNamePlaceholder: string;
  customerAddressPlaceholder: string;
  shopNamePlaceholder: string;
  daysOld: string;
  counterStock: string;
  actionQuickSellDesc: string;
  actionScanBillDesc: string;
  actionAddItemDesc: string;
  actionNightCountDesc: string;
  actionScanToSell: string;
  actionScanToSellDesc: string;
  actionShareStock: string;
  actionShareStockDesc: string;
  barcodeLabel: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  phoneLabel: string;
  phonePlaceholder: string;
  optionalLabel: string;
  storeTypeLabel: string;
  preferredLanguageLabel: string;
  accountTypeLabel: string;
  guestUserBadge: string;
  signedInAs: string;
  loginOrCreateAccount: string;
  quickDemoAccount: string;
  allStockHealthyMsg: string;
  itemsNeedReorderCount: string;
  bundlePacks: string;
  reorderLevelPrefix: string;
  itemsCountSuffix: string;
  totalItemsCount: string;
  perishableBadge: string;
  returnableBadge: string;
  perPack: string;
  shopStockLabel: string;
  reorderBadge: string;
  stockLowBadge: string;
  stockAdequateBadge: string;
  photoUnclearWarning: string;
  retakeOrProceed: string;
  fieldUncertainTooltip: string;
  qualityCheckDark: string;
  qualityCheckBlurry: string;
  qualityCheckAngle: string;
  preprocessingBillMsg: string;
  scanRetryingMsg: string;
  scanAutoEnhancedBadge: string;
  btnRetryScan: string;
  counterBillingTitle: string;
  counterBillingSubtitle: string;
  counterBringPrompt: string;
  counterEmptyMsg: string;
  counterAddCustomItem: string;
  counterNothingMissedMsg: string;
  counterPayCashBtn: string;
  counterPayUPIBtn: string;
  counterPayUdhaarBtn: string;
  counterNextCustomerBtn: string;
  counterWhatsAppReceipt: string;
  counterItemsOnCounter: string;
  counterRunningTotal: string;
  counterQuickAddPopular: string;
  counterScanBarcodePrompt: string;
}

export const translations: Record<Language, Translations> = {
  hi: {
    appName: 'Krow',
    appTagline: 'दुकान का पक्का हिसाब व मुनाफ़ा',
    appSubBadge: 'Know More • Grow More',
    // Navigation
    navHome: 'होम',
    navStock: 'स्टॉक',
    navUdhaar: 'उधार',
    // Common Buttons
    btnContinue: 'आगे बढ़ें',
    btnSave: 'सुरक्षित करें',
    btnCancel: 'रद्द करें',
    btnDelete: 'हटाएं',
    btnEdit: 'सुधारें',
    btnAdd: 'जोड़ें',
    btnSell: 'बेचें',
    btnSendWhatsApp: 'व्हाट्सएप पर ऑर्डर पर्चा भेजें',
    btnPrint: 'पर्चा प्रिंट करें',
    btnRetry: 'दोबारा कोशिश करें',
    btnConfirm: 'पुष्टि करें',
    btnConfirmAddToStock: 'पुष्टि करके स्टॉक में जोड़ें',
    btnRetakePhoto: 'दोबारा फोटो खींचें',
    btnUploadBill: 'बिल की फोटो चुनें',
    btnTakePhoto: 'कैमरे से फोटो लें',
    btnUseSampleBill: 'नमूना बिल से परखें',
    btnSearch: 'खोजें',
    // Onboarding
    onboardingStep1Title: 'अपनी भाषा चुनें',
    onboardingStep1Badge: '4 विकल्प',
    onboardingStep2Title: 'दुकान का प्रकार चुनें',
    onboardingStep2Badge: 'एक चुनें',
    onboardingTrustTip: 'आपका खाता पूरी तरह सुरक्षित है। बिना इंटरनेट भी ऑफलाइन काम करता है।',
    storeTypeKiranaTitle: 'किराना / जनरल स्टोर',
    storeTypeKiranaDesc: 'दैनिक उपभोग एवं राशन सामग्री',
    storeTypeGeneralStoreTitle: 'जनरल स्टोर / किराना',
    storeTypeGeneralStoreDesc: 'दैनिक राशन, दालें, तेल, मसाले, साबुन व पैकेज्ड फूड',
    storeTypeStationeryTitle: 'स्टेशनरी व बुक डिपो',
    storeTypeStationeryDesc: 'कॉपियाँ, रजिस्टर, पेन, पेंसिल, क्राफ्ट व ऑफिस फाइल्स',
    storeTypeUniformTitle: 'स्कूल यूनिफॉर्म व कपड़े',
    storeTypeUniformDesc: 'स्कूल यूनिफॉर्म, शर्ट, पैंट, टाई, बेल्ट, जूते व मोज़े',
    storeTypeGiftShopTitle: 'गिफ्ट शॉप व खिलौने',
    storeTypeGiftShopDesc: 'खिलौने, गिफ्ट शोपीस, घड़ियां, फोटो फ्रेम व कार्ड्स',
    storeDropdownLabel: 'दुकान का प्रकार (ड्रॉपडाउन से चुनें)',
    storeDropdownPlaceholder: 'दुकान का प्रकार चुनें...',
    selectedTag: 'चयनित',
    changeLaterNote: 'भाषा व दुकान का प्रकार बाद में भी बदला जा सकता है।',
    // Home Dashboard
    todayNetProfit: 'आज का शुद्ध मुनाफ़ा',
    growthBadge: 'लाइव खाता',
    weekNetProfit: 'इस हफ़्ते का कुल मुनाफ़ा',
    totalStockItems: 'कुल सामान',
    availableStock: 'उपलब्ध स्टॉक',
    runningOutSoon: 'खत्म होने वाले हैं',
    totalMarketUdhaar: 'बाज़ार में कुल उधार',
    remainingToCollect: 'वसूलना बाकी',
    onCustomersCount: 'ग्राहकों पर',
    counterQuickActions: 'काउंटर त्वरित कार्य',
    actionQuickSell: 'तुरंत बिक्री (बारकोड)',
    actionScanBill: 'बिल स्कैन करें',
    actionAddItem: 'नया सामान',
    actionNightCount: 'रात का मिलान',
    needsAttentionSection: 'तुरंत ध्यान दें',
    alertsCountSuffix: 'अलर्ट',
    sellByTonight: 'आज रात तक बेचें',
    stockEmpty: 'स्टॉक खत्म',
    limitedStock: 'सीमित स्टॉक',
    leftUnits: 'बचे',
    reorderLevelLabel: 'रीऑर्डर स्तर',
    // Stock List
    stockListTitle: 'दुकान का स्टॉक',
    searchStockPlaceholder: 'सामान का नाम खोजें...',
    filterAll: 'सभी',
    orderListAction: 'मंगवाने की सूची',
    addNewItem: 'नया सामान जोड़ें',
    emptyStockMsg: 'कोई सामान नहीं मिला। नया सामान दर्ज करें।',
    // Add Item
    addItemTitle: 'नया सामान जोड़ें',
    editItemTitle: 'सामान सुधारें',
    mainDetailsSection: 'मुख्य जानकारी',
    itemNameLabel: 'सामान का नाम',
    itemNamePlaceholder: 'जैसे: राजधानी चना दाल 1kg',
    categoryLabel: 'श्रेणी चुनें',
    unitSection: 'माप एवं इकाई',
    unitTypeLabel: 'इकाई (Unit)',
    unitTypePlaceholder: 'जैसे: पैकेट, बोरी, कट्टा, लड़ी, पेटी, दर्जन, किलो',
    unitHelperHint: 'अपनी दुकान की भाषा में लिखें: पैकेट, कट्टा, लड़ी, पेटी, दर्जन, बोरी',
    packSizeLabel: 'थोक पैकिंग आकार (वैकल्पिक)',
    packSizePlaceholder: 'जैसे: 24 पैकेट प्रति पेटी',
    stockQtyAlertSection: 'स्टॉक मात्रा व चेतावनी स्तर',
    currentShopStockLabel: 'काउंटर पर मौजूदा स्टॉक',
    reorderLevelAlertLabel: 'चेतावनी स्तर (रीऑर्डर लेवल)',
    reorderHelperHint: 'स्टॉक इस संख्या से कम होते ही ऐप आपको अलर्ट करेगा',
    pricingSection: 'खरीद व बिक्री मूल्य',
    costPriceLabel: 'खरीद मूल्य (Buy Price)',
    sellPriceLabel: 'बिक्री मूल्य (Sell Price)',
    profitMarginLabel: 'प्रति इकाई शुद्ध मुनाफ़ा',
    profitableDealBadge: 'मुनाफ़े का सौदा',
    expirySection: 'खराब होने व वापसी की शर्त',
    perishableOption: 'जल्दी खराब होने वाला (दूध, ब्रेड, दही, पनीर)',
    perishableOptionDesc: 'कम अवधि में बिकने वाला सामान (2-3 दिन)',
    exchangeableOption: 'सप्लायर द्वारा वापसी संभव (खराब होने पर बदला जाएगा)',
    exchangeableOptionDesc: 'जैसे: ब्रेड, चिप्स - सप्लायर नया माल दे देता है',
    pureLossOption: 'पूर्ण नुकसान (खराब होने पर सप्लायर वापस नहीं लेता)',
    pureLossOptionDesc: 'जैसे: खुला दूध - फटने पर खुद का नुकसान',
    regularNonPerishableOption: 'सामान्य टिकाऊ सामान (महीनों चलने वाला)',
    regularOptionDesc: 'दाल, चावल, तेल, साबुन व सूखा राशन',
    supplierNameLabel: 'थोक सप्लायर का नाम (वैकल्पिक)',
    supplierNamePlaceholder: 'जैसे: गुप्ता होलसेल एजेंसी',
    saveItemBtn: 'सामान सुरक्षित करें',
    // Night Count
    nightCountTitle: 'रात का स्टॉक मिलान',
    nightCountHeaderTitle: 'दुकान बंद करने से पहले मिलान',
    nightCountHeaderDesc: 'शटर गिराने से पहले 3 मिनट में काउंटर का हिसाब मिलाएं ताकि कल सुबह साफ शुरुआत हो।',
    pendingCountBadge: 'लाइव मिलान',
    pendingCountLabel: 'गिनती बाकी',
    itemsTallyDoneMsg: 'दिन भर बिका सामान सुरक्षित करते ही आपके मुनाफ़े के बही-खाते में दर्ज हो जाएगा।',
    morningStockLabel: 'सुबह का स्टॉक',
    calculatedSalesLabel: 'बिका सामान',
    enterRemainingStockLabel: 'दुकान में बचा सामान दर्ज करें:',
    perishableWarning: 'बचा हुआ दूध/ब्रेड रात में खराब हो सकता है - बर्फ या फ्रिज में रखें।',
    markExpiryReturn: 'सप्लायर वापसी के लिए अलग करें',
    closeDayAndSaveCount: 'दिन बंद करें व हिसाब जोड़ें',
    saveCountBtn: 'गिनती सुरक्षित करें',
    estimatedDailyProfitLabel: 'आज की अनुमानित बिक्री से मुनाफ़ा:',
    itemsCheckingCount: 'सामान की जांच',
    supplierReturnLabel: 'सप्लायर वापसी',
    soldCountLabel: 'बिका',
    // Order List
    orderListHeaderTitle: 'थोक सप्लायर ऑर्डर पर्चा',
    orderListHeaderDesc: 'पूरी पेटी, बोरी और कट्टा के अनुसार तैयार',
    orderListSummaryTitle: 'ऑर्डर सारांश',
    estimatedPaymentLabel: 'अनुमानित कुल भुगतान',
    wholesaleSavingsIncluded: 'थोक छूट शामिल',
    packOrderLabel: 'थोक पेटी ऑर्डर',
    costLabel: 'लागत',
    stockLeftPrefix: 'बचा स्टॉक:',
    sendOrderViaWhatsAppBtn: 'व्हाट्सएप पर ऑर्डर पर्चा भेजें',
    printOrPdfBtn: 'पर्चा प्रिंट या पीडीएफ सहेजें',
    emptyOrderListMsg: 'सभी सामान पर्याप्त मात्रा में उपलब्ध हैं। अभी कोई ऑर्डर नहीं चाहिए।',
    // Multi-Wholesaler Order Hub
    wholesalerRationTab: 'राशन व मंडी पर्चा',
    wholesalerTobaccoTab: 'सिगरेट व तंबाकू',
    wholesalerDailyVanTab: 'दैनिक वैन व सेल्समैन',
    wholesalerAllTab: 'सभी सप्लायर',
    rationSlipNotice: 'थोक गल्ला व्यापारी / मंडी को पर्चा भेजना पड़ता है (WhatsApp / प्रिंट)',
    tobaccoAgencySlipNotice: 'सिगरेट एजेंसी को पर्चा भेजना पड़ता है (डब्बा / खोका / बंडल)',
    dailySalesmanNotice: 'सेल्समैन दुकान पर रोज़ ऑर्डर लेने आते हैं — खाली रैक देखकर ऑर्डर दें',
    markOrderGivenBtn: 'सेल्समैन को ऑर्डर दे दिया ✓',
    orderGivenRecordedBadge: 'आज का ऑर्डर दे दिया गया',
    receiveStockFromVanBtn: 'वैन से माल आ गया (स्टॉक जोड़ें)',
    stockReceivedSuccessMsg: 'वैन से माल स्टॉक में जोड़ दिया गया!',
    slipViewMode: 'दुकान पर्चा (Slip View)',
    listViewMode: 'आइटम लिस्ट (List View)',
    copySlipBtn: 'पर्चा कॉपी करें',
    slipCopiedToast: 'पर्चा क्लिपबोर्ड पर कॉपी हो गया!',
    orderSlipShopTitle: 'दुकान थोक रीऑर्डर पर्चा',
    wholesalerVendorLabel: 'सप्लायर / थोक व्यापारी',
    deliveryMethodLabel: 'ऑर्डर व डिलीवरी का तरीका',
    methodSendSlip: 'पर्चा भेजें (WhatsApp / प्रिंट)',
    methodDailySalesman: 'दैनिक वैन (दुकान पर आते हैं)',
    suggestWholesaleSupplier: 'सुझाया गया सप्लायर',
    addWholesalerTitle: 'नया थोक सप्लायर जोड़ें',
    wholesalerPhoneLabel: 'व्हाट्सएप / फोन नंबर',
    wholesalerTimingLabel: 'आने का समय / शेड्यूल',
    // Wholesale Bill Scanner
    billScanHeaderTitle: 'थोक पर्ची सत्यापन',
    billScanWarningBanner: 'रुपयों का मामला है — ध्यान से जांचें',
    billScanWarningDesc: 'गोदाम में माल उतारने से पहले बिल के दाम और गिनती मिला लें।',
    wholesaleVendorLabel: 'थोक विक्रेता / फर्म',
    scannedItemsCountSuffix: 'सामान मिले',
    itemsFoundInBillTitle: 'बिल में दर्ज सामान',
    tapToEditHint: 'बदलने के लिए लाइन पर छुएं',
    qtyColLabel: 'मात्रा',
    billRateColLabel: 'दर',
    lineTotalColLabel: 'रकम',
    rateFairBadge: 'सही भाव ✓',
    rateCheaperBadge: 'पिछली बार से सस्ता',
    rateCheckBadge: 'जांचें ⚠️',
    selectPaymentMode: 'भुगतान का तरीका चुनें',
    paymentModeCash: 'नकद चुकाया',
    paymentModeCredit: 'सप्लायर पर उधार',
    totalInvoiceAmount: 'बिल की कुल रकम',
    totalTaxIncluded: 'सभी कर व ढुलाई सहित',
    scanFailureMsg: 'फोटो स्पष्ट नहीं पढ़ पाए, कृपया दोबारा खींचें या हाथ से दर्ज करें',
    scanningWaitMsg: 'पर्ची की लिखावट और दरें जांची जा रही हैं...',
    uncertainFieldWarning: 'लिखावट अस्पष्ट थी, कृपया जांच लें',
    // Udhaar Ledger
    udhaarTotalMarketTitle: 'बाज़ार में कुल बकाया उधार',
    recoveryProgressBadge: 'उगाही प्रगति',
    udhaarRepaidBadge: (percent: number) => `कुल उधार का ${percent}% वापस मिला`,
    regularCustomersLabel: 'खाताधारक ग्राहक',
    collectedThisWeek: 'इस हफ़्ते वसूल हुए',
    // Trust & Calculation Transparency
    infoTodayProfitTitle: 'आज का शुद्ध मुनाफ़ा कैसे निकलता है?',
    infoTodayProfitDesc: 'मुनाफ़ा = बिक्री मूल्य (Sell Price) − ख़रीद मूल्य (Buy Price), आज बेचे गए हर सामान पर (क्विक सेल, बारकोड स्कैन व रात की गिनती से)।',
    infoWeekProfitTitle: 'इस हफ़्ते का कुल मुनाफ़ा',
    infoWeekProfitDesc: 'इस चालू हफ़्ते में हर दिन हुए शुद्ध मुनाफ़े (बिक्री मूल्य − ख़रीद मूल्य) का कुल जोड़।',
    infoMarginTitle: 'मुनाफ़ा मार्जिन (Profit Margin)',
    infoMarginDesc: 'मार्जिन % = ((बिक्री मूल्य − ख़रीद मूल्य) ÷ बिक्री मूल्य) × 100। यह बताता है कि हर बिक्री पर आपको कितने प्रतिशत बचत होती है।',
    infoUdhaarRepaidTitle: 'उधार वसूली प्रतिशत (% Repaid)',
    infoUdhaarRepaidDesc: 'वसूली % = (ग्राहक से मिली कुल जमा रकम ÷ अब तक दिया गया कुल उधार) × 100।',
    searchCustomerPlaceholder: 'ग्राहक का नाम या फोन खोजें...',
    filterAllCustomers: 'सभी खाते',
    filterHighCredit: 'अधिक बकाया',
    filterOlder30Days: '30 दिन से पुराने',
    customerDueLabel: 'कुल बकाया रकम',
    recentLedgerHistory: 'हाल का लेन-देन इतिहास',
    viewFullLedger: 'पूरा खाता देखें',
    btnAddUdhaar: '+ उधार दिया',
    btnRecordPayment: '✓ रुपये जमा किए',
    btnRemindWhatsApp: 'तकादा संदेश भेजें',
    otherCustomerAccountsTitle: 'ग्राहकों के बही-खाते',
    sortByAmount: 'बकाया रकम अनुसार',
    btnAddNewCustomer: 'नया ग्राहक खाता जोड़ें',
    lastSeenPrefix: 'अंतिम:',
    viewHisabBtn: 'खाता देखें',
    newCustomerModalTitle: 'नया ग्राहक खाता जोड़ें',
    customerNameLabel: 'ग्राहक का नाम',
    customerPhoneLabel: 'मोबाइल नंबर',
    customerAddressLabel: 'मकान / पता / पहचान नोट',
    initialBalanceLabel: 'पहले का पुराना बकाया (यदि कोई हो)',
    recordUdhaarTitle: 'उधार दर्ज करें (+)',
    recordPaymentTitle: 'रुपये जमा दर्ज करें (-)',
    amountLabel: 'रकम (₹)',
    noteLabel: 'सामान का विवरण / नोट',
    notePlaceholder: 'जैसे: आटा, तेल व राशन',
    deleteCustomerConfirm: 'क्या आप इस ग्राहक का खाता हटाना चाहते हैं?',
    // Auth
    authTitle: 'दुकानदार लॉगिन',
    authSubtitle: 'अपनी दुकान का स्टॉक, उधार और मुनाफ़ा सुरक्षित रखें',
    emailOrPhoneLabel: 'ईमेल या फोन',
    passwordLabel: 'पासवर्ड',
    btnLogin: 'लॉगिन करें',
    btnSignup: 'नया खाता बनाएं',
    btnForgotPassword: 'पासवर्ड भूल गए?',
    btnLogout: 'लॉगआउट',
    dontHaveAccount: 'खाता नहीं है? नया बनाएं',
    alreadyHaveAccount: 'पहले से खाता है? लॉगिन करें',
    resetPasswordSent: 'पासवर्ड रीसेट करने का लिंक ईमेल पर भेज दिया गया है।',
    btnDemoLogin: 'डेमो खाते से तुरंत परखें',
    profileTitle: 'दुकान की प्रोफाइल',
    shopNameLabel: 'दुकान का नाम',
    ownerLabel: 'मालिक का नाम',
    profitLabel: 'मुनाफ़ा',
    sellQuantityLabel: 'बिक्री मात्रा',
    customerBillTotal: 'ग्राहक का कुल बिल',
    directProfit: 'सीधा मुनाफ़ा',
    ratePerUnit: 'दर',
    remainingUnits: 'बचे',
    morningStock: 'सुबह का स्टॉक',
    soldUnits: 'बिका',
    allItems: 'सभी सामान',
    todayEstimatedProfit: 'आज की अनुमानित बिक्री से मुनाफ़ा:',
    orderAction: 'मंगवाएं',
    sufficientStock: 'पर्याप्त स्टॉक',
    todaySalesCount: 'आज की बिक्री',
    units: 'इकाई',
    itemsChecked: 'सामान की जांच',
    supplierReturn: 'सप्लायर वापसी',
    sendWhatsApp: 'व्हाट्सएप पर भेजें',
    whatsappOrderHeader: '*थोक ऑर्डर पर्चा — Krōw*\n\n',
    whatsappEstimatedTotal: 'अनुमानित कुल रकम',
    whatsappOrderFooter: 'कृपया उपरोक्त सामान जल्द से जल्द गाड़ी में लोड करवाएं। धन्यवाद!',
    btnBackToLogin: '← वापस लॉगिन पर जाएं',
    btnSendResetLink: 'पासवर्ड रीसेट लिंक भेजें',
    googleSignInBtn: 'गूगल से लॉगिन करें',
    orDivider: 'या',
    scanWholesaleBillTitle: 'थोक सप्लायर का बिल स्कैन करें',
    scanWholesaleBillDesc: 'पर्चे या छपे हुए चालान की फोटो लें, Krow अपने आप सामान, दर और मात्रा पढ़ लेगा।',
    uncertainHandwriting: 'लिखावट अस्पष्ट ⚠️',
    btnDone: 'हो गया',
    btnChange: 'बदलें',
    creditGiven: 'उधार दिया',
    paymentReceived: 'रुपये जमा',
    noTransactionsYet: 'अभी तक कोई पुराना लेन-देन दर्ज नहीं है।',
    callButtonTitle: 'कॉल करें',
    todayLabel: 'आज',
    recentLabel: 'हाल ही में',
    defaultCreditNote: 'दुकान से उधार',
    defaultPaymentNote: 'नकद जमा',
    currentDueLabel: 'मौजूदा बकाया',
    customerNamePlaceholder: 'जैसे: रमेश वर्मा',
    customerAddressPlaceholder: 'जैसे: मकान नंबर 12, मंदिर के सामने',
    shopNamePlaceholder: 'जैसे: शर्मा किराना स्टोर',
    daysOld: 'दिन पुराना',
    counterStock: 'काउंटर पर मौजूद',
    actionQuickSellDesc: 'बारकोड स्कैन से तुरंत बिक्री',
    actionScanBillDesc: 'फोटो पर्ची पढ़ें',
    actionAddItemDesc: 'नया माल चढ़ाएं',
    actionNightCountDesc: 'दिन बंद व मिलान',
    actionScanToSell: 'खुला राशन बिक्री',
    actionScanToSellDesc: 'आटा, दाल, चीनी बिना बारकोड',
    actionShareStock: 'ग्राहक स्टॉक / QR',
    actionShareStockDesc: 'लाइव स्टॉक काउंटर QR',
    barcodeLabel: 'बारकोड',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
    phoneLabel: 'मोबाइल नंबर',
    phonePlaceholder: '10 अंकों का मोबाइल नंबर',
    optionalLabel: 'वैकल्पिक',
    storeTypeLabel: 'दुकान का प्रकार',
    preferredLanguageLabel: 'पसंदीदा भाषा',
    accountTypeLabel: 'खाता स्थिति',
    guestUserBadge: 'अतिथि (डेमो मोड)',
    signedInAs: 'लॉगिन खाता:',
    loginOrCreateAccount: 'लॉगिन करें या नया खाता बनाएं',
    quickDemoAccount: 'त्वरित डेमो खाता',
    allStockHealthyMsg: 'दुकान में सारा माल पर्याप्त है! कोई सामान खत्म नहीं है।',
    itemsNeedReorderCount: 'सामान खत्म होने वाले हैं',
    bundlePacks: 'बंडल',
    reorderLevelPrefix: 'रीऑर्डर स्तर:',
    itemsCountSuffix: 'सामान',
    totalItemsCount: 'कुल सामान',
    perishableBadge: 'जल्दी खराब होने वाला',
    returnableBadge: 'वापसी संभव',
    perPack: 'प्रति पेटी',
    shopStockLabel: 'दुकान स्टॉक',
    reorderBadge: 'रीऑर्डर',
    stockLowBadge: 'स्टॉक कम',
    stockAdequateBadge: 'पर्याप्त',
    photoUnclearWarning: 'फोटो अस्पष्ट है',
    retakeOrProceed: 'सटीक परिणाम के लिए दोबारा साफ फोटो लें, या ऐसे ही आगे बढ़ें।',
    fieldUncertainTooltip: 'यह फ़ील्ड अस्पष्ट थी, कृपया जांच लें',
    qualityCheckDark: 'फोटो बहुत अंधेरी है',
    qualityCheckBlurry: 'फोटो धुंधली प्रतीत होती है',
    qualityCheckAngle: 'फोटो का कोण बहुत तिरछा है',
    preprocessingBillMsg: 'पर्चे की लिखावट स्पष्ट व सीधी की जा रही है...',
    scanRetryingMsg: 'कोई सामान नहीं मिला, अधिक स्पष्टता (High-Contrast) के साथ दोबारा स्कैन हो रहा है...',
    scanAutoEnhancedBadge: 'ऑटो-एन्हांस्ड व सीधा किया गया',
    btnRetryScan: 'फिर से स्कैन करें',
    counterBillingTitle: 'काउंटर बिक्री पर्चा',
    counterBillingSubtitle: 'काउंटर पर सामान रखें • पर्चा बनाएं • तुरंत बेचें',
    counterBringPrompt: 'सामान काउंटर पर जोड़ें',
    counterEmptyMsg: 'काउंटर खाली है। नीचे दिए गए सामान पर टैप करें या ऊपर खोजें ताकि कोई भी सामान छूटे नहीं।',
    counterAddCustomItem: '+ अन्य खुला सामान',
    counterNothingMissedMsg: 'काउंटर पर सभी सामान दर्ज हैं • कुछ भी छूटा नहीं',
    counterPayCashBtn: 'नकद बिक्री (Cash)',
    counterPayUPIBtn: 'ऑनलाइन / UPI QR',
    counterPayUdhaarBtn: 'उधार खाते में लिखें',
    counterNextCustomerBtn: 'अगला ग्राहक (New Bill)',
    counterWhatsAppReceipt: 'WhatsApp पर पर्चा भेजें',
    counterItemsOnCounter: 'काउंटर पर सामान',
    counterRunningTotal: 'कुल बिल राशि',
    counterQuickAddPopular: 'लोकप्रिय काउंटर सामान',
    counterScanBarcodePrompt: 'बारकोड स्कैन करें',
  },

  pa: {
    appName: 'Krow',
    appTagline: 'ਦੁਕਾਨ ਦਾ ਪੱਕਾ ਹਿਸਾਬ-ਕਿਤਾਬ ਤੇ ਮੁਨਾਫ਼ਾ',
    appSubBadge: 'Know More • Grow More',
    // Navigation
    navHome: 'ਹੋਮ',
    navStock: 'ਸਟਾਕ',
    navUdhaar: 'ਉਧਾਰ',
    // Common Buttons
    btnContinue: 'ਅੱਗੇ ਵਧੋ',
    btnSave: 'ਸੰਭਾਲੋ',
    btnCancel: 'ਰੱਦ ਕਰੋ',
    btnDelete: 'ਮਿਟਾਓ',
    btnEdit: 'ਸੋਧੋ',
    btnAdd: 'ਜੋੜੋ',
    btnSell: 'ਵੇਚੋ',
    btnSendWhatsApp: 'ਵਟਸਐਪ \'ਤੇ ਆਰਡਰ ਭੇਜੋ',
    btnPrint: 'ਪਰਚੀ ਪ੍ਰਿੰਟ ਕਰੋ',
    btnRetry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    btnConfirm: 'ਪੁਸ਼ਟੀ ਕਰੋ',
    btnConfirmAddToStock: 'ਪੁਸ਼ਟੀ ਕਰਕੇ ਸਟਾਕ ਵਿੱਚ ਜੋੜੋ',
    btnRetakePhoto: 'ਦੁਬਾਰਾ ਫੋਟੋ ਲਓ',
    btnUploadBill: 'ਬਿੱਲ ਫੋਟੋ ਚੁਣੋ',
    btnTakePhoto: 'ਕੈਮਰੇ ਨਾਲ ਫੋਟੋ ਲਓ',
    btnUseSampleBill: 'ਨਮੂਨਾ ਬਿੱਲ ਨਾਲ ਦੇਖੋ',
    btnSearch: 'ਖੋਜੋ',
    // Onboarding
    onboardingStep1Title: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    onboardingStep1Badge: '4 ਵਿਕਲਪ',
    onboardingStep2Title: 'ਦੁਕਾਨ ਦੀ ਕਿਸਮ ਚੁਣੋ',
    onboardingStep2Badge: 'ਇੱਕ ਚੁਣੋ',
    onboardingTrustTip: 'ਤੁਹਾਡਾ ਡਾਟਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਹੈ। ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਵੀ ਕੰਮ ਕਰਦਾ ਹੈ।',
    storeTypeKiranaTitle: 'ਕਿਰਿਆਣਾ / ਜਨਰਲ ਸਟੋਰ',
    storeTypeKiranaDesc: 'ਰੋਜ਼ਾਨਾ ਰਾਸ਼ਨ ਅਤੇ ਘਰੇਲੂ ਸਮਾਨ',
    storeTypeGeneralStoreTitle: 'ਜਨਰਲ ਸਟੋਰ / ਕਿਰਿਆਣਾ',
    storeTypeGeneralStoreDesc: 'ਰੋਜ਼ਾਨਾ ਰਾਸ਼ਨ, ਦਾਲਾਂ, ਤੇਲ, ਮਸਾਲੇ ਤੇ ਪੈਕਡ ਫੂਡ',
    storeTypeStationeryTitle: 'ਸਟੇਸ਼ਨਰੀ ਅਤੇ ਕਿਤਾਬਾਂ',
    storeTypeStationeryDesc: 'ਕਾਪੀਆਂ, ਰਜਿਸਟਰ, ਪੈੱਨ, ਪੈਨਸਿਲ ਤੇ ਦਫ਼ਤਰੀ ਸਮੱਗਰੀ',
    storeTypeUniformTitle: 'ਸਕੂਲ ਵਰਦੀਆਂ ਤੇ ਡਰੈੱਸ',
    storeTypeUniformDesc: 'ਸਕੂਲ ਵਰਦੀਆਂ, ਕਮੀਜ਼ਾਂ, ਪੈਂਟਾਂ, ਟਾਈਆਂ, ਬੈਲਟਾਂ ਤੇ ਜੁੱਤੇ',
    storeTypeGiftShopTitle: 'ਗਿਫਟ ਸ਼ਾਪ ਅਤੇ ਖਿਡੌਣੇ',
    storeTypeGiftShopDesc: 'ਖਿਡੌਣੇ, ਤੋਹਫ਼ੇ, ਘੜੀਆਂ, ਫੋਟੋ ਫਰੇਮ ਤੇ ਕਾਰਡ',
    storeDropdownLabel: 'ਦੁਕਾਨ ਦੀ ਕਿਸਮ (ਡ੍ਰੌਪਡਾਊਨ ਵਿੱਚੋਂ ਚੁਣੋ)',
    storeDropdownPlaceholder: 'ਦੁਕਾਨ ਦੀ ਕਿਸਮ ਚੁਣੋ...',
    selectedTag: 'ਚੁਣਿਆ ਗਿਆ',
    changeLaterNote: 'ਭਾਸ਼ਾ ਅਤੇ ਦੁਕਾਨ ਦੀ ਕਿਸਮ ਬਾਅਦ ਵਿੱਚ ਵੀ ਬਦਲੀ ਜਾ ਸਕਦੀ ਹੈ।',
    // Home Dashboard
    todayNetProfit: 'ਅੱਜ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ',
    growthBadge: 'ਲਾਈਵ ਖਾਤਾ',
    weekNetProfit: 'ਇਸ ਹਫ਼ਤੇ ਦਾ ਕੁੱਲ ਮੁਨਾਫ਼ਾ',
    totalStockItems: 'ਕੁੱਲ ਸਮਾਨ',
    availableStock: 'ਮੌਜੂਦ ਸਟਾਕ',
    runningOutSoon: 'ਮੁੱਕਣ ਵਾਲੇ ਹਨ',
    totalMarketUdhaar: 'ਬਾਜ਼ਾਰ ਵਿੱਚ ਕੁੱਲ ਉਧਾਰ',
    remainingToCollect: 'ਵਸੂਲਣਾ ਬਾਕੀ',
    onCustomersCount: 'ਗਾਹਕਾਂ \'ਤੇ',
    counterQuickActions: 'ਕਾਊਂਟਰ ਤੁਰੰਤ ਕਾਰਜ',
    actionQuickSell: 'ਤੁਰੰਤ ਵਿਕਰੀ (ਬਾਰਕੋਡ)',
    actionScanBill: 'ਬਿੱਲ ਸਕੈਨ ਕਰੋ',
    actionAddItem: 'ਨਵਾਂ ਸਮਾਨ',
    actionNightCount: 'ਰਾਤ ਦਾ ਮਿਲਾਨ',
    needsAttentionSection: 'ਤੁਰੰਤ ਧਿਆਨ ਦਿਓ',
    alertsCountSuffix: 'ਚੇਤਾਵਨੀਆਂ',
    sellByTonight: 'ਅੱਜ ਰਾਤ ਤੱਕ ਵੇਚੋ',
    stockEmpty: 'ਸਟਾਕ ਮੁੱਕ ਗਿਆ',
    limitedStock: 'ਘੱਟ ਸਟਾਕ',
    leftUnits: 'ਬਾਕੀ',
    reorderLevelLabel: 'ਰੀਆਰਡਰ ਪੱਧਰ',
    // Stock List
    stockListTitle: 'ਦੁਕਾਨ ਦਾ ਸਟਾਕ',
    searchStockPlaceholder: 'ਸਮਾਨ ਦਾ ਨਾਮ ਖੋਜੋ...',
    filterAll: 'ਸਾਰੇ',
    orderListAction: 'ਮੰਗਵਾਉਣ ਦੀ ਸੂਚੀ',
    addNewItem: 'ਨਵਾਂ ਸਮਾਨ ਜੋੜੋ',
    emptyStockMsg: 'ਕੋਈ ਸਮਾਨ ਨਹੀਂ ਮਿਲਿਆ। ਨਵਾਂ ਸਮਾਨ ਦਰਜ ਕਰੋ।',
    // Add Item
    addItemTitle: 'ਨਵਾਂ ਸਮਾਨ ਜੋੜੋ',
    editItemTitle: 'ਸਮਾਨ ਸੋਧੋ',
    mainDetailsSection: 'ਮੁੱਖ ਵੇਰਵੇ',
    itemNameLabel: 'ਸਮਾਨ ਦਾ ਨਾਮ',
    itemNamePlaceholder: 'ਜਿਵੇਂ: ਰਾਜਧਾਨੀ ਚਨਾ ਦਾਲ 1kg',
    categoryLabel: 'ਸ਼੍ਰੇਣੀ ਚੁਣੋ',
    unitSection: 'ਮਾਪ ਅਤੇ ਇਕਾਈ',
    unitTypeLabel: 'ਇਕਾਈ (Unit)',
    unitTypePlaceholder: 'ਜਿਵੇਂ: ਪੈਕੇਟ, ਬੋਰੀ, ਕੱਟਾ, ਲੜੀ, ਪੇਟੀ, ਦਰਜਨ, ਕਿਲੋ',
    unitHelperHint: 'ਆਪਣੀ ਦੁਕਾਨ ਦੀ ਬੋਲੀ ਵਿੱਚ ਲਿਖੋ: ਪੈਕੇਟ, ਕੱਟਾ, ਲੜੀ, ਪੇਟੀ, ਦਰਜਨ, ਬੋਰੀ',
    packSizeLabel: 'ਥੋਕ ਪੈਕਿੰਗ ਆਕਾਰ (ਵਿਕਲਪਿਕ)',
    packSizePlaceholder: 'ਜਿਵੇਂ: 24 ਪੈਕੇਟ ਪ੍ਰਤੀ ਪੇਟੀ',
    stockQtyAlertSection: 'ਸਟਾਕ ਮਾਤਰਾ ਤੇ ਚੇਤਾਵਨੀ ਪੱਧਰ',
    currentShopStockLabel: 'ਕਾਊਂਟਰ \'ਤੇ ਮੌਜੂਦ ਸਟਾਕ',
    reorderLevelAlertLabel: 'ਚੇਤਾਵਨੀ ਪੱਧਰ (ਰੀਆਰਡਰ ਲੈਵਲ)',
    reorderHelperHint: 'ਸਟਾਕ ਇਸ ਗਿਣਤੀ ਤੋਂ ਘਟਦੇ ਹੀ ਐਪ ਤੁਹਾਨੂੰ ਅਲਰਟ ਕਰੇਗੀ',
    pricingSection: 'ਖਰੀਦ ਤੇ ਵਿਕਰੀ ਮੁੱਲ',
    costPriceLabel: 'ਖਰੀਦ ਮੁੱਲ (Buy Price)',
    sellPriceLabel: 'ਵਿਕਰੀ ਮੁੱਲ (Sell Price)',
    profitMarginLabel: 'ਪ੍ਰਤੀ ਇਕਾਈ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ',
    profitableDealBadge: 'ਮੁਨਾਫ਼ੇ ਦਾ ਸੌਦਾ',
    expirySection: 'ਖਰਾਬ ਹੋਣ ਤੇ ਵਾਪਸੀ ਨਿਯਮ',
    perishableOption: 'ਛੇਤੀ ਖਰਾਬ ਹੋਣ ਵਾਲਾ (ਦੁੱਧ, ਬ੍ਰੈੱਡ, ਦਹੀਂ, ਪਨੀਰ)',
    perishableOptionDesc: 'ਘੱਟ ਸਮੇਂ ਵਿੱਚ ਵਿਕਣ ਵਾਲਾ ਤਾਜ਼ਾ ਸਮਾਨ (2-3 ਦਿਨ)',
    exchangeableOption: 'ਸਪਲਾਇਰ ਵੱਲੋਂ ਵਾਪਸੀ ਸੰਭਵ (ਖਰਾਬ ਹੋਣ \'ਤੇ ਬਦਲਿਆ ਜਾਵੇਗਾ)',
    exchangeableOptionDesc: 'ਜਿਵੇਂ: ਬ੍ਰੈੱਡ, ਚਿਪਸ - ਸਪਲਾਇਰ ਨਵਾਂ ਮਾਲ ਦੇ ਦਿੰਦਾ ਹੈ',
    pureLossOption: 'ਪੂਰਾ ਨੁਕਸਾਨ (ਖਰਾਬ ਹੋਣ \'ਤੇ ਸਪਲਾਇਰ ਵਾਪਸ ਨਹੀਂ ਲੈਂਦਾ)',
    pureLossOptionDesc: 'ਜਿਵੇਂ: ਖੁੱਲ੍ਹਾ ਦੁੱਧ - ਖਰਾਬ ਹੋਣ \'ਤੇ ਆਪਣਾ ਨੁਕਸਾਨ',
    regularNonPerishableOption: 'ਆਮ ਪੱਕਾ ਸਮਾਨ (ਮਹੀਨਿਆਂ ਤੱਕ ਚੱਲਣ ਵਾਲਾ)',
    regularOptionDesc: 'ਦਾਲਾਂ, ਚੌਲ, ਤੇਲ, ਸਾਬਣ ਤੇ ਸੁੱਕਾ ਰਾਸ਼ਨ',
    supplierNameLabel: 'ਥੋਕ ਸਪਲਾਇਰ ਦਾ ਨਾਮ (ਵਿਕਲਪਿਕ)',
    supplierNamePlaceholder: 'ਜਿਵੇਂ: ਗੁਪਤਾ ਹੋਲਸੇਲ ਏਜੰਸੀ',
    saveItemBtn: 'ਸਮਾਨ ਸੰਭਾਲੋ',
    // Night Count
    nightCountTitle: 'ਰਾਤ ਦਾ ਸਟਾਕ ਮਿਲਾਨ',
    nightCountHeaderTitle: 'ਦੁਕਾਨ ਬੰਦ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਮਿਲਾਨ',
    nightCountHeaderDesc: 'ਸ਼ਟਰ ਸੁੱਟਣ ਤੋਂ ਪਹਿਲਾਂ 3 ਮਿੰਟ ਵਿੱਚ ਕਾਊਂਟਰ ਦਾ ਹਿਸਾਬ ਮਿਲਾਓ ਤਾਂ ਜੋ ਕੱਲ੍ਹ ਸਵੇਰ ਸਾਫ਼ ਸ਼ੁਰੂਆਤ ਹੋਵੇ।',
    pendingCountBadge: 'ਲਾਈਵ ਮਿਲਾਨ',
    pendingCountLabel: 'ਗਿਣਤੀ ਬਾਕੀ',
    itemsTallyDoneMsg: 'ਦਿਨ ਭਰ ਵਿਕਿਆ ਸਮਾਨ ਸੰਭਾਲਦੇ ਹੀ ਤੁਹਾਡੇ ਮੁਨਾਫ਼ੇ ਦੇ ਖਾਤੇ ਵਿੱਚ ਦਰਜ ਹੋ ਜਾਵੇਗਾ।',
    morningStockLabel: 'ਸਵੇਰ ਦਾ ਸਟਾਕ',
    calculatedSalesLabel: 'ਵਿਕਿਆ ਸਮਾਨ',
    enterRemainingStockLabel: 'ਦੁਕਾਨ ਵਿੱਚ ਬਚਿਆ ਸਮਾਨ ਦਰਜ ਕਰੋ:',
    perishableWarning: 'ਬਚਿਆ ਹੋਇਆ ਦੁੱਧ/ਬ੍ਰੈੱਡ ਰਾਤ ਨੂੰ ਖਰਾਬ ਹੋ ਸਕਦਾ ਹੈ - ਬਰਫ਼ ਜਾਂ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ।',
    markExpiryReturn: 'ਸਪਲਾਇਰ ਵਾਪਸੀ ਲਈ ਵੱਖਰਾ ਕਰੋ',
    closeDayAndSaveCount: 'ਦਿਨ ਬੰਦ ਕਰੋ ਤੇ ਹਿਸਾਬ ਜੋੜੋ',
    saveCountBtn: 'ਗਿਣਤੀ ਸੰਭਾਲੋ',
    estimatedDailyProfitLabel: 'ਅੱਜ ਦੀ ਅੰਦਾਜ਼ਨ ਵਿਕਰੀ ਤੋਂ ਮੁਨਾਫ਼ਾ:',
    itemsCheckingCount: 'ਸਾਮਾਨ ਦੀ ਜਾਂਚ',
    supplierReturnLabel: 'ਸਪਲਾਇਰ ਵਾਪਸੀ',
    soldCountLabel: 'ਵਿਕਿਆ',
    // Order List
    orderListHeaderTitle: 'ਥੋਕ ਸਪਲਾਇਰ ਆਰਡਰ ਪਰਚੀ',
    orderListHeaderDesc: 'ਪੂਰੀ ਪੇਟੀ, ਬੋਰੀ ਅਤੇ ਕੱਟੇ ਅਨੁਸਾਰ ਤਿਆਰ',
    orderListSummaryTitle: 'ਆਰਡਰ ਸਾਰ',
    estimatedPaymentLabel: 'ਅੰਦਾਜ਼ਨ ਕੁੱਲ ਭੁਗਤਾਨ',
    wholesaleSavingsIncluded: 'ਥੋਕ ਛੋਟ ਸ਼ਾਮਲ',
    packOrderLabel: 'ਥੋਕ ਪੇਟੀ ਆਰਡਰ',
    costLabel: 'ਲਾਗਤ',
    stockLeftPrefix: 'ਬਚਿਆ ਸਟਾਕ:',
    sendOrderViaWhatsAppBtn: 'ਵਟਸਐਪ \'ਤੇ ਆਰਡਰ ਪਰਚੀ ਭੇਜੋ',
    printOrPdfBtn: 'ਪਰਚੀ ਪ੍ਰਿੰਟ ਜਾਂ ਪੀਡੀਐਫ ਸੇਵ ਕਰੋ',
    emptyOrderListMsg: 'ਸਾਰਾ ਸਮਾਨ ਪੂਰੀ ਮਾਤਰਾ ਵਿੱਚ ਮੌਜੂਦ ਹੈ। ਹੁਣ ਕੋਈ ਆਰਡਰ ਨਹੀਂ ਚਾਹੀਦਾ।',
    // Multi-Wholesaler Order Hub
    wholesalerRationTab: 'ਰਾਸ਼ਨ ਤੇ ਮੰਡੀ ਪਰਚੀ',
    wholesalerTobaccoTab: 'ਸਿਗਰਟ ਤੇ ਤੰਬਾਕੂ',
    wholesalerDailyVanTab: 'ਰੋਜ਼ਾਨਾ ਵੈਨ ਤੇ ਸੇਲਜ਼ਮੈਨ',
    wholesalerAllTab: 'ਸਾਰੇ ਸਪਲਾਇਰ',
    rationSlipNotice: 'ਥੋਕ ਗੱਲਾ ਮੰਡੀ ਵਪਾਰੀ ਨੂੰ ਪਰਚੀ ਭੇਜਣੀ ਪੈਂਦੀ ਹੈ (WhatsApp / ਪ੍ਰਿੰਟ)',
    tobaccoAgencySlipNotice: 'ਸਿਗਰਟ ਏਜੰਸੀ ਨੂੰ ਪਰਚੀ ਭੇਜਣੀ ਪੈਂਦੀ ਹੈ (ਡੱਬਾ / ਖੋਖਾ / ਬੰਡਲ)',
    dailySalesmanNotice: 'ਸੇਲਜ਼ਮੈਨ ਦੁਕਾਨ \'ਤੇ ਰੋਜ਼ ਆਰਡਰ ਲੈਣ ਆਉਂਦੇ ਹਨ — ਰੈਕ ਚੈੱਕ ਕਰਕੇ ਆਰਡਰ ਦਿਓ',
    markOrderGivenBtn: 'ਸੇਲਜ਼ਮੈਨ ਨੂੰ ਆਰਡਰ ਦੇ ਦਿੱਤਾ ✓',
    orderGivenRecordedBadge: 'ਅੱਜ ਦਾ ਆਰਡਰ ਦੇ ਦਿੱਤਾ ਗਿਆ',
    receiveStockFromVanBtn: 'ਵੈਨ ਤੋਂ ਮਾਲ ਆ ਗਿਆ (ਸਟਾਕ ਜੋੜੋ)',
    stockReceivedSuccessMsg: 'ਵੈਨ ਤੋਂ ਮਾਲ ਸਟਾਕ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਗਿਆ!',
    slipViewMode: 'ਦੁਕਾਨ ਪਰਚੀ (Slip View)',
    listViewMode: 'ਆਈਟਮ ਲਿਸਟ (List View)',
    copySlipBtn: 'ਪਰਚੀ ਕਾਪੀ ਕਰੋ',
    slipCopiedToast: 'ਪਰਚੀ ਕਾਪੀ ਹੋ ਗਈ!',
    orderSlipShopTitle: 'ਦੁਕਾਨ ਥੋਕ ਰੀਆਰਡਰ ਪਰਚੀ',
    wholesalerVendorLabel: 'ਸਪਲਾਇਰ / ਥੋਕ ਵਪਾਰੀ',
    deliveryMethodLabel: 'ਆਰਡਰ ਦਾ ਤਰੀਕਾ',
    methodSendSlip: 'ਪਰਚੀ ਭੇਜੋ (WhatsApp / ਪ੍ਰਿੰਟ)',
    methodDailySalesman: 'ਰੋਜ਼ਾਨਾ ਵੈਨ (ਦੁਕਾਨ \'ਤੇ ਆਉਂਦੇ ਹਨ)',
    suggestWholesaleSupplier: 'ਸੁਝਾਇਆ ਗਿਆ ਸਪਲਾਇਰ',
    addWholesalerTitle: 'ਨਵਾਂ ਥੋਕ ਸਪਲਾਇਰ ਜੋੜੋ',
    wholesalerPhoneLabel: 'ਵਟਸਐਪ / ਫ਼ੋਨ ਨੰਬਰ',
    wholesalerTimingLabel: 'ਆਉਣ ਦਾ ਸਮਾਂ / ਸ਼ਡਿਊਲ',
    // Wholesale Bill Scanner
    billScanHeaderTitle: 'ਥੋਕ ਬਿੱਲ ਪੜਤਾਲ',
    billScanWarningBanner: 'ਰੁਪਇਆਂ ਦਾ ਮਾਮਲਾ ਹੈ — ਧਿਆਨ ਨਾਲ ਜਾਂਚੋ',
    billScanWarningDesc: 'ਗੋਦਾਮ ਵਿੱਚ ਮਾਲ ਲਾਹੁਣ ਤੋਂ ਪਹਿਲਾਂ ਬਿੱਲ ਦੇ ਰੇਟ ਅਤੇ ਗਿਣਤੀ ਮਿਲਾ ਲਓ।',
    wholesaleVendorLabel: 'ਥੋਕ ਵਿਕਰੇਤਾ / ਫਰਮ',
    scannedItemsCountSuffix: 'ਸਮਾਨ ਮਿਲੇ',
    itemsFoundInBillTitle: 'ਬਿੱਲ ਵਿੱਚ ਦਰਜ ਸਮਾਨ',
    tapToEditHint: 'ਬਦਲਣ ਲਈ ਲਾਈਨ \'ਤੇ ਛੂਹੋ',
    qtyColLabel: 'ਮਾਤਰਾ',
    billRateColLabel: 'ਰੇਟ',
    lineTotalColLabel: 'ਰਕਮ',
    rateFairBadge: 'ਸਹੀ ਭਾਅ ✓',
    rateCheaperBadge: 'ਪਿਛਲੀ ਵਾਰ ਨਾਲੋਂ ਸਸਤਾ',
    rateCheckBadge: 'ਜਾਂਚੋ ⚠️',
    selectPaymentMode: 'ਭੁਗਤਾਨ ਦਾ ਢੰਗ ਚੁਣੋ',
    paymentModeCash: 'ਨਕਦ ਭੁਗਤਾਨ',
    paymentModeCredit: 'ਸਪਲਾਇਰ \'ਤੇ ਉਧਾਰ',
    totalInvoiceAmount: 'ਬਿੱਲ ਦੀ ਕੁੱਲ ਰਕਮ',
    totalTaxIncluded: 'ਸਾਰੇ ਟੈਕਸ ਤੇ ਢੋਆ-ਢੁਆਈ ਸਮੇਤ',
    scanFailureMsg: 'ਫੋਟੋ ਸਾਫ਼ ਨਹੀਂ ਪੜ੍ਹੀ ਗਈ, ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਖਿੱਚੋ ਜਾਂ ਹੱਥ ਨਾਲ ਦਰਜ ਕਰੋ',
    scanningWaitMsg: 'ਪਰਚੀ ਦੀ ਲਿਖਾਈ ਅਤੇ ਦਰਾਂ ਜਾਂਚੀਆਂ ਜਾ ਰਹੀਆਂ ਹਨ...',
    uncertainFieldWarning: 'ਲਿਖਾਈ ਅਸਪਸ਼ਟ ਸੀ, ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚੋ',
    // Udhaar Ledger
    udhaarTotalMarketTitle: 'ਬਾਜ਼ਾਰ ਵਿੱਚ ਕੁੱਲ ਬਕਾਇਆ ਉਧਾਰ',
    recoveryProgressBadge: 'ਵਸੂਲੀ ਪ੍ਰਗਤੀ',
    udhaarRepaidBadge: (percent: number) => `ਕੁੱਲ ਉਧਾਰ ਦਾ ${percent}% ਵਾਪਸ ਮਿਲਿਆ`,
    regularCustomersLabel: 'ਖਾਤਾਧਾਰਕ ਗਾਹਕ',
    collectedThisWeek: 'ਇਸ ਹਫ਼ਤੇ ਵਸੂਲ ਹੋਏ',
    // Trust & Calculation Transparency
    infoTodayProfitTitle: 'ਅੱਜ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ ਕਿਵੇਂ ਗਿਣਿਆ ਜਾਂਦਾ ਹੈ?',
    infoTodayProfitDesc: 'ਮੁਨਾਫ਼ਾ = ਵਿਕਰੀ ਮੁੱਲ (Sell Price) − ਖਰੀਦ ਮੁੱਲ (Buy Price), ਅੱਜ ਵੇਚੇ ਗਏ ਹਰ ਸਮਾਨ \'ਤੇ (ਕਵਿੱਕ ਸੇਲ, ਬਾਰਕੋਡ ਸਕੈਨ ਅਤੇ ਰਾਤ ਦੀ ਗਿਣਤੀ ਤੋਂ)।',
    infoWeekProfitTitle: 'ਇਸ ਹਫ਼ਤੇ ਦਾ ਕੁੱਲ ਮੁਨਾਫ਼ਾ',
    infoWeekProfitDesc: 'ਇਸ ਚਾਲੂ ਹਫ਼ਤੇ ਵਿੱਚ ਹਰ ਦਿਨ ਹੋਏ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ੇ (ਵਿਕਰੀ ਮੁੱਲ − ਖਰੀਦ ਮੁੱਲ) ਦਾ ਕੁੱਲ ਜੋੜ।',
    infoMarginTitle: 'ਮੁਨਾਫ਼ਾ ਮਾਰਜਿਨ (Profit Margin)',
    infoMarginDesc: 'ਮਾਰਜਿਨ % = ((ਵਿਕਰੀ ਮੁੱਲ − ਖਰੀਦ ਮੁੱਲ) ÷ ਵਿਕਰੀ ਮੁੱਲ) × 100।',
    infoUdhaarRepaidTitle: 'ਉਧਾਰ ਵਸੂਲੀ ਦਰ (% Repaid)',
    infoUdhaarRepaidDesc: 'ਵਸੂਲੀ % = (ਗ੍ਰਾਹਕ ਵੱਲੋਂ ਮਿਲੀ ਕੁੱਲ ਜਮ੍ਹਾਂ ਰਕਮ ÷ ਹੁਣ ਤੱਕ ਦਿੱਤਾ ਗਿਆ ਕੁੱਲ ਉਧਾਰ) × 100।',
    searchCustomerPlaceholder: 'ਗਾਹਕ ਦਾ ਨਾਮ ਜਾਂ ਫ਼ੋਨ ਖੋਜੋ...',
    filterAllCustomers: 'ਸਾਰੇ ਖਾਤੇ',
    filterHighCredit: 'ਵੱਧ ਬਕਾਇਆ',
    filterOlder30Days: '30 ਦਿਨਾਂ ਤੋਂ ਪੁਰਾਣੇ',
    customerDueLabel: 'ਕੁੱਲ ਬਕਾਇਆ ਰਕਮ',
    recentLedgerHistory: 'ਹਾਲ ਹੀ ਦਾ ਲੈਣ-ਦੇਣ ਇਤਿਹਾਸ',
    viewFullLedger: 'ਪੂਰਾ ਖਾਤਾ ਦੇਖੋ',
    btnAddUdhaar: '+ ਉਧਾਰ ਦਿੱਤਾ',
    btnRecordPayment: '✓ ਰੁਪਏ ਜਮ੍ਹਾਂ ਕੀਤੇ',
    btnRemindWhatsApp: 'ਤਕਾਜ਼ਾ ਸੁਨੇਹਾ ਭੇਜੋ',
    otherCustomerAccountsTitle: 'ਗਾਹਕਾਂ ਦੇ ਬਹੀ-ਖਾਤੇ',
    sortByAmount: 'ਬਕਾਇਆ ਰਕਮ ਅਨੁਸਾਰ',
    btnAddNewCustomer: 'ਨਵਾਂ ਗਾਹਕ ਖਾਤਾ ਜੋੜੋ',
    lastSeenPrefix: 'ਆਖਰੀ:',
    viewHisabBtn: 'ਖਾਤਾ ਦੇਖੋ',
    newCustomerModalTitle: 'ਨਵਾਂ ਗਾਹਕ ਖਾਤਾ ਜੋੜੋ',
    customerNameLabel: 'ਗਾਹਕ ਦਾ ਨਾਮ',
    customerPhoneLabel: 'ਮੋਬਾਈਲ ਨੰਬਰ',
    customerAddressLabel: 'ਮਕਾਨ / ਪਤਾ / ਪਛਾਣ ਨੋਟ',
    initialBalanceLabel: 'ਪਹਿਲਾਂ ਦਾ ਪੁਰਾਣਾ ਬਕਾਇਆ (ਜੇਕਰ ਕੋਈ ਹੈ)',
    recordUdhaarTitle: 'ਉਧਾਰ ਦਰਜ ਕਰੋ (+)',
    recordPaymentTitle: 'ਰੁਪਏ ਜਮ੍ਹਾਂ ਦਰਜ ਕਰੋ (-)',
    amountLabel: 'ਰਕਮ (₹)',
    noteLabel: 'ਸਮਾਨ ਦਾ ਵੇਰਵਾ / ਨੋਟ',
    notePlaceholder: 'ਜਿਵੇਂ: ਆਟਾ, ਤੇਲ ਤੇ ਰਾਸ਼ਨ',
    deleteCustomerConfirm: 'ਕੀ ਤੁਸੀਂ ਇਸ ਗਾਹਕ ਦਾ ਖਾਤਾ ਹਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    // Auth
    authTitle: 'ਦੁਕਾਨਦਾਰ ਲੌਗਇਨ',
    authSubtitle: 'ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਸਟਾਕ, ਉਧਾਰ ਅਤੇ ਮੁਨਾਫ਼ਾ ਸੁਰੱਖਿਅਤ ਰੱਖੋ',
    emailOrPhoneLabel: 'ਈਮੇਲ ਜਾਂ ਫ਼ੋਨ',
    passwordLabel: 'ਪਾਸਵਰਡ',
    btnLogin: 'ਲੌਗਇਨ ਕਰੋ',
    btnSignup: 'ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ',
    btnForgotPassword: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
    btnLogout: 'ਲੌਗਆਉਟ',
    dontHaveAccount: 'ਖਾਤਾ ਨਹੀਂ ਹੈ? ਨਵਾਂ ਬਣਾਓ',
    alreadyHaveAccount: 'ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ? ਲੌਗਇਨ ਕਰੋ',
    resetPasswordSent: 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰਨ ਦਾ ਲਿੰਕ ਈਮੇਲ \'ਤੇ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।',
    btnDemoLogin: 'ਡੈਮੋ ਖਾਤੇ ਨਾਲ ਤੁਰੰਤ ਪਰਖੋ',
    profileTitle: 'ਦੁਕਾਨ ਦਾ ਪ੍ਰੋਫਾਈਲ',
    shopNameLabel: 'ਦੁਕਾਨ ਦਾ ਨਾਮ',
    ownerLabel: 'ਮਾਲਕ ਦਾ ਨਾਮ',
    profitLabel: 'ਮੁਨਾਫ਼ਾ',
    sellQuantityLabel: 'ਵਿਕਰੀ ਮਾਤਰਾ',
    customerBillTotal: 'ਗਾਹਕ ਦਾ ਕੁੱਲ ਬਿੱਲ',
    directProfit: 'ਸਿੱਧਾ ਮੁਨਾਫ਼ਾ',
    ratePerUnit: 'ਰੇਟ',
    remainingUnits: 'ਬਾਕੀ',
    morningStock: 'ਸਵੇਰ ਦਾ ਸਟਾਕ',
    soldUnits: 'ਵਿਕਿਆ',
    allItems: 'ਸਾਰੇ ਸਮਾਨ',
    todayEstimatedProfit: 'ਅੱਜ ਦੀ ਅੰਦਾਜ਼ਨ ਵਿਕਰੀ ਤੋਂ ਮੁਨਾਫ਼ਾ:',
    orderAction: 'ਮੰਗਵਾਓ',
    sufficientStock: 'ਕਾਫ਼ੀ ਸਟਾਕ',
    todaySalesCount: 'ਅੱਜ ਦੀ ਵਿਕਰੀ',
    units: 'ਇਕਾਈ',
    itemsChecked: 'ਸਮਾਨ ਦੀ ਜਾਂਚ',
    supplierReturn: 'ਸਪਲਾਇਰ ਵਾਪਸੀ',
    sendWhatsApp: 'ਵਟਸਐਪ \'ਤੇ ਭੇਜੋ',
    whatsappOrderHeader: '*ਥੋਕ ਆਰਡਰ ਪਰਚੀ — Krōw*\n\n',
    whatsappEstimatedTotal: 'ਅੰਦਾਜ਼ਨ ਕੁੱਲ ਰਕਮ',
    whatsappOrderFooter: 'ਕਿਰਪਾ ਕਰਕੇ ਉਪਰੋਕਤ ਸਮਾਨ ਜਲਦੀ ਤੋਂ ਜਲਦੀ ਗੱਡੀ ਵਿੱਚ ਲੋਡ ਕਰਵਾਓ। ਧੰਨਵਾਦ!',
    btnBackToLogin: '← ਵਾਪਸ ਲੌਗਇਨ \'ਤੇ ਜਾਓ',
    btnSendResetLink: 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਲਿੰਕ ਭੇਜੋ',
    googleSignInBtn: 'ਗੂਗਲ ਨਾਲ ਲੌਗਇਨ ਕਰੋ',
    orDivider: 'ਜਾਂ',
    scanWholesaleBillTitle: 'ਥੋਕ ਸਪਲਾਇਰ ਦਾ ਬਿੱਲ ਸਕੈਨ ਕਰੋ',
    scanWholesaleBillDesc: 'ਪਰਚੀ ਜਾਂ ਛਪੇ ਹੋਏ ਚਲਾਨ ਦੀ ਫੋਟੋ ਲਓ, Krow ਆਪਣੇ ਆਪ ਸਮਾਨ, ਰੇਟ ਅਤੇ ਮਾਤਰਾ ਪੜ੍ਹ ਲਵੇਗਾ।',
    uncertainHandwriting: 'ਲਿਖਾਈ ਅਸਪਸ਼ਟ ⚠️',
    btnDone: 'ਹੋ ਗਿਆ',
    btnChange: 'ਬਦਲੋ',
    creditGiven: 'ਉਧਾਰ ਦਿੱਤਾ',
    paymentReceived: 'ਰੁਪਏ ਜਮ੍ਹਾਂ',
    noTransactionsYet: 'ਅਜੇ ਤੱਕ ਕੋਈ ਪੁਰਾਣਾ ਲੈਣ-ਦੇਣ ਦਰਜ ਨਹੀਂ ਹੈ।',
    callButtonTitle: 'ਕਾਲ ਕਰੋ',
    todayLabel: 'ਅੱਜ',
    recentLabel: 'ਹਾਲ ਹੀ ਵਿੱਚ',
    defaultCreditNote: 'ਦੁਕਾਨ ਤੋਂ ਉਧਾਰ',
    defaultPaymentNote: 'ਨਕਦ ਜਮ੍ਹਾਂ',
    currentDueLabel: 'ਮੌਜੂਦਾ ਬਕਾਇਆ',
    customerNamePlaceholder: 'ਜਿਵੇਂ: ਰਮੇਸ਼ ਵਰਮਾ',
    customerAddressPlaceholder: 'ਜਿਵੇਂ: ਮਕਾਨ ਨੰਬਰ 12, ਮੰਦਰ ਦੇ ਸਾਹਮਣੇ',
    shopNamePlaceholder: 'ਜਿਵੇਂ: ਸ਼ਰਮਾ ਕਿਰਿਆਣਾ ਸਟੋਰ',
    daysOld: 'ਦਿਨ ਪੁਰਾਣਾ',
    counterStock: 'ਕਾਊਂਟਰ \'ਤੇ ਮੌਜੂਦ',
    actionQuickSellDesc: 'ਬਾਰਕੋਡ ਸਕੈਨ ਨਾਲ ਤੁਰੰਤ ਵਿਕਰੀ',
    actionScanBillDesc: 'ਫੋਟੋ ਪਰਚੀ ਪੜ੍ਹੋ',
    actionAddItemDesc: 'ਨਵਾਂ ਮਾਲ ਚੜ੍ਹਾਓ',
    actionNightCountDesc: 'ਦਿਨ ਬੰਦ ਤੇ ਮਿਲਾਨ',
    actionScanToSell: 'ਖੁੱਲ੍ਹਾ ਰਾਸ਼ਨ ਵਿਕਰੀ',
    actionScanToSellDesc: 'ਆਟਾ, ਦਾਲ, ਖੰਡ ਬਿਨਾਂ ਬਾਰਕੋਡ',
    actionShareStock: 'ਗਾਹਕ ਸਟਾਕ / QR',
    actionShareStockDesc: 'ਲਾਈਵ ਸਟਾਕ ਲਿੰਕ',
    barcodeLabel: 'ਬਾਰਕੋਡ',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
    phoneLabel: 'ਮੋਬਾਈਲ ਨੰਬਰ',
    phonePlaceholder: '10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ',
    optionalLabel: 'ਵਿਕਲਪਿਕ',
    storeTypeLabel: 'ਦੁਕਾਨ ਦੀ ਕਿਸਮ',
    preferredLanguageLabel: 'ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ',
    accountTypeLabel: 'ਖਾਤਾ ਸਥਿਤੀ',
    guestUserBadge: 'ਮਹਿਮਾਨ (ਡੈਮੋ ਮੋਡ)',
    signedInAs: 'ਲੌਗਇਨ ਖਾਤਾ:',
    loginOrCreateAccount: 'ਲੌਗਇਨ ਕਰੋ ਜਾਂ ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ',
    quickDemoAccount: 'ਤੁਰੰਤ ਡੈਮੋ ਖਾਤਾ',
    allStockHealthyMsg: 'ਦੁਕਾਨ ਵਿੱਚ ਸਾਰਾ ਮਾਲ ਕਾਫ਼ੀ ਹੈ! ਕੋਈ ਸਮਾਨ ਮੁੱਕਿਆ ਨਹੀਂ ਹੈ।',
    itemsNeedReorderCount: 'ਸਮਾਨ ਮੁੱਕਣ ਵਾਲੇ ਹਨ',
    bundlePacks: 'ਬੰਡਲ',
    reorderLevelPrefix: 'ਰੀਆਰਡਰ ਪੱਧਰ:',
    itemsCountSuffix: 'ਸਮਾਨ',
    totalItemsCount: 'ਕੁੱਲ ਸਮਾਨ',
    perishableBadge: 'ਛੇਤੀ ਖਰਾਬ ਹੋਣ ਵਾਲਾ',
    returnableBadge: 'ਵਾਪਸੀ ਸੰਭਵ',
    perPack: 'ਪ੍ਰਤੀ ਪੇਟੀ',
    shopStockLabel: 'ਦੁਕਾਨ ਸਟਾਕ',
    reorderBadge: 'ਰੀਆਰਡਰ',
    stockLowBadge: 'ਸਟਾਕ ਘੱਟ',
    stockAdequateBadge: 'ਕਾਫ਼ੀ',
    photoUnclearWarning: 'ਫੋਟੋ ਅਸਪਸ਼ਟ ਹੈ',
    retakeOrProceed: 'ਸਹੀ ਨਤੀਜਿਆਂ ਲਈ ਦੁਬਾਰਾ ਸਾਫ਼ ਫੋਟੋ ਲਓ, ਜਾਂ ਅੱਗੇ ਵਧੋ।',
    fieldUncertainTooltip: 'ਇਹ ਫੀਲਡ ਅਸਪਸ਼ਟ ਸੀ, ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚ ਕਰੋ',
    qualityCheckDark: 'ਫੋਟੋ ਬਹੁਤ ਹਨੇਰੀ ਹੈ',
    qualityCheckBlurry: 'ਫੋਟੋ ਧੁੰਦਲੀ ਲੱਗਦੀ ਹੈ',
    qualityCheckAngle: 'ਫੋਟੋ ਦਾ ਕੋਣ ਬਹੁਤ ਤਿਰਛਾ ਹੈ',
    preprocessingBillMsg: 'ਪਰਚੇ ਦੀ ਲਿਖਾਵਟ ਸਾਫ਼ ਅਤੇ ਸਿੱਧੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...',
    scanRetryingMsg: 'ਕੋਈ ਸਮਾਨ ਨਹੀਂ ਮਿਲਿਆ, ਹੋਰ ਸਪਸ਼ਟਤਾ ਨਾਲ ਦੁਬਾਰਾ ਸਕੈਨ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...',
    scanAutoEnhancedBadge: 'ਆਟੋ-ਐਨਹਾਂਸਡ ਅਤੇ ਸਿੱਧਾ ਕੀਤਾ ਗਿਆ',
    btnRetryScan: 'ਦੁਬਾਰਾ ਸਕੈਨ ਕਰੋ',
    counterBillingTitle: 'ਕਾਊਂਟਰ ਵਿਕਰੀ ਪਰਚਾ',
    counterBillingSubtitle: 'ਸਾਮਾਨ ਕਾਊਂਟਰ ਤੇ ਲਿਆਓ • ਪਰਚਾ ਬਣਾਓ • ਤੁਰੰਤ ਵੇਚੋ',
    counterBringPrompt: 'ਸਾਮਾਨ ਕਾਊਂਟਰ ਤੇ ਸ਼ਾਮਲ ਕਰੋ',
    counterEmptyMsg: 'ਕਾਊਂਟਰ ਖਾਲੀ ਹੈ। ਹੇਠਾਂ ਦਿੱਤੇ ਸਾਮਾਨ ਤੇ ਟੈਪ ਕਰੋ ਤਾਂ ਜੋ ਕੋਈ ਵੀ ਚੀਜ਼ ਨਾ ਛੁੱਟੇ।',
    counterAddCustomItem: '+ ਹੋਰ ਖੁੱਲ੍ਹਾ ਸਾਮਾਨ',
    counterNothingMissedMsg: 'ਕਾਊਂਟਰ ਤੇ ਸਾਰਾ ਸਾਮਾਨ ਦਰਜ ਹੈ • ਕੁਝ ਵੀ ਨਹੀਂ ਛੁੱਟਿਆ',
    counterPayCashBtn: 'ਨਕਦ ਵਿਕਰੀ (Cash)',
    counterPayUPIBtn: 'ਆਨਲਾਈਨ / UPI QR',
    counterPayUdhaarBtn: 'ਉਧਾਰ ਖਾਤੇ ਵਿੱਚ ਲਿਖੋ',
    counterNextCustomerBtn: 'ਅਗਲਾ ਗਾਹਕ (New Bill)',
    counterWhatsAppReceipt: 'WhatsApp ਤੇ ਪਰਚਾ ਭੇਜੋ',
    counterItemsOnCounter: 'ਕਾਊਂਟਰ ਤੇ ਸਾਮਾਨ',
    counterRunningTotal: 'ਕੁੱਲ ਬਿੱਲ ਰਕਮ',
    counterQuickAddPopular: 'ਮਸ਼ਹੂਰ ਕਾਊਂਟਰ ਸਾਮਾਨ',
    counterScanBarcodePrompt: 'ਬਾਰਕੋਡ ਸਕੈਨ ਕਰੋ',
  },

  en: {
    appName: 'Krow',
    appTagline: 'Smart Retail Inventory, Udhaar & Profit',
    appSubBadge: 'Know More • Grow More',
    // Navigation
    navHome: 'Home',
    navStock: 'Stock',
    navUdhaar: 'Udhaar',
    // Common Buttons
    btnContinue: 'Continue',
    btnSave: 'Save',
    btnCancel: 'Cancel',
    btnDelete: 'Delete',
    btnEdit: 'Edit',
    btnAdd: 'Add',
    btnSell: 'Sell',
    btnSendWhatsApp: 'Send Order Slip via WhatsApp',
    btnPrint: 'Print Order Slip',
    btnRetry: 'Try Again',
    btnConfirm: 'Confirm',
    btnConfirmAddToStock: 'Confirm & Add to Stock',
    btnRetakePhoto: 'Retake Photo',
    btnUploadBill: 'Upload Bill Photo',
    btnTakePhoto: 'Take Camera Photo',
    btnUseSampleBill: 'Try Sample Bill',
    btnSearch: 'Search',
    // Onboarding
    onboardingStep1Title: 'Select Your Language',
    onboardingStep1Badge: '4 Choices',
    onboardingStep2Title: 'Select Store Type',
    onboardingStep2Badge: 'Pick One',
    onboardingTrustTip: 'Your ledger is fully secured. Works offline seamlessly.',
    storeTypeKiranaTitle: 'Kirana / General Store',
    storeTypeKiranaDesc: 'Daily groceries, packaged goods & staples',
    storeTypeGeneralStoreTitle: 'General Store / Grocery',
    storeTypeGeneralStoreDesc: 'Daily groceries, grains, edible oils, spices & snacks',
    storeTypeStationeryTitle: 'Stationery & Books',
    storeTypeStationeryDesc: 'Notebooks, registers, pens, craft & office supplies',
    storeTypeUniformTitle: 'Uniform & Apparel Store',
    storeTypeUniformDesc: 'School uniforms, shirts, trousers, ties, belts, socks & shoes',
    storeTypeGiftShopTitle: 'Gift Shop & Novelties',
    storeTypeGiftShopDesc: 'Toys, showpieces, wall clocks, frames, cards & decor',
    storeDropdownLabel: 'Store Type (Choose from dropdown)',
    storeDropdownPlaceholder: 'Select store type...',
    selectedTag: 'Selected',
    changeLaterNote: 'Language and store type can be changed anytime in settings.',
    // Home Dashboard
    todayNetProfit: "Today's Net Profit",
    growthBadge: 'Live Ledger',
    weekNetProfit: "This Week's Net Profit",
    totalStockItems: 'Total SKUs',
    availableStock: 'In Stock',
    runningOutSoon: 'Running out soon',
    totalMarketUdhaar: 'Total Market Udhaar',
    remainingToCollect: 'to collect',
    onCustomersCount: 'customers',
    counterQuickActions: 'Counter Quick Actions',
    actionQuickSell: 'Quick Sell (Barcode)',
    actionScanBill: 'Scan Bill',
    actionAddItem: 'Add Item',
    actionNightCount: 'Night Count',
    needsAttentionSection: 'Needs Attention',
    alertsCountSuffix: 'Alerts',
    sellByTonight: 'Sell by tonight',
    stockEmpty: 'Out of stock',
    limitedStock: 'Limited stock',
    leftUnits: 'left',
    reorderLevelLabel: 'Reorder Level',
    // Stock List
    stockListTitle: 'Stock Inventory',
    searchStockPlaceholder: 'Search item name...',
    filterAll: 'All',
    orderListAction: 'Reorder List',
    addNewItem: 'Add Item',
    emptyStockMsg: 'No items found. Add your first inventory item.',
    // Add Item
    addItemTitle: 'Add New Stock Item',
    editItemTitle: 'Edit Stock Item',
    mainDetailsSection: 'Primary Details',
    itemNameLabel: 'Item Name',
    itemNamePlaceholder: 'e.g. Rajdhani Chana Dal 1kg',
    categoryLabel: 'Select Category',
    unitSection: 'Custom Unit & Measure',
    unitTypeLabel: 'Unit Type',
    unitTypePlaceholder: 'e.g. packet, laddi, bori, katta, box, dozen, kg',
    unitHelperHint: 'Use your shop unit: packet, laddi, bori, katta, carton, kg',
    packSizeLabel: 'Pack Size when ordering (Optional)',
    packSizePlaceholder: 'e.g. 24 packets per carton',
    stockQtyAlertSection: 'Stock Quantity & Alerts',
    currentShopStockLabel: 'Current Counter Stock',
    reorderLevelAlertLabel: 'Reorder Alert Threshold',
    reorderHelperHint: 'Alert when inventory drops to this level to avoid stockouts',
    pricingSection: 'Cost & Selling Price',
    costPriceLabel: 'Buy Price (Cost)',
    sellPriceLabel: 'Sell Price',
    profitMarginLabel: 'Direct Profit Margin',
    profitableDealBadge: 'Profitable Margin',
    expirySection: 'Perishable & Return Policy',
    perishableOption: 'Spoils quickly (Milk, Bread, Curd)',
    perishableOptionDesc: 'Short shelf-life fresh goods (2-3 days)',
    exchangeableOption: 'Exchangeable with supplier (Vendor replaces spoiled packets)',
    exchangeableOptionDesc: 'e.g. Bread, chips - replaced on delivery',
    pureLossOption: 'Pure loss when wasted (No supplier return)',
    pureLossOptionDesc: 'e.g. Loose milk - full loss if soured',
    regularNonPerishableOption: 'Regular non-perishable merchandise',
    regularOptionDesc: 'Dry groceries and goods with long shelf life',
    supplierNameLabel: 'Wholesale Supplier Name (Optional)',
    supplierNamePlaceholder: 'e.g. Gupta Wholesale Agency',
    saveItemBtn: 'Save Item',
    // Night Count
    nightCountTitle: 'Night Stock Count',
    nightCountHeaderTitle: 'Closing Counter Stock Audit',
    nightCountHeaderDesc: 'Fast closing count before shutting shop shutters so tomorrow morning starts clean.',
    pendingCountBadge: 'Live Tally',
    pendingCountLabel: 'Pending Count',
    itemsTallyDoneMsg: 'Items sold today will be recorded automatically into your profit ledger upon confirmation.',
    morningStockLabel: 'Morning Stock',
    calculatedSalesLabel: 'Calculated Sold',
    enterRemainingStockLabel: 'Enter remaining stock:',
    perishableWarning: 'Remaining perishable stock may spoil by morning - store in refrigerator.',
    markExpiryReturn: 'Mark for supplier exchange / return',
    closeDayAndSaveCount: 'Close Today & Reconcile Balances',
    saveCountBtn: 'Save Closing Count',
    estimatedDailyProfitLabel: "Today's estimated sales profit:",
    itemsCheckingCount: 'items check',
    supplierReturnLabel: 'Supplier return',
    soldCountLabel: 'Sold',
    // Order List
    orderListHeaderTitle: 'Wholesale Order List Ready',
    orderListHeaderDesc: 'Auto-rounded to full crates, bundles, and cartons',
    orderListSummaryTitle: 'Order Summary',
    estimatedPaymentLabel: 'Estimated Total Cost',
    wholesaleSavingsIncluded: 'Bulk Savings Included',
    packOrderLabel: 'Wholesale Bundle Order',
    costLabel: 'Cost',
    stockLeftPrefix: 'Stock:',
    sendOrderViaWhatsAppBtn: 'Send Order Slip via WhatsApp',
    printOrPdfBtn: 'Print / Save PDF Slip',
    emptyOrderListMsg: 'All items are well stocked above reorder thresholds.',
    // Multi-Wholesaler Order Hub
    wholesalerRationTab: 'Ration & Mandi',
    wholesalerTobaccoTab: 'Tobacco & Cigarettes',
    wholesalerDailyVanTab: 'Daily Route Van',
    wholesalerAllTab: 'All Wholesalers',
    rationSlipNotice: 'Send order slip to Mandi / grain merchant (WhatsApp / Print)',
    tobaccoAgencySlipNotice: 'Send indent slip to Cigarette Agency (Packets / Cartons)',
    dailySalesmanNotice: 'Salesman visits shop daily — Counter check empty racks & order',
    markOrderGivenBtn: 'Mark Order Given to Salesman ✓',
    orderGivenRecordedBadge: "Today's order recorded as given",
    receiveStockFromVanBtn: 'Stock Received from Van (Restock)',
    stockReceivedSuccessMsg: 'Items received from van and added to store stock!',
    slipViewMode: 'Order Slip View',
    listViewMode: 'Item List View',
    copySlipBtn: 'Copy Slip Text',
    slipCopiedToast: 'Order slip copied to clipboard!',
    orderSlipShopTitle: 'Wholesale Reorder Slip',
    wholesalerVendorLabel: 'Supplier / Wholesaler',
    deliveryMethodLabel: 'Ordering & Delivery Method',
    methodSendSlip: 'Send Slip (WhatsApp / Print)',
    methodDailySalesman: 'Daily Van (Visits Shop Daily)',
    suggestWholesaleSupplier: 'Suggested Wholesaler',
    addWholesalerTitle: 'Add New Wholesaler',
    wholesalerPhoneLabel: 'WhatsApp / Phone Number',
    wholesalerTimingLabel: 'Visit Time / Order Schedule',
    // Wholesale Bill Scanner
    billScanHeaderTitle: 'Verify Wholesale Bill',
    billScanWarningBanner: 'Money matters — Verify carefully',
    billScanWarningDesc: 'Check bill prices and counts before unloading crates into storage.',
    wholesaleVendorLabel: 'Wholesale Vendor',
    scannedItemsCountSuffix: 'Items Scanned',
    itemsFoundInBillTitle: 'Items Found on Bill',
    tapToEditHint: 'Tap line to edit',
    qtyColLabel: 'Qty',
    billRateColLabel: 'Rate',
    lineTotalColLabel: 'Line Total',
    rateFairBadge: 'Rate OK ✓',
    rateCheaperBadge: 'Cheaper than previous',
    rateCheckBadge: 'Check Qty ⚠️',
    selectPaymentMode: 'Select Payment Mode',
    paymentModeCash: 'Cash Paid',
    paymentModeCredit: 'Supplier Credit (Udhaar)',
    totalInvoiceAmount: 'Total Bill Amount',
    totalTaxIncluded: 'Inclusive of all charges',
    scanFailureMsg: "Couldn't read this photo, try again or add manually",
    scanningWaitMsg: 'Analyzing handwritten invoice & line rates...',
    uncertainFieldWarning: 'Handwriting was uncertain, please verify',
    // Udhaar Ledger
    udhaarTotalMarketTitle: 'Total Market Udhaar Due',
    recoveryProgressBadge: 'Collection Progress',
    udhaarRepaidBadge: (percent: number) => `${percent}% of udhaar repaid`,
    regularCustomersLabel: 'Regular Customers',
    collectedThisWeek: 'Collected this week',
    // Trust & Calculation Transparency
    infoTodayProfitTitle: "How Today's Net Profit is calculated",
    infoTodayProfitDesc: 'Profit = sell price − buy price, per item sold today (from Quick Sell, Barcode Scan to Sell, and Night Count entries).',
    infoWeekProfitTitle: "This Week's Net Profit",
    infoWeekProfitDesc: 'Sum of daily net profits (sell price − buy price) for all sales recorded during the current week.',
    infoMarginTitle: 'Profit Margin',
    infoMarginDesc: 'Margin % = ((sell price − buy price) ÷ sell price) × 100. Shows gross profit earned on every unit sold.',
    infoUdhaarRepaidTitle: 'Udhaar Repayment Rate (% Repaid)',
    infoUdhaarRepaidDesc: 'Repayment % = (total payments received from customer ÷ total credit ever given to customer) × 100.',
    searchCustomerPlaceholder: 'Search customer by name or phone...',
    filterAllCustomers: 'All',
    filterHighCredit: 'High Credit',
    filterOlder30Days: 'Older than 30 Days',
    customerDueLabel: 'Total Balance Due',
    recentLedgerHistory: 'Recent Transaction History',
    viewFullLedger: 'Full Ledger',
    btnAddUdhaar: '+ Give Credit',
    btnRecordPayment: '✓ Record Payment',
    btnRemindWhatsApp: 'Send WhatsApp Reminder',
    otherCustomerAccountsTitle: 'Customer Ledger Accounts',
    sortByAmount: 'By Balance',
    btnAddNewCustomer: 'Add Customer',
    lastSeenPrefix: 'Last:',
    viewHisabBtn: 'View Account',
    newCustomerModalTitle: 'Add New Customer Account',
    customerNameLabel: 'Customer Name',
    customerPhoneLabel: 'Phone Number',
    customerAddressLabel: 'House / Shop / Landmark Note',
    initialBalanceLabel: 'Opening Due Balance (if any)',
    recordUdhaarTitle: 'Log Credit Given (+)',
    recordPaymentTitle: 'Record Payment Received (-)',
    amountLabel: 'Amount (₹)',
    noteLabel: 'Item description / note',
    notePlaceholder: 'e.g. Atta & Oil groceries',
    deleteCustomerConfirm: 'Are you sure you want to delete this customer account?',
    // Auth
    authTitle: 'Shopkeeper Login',
    authSubtitle: 'Keep your store inventory, udhaar and profit secure',
    emailOrPhoneLabel: 'Email or Phone',
    passwordLabel: 'Password',
    btnLogin: 'Login',
    btnSignup: 'Sign Up',
    btnForgotPassword: 'Forgot Password?',
    btnLogout: 'Logout',
    dontHaveAccount: "Don't have an account? Sign up",
    alreadyHaveAccount: 'Already have an account? Login',
    resetPasswordSent: 'Password reset link sent to your email.',
    btnDemoLogin: 'Try Demo Account Instantly',
    profileTitle: 'Shop Profile',
    shopNameLabel: 'Shop Name',
    ownerLabel: 'Owner Name',
    profitLabel: 'Profit',
    sellQuantityLabel: 'Sell Quantity',
    customerBillTotal: 'Customer Total Bill',
    directProfit: 'Direct Profit',
    ratePerUnit: 'Rate',
    remainingUnits: 'left',
    morningStock: 'Morning Stock',
    soldUnits: 'Sold',
    allItems: 'All Items',
    todayEstimatedProfit: "Estimated profit from today's sales:",
    orderAction: 'Reorder',
    sufficientStock: 'Sufficient Stock',
    todaySalesCount: "Today's Sales",
    units: 'units',
    itemsChecked: 'items audited',
    supplierReturn: 'Supplier Return',
    sendWhatsApp: 'Send via WhatsApp',
    whatsappOrderHeader: '*Wholesale Reorder Slip — Krōw*\n\n',
    whatsappEstimatedTotal: 'Estimated Total Bill',
    whatsappOrderFooter: 'Please load and dispatch the items as soon as possible. Thank you!',
    btnBackToLogin: '← Back to Login',
    btnSendResetLink: 'Send Password Reset Link',
    googleSignInBtn: 'Sign in with Google',
    orDivider: 'OR',
    scanWholesaleBillTitle: 'Scan Wholesale Bill or Invoice',
    scanWholesaleBillDesc: 'Snap a photo of supplier handwritten slip or printed invoice, Krow will auto-extract items, rates and quantities.',
    uncertainHandwriting: 'Unclear handwriting ⚠️',
    btnDone: 'Done',
    btnChange: 'Change',
    creditGiven: 'Credit Given',
    paymentReceived: 'Payment Received',
    noTransactionsYet: 'No transaction records found yet.',
    callButtonTitle: 'Call',
    todayLabel: 'Today',
    recentLabel: 'Recent',
    defaultCreditNote: 'Credit items',
    defaultPaymentNote: 'Cash payment',
    currentDueLabel: 'Current Balance Due',
    customerNamePlaceholder: 'e.g. Rakesh Sharma',
    customerAddressPlaceholder: 'e.g. House 12, Opposite Temple',
    shopNamePlaceholder: 'e.g. Sharma General Store',
    daysOld: 'days old',
    counterStock: 'On Counter',
    actionQuickSellDesc: 'Fast barcode scan & POS',
    actionScanBillDesc: 'Read wholesale slip',
    actionAddItemDesc: 'Record new stock',
    actionNightCountDesc: 'Closing audit & tally',
    actionScanToSell: 'Loose Ration Sell',
    actionScanToSellDesc: 'Atta, dal, sugar without barcode',
    actionShareStock: 'Customer Stock & QR',
    actionShareStockDesc: 'Live counter link & QR',
    barcodeLabel: 'Barcode',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '10-digit mobile number',
    optionalLabel: 'Optional',
    storeTypeLabel: 'Store Type',
    preferredLanguageLabel: 'Preferred Language',
    accountTypeLabel: 'Account Status',
    guestUserBadge: 'Guest (Demo Mode)',
    signedInAs: 'Signed in as:',
    loginOrCreateAccount: 'Sign In or Create Account',
    quickDemoAccount: 'Quick Demo Account',
    allStockHealthyMsg: 'All stock is sufficient! No reorders needed.',
    itemsNeedReorderCount: 'items need reorder',
    bundlePacks: 'bundles',
    reorderLevelPrefix: 'Reorder Level:',
    itemsCountSuffix: 'items',
    totalItemsCount: 'total items',
    perishableBadge: 'Perishable',
    returnableBadge: 'Returnable',
    perPack: 'per carton',
    shopStockLabel: 'Counter Stock',
    reorderBadge: 'Reorder',
    stockLowBadge: 'Low Stock',
    stockAdequateBadge: 'Adequate',
    photoUnclearWarning: 'Photo unclear or blurry',
    retakeOrProceed: 'Retake a clearer photo for best accuracy, or proceed anyway.',
    fieldUncertainTooltip: 'Uncertain reading, please verify',
    qualityCheckDark: 'Photo is too dark',
    qualityCheckBlurry: 'Photo appears blurry',
    qualityCheckAngle: 'Extreme camera angle',
    preprocessingBillMsg: 'Enhancing contrast and straightening bill...',
    scanRetryingMsg: 'No items detected, retrying with enhanced clarity...',
    scanAutoEnhancedBadge: 'Auto-Enhanced & Deskewed',
    btnRetryScan: 'Retry Scan',
    counterBillingTitle: 'Counter Sell POS',
    counterBillingSubtitle: 'Bring items to counter • Build list • Quick checkout',
    counterBringPrompt: 'Bring items onto counter',
    counterEmptyMsg: 'Counter is empty. Tap items below or search so that nothing is missed.',
    counterAddCustomItem: '+ Custom / Loose Item',
    counterNothingMissedMsg: 'All items accounted for • Nothing missed',
    counterPayCashBtn: 'Cash Checkout',
    counterPayUPIBtn: 'Online / UPI QR',
    counterPayUdhaarBtn: 'Add to Udhaar Ledger',
    counterNextCustomerBtn: 'Next Customer (New Bill)',
    counterWhatsAppReceipt: 'Send WhatsApp Slip',
    counterItemsOnCounter: 'Items on Counter',
    counterRunningTotal: 'Total Bill Amount',
    counterQuickAddPopular: 'Quick Shelf Items',
    counterScanBarcodePrompt: 'Scan Barcode',
  },

  ja: {
    appName: 'Krow',
    appTagline: 'スマート在庫・売掛・純利益管理台帳',
    appSubBadge: 'Know More • Grow More',
    // Navigation
    navHome: 'ホーム',
    navStock: '在庫管理',
    navUdhaar: '売掛金 (ツケ)',
    // Common Buttons
    btnContinue: '次へ',
    btnSave: '保存する',
    btnCancel: 'キャンセル',
    btnDelete: '削除',
    btnEdit: '編集',
    btnAdd: '追加',
    btnSell: '販売',
    btnSendWhatsApp: 'WhatsAppで発注伝票を送信',
    btnPrint: '伝票を印刷',
    btnRetry: '再試行',
    btnConfirm: '確認する',
    btnConfirmAddToStock: '確認して在庫に追加',
    btnRetakePhoto: '再撮影',
    btnUploadBill: '伝票画像をアップロード',
    btnTakePhoto: 'カメラで撮影',
    btnUseSampleBill: 'サンプル伝票で試す',
    btnSearch: '検索',
    // Onboarding
    onboardingStep1Title: '言語を選択してください',
    onboardingStep1Badge: '4言語対応',
    onboardingStep2Title: '店舗の業態を選択',
    onboardingStep2Badge: '1つ選択',
    onboardingTrustTip: 'データは安全に保護されます。オフラインでも正常に動作します。',
    storeTypeKiranaTitle: '食料品・雑貨店 (キラーナ)',
    storeTypeKiranaDesc: '日用食料品、乳製品、調味料、雑貨',
    storeTypeGeneralStoreTitle: 'ジェネラルストア / 食料品・日用品',
    storeTypeGeneralStoreDesc: '日用食料品、穀物、油、調味料、スナック菓子',
    storeTypeStationeryTitle: '文房具・書籍店',
    storeTypeStationeryDesc: 'ノート、筆記用具、事務用品、画材',
    storeTypeUniformTitle: '学生服・ユニフォーム専門店',
    storeTypeUniformDesc: '学校制服、シャツ、スラックス、ネクタイ、靴下、靴',
    storeTypeGiftShopTitle: 'ギフト・おもちゃ・雑貨店',
    storeTypeGiftShopDesc: 'おもちゃ、置物、時計、フォトフレーム、贈答品',
    storeDropdownLabel: '店舗業態（ドロップダウンから選択）',
    storeDropdownPlaceholder: '業態を選択してください...',
    selectedTag: '選択中',
    changeLaterNote: '言語や業態は設定メニューからいつでも変更可能です。',
    // Home Dashboard
    todayNetProfit: '本日の純利益',
    growthBadge: 'リアルタイム台帳',
    weekNetProfit: '今週の累計利益',
    totalStockItems: '登録品目数',
    availableStock: '適正在庫',
    runningOutSoon: 'まもなく欠品',
    totalMarketUdhaar: '市場の売掛金残高',
    remainingToCollect: '回収待ち',
    onCustomersCount: '名の顧客',
    counterQuickActions: '店頭クイック操作',
    actionQuickSell: '即時売上（バーコード）',
    actionScanBill: '伝票スキャン',
    actionAddItem: '商品登録',
    actionNightCount: '夜間棚卸',
    needsAttentionSection: '要対応・アラート',
    alertsCountSuffix: '件',
    sellByTonight: '本日中に販売推奨',
    stockEmpty: '在庫切れ (欠品)',
    limitedStock: '在庫僅少',
    leftUnits: '残',
    reorderLevelLabel: '発注点',
    // Stock List
    stockListTitle: '店舗在庫一覧',
    searchStockPlaceholder: '商品名を検索...',
    filterAll: 'すべて',
    orderListAction: '発注リスト',
    addNewItem: '新規商品を登録',
    emptyStockMsg: '該当する商品がありません。新しい商品を登録してください。',
    // Add Item
    addItemTitle: '新規商品を追加',
    editItemTitle: '商品情報の編集',
    mainDetailsSection: '基本情報',
    itemNameLabel: '商品名',
    itemNamePlaceholder: '例: ラージダーニー 小麦粉 10kg袋',
    categoryLabel: '商品カテゴリー',
    unitSection: '数量・荷姿単位',
    unitTypeLabel: '単位 (パック、袋、箱など)',
    unitTypePlaceholder: '例: パック、袋、連、箱、ダース、kg',
    unitHelperHint: '店舗で日常使用している荷姿単位を入力してください',
    packSizeLabel: '仕入れ荷姿の入り数 (任意)',
    packSizePlaceholder: '例: 1箱あたり24パック入り',
    stockQtyAlertSection: '在庫数と発注点アラート',
    currentShopStockLabel: '現在の店頭在庫数',
    reorderLevelAlertLabel: '発注点アラート閾値',
    reorderHelperHint: '在庫数がこの数量を下回ると、発注推奨アラートを表示します',
    pricingSection: '仕入価格と販売価格',
    costPriceLabel: '仕入原価 (円/ルピー)',
    sellPriceLabel: '店頭売価 (円/ルピー)',
    profitMarginLabel: '1個あたりの粗利益',
    profitableDealBadge: '適正利益率',
    expirySection: '賞味期限と返品規約',
    perishableOption: '日持ちしない生鮮品 (牛乳、パン、ヨーグルト)',
    perishableOptionDesc: '賞味期限が極めて短い商品 (2〜3日)',
    exchangeableOption: '仕入先による不良返品・交換可能 (賞味期限切れ交換あり)',
    exchangeableOptionDesc: '例: パン、スナック菓子 (次回配送時に交換)',
    pureLossOption: '期限切れ時は全額廃棄損 (仕入先返品不可)',
    pureLossOptionDesc: '例: 量り売り生乳 (変質時は店舗負担)',
    regularNonPerishableOption: '一般常温・長期保存可能品',
    regularOptionDesc: '穀類、食用油、石鹸など日持ちする日用品',
    supplierNameLabel: '卸売問屋・仕入先名 (任意)',
    supplierNamePlaceholder: '例: グプタ総合卸売商社',
    saveItemBtn: '商品を保存する',
    // Night Count
    nightCountTitle: '夜間在庫棚卸・日締め',
    nightCountHeaderTitle: '店舗閉店時のレジ・在庫照合',
    nightCountHeaderDesc: '閉店前に約3分で店頭在庫を照合し、翌朝スムーズに営業再開できるようにします。',
    pendingCountBadge: '照合状況',
    pendingCountLabel: '未照合品目',
    itemsTallyDoneMsg: '照合を確認すると、本日販売された数量と粗利益が自動的に帳簿に記録されます。',
    morningStockLabel: '始業時在庫',
    calculatedSalesLabel: '本日推定販売数',
    enterRemainingStockLabel: '閉店時の残数を入力:',
    perishableWarning: '残りの生鮮品は翌朝までに劣化する恐れがあります。保冷庫に保管してください。',
    markExpiryReturn: '仕入先への返品・交換分として計上',
    closeDayAndSaveCount: '本日の営業を締め、残高を確定',
    saveCountBtn: '棚卸結果を確定保存',
    estimatedDailyProfitLabel: '本日の推定売上利益:',
    itemsCheckingCount: '品目の確認',
    supplierReturnLabel: '仕入先返品',
    soldCountLabel: '販売済',
    // Order List
    orderListHeaderTitle: '問屋向け仕入れ発注伝票',
    orderListHeaderDesc: '箱・カートン単位に自動丸め計算済み',
    orderListSummaryTitle: '発注サマリー',
    estimatedPaymentLabel: '推定仕入総額',
    wholesaleSavingsIncluded: 'まとめ仕入れ割引適用済み',
    packOrderLabel: '箱単位まとめ発注',
    costLabel: '仕入原価',
    stockLeftPrefix: '現在庫:',
    sendOrderViaWhatsAppBtn: 'WhatsAppで発注伝票を送信',
    printOrPdfBtn: '伝票を印刷 / PDF保存',
    emptyOrderListMsg: '全商品の在庫が発注点を超えており、現在発注の必要はありません。',
    // Multi-Wholesaler Order Hub
    wholesalerRationTab: '穀物・調味料卸',
    wholesalerTobaccoTab: 'たばこ総代理店',
    wholesalerDailyVanTab: '巡回営業・配送',
    wholesalerAllTab: '全仕入先',
    rationSlipNotice: '穀物・調味料卸売店へ発注書を送付（WhatsApp / 印刷）',
    tobaccoAgencySlipNotice: 'たばこ総代理店へ発注伝票を送付（カートン単位）',
    dailySalesmanNotice: '巡回営業担当が毎日店頭訪問 — 陳列棚を確認して即時発注',
    markOrderGivenBtn: '担当者に発注済みにする ✓',
    orderGivenRecordedBadge: '本日の発注完了を記録しました',
    receiveStockFromVanBtn: '巡回車から入荷受領（在庫加算）',
    stockReceivedSuccessMsg: '巡回車からの納品を在庫に反映しました！',
    slipViewMode: '発注伝票ビュー',
    listViewMode: '商品一覧ビュー',
    copySlipBtn: '伝票テキストをコピー',
    slipCopiedToast: '伝票をクリップボードにコピーしました！',
    orderSlipShopTitle: '店舗仕入発注伝票',
    wholesalerVendorLabel: '仕入先・問屋',
    deliveryMethodLabel: '発注・納品方式',
    methodSendSlip: '伝票送付（WhatsApp / 印刷）',
    methodDailySalesman: '定期巡回（毎日店舗訪問）',
    suggestWholesaleSupplier: '推奨仕入先',
    addWholesalerTitle: '新しい仕入先を追加',
    wholesalerPhoneLabel: '電話 / 連絡先',
    wholesalerTimingLabel: '訪問時間・スケジュール',
    // Wholesale Bill Scanner
    billScanHeaderTitle: '仕入納品書・領収書スキャン検証',
    billScanWarningBanner: '確実な照合 — 荷受け時の検品',
    billScanWarningDesc: '倉庫への搬入前に、納品書の単価と入荷数量を必ず照合してください。',
    wholesaleVendorLabel: '仕入先問屋名',
    scannedItemsCountSuffix: '品目を検出',
    itemsFoundInBillTitle: '伝票から検出された品目',
    tapToEditHint: 'タップして直接修正可能',
    qtyColLabel: '数量',
    billRateColLabel: '単価',
    lineTotalColLabel: '金額',
    rateFairBadge: '適正単価 ✓',
    rateCheaperBadge: '前回より安値',
    rateCheckBadge: '要数量確認 ⚠️',
    selectPaymentMode: '支払区分を選択',
    paymentModeCash: '現金払い (済)',
    paymentModeCredit: '買掛金 (ツケ仕入れ)',
    totalInvoiceAmount: '伝票請求合計額',
    totalTaxIncluded: '諸費用・税込み',
    scanFailureMsg: '画像を正常に読み取れませんでした。再撮影するか手動で入力してください。',
    scanningWaitMsg: '手書き伝票と仕入単価を解析中...',
    uncertainFieldWarning: '筆跡が不鮮明な箇所があります。内容をご確認ください。',
    // Udhaar Ledger
    udhaarTotalMarketTitle: '市場の顧客売掛金 (ツケ) 総額',
    recoveryProgressBadge: '回収進捗',
    udhaarRepaidBadge: (percent: number) => `ツケの${percent}%回収済`,
    regularCustomersLabel: '掛売り顧客',
    collectedThisWeek: '今週の回収額',
    // Trust & Calculation Transparency
    infoTodayProfitTitle: '本日の純利益の計算方法',
    infoTodayProfitDesc: '純利益 = 販売価格 − 仕入価格（本日記録されたクイック販売・バーコード販売・夜間棚卸より集計）。',
    infoWeekProfitTitle: '今週の純利益',
    infoWeekProfitDesc: '今週記録された全販売の純利益の合計額。',
    infoMarginTitle: '利益率 (Profit Margin)',
    infoMarginDesc: '利益率 % = ((販売価格 − 仕入価格) ÷ 販売価格) × 100。',
    infoUdhaarRepaidTitle: 'ツケ回収率 (% Repaid)',
    infoUdhaarRepaidDesc: '回収率 % = (顧客からの回収累計額 ÷ 提供したツケ累計額) × 100。',
    searchCustomerPlaceholder: '顧客名または電話番号で検索...',
    filterAllCustomers: '全顧客',
    filterHighCredit: '高額売掛',
    filterOlder30Days: '30日以上未回収',
    customerDueLabel: '売掛残高合計',
    recentLedgerHistory: '最近の取引履歴',
    viewFullLedger: '全台帳を見る',
    btnAddUdhaar: '+ ツケを記録 (売掛)',
    btnRecordPayment: '✓ 入金を記録 (回収)',
    btnRemindWhatsApp: 'WhatsAppで督促・入金案内を送信',
    otherCustomerAccountsTitle: '顧客別売掛台帳',
    sortByAmount: '残高順',
    btnAddNewCustomer: '新規顧客を追加',
    lastSeenPrefix: '最終取引:',
    viewHisabBtn: '台帳を開く',
    newCustomerModalTitle: '新規顧客口座の登録',
    customerNameLabel: '顧客名',
    customerPhoneLabel: '電話番号',
    customerAddressLabel: '住所・目印・店舗メモ',
    initialBalanceLabel: '開始時売掛残高 (繰越残高)',
    recordUdhaarTitle: 'ツケ (掛売り) を記録 (+)',
    recordPaymentTitle: '入金を記録 (-)',
    amountLabel: '金額 (円/₹)',
    noteLabel: '品目内容・備考メモ',
    notePlaceholder: '例: 小麦粉・油・調味料一式',
    deleteCustomerConfirm: 'この顧客の台帳を削除してもよろしいですか？',
    // Auth
    authTitle: '店舗ログイン',
    authSubtitle: '在庫・売掛金・利益データを安全にクラウド保管',
    emailOrPhoneLabel: 'メールアドレスまたは電話番号',
    passwordLabel: 'パスワード',
    btnLogin: 'ログイン',
    btnSignup: '新規登録',
    btnForgotPassword: 'パスワードをお忘れですか？',
    btnLogout: 'ログアウト',
    dontHaveAccount: 'アカウントをお持ちでないですか？ 新規登録',
    alreadyHaveAccount: 'すでにアカウントをお持ちですか？ ログイン',
    resetPasswordSent: 'パスワード再設定リンクをメールに送信しました。',
    btnDemoLogin: 'デモ店舗で今すぐ体験',
    profileTitle: '店舗プロフィール設定',
    shopNameLabel: '店舗名 (屋号)',
    ownerLabel: '店主名',
    profitLabel: '粗利',
    sellQuantityLabel: '販売数量',
    customerBillTotal: 'お会計合計金額',
    directProfit: '販売粗利益',
    ratePerUnit: '単価',
    remainingUnits: '残',
    morningStock: '朝の在庫',
    soldUnits: '売上数',
    allItems: '全品目',
    todayEstimatedProfit: '本日の販売粗利推計:',
    orderAction: '発注',
    sufficientStock: '在庫適正',
    todaySalesCount: '本日の売上数',
    units: '個/単位',
    itemsChecked: '品目を点検',
    supplierReturn: '仕入先返品',
    sendWhatsApp: 'WhatsAppで送信',
    whatsappOrderHeader: '*仕入れ発注伝票 — Krōw*\n\n',
    whatsappEstimatedTotal: '推定発注総額',
    whatsappOrderFooter: '上記の商品を至急手配・出荷してください。よろしくお願いいたします。',
    btnBackToLogin: '← ログインに戻る',
    btnSendResetLink: '再設定リンクを送信',
    googleSignInBtn: 'Googleでログイン',
    orDivider: 'または',
    scanWholesaleBillTitle: '仕入納品書・領収書のスキャン',
    scanWholesaleBillDesc: '手書きの伝票や印刷レシートを撮影すると、商品名・数量・単価を自動抽出します。',
    uncertainHandwriting: '手書き判読注意 ⚠️',
    btnDone: '完了',
    btnChange: '変更',
    creditGiven: 'ツケ発生 (売掛)',
    paymentReceived: '入金完了',
    noTransactionsYet: '過去の取引履歴はまだありません。',
    callButtonTitle: '発信',
    todayLabel: '本日',
    recentLabel: '直近',
    defaultCreditNote: '店頭掛売り',
    defaultPaymentNote: '現金入金',
    currentDueLabel: '現在の売掛残高',
    customerNamePlaceholder: '例: 田中 太郎',
    customerAddressPlaceholder: '例: 3丁目5番地 寺院前',
    shopNamePlaceholder: '例: シャルマ商店',
    daysOld: '日経過',
    counterStock: '店頭在庫',
    actionQuickSellDesc: 'バーコードスキャンで即時販売',
    actionScanBillDesc: '納品書を自動読取',
    actionAddItemDesc: '新商品を在庫に追加',
    actionNightCountDesc: '日締めと在庫照合',
    actionScanToSell: '量り売り・バラ売り',
    actionScanToSellDesc: 'バーコードなし商品の手動販売',
    actionShareStock: '顧客向け在庫・QR',
    actionShareStockDesc: '店頭公開リンクとQR',
    barcodeLabel: 'バーコード',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
    phoneLabel: '電話番号',
    phonePlaceholder: '10桁または11桁の電話番号',
    optionalLabel: '任意',
    storeTypeLabel: '店舗の業態',
    preferredLanguageLabel: '使用言語',
    accountTypeLabel: 'アカウント区分',
    guestUserBadge: 'ゲスト (デモモード)',
    signedInAs: 'ログイン中:',
    loginOrCreateAccount: 'ログインまたは新規登録',
    quickDemoAccount: 'ワンクリック・デモ体験',
    allStockHealthyMsg: 'すべての在庫が適正です！ 現在発注が必要な商品はありません。',
    itemsNeedReorderCount: '品目が欠品リスクに達しています',
    bundlePacks: '箱/束',
    reorderLevelPrefix: '発注点:',
    itemsCountSuffix: '品目',
    totalItemsCount: '総商品数',
    perishableBadge: '生鮮品・期限注意',
    returnableBadge: '返品可能',
    perPack: '1箱あたり',
    shopStockLabel: '店舗在庫',
    reorderBadge: '発注点',
    stockLowBadge: '在庫僅少',
    stockAdequateBadge: '適正',
    photoUnclearWarning: '画像が不鮮明です',
    retakeOrProceed: '高精度の読み取りのため再撮影するか、このまま続行してください。',
    fieldUncertainTooltip: '読取不確か、確認してください',
    qualityCheckDark: '画像が暗すぎます',
    qualityCheckBlurry: '画像が不鮮明・ブレています',
    qualityCheckAngle: '撮影角度が傾きすぎています',
    preprocessingBillMsg: '文字の鮮明化と傾き補正を実行中...',
    scanRetryingMsg: '品目が検出されませんでした。高コントラスト処理で再スキャン中...',
    scanAutoEnhancedBadge: '自動鮮明化・傾き補正済み',
    btnRetryScan: '再スキャン',
    counterBillingTitle: 'カウンターPOS売上伝票',
    counterBillingSubtitle: 'カウンターに商品を並べ・伝票化・即時販売',
    counterBringPrompt: '商品をカウンターに追加',
    counterEmptyMsg: 'カウンターは空です。漏れがないよう下の品目をタップまたは検索してください。',
    counterAddCustomItem: '+ その他・量り売り品目',
    counterNothingMissedMsg: 'すべての品目が計上されました • 漏れなし',
    counterPayCashBtn: '現金支払い (Cash)',
    counterPayUPIBtn: 'オンライン / QR決済',
    counterPayUdhaarBtn: '売掛台帳に記帳 (ツケ)',
    counterNextCustomerBtn: '次のお客様 (新規伝票)',
    counterWhatsAppReceipt: 'WhatsAppで伝票送信',
    counterItemsOnCounter: 'カウンター上の商品',
    counterRunningTotal: 'お会計合計額',
    counterQuickAddPopular: 'よく出る定番商品',
    counterScanBarcodePrompt: 'バーコードをスキャン',
  },
};
