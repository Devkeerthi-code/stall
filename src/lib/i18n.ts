import type { Language } from "@/lib/validation";

/** Storefront UI labels. Product text always stays exactly as the owner wrote it. */
const en = {
  search: "Search this shop", all: "All", add: "Add", out: "Out of stock", featured: "Featured",
  madeToOrder: "Made to order", from: "from",
  open: "Open now", closed: "Closed", opensToday: "Opens {time}", opensTomorrow: "Opens tomorrow {time}",
  opensLater: "Opens {day} {time}", closesAt: "Closes {time}", hoursUnknown: "Ask on WhatsApp",
  slip: "Order slip", items: "items", item: "item", total: "Total", view: "View slip",
  name: "Your name", pickup: "Pickup", delivery: "Delivery", address: "Delivery address",
  note: "Note for the shop (optional)", previewBtn: "Check my order", preview: "This message will be sent",
  edit: "Change order", orderWa: "Send on WhatsApp", empty: "Your slip is empty",
  emptyHint: "Tap Add on anything you like.", noResults: "Nothing matches that. Try another word.",
  nameErr: "Add your name so the shop knows who's ordering.", addressErr: "Add a delivery address.",
  sent: "Sent to WhatsApp", sentHint: "The shop will reply there to confirm. Keep your order code.",
  newSlip: "Start a new slip", info: "About this shop", addToSlip: "Add to slip", inSlip: "in slip",
  closedNote: "The shop is closed now. You can still send your order; they'll reply when they open.",
  paused: "This shop is closed for now. Please check back later.", details: "Details", ingredients: "About this item",
  deliveryInfo: "Delivery and pickup", hours: "Opening hours", map: "Open in Maps", back: "Back to the shop",
  share: "Share", copied: "Link copied", chooseSize: "Choose a size", qtyLess: "One less", qtyMore: "One more",
  remove: "Remove", trackTitle: "Check your order", trackHint: "Enter the code from your WhatsApp message.",
  trackBtn: "Check", trackNone: "We couldn't find that order code in this shop.", orderCode: "Order code",
  status_NEW: "Received", status_CONFIRMED: "Confirmed", status_READY: "Ready", status_DELIVERED: "Delivered",
  status_CANCELLED: "Cancelled", updated: "Updated", report: "Report this shop", demoNote: "This is a demo stall. The message is shown but not sent.",
  offline: "No internet. Check your connection and try again.", tryAgain: "Something went wrong. Please try again.",
  sending: "Getting your order ready…", photos: "Photos",
};

export type MessageKey = keyof typeof en;
type Dict = Record<MessageKey, string>;

const hi: Partial<Dict> = {
  search: "इस दुकान में खोजें", all: "सभी", add: "जोड़ें", out: "स्टॉक में नहीं", featured: "ख़ास", madeToOrder: "ऑर्डर पर बनता है", from: "से",
  open: "अभी खुला है", closed: "बंद है", opensToday: "{time} खुलेगा", opensTomorrow: "कल {time} खुलेगा", opensLater: "{day} {time} खुलेगा", closesAt: "{time} बंद होगा", hoursUnknown: "WhatsApp पर पूछें",
  slip: "ऑर्डर पर्ची", items: "चीज़ें", item: "चीज़", total: "कुल", view: "पर्ची देखें", name: "आपका नाम", pickup: "पिकअप", delivery: "डिलीवरी",
  address: "डिलीवरी का पता", note: "दुकान के लिए नोट (वैकल्पिक)", previewBtn: "ऑर्डर जाँचें", preview: "यह संदेश भेजा जाएगा", edit: "ऑर्डर बदलें",
  orderWa: "WhatsApp पर भेजें", empty: "आपकी पर्ची खाली है", emptyHint: "जो पसंद हो उस पर \"जोड़ें\" दबाएँ।", noResults: "इससे कुछ नहीं मिला। कोई और शब्द आज़माएँ।",
  nameErr: "अपना नाम लिखें ताकि दुकान को पता चले कि ऑर्डर किसका है।", addressErr: "डिलीवरी का पता लिखें।", sent: "WhatsApp पर भेज दिया",
  sentHint: "दुकान वहीं जवाब देकर पक्का करेगी। अपना ऑर्डर कोड रखें।", newSlip: "नई पर्ची शुरू करें", info: "इस दुकान के बारे में", addToSlip: "पर्ची में जोड़ें", inSlip: "पर्ची में",
  closedNote: "दुकान अभी बंद है। आप ऑर्डर भेज सकते हैं; खुलने पर जवाब मिलेगा।", paused: "यह दुकान अभी बंद है। बाद में देखें।", details: "जानकारी",
  deliveryInfo: "डिलीवरी और पिकअप", hours: "खुलने का समय", map: "नक्शे में खोलें", back: "दुकान पर वापस", share: "शेयर करें", copied: "लिंक कॉपी हुआ",
  chooseSize: "साइज़ चुनें", remove: "हटाएँ", trackTitle: "अपना ऑर्डर देखें", trackHint: "WhatsApp संदेश वाला कोड लिखें।", trackBtn: "देखें",
  trackNone: "इस दुकान में यह ऑर्डर कोड नहीं मिला।", orderCode: "ऑर्डर कोड", status_NEW: "मिल गया", status_CONFIRMED: "पक्का", status_READY: "तैयार",
  status_DELIVERED: "पहुँच गया", status_CANCELLED: "रद्द", updated: "अपडेट", report: "इस दुकान की शिकायत करें", sending: "आपका ऑर्डर तैयार हो रहा है…",
  offline: "इंटरनेट नहीं है। दोबारा कोशिश करें।", tryAgain: "कुछ गड़बड़ हुई। दोबारा कोशिश करें।",
};

