import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ml' | 'kn';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'Default', flag: '🌐' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra & Telangana', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', region: 'India', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    portalTitle: 'SLA Portal',
    welcomeBack: 'Welcome Back',
    hey: 'Hey',
    placementReady: 'PLACEMENT READY',
    completeProfile: 'Complete Profile',
    editProfile: 'Edit Profile',
    updateProfile: 'Update Profile',
    dailyAttendance: 'DAILY ATTENDANCE CHECK-IN',
    scanQr: 'SCAN ATTENDANCE QR',
    viewLogs: 'View Logs',
    assignedCohorts: 'Assigned Cohorts & Attendance',
    daysAttended: 'DAYS ATTENDED',
    notifications: 'Notifications',
    selectLanguage: 'Select Language',
    noNotifications: 'No notifications right now',
    close: 'Close',
    saveLanguage: 'Save Language',
    languageUpdated: 'Language updated successfully',
  },
  te: {
    portalTitle: 'SLA పోర్టల్',
    welcomeBack: 'పునఃస్వాగతం',
    hey: 'హలో',
    placementReady: 'ప్లేస్‌మెంట్ సిద్ధంగా ఉంది',
    completeProfile: 'ప్రొఫైల్ పూర్తి చేయండి',
    editProfile: 'ప్రొఫైల్ సవరించండి',
    updateProfile: 'ప్రొఫైల్ నవీకరించండి',
    dailyAttendance: 'రోజువారీ హాజరు తనిఖీ',
    scanQr: 'హాజరు QR స్కాన్ చేయండి',
    viewLogs: 'లాగ్‌లను చూడండి',
    assignedCohorts: 'కేటాయించిన బ్యాచ్‌లు & హాజరు',
    daysAttended: 'రోజులు హాజరయ్యారు',
    notifications: 'నోటిఫికేషన్లు',
    selectLanguage: 'భాషను ఎంచుకోండి',
    noNotifications: 'ప్రస్తుతం నోటిఫికేషన్‌లు లేవు',
    close: 'మూసివేయి',
    saveLanguage: 'భాషను సేవ్ చేయండి',
    languageUpdated: 'భాష విజయవంతంగా నవీకరించబడింది',
  },
  hi: {
    portalTitle: 'SLA पोर्टल',
    welcomeBack: 'वापसी पर स्वागत है',
    hey: 'नमस्ते',
    placementReady: 'प्लेसमेंट तैयार',
    completeProfile: 'प्रोफ़ाइल पूरा करें',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    updateProfile: 'प्रोफ़ाइल अपडेट करें',
    dailyAttendance: 'दैनिक उपस्थिति चेक-इन',
    scanQr: 'उपस्थिति क्यूआर स्कैन करें',
    viewLogs: 'लॉग देखें',
    assignedCohorts: 'आवंटित बैच और उपस्थिति',
    daysAttended: 'दिन उपस्थित रहे',
    notifications: 'सूचनाएं',
    selectLanguage: 'भाषा चुनें',
    noNotifications: 'अभी कोई सूचनाएं नहीं हैं',
    close: 'बंद करें',
    saveLanguage: 'भाषा सहेजें',
    languageUpdated: 'भाषा सफलतापूर्वक अपडेट की गई',
  },
  ml: {
    portalTitle: 'SLA പോർട്ടൽ',
    welcomeBack: 'വീണ്ടും സ്വാഗതം',
    hey: 'ഹലോ',
    placementReady: 'പ്ലേസ്‌മെന്റ് റെഡി',
    completeProfile: 'പ്രൊഫൈൽ പൂർത്തിയാക്കുക',
    editProfile: 'പ്രൊഫൈൽ തിരുത്തുക',
    updateProfile: 'പ്രൊഫൈൽ പുതുക്കുക',
    dailyAttendance: 'ദിനംപ്രതിയുള്ള ഹാജർ രേഖപ്പെടുത്തൽ',
    scanQr: 'ഹാജർ QR സ്കാൻ ചെയ്യുക',
    viewLogs: 'ലോഗുകൾ കാണുക',
    assignedCohorts: 'അനുവദിച്ച ബാച്ചുകളും ഹാജരും',
    daysAttended: 'ഹാജരായ ദിവസങ്ങൾ',
    notifications: 'അറിയിപ്പുകൾ',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    noNotifications: 'ഇപ്പോൾ അറിയിപ്പുകളൊന്നുമില്ല',
    close: 'അടയ്ക്കുക',
    saveLanguage: 'ഭാഷ സേവ് ചെയ്യുക',
    languageUpdated: 'ഭാഷ വിജയകരമായി മാറ്റി',
  },
  kn: {
    portalTitle: 'SLA ಪೋರ್ಟಲ್',
    welcomeBack: 'ಮತ್ತೆ ಸುಸ್ವಾಗತ',
    hey: 'ಹಲೋ',
    placementReady: 'ಪ್ಲೇಸ್‌ಮೆಂಟ್ ಸಿದ್ಧವಾಗಿದೆ',
    completeProfile: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    editProfile: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    updateProfile: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ',
    dailyAttendance: 'ದೈನಂದಿನ ಹಾಜರಾತಿ ಚೆಕ್-ಇನ್',
    scanQr: 'ಹಾಜರಾತಿ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    viewLogs: 'ಲಾಗ್ ವೀಕ್ಷಿಸಿ',
    assignedCohorts: 'ನಿಯೋಜಿತ ಬ್ಯಾಚ್‌ಗಳು ಮತ್ತು ಹಾಜರಾತಿ',
    daysAttended: 'ಹಾಜರಾದ ದಿನಗಳು',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    noNotifications: 'ಈಗ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ',
    close: 'ಮುಚ್ಚಿ',
    saveLanguage: 'ಭಾಷೆಯನ್ನು ಉಳಿಸಿ',
    languageUpdated: 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ',
  },
};

const LANG_KEY = 'user_selected_language';

export const getStoredLanguage = async (): Promise<LanguageCode> => {
  try {
    const lang = await AsyncStorage.getItem(LANG_KEY);
    if (lang && (lang === 'en' || lang === 'te' || lang === 'hi' || lang === 'ml' || lang === 'kn')) {
      return lang as LanguageCode;
    }
  } catch (e) {}
  return 'en';
};

export const setStoredLanguage = async (code: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANG_KEY, code);
  } catch (e) {}
};

export const getText = (lang: LanguageCode, key: string): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
};
