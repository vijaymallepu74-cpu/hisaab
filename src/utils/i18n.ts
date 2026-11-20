import { Language } from '../types';

export interface TranslationStrings {
  appTitle: string;
  tagline: string;
  defaultShop: string;
  liveLedger: string;
  totalOutstanding: string;
  outstandingSubtext: string;
  totalCustomers: string;
  customersWithBalance: string;
  topDefaulter: string;
  home: string;
  customers: string;
  more: string;
  addCustomer: string;
  addEntry: string;
  searchPlaceholder: string;
  clearSearch: string;
  noCustomersFound: string;
  noCustomersYet: string;
  addFirstCustomerPrompt: string;
  remindWhatsApp: string;
  customerLedger: string;
  giveCredit: string;
  receivePayment: string;
  allTransactions: string;
  newestFirst: string;
  noTransactions: string;
  noTransactionsSubtext: string;
  credit: string;
  payment: string;
  amount: string;
  date: string;
  note: string;
  optional: string;
  saveTransaction: string;
  saveCredit: string;
  savePayment: string;
  saveCustomer: string;
  cancel: string;
  delete: string;
  edit: string;
  back: string;
  overdue: string;
  viewOverdue: string;
  overdueCustomers: string;
  overdueSubtext: string;
  noOverdue: string;
  noOverdueSubtext: string;
  pendingSincePayment: string;
  neverPaid: string;
  mostDelayedFirst: string;
  daysAgo: string;
  dayAgo: string;
  delayed: string;
  today: string;
  noPaymentYet: string;
  lastPaid: string;
  firstCredit: string;
  importData: string;
  exportCsv: string;
  exportExcel: string;
  settings: string;
  moreAndSettings: string;
  moreSubtext: string;
  paymentProof: string;
  attachProof: string;
  viewProof: string;
  shopSettings: string;
  saveShopDetails: string;
  shopNameLabel: string;
  upiIdLabel: string;
  upiHelp: string;
  effectiveDateLabel: string;
  pending: string;
  advance: string;
  settled: string;
  currentBalance: string;
  totalCredit: string;
  totalReceived: string;
  creditOwed: string;
  advanceOverpaid: string;
  showMore: string;
  loadSampleCustomers: string;
  shopProfiles: string;
  newShop: string;
  createAndOpen: string;
  encryptedVault: string;
  encryptedVaultSubtext: string;
  createBackup: string;
  restoreLedger: string;
  storageNoticeTitle: string;
  storageNoticeText: string;
  storageNoticeTip: string;
  resetLedgerTitle: string;
  resetLedgerSubtext: string;
  resetLedgerBtn: string;
  resetConfirmTitle: string;
  resetConfirmText: string;
  resetConfirmBtn: string;
  valNameRequired: string;
  valPhone10Digits: string;
  valPhoneValidIndian: string;
  valPhoneExists: string;
  valAmountPositive: string;
  valDateRequired: string;
  valSelectCustomer: string;
  valValidUpi: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appTitle: 'HISAAB',
    tagline: 'Your shop. Your ledger. Simplified.',
    defaultShop: 'My Shop',
    liveLedger: 'Live Ledger',
    totalOutstanding: 'TOTAL OUTSTANDING',
    outstandingSubtext: 'Amount pending from all customers',
    totalCustomers: 'Total Customers',
    customersWithBalance: 'With Outstanding',
    topDefaulter: 'Top Defaulter',
    home: 'Home',
    customers: 'Customers',
    more: 'More',
    addCustomer: 'Add Customer',
    addEntry: 'Entry',
    searchPlaceholder: 'Search name or 10-digit phone...',
    clearSearch: 'Clear',
    noCustomersFound: 'No customers found',
    noCustomersYet: 'No customers added yet',
    addFirstCustomerPrompt: 'Add your first customer to start tracking credit and payments.',
    remindWhatsApp: 'Remind on WhatsApp',
    customerLedger: 'Customer Ledger',
    giveCredit: 'Give Credit',
    receivePayment: 'Receive Payment',
    allTransactions: 'Transaction History',
    newestFirst: 'Sorted by newest first',
    noTransactions: 'No transactions yet',
    noTransactionsSubtext: 'Record customer purchases as Credit or payments received as Payment using the buttons above.',
    credit: 'Credit',
    payment: 'Payment',
    amount: 'Amount (INR)',
    date: 'Transaction Date',
    note: 'Note / Description',
    optional: 'Optional',
    saveTransaction: 'Save Entry',
    saveCredit: 'Save Credit',
    savePayment: 'Save Payment',
    saveCustomer: 'Save Customer',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    overdue: 'Overdue List',
    viewOverdue: 'View Overdue',
    overdueCustomers: 'Overdue Customers',
    overdueSubtext: 'customers with pending balance, ranked by payment delay',
    noOverdue: 'No overdue balances!',
    noOverdueSubtext: 'All customers have fully cleared their accounts.',
    pendingSincePayment: 'Pending Since Last Payment',
    neverPaid: 'Never Paid (Since First Credit)',
    mostDelayedFirst: 'Most delayed first',
    daysAgo: 'days ago',
    dayAgo: 'day ago',
    delayed: 'delayed',
    today: 'Today',
    noPaymentYet: 'No payment made yet',
    lastPaid: 'Last paid',
    firstCredit: 'First credit',
    importData: 'Import Ledger Data',
    exportCsv: 'Export to CSV',
    exportExcel: 'Export to Excel (.xlsx)',
    settings: 'Settings',
    moreAndSettings: 'More & Settings',
    moreSubtext: 'Application tools, multi-shop profiles, and data controls',
    paymentProof: 'Payment Screenshot / Receipt',
    attachProof: 'Upload UPI screenshot or receipt',
    viewProof: 'View Screenshot',
    shopSettings: 'Shop Details',
    saveShopDetails: 'Save Shop Details',
    shopNameLabel: 'Shop Name',
    upiIdLabel: 'Shop UPI ID (for WhatsApp Reminders)',
    upiHelp: 'Valid UPI VPA format required (e.g. exampleupi@hdjcbank). Embedded into WhatsApp payment links.',
    effectiveDateLabel: 'Effective System Date',
    pending: 'Pending',
    advance: 'Advance',
    settled: 'Settled',
    currentBalance: 'Current Net Balance',
    totalCredit: 'Total Credit',
    totalReceived: 'Total Received',
    creditOwed: 'Credit (Customer owes you)',
    advanceOverpaid: 'Advance / Overpaid',
    showMore: 'Show More',
    loadSampleCustomers: 'Load Sample Customers',
    shopProfiles: 'Shop Profiles',
    newShop: 'New Shop',
    createAndOpen: 'Create & Open Ledger',
    encryptedVault: 'Encrypted Backup Vault',
    encryptedVaultSubtext: 'Export or restore a password-protected .hisaab archive of your complete ledger.',
    createBackup: 'Create Backup',
    restoreLedger: 'Restore Ledger',
    storageNoticeTitle: 'Local Browser Storage Notice',
    storageNoticeText: 'Hisaab operates local-first for 100% privacy. All records are stored directly inside this browser. Clearing browser history, cookies, or site data will remove your local ledger.',
    storageNoticeTip: 'Tip: Export an Encrypted Backup (.hisaab) regularly to keep a safe, portable copy of your ledger.',
    resetLedgerTitle: 'Reset Local Ledger',
    resetLedgerSubtext: 'Deletes this shop\'s saved ledger from this browser only. Other shops and devices are not affected.',
    resetLedgerBtn: 'Reset Ledger',
    resetConfirmTitle: 'Reset ledger for this shop?',
    resetConfirmText: 'This will permanently delete all customer accounts, credit records, payments, and receipt attachments for this shop profile from this browser only.',
    resetConfirmBtn: 'Yes, Reset Ledger',
    valNameRequired: 'Customer name cannot be empty',
    valPhone10Digits: 'Phone number must contain exactly 10 digits',
    valPhoneValidIndian: 'Please enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9)',
    valPhoneExists: 'Customer with this phone number already exists',
    valAmountPositive: 'Amount must be greater than zero',
    valDateRequired: 'Date is required',
    valSelectCustomer: 'Please select a customer',
    valValidUpi: 'Please enter a valid UPI ID (e.g. exampleupi@hdjcbank)',
  },
  te: {
    appTitle: 'హిసాబ్ (HISAAB)',
    tagline: 'మీ దుకాణం. మీ ఖాతా. సరళీకృతం.',
    defaultShop: 'నా దుకాణం',
    liveLedger: 'లైవ్ లెడ్జర్',
    totalOutstanding: 'మొత్తం బకాయి',
    outstandingSubtext: 'కస్టమర్ల నుండి రావలసిన మొత్తం బకాయి',
    totalCustomers: 'మొత్తం కస్టమర్లు',
    customersWithBalance: 'బకాయి ఉన్నవారు',
    topDefaulter: 'అత్యధిక బకాయిదారుడు',
    home: 'హోమ్',
    customers: 'ఖాతాదారులు',
    more: 'మరిన్ని',
    addCustomer: 'కొత్త ఖాతాదారు',
    addEntry: 'నమోదు',
    searchPlaceholder: 'పేరు లేదా 10-అంకెల ఫోన్ శోధించండి...',
    clearSearch: 'క్లియర్',
    noCustomersFound: 'ఖాతాదారులు కనుగొనబడలేదు',
    noCustomersYet: 'ఇంకా ఖాతాదారులు చేర్చబడలేదు',
    addFirstCustomerPrompt: 'ఖాతా ప్రారంభించడానికి మీ మొదటి కస్టమర్‌ను చేర్చండి.',
    remindWhatsApp: 'వాట్సాప్‌లో గుర్తుచేయి',
    customerLedger: 'ఖాతా లెడ్జర్',
    giveCredit: 'అప్పు ఇవ్వండి (Give Credit)',
    receivePayment: 'వసూలు నమోదు (Receive Payment)',
    allTransactions: 'లావాదేవీల చరిత్ర',
    newestFirst: 'సరికొత్తవి ముందుగా చూపబడతాయి',
    noTransactions: 'ఇంకా లావాదేవీలు లేవు',
    noTransactionsSubtext: 'పై బటన్లను ఉపయోగించి అప్పు (Credit) లేదా వసూలు (Payment) నమోదు చేయండి.',
    credit: 'అప్పు (Credit)',
    payment: 'వసూలు (Payment)',
    amount: 'మొత్తం (INR)',
    date: 'లావాదేవీ తేదీ',
    note: 'వివరాలు / నోట్',
    optional: 'ఐచ్ఛికం',
    saveTransaction: 'నమోదు చేయండి',
    saveCredit: 'అప్పు నమోదు చేయండి',
    savePayment: 'వసూలు నమోదు చేయండి',
    saveCustomer: 'ఖాతాదారుని సేవ్‌ చేయండి',
    cancel: 'రద్దు',
    delete: 'తొలగించు',
    edit: 'సవరించు',
    back: 'వెనుకకు',
    overdue: 'బకాయిల జాబితా',
    viewOverdue: 'బకాయిల జాబితా చూడండి',
    overdueCustomers: 'బకాయి ఉన్న ఖాతాదారులు',
    overdueSubtext: 'చెల్లింపు ఆలస్యం ఆధారంగా బకాయి ఉన్న ఖాతాదారుల జాబితా',
    noOverdue: 'ఎటువంటి బకాయిలు లేవు!',
    noOverdueSubtext: 'ఖాతాదారులందరూ తమ బకాయిలను పూర్తిగా చెల్లించారు.',
    pendingSincePayment: 'చివరి చెల్లింపు నుండి బకాయి',
    neverPaid: 'మొదటి అప్పు నుండి ఇంకా చెల్లించనివారు',
    mostDelayedFirst: 'ఎక్కువ ఆలస్యమైనవి ముందుగా',
    daysAgo: 'రోజుల క్రితం',
    dayAgo: 'రోజు క్రితం',
    delayed: 'ఆలస్యం',
    today: 'ఈ రోజు',
    noPaymentYet: 'ఇంకా ఎటువంటి చెల్లింపు జరగలేదు',
    lastPaid: 'చివరిగా చెల్లించినది',
    firstCredit: 'మొదటి అప్పు తేదీ',
    importData: 'డేటా దిగుమతి (Import)',
    exportCsv: 'CSV ఎగుమతి చేయండి',
    exportExcel: 'Excel (.xlsx) ఎగుమతి చేయండి',
    settings: 'సెట్టింగ్‌లు',
    moreAndSettings: 'మరిన్ని & సెట్టింగ్‌లు',
    moreSubtext: 'అప్లికేషన్ టూల్స్, బహుళ షాప్ ప్రొఫైల్స్, డేటా నియంత్రణలు',
    paymentProof: 'చెల్లింపు స్క్రీన్‌షాట్ / రసీదు',
    attachProof: 'UPI స్క్రీన్‌షాట్ లేదా రసీదు అప్‌లోడ్ చేయండి',
    viewProof: 'స్క్రీన్‌షాట్ చూడండి',
    shopSettings: 'దుకాణం వివరాలు',
    saveShopDetails: 'షాప్ వివరాలు సేవ్ చేయండి',
    shopNameLabel: 'దుకాణం పేరు',
    upiIdLabel: 'దుకాణం UPI ID (వాట్సాప్ చెల్లింపుల కోసం)',
    upiHelp: 'సరైన UPI VPA ఫార్మాట్ ఉండాలి (ఉదా: exampleupi@hdjcbank). ఇది వాట్సాప్ మెసేజ్‌లో జతచేయబడుతుంది.',
    effectiveDateLabel: 'సిస్టమ్ తేదీ',
    pending: 'బకాయి',
    advance: 'అడ్వాన్స్',
    settled: 'క్లియర్ అయింది',
    currentBalance: 'ప్రస్తుత నికర బకాయి',
    totalCredit: 'మొత్తం అప్పు',
    totalReceived: 'మొత్తం వసూలు',
    creditOwed: 'అప్పు (కస్టమర్ చెల్లించవలసినది)',
    advanceOverpaid: 'అడ్వాన్స్ / అదనపు చెల్లింపు',
    showMore: 'మరిన్ని చూపించు',
    loadSampleCustomers: 'నమూనా కస్టమర్లను లోడ్ చేయండి',
    shopProfiles: 'షాప్ ప్రొఫైల్స్',
    newShop: 'కొత్త షాప్',
    createAndOpen: 'ఖాతా ప్రారంభించండి',
    encryptedVault: 'ఎన్‌క్రిప్టెడ్ బ్యాకప్ వాల్ట్',
    encryptedVaultSubtext: 'మీ పూర్తి ఖాతా లెడ్జర్‌ను పాస్‌వర్డ్-రక్షిత .hisaab ఫైల్‌గా ఎగుమతి లేదా పునరుద్ధరించండి.',
    createBackup: 'బ్యాకప్ సృష్టించండి',
    restoreLedger: 'లెడ్జర్ పునరుద్ధరించండి',
    storageNoticeTitle: 'లోకల్ బ్రౌజర్ స్టోరేజ్ నోటీసు',
    storageNoticeText: 'హిసాబ్ 100% గోప్యత కోసం లోకల్-ఫస్ట్‌గా పనిచేస్తుంది. అన్ని రికార్డులు నేరుగా ఈ బ్రౌజర్‌లోనే భద్రపరచబడతాయి.',
    storageNoticeTip: 'చిట్కా: మీ డేటా సురక్షితంగా ఉండటానికి క్రమం తప్పకుండా ఎన్‌క్రిప్టెడ్ బ్యాకప్ (.hisaab) తీసుకోండి.',
    resetLedgerTitle: 'లోకల్ లెడ్జర్ రీసెట్',
    resetLedgerSubtext: 'ఈ బ్రౌజర్ నుండి ఈ దుకాణం రికార్డులను మాత్రమే తొలగిస్తుంది. ఇతర షాపులు ప్రభావితం కావు.',
    resetLedgerBtn: 'లెడ్జర్ రీసెట్',
    resetConfirmTitle: 'ఈ దుకాణం లెడ్జర్ రీసెట్ చేయాలా?',
    resetConfirmText: 'ఇది ఈ బ్రౌజర్ నుండి ఈ దుకాణం యొక్క అన్ని కస్టమర్ ఖాతాలు, అప్పులు, చెల్లింపులను శాశ్వతంగా తొలగిస్తుంది.',
    resetConfirmBtn: 'అవును, లెడ్జర్ రీసెట్ చేయండి',
    valNameRequired: 'ఖాతాదారుని పేరు ఖాళీగా ఉండకూడదు',
    valPhone10Digits: 'ఫోన్ నంబర్ ఖచ్చితంగా 10 అంకెలు ఉండాలి',
    valPhoneValidIndian: 'సరైన 10-అంకెల మొబైల్ నంబర్ నమోదు చేయండి (6, 7, 8 లేదా 9 తో ప్రారంభం కావాలి)',
    valPhoneExists: 'ఈ ఫోన్ నంబర్‌తో ఖాతాదారుడు ఇప్పటికే ఉన్నారు',
    valAmountPositive: 'మొత్తం సున్నా కంటే ఎక్కువగా ఉండాలి',
    valDateRequired: 'తేదీ తప్పనిసరి',
    valSelectCustomer: 'దయచేసి ఖాతాదారుని ఎంచుకోండి',
    valValidUpi: 'దయచేసి సరైన UPI ID నమోదు చేయండి (ఉదా: exampleupi@hdjcbank)',
  },
  hi: {
    appTitle: 'हिसाब (HISAAB)',
    tagline: 'आपकी दुकान। आपका बहीखाता। सरल और सुरक्षित।',
    defaultShop: 'मेरी दुकान',
    liveLedger: 'लाइव बहीखाता',
    totalOutstanding: 'कुल बकाया',
    outstandingSubtext: 'सभी ग्राहकों से मिलने वाली कुल बकाया राशि',
    totalCustomers: 'कुल ग्राहक',
    customersWithBalance: 'बकाया वाले ग्राहक',
    topDefaulter: 'अधिकतम बकायादार',
    home: 'होम',
    customers: 'ग्राहक',
    more: 'अधिक',
    addCustomer: 'नया ग्राहक',
    addEntry: 'प्रविष्टि',
    searchPlaceholder: 'नाम या 10-अंकों का फ़ोन नंबर खोजें...',
    clearSearch: 'हटाएं',
    noCustomersFound: 'कोई ग्राहक नहीं मिला',
    noCustomersYet: 'अभी तक कोई ग्राहक नहीं जोड़ा गया',
    addFirstCustomerPrompt: 'उधार और भुगतान ट्रैक करने के लिए अपना पहला ग्राहक जोड़ें।',
    remindWhatsApp: 'व्हाट्सएप पर याद दिलाएं',
    customerLedger: 'ग्राहक खाता',
    giveCredit: 'उधार दें (Give Credit)',
    receivePayment: 'भुगतान प्राप्त करें (Receive Payment)',
    allTransactions: 'लेन-देन इतिहास',
    newestFirst: 'नवीनतम पहले क्रमबद्ध',
    noTransactions: 'अभी तक कोई लेन-देन नहीं',
    noTransactionsSubtext: 'ऊपर दिए गए बटनों का उपयोग करके उधार (Credit) या भुगतान (Payment) दर्ज करें।',
    credit: 'उधार (Credit)',
    payment: 'भुगतान (Payment)',
    amount: 'राशि (INR)',
    date: 'लेन-देन तिथि',
    note: 'विवरण / नोट',
    optional: 'वैकल्पिक',
    saveTransaction: 'प्रविष्टि सहेजें',
    saveCredit: 'उधार सहेजें',
    savePayment: 'भुगतान सहेजें',
    saveCustomer: 'ग्राहक सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    overdue: 'बकाया सूची',
    viewOverdue: 'बकाया सूची देखें',
    overdueCustomers: 'बकायादार ग्राहक',
    overdueSubtext: 'भुगतान में देरी के अनुसार क्रमबद्ध बकायादार ग्राहक',
    noOverdue: 'कोई बकाया शेष नहीं!',
    noOverdueSubtext: 'सभी ग्राहकों ने अपना पूरा हिसाब चुकता कर दिया है।',
    pendingSincePayment: 'अंतिम भुगतान के बाद से बकाया',
    neverPaid: 'पहले उधार के बाद से अभी तक कोई भुगतान नहीं',
    mostDelayedFirst: 'सबसे अधिक विलंबित पहले',
    daysAgo: 'दिन पहले',
    dayAgo: 'दिन पहले',
    delayed: 'देरी',
    today: 'आज',
    noPaymentYet: 'अभी तक कोई भुगतान नहीं हुआ',
    lastPaid: 'अंतिम भुगतान',
    firstCredit: 'पहला उधार',
    importData: 'डेटा आयात करें (Import)',
    exportCsv: 'CSV में डाउनलोड करें',
    exportExcel: 'Excel (.xlsx) में डाउनलोड करें',
    settings: 'सेटिंग्स',
    moreAndSettings: 'अधिक और सेटिंग्स',
    moreSubtext: 'एप्लिकेशन टूल्स, एकाधिक दुकान प्रोफाइल, और डेटा नियंत्रण',
    paymentProof: 'भुगतान रसीद / स्क्रीनशॉट',
    attachProof: 'UPI स्क्रीनशॉट या रसीद अपलोड करें',
    viewProof: 'स्क्रीनशॉट देखें',
    shopSettings: 'दुकान का विवरण',
    saveShopDetails: 'दुकान का विवरण सहेजें',
    shopNameLabel: 'दुकान का नाम',
    upiIdLabel: 'दुकान UPI ID (व्हाट्सएप भुगतान लिंक के लिए)',
    upiHelp: 'मान्य UPI VPA प्रारूप आवश्यक (उदा: exampleupi@hdjcbank)। व्हाट्सएप संदेश में जोड़ा जाएगा।',
    effectiveDateLabel: 'सिस्टम तिथि',
    pending: 'बकाया',
    advance: 'अग्रिम',
    settled: 'चुकता',
    currentBalance: 'वर्तमान कुल बकाया',
    totalCredit: 'कुल दिया उधार',
    totalReceived: 'कुल प्राप्त भुगतान',
    creditOwed: 'उधार (ग्राहक को चुकाना है)',
    advanceOverpaid: 'अग्रिम / अधिक भुगतान',
    showMore: 'और दिखाएं',
    loadSampleCustomers: 'नमूना ग्राहक लोड करें',
    shopProfiles: 'दुकान प्रोफाइल',
    newShop: 'नई दुकान',
    createAndOpen: 'खाता बनाएं और खोलें',
    encryptedVault: 'एन्क्रिप्टेड बैकअप वॉल्ट',
    encryptedVaultSubtext: 'पासवर्ड से सुरक्षित .hisaab फ़ाइल में अपने बहीखाते का बैकअप लें या पुनर्स्थापित करें।',
    createBackup: 'बैकअप बनाएं',
    restoreLedger: 'खाता पुनर्स्थापित करें',
    storageNoticeTitle: 'स्थानीय ब्राउज़र स्टोरेज सूचना',
    storageNoticeText: 'हिसाब 100% गोपनीयता के लिए लोकल-फ़र्स्ट कार्य करता है। सारा डेटा सीधे इसी ब्राउज़र में सुरक्षित रहता है।',
    storageNoticeTip: 'सुझाव: सुरक्षित और सुवाह्य प्रति बनाए रखने के लिए समय-समय पर एन्क्रिप्टेड बैकअप (.hisaab) लें।',
    resetLedgerTitle: 'लोकल बहीखाता रीसेट करें',
    resetLedgerSubtext: 'केवल इस ब्राउज़र से इस दुकान का बहीखाता हटाएगा। अन्य दुकानें अप्रभावित रहेंगी।',
    resetLedgerBtn: 'बहीखाता रीसेट करें',
    resetConfirmTitle: 'क्या इस दुकान का बहीखाता रीसेट करें?',
    resetConfirmText: 'यह इस ब्राउज़र से इस दुकान के सभी ग्राहक खाते, उधार, भुगतान और रसीदें स्थायी रूप से हटा देगा।',
    resetConfirmBtn: 'हाँ, बहीखाता रीसेट करें',
    valNameRequired: 'ग्राहक का नाम खाली नहीं हो सकता',
    valPhone10Digits: 'फ़ोन नंबर में ठीक 10 अंक होने चाहिए',
    valPhoneValidIndian: 'कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें (6, 7, 8, या 9 से शुरू)',
    valPhoneExists: 'इस फ़ोन नंबर वाला ग्राहक पहले से मौजूद है',
    valAmountPositive: 'राशि शून्य से अधिक होनी चाहिए',
    valDateRequired: 'तारीख आवश्यक है',
    valSelectCustomer: 'कृपया ग्राहक का चयन करें',
    valValidUpi: 'कृपया मान्य UPI ID दर्ज करें (उदा: exampleupi@hdjcbank)',
  },
};