const ta: Partial<Dict> = {
  search: "இந்தக் கடையில் தேடுங்கள்", all: "அனைத்தும்", add: "சேர்", out: "கையிருப்பில் இல்லை", featured: "சிறப்பு", madeToOrder: "ஆர்டருக்கு செய்யப்படும்",
  open: "இப்போது திறந்துள்ளது", closed: "மூடப்பட்டுள்ளது", opensToday: "{time} திறக்கும்", opensTomorrow: "நாளை {time} திறக்கும்", closesAt: "{time} மூடும்",
  slip: "ஆர்டர் சீட்டு", items: "பொருட்கள்", item: "பொருள்", total: "மொத்தம்", view: "சீட்டைப் பார்", name: "உங்கள் பெயர்", pickup: "பிக்அப்", delivery: "டெலிவரி",
  address: "டெலிவரி முகவரி", note: "கடைக்கான குறிப்பு (விருப்பம்)", previewBtn: "ஆர்டரைச் சரிபார்", preview: "இந்தச் செய்தி அனுப்பப்படும்", edit: "ஆர்டரை மாற்று",
  orderWa: "WhatsApp-இல் அனுப்பு", empty: "உங்கள் சீட்டு காலியாக உள்ளது", emptyHint: "பிடித்தவற்றில் \"சேர்\" அழுத்துங்கள்.", noResults: "பொருந்தவில்லை. வேறு சொல்லை முயலுங்கள்.",
  nameErr: "யார் ஆர்டர் செய்கிறார்கள் என்று கடைக்குத் தெரிய உங்கள் பெயரைச் சேர்க்கவும்.", sent: "WhatsApp-க்கு அனுப்பப்பட்டது", sentHint: "கடை அங்கேயே பதில் அளித்து உறுதி செய்யும்.",
  newSlip: "புதிய சீட்டு தொடங்கு", info: "இந்தக் கடை பற்றி", addToSlip: "சீட்டில் சேர்", inSlip: "சீட்டில்",
  closedNote: "கடை இப்போது மூடியுள்ளது. ஆர்டரை அனுப்பலாம்; திறந்ததும் பதில் வரும்.", back: "கடைக்குத் திரும்பு", trackTitle: "உங்கள் ஆர்டரைப் பாருங்கள்",
  orderCode: "ஆர்டர் குறியீடு", status_NEW: "பெறப்பட்டது", status_CONFIRMED: "உறுதி", status_READY: "தயார்", status_DELIVERED: "வழங்கப்பட்டது", status_CANCELLED: "ரத்து",
};

const kn: Partial<Dict> = {
  search: "ಈ ಅಂಗಡಿಯಲ್ಲಿ ಹುಡುಕಿ", all: "ಎಲ್ಲಾ", add: "ಸೇರಿಸಿ", out: "ಸ್ಟಾಕ್ ಇಲ್ಲ", featured: "ವಿಶೇಷ", open: "ಈಗ ತೆರೆದಿದೆ", closed: "ಮುಚ್ಚಿದೆ",
  opensToday: "{time}ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ", opensTomorrow: "ನಾಳೆ {time}ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ", closesAt: "{time}ಕ್ಕೆ ಮುಚ್ಚುತ್ತದೆ",
  slip: "ಆರ್ಡರ್ ಚೀಟಿ", items: "ವಸ್ತುಗಳು", item: "ವಸ್ತು", total: "ಒಟ್ಟು", view: "ಚೀಟಿ ನೋಡಿ", name: "ನಿಮ್ಮ ಹೆಸರು", pickup: "ಪಿಕಪ್", delivery: "ಡೆಲಿವರಿ",
  address: "ಡೆಲಿವರಿ ವಿಳಾಸ", note: "ಅಂಗಡಿಗೆ ಸೂಚನೆ (ಐಚ್ಛಿಕ)", previewBtn: "ಆರ್ಡರ್ ಪರಿಶೀಲಿಸಿ", preview: "ಈ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗುವುದು", edit: "ಆರ್ಡರ್ ಬದಲಿಸಿ",
  orderWa: "WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಿ", empty: "ನಿಮ್ಮ ಚೀಟಿ ಖಾಲಿಯಾಗಿದೆ", emptyHint: "ಇಷ್ಟವಾದದ್ದರ ಮೇಲೆ \"ಸೇರಿಸಿ\" ಒತ್ತಿ.", noResults: "ಏನೂ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ.",
  nameErr: "ಯಾರು ಆರ್ಡರ್ ಮಾಡುತ್ತಿದ್ದಾರೆ ಎಂದು ಅಂಗಡಿಗೆ ತಿಳಿಯಲು ನಿಮ್ಮ ಹೆಸರು ಸೇರಿಸಿ.", sent: "WhatsApp ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ", sentHint: "ಅಂಗಡಿ ಅಲ್ಲೇ ಉತ್ತರಿಸಿ ಖಚಿತಪಡಿಸುತ್ತದೆ.",
  newSlip: "ಹೊಸ ಚೀಟಿ ಆರಂಭಿಸಿ", info: "ಈ ಅಂಗಡಿಯ ಬಗ್ಗೆ", addToSlip: "ಚೀಟಿಗೆ ಸೇರಿಸಿ", inSlip: "ಚೀಟಿಯಲ್ಲಿ",
  closedNote: "ಅಂಗಡಿ ಈಗ ಮುಚ್ಚಿದೆ. ಆರ್ಡರ್ ಕಳುಹಿಸಬಹುದು; ತೆರೆದಾಗ ಉತ್ತರ ಸಿಗುತ್ತದೆ.", back: "ಅಂಗಡಿಗೆ ಹಿಂತಿರುಗಿ", trackTitle: "ನಿಮ್ಮ ಆರ್ಡರ್ ನೋಡಿ",
  orderCode: "ಆರ್ಡರ್ ಕೋಡ್", status_NEW: "ಸಿಕ್ಕಿದೆ", status_CONFIRMED: "ಖಚಿತ", status_READY: "ಸಿದ್ಧ", status_DELIVERED: "ತಲುಪಿದೆ", status_CANCELLED: "ರದ್ದು",
};

const te: Partial<Dict> = {
  search: "ఈ దుకాణంలో వెతకండి", all: "అన్నీ", add: "చేర్చు", out: "స్టాక్ లేదు", featured: "ప్రత్యేకం", open: "ఇప్పుడు తెరిచి ఉంది", closed: "మూసి ఉంది",
  opensToday: "{time}కి తెరుస్తారు", opensTomorrow: "రేపు {time}కి తెరుస్తారు", closesAt: "{time}కి మూస్తారు",
  slip: "ఆర్డర్ చీటీ", items: "వస్తువులు", item: "వస్తువు", total: "మొత్తం", view: "చీటీ చూడండి", name: "మీ పేరు", pickup: "పికప్", delivery: "డెలివరీ",
  address: "డెలివరీ చిరునామా", note: "దుకాణానికి గమనిక (ఐచ్ఛికం)", previewBtn: "ఆర్డర్ చూసుకోండి", preview: "ఈ సందేశం పంపబడుతుంది", edit: "ఆర్డర్ మార్చండి",
  orderWa: "WhatsApp లో పంపండి", empty: "మీ చీటీ ఖాళీగా ఉంది", emptyHint: "నచ్చినదానిపై \"చేర్చు\" నొక్కండి.", noResults: "ఏమీ దొరకలేదు. వేరే పదం ప్రయత్నించండి.",
  nameErr: "ఎవరు ఆర్డర్ చేస్తున్నారో దుకాణానికి తెలియడానికి మీ పేరు చేర్చండి.", sent: "WhatsApp కు పంపబడింది", sentHint: "దుకాణం అక్కడే జవాబిచ్చి నిర్ధారిస్తుంది.",
  newSlip: "కొత్త చీటీ ప్రారంభించండి", info: "ఈ దుకాణం గురించి", addToSlip: "చీటీకి చేర్చు", inSlip: "చీటీలో",
  closedNote: "దుకాణం ఇప్పుడు మూసి ఉంది. ఆర్డర్ పంపవచ్చు; తెరిచాక జవాబు వస్తుంది.", back: "దుకాణానికి తిరిగి", trackTitle: "మీ ఆర్డర్ చూడండి",
  orderCode: "ఆర్డర్ కోడ్", status_NEW: "అందింది", status_CONFIRMED: "నిర్ధారించారు", status_READY: "సిద్ధం", status_DELIVERED: "అందజేశారు", status_CANCELLED: "రద్దు",
};

const ml: Partial<Dict> = {
  search: "ഈ കടയിൽ തിരയുക", all: "എല്ലാം", add: "ചേർക്കുക", out: "സ്റ്റോക്കില്ല", featured: "പ്രത്യേകം", open: "ഇപ്പോൾ തുറന്നിരിക്കുന്നു", closed: "അടച്ചിരിക്കുന്നു",
  opensToday: "{time}ന് തുറക്കും", opensTomorrow: "നാളെ {time}ന് തുറക്കും", closesAt: "{time}ന് അടയ്ക്കും",
  slip: "ഓർഡർ സ്ലിപ്പ്", items: "സാധനങ്ങൾ", item: "സാധനം", total: "ആകെ", view: "സ്ലിപ്പ് കാണുക", name: "നിങ്ങളുടെ പേര്", pickup: "പിക്കപ്പ്", delivery: "ഡെലിവറി",
  address: "ഡെലിവറി വിലാസം", note: "കടയ്ക്കുള്ള കുറിപ്പ് (ഐച്ഛികം)", previewBtn: "ഓർഡർ പരിശോധിക്കുക", preview: "ഈ സന്ദേശം അയയ്ക്കും", edit: "ഓർഡർ മാറ്റുക",
  orderWa: "WhatsApp-ൽ അയയ്ക്കുക", empty: "നിങ്ങളുടെ സ്ലിപ്പ് ശൂന്യമാണ്", emptyHint: "ഇഷ്ടമുള്ളതിൽ \"ചേർക്കുക\" അമർത്തുക.", noResults: "ഒന്നും കിട്ടിയില്ല. മറ്റൊരു വാക്ക് ശ്രമിക്കൂ.",
  nameErr: "ആരാണ് ഓർഡർ ചെയ്യുന്നതെന്ന് കടയ്ക്ക് അറിയാൻ നിങ്ങളുടെ പേര് ചേർക്കുക.", sent: "WhatsApp-ലേക്ക് അയച്ചു", sentHint: "കട അവിടെ മറുപടി നൽകി ഉറപ്പിക്കും.",
  newSlip: "പുതിയ സ്ലിപ്പ് തുടങ്ങുക", info: "ഈ കടയെക്കുറിച്ച്", addToSlip: "സ്ലിപ്പിൽ ചേർക്കുക", inSlip: "സ്ലിപ്പിൽ",
  closedNote: "കട ഇപ്പോൾ അടച്ചിരിക്കുന്നു. ഓർഡർ അയയ്ക്കാം; തുറക്കുമ്പോൾ മറുപടി ലഭിക്കും.", back: "കടയിലേക്ക് മടങ്ങുക", trackTitle: "നിങ്ങളുടെ ഓർഡർ കാണുക",
  orderCode: "ഓർഡർ കോഡ്", status_NEW: "ലഭിച്ചു", status_CONFIRMED: "ഉറപ്പിച്ചു", status_READY: "തയ്യാർ", status_DELIVERED: "എത്തിച്ചു", status_CANCELLED: "റദ്ദാക്കി",
};

const DICTS: Record<Language, Partial<Dict>> = { en, hi, ta, kn, te, ml };

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English", hi: "हिन्दी", ta: "தமிழ்", kn: "ಕನ್ನಡ", te: "తెలుగు", ml: "മലയാളം",
};

/** Missing translations fall back to English rather than showing a key. */
export function messages(lang: Language): Dict {
  return { ...en, ...DICTS[lang] } as Dict;
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
}
