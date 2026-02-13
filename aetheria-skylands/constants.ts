// --- Configuration Constants ---
export const ADMIN_WALLET = "UQDCOmFcYz_Tvf7clsf9iGNTCIkI9oIg869O2YyBkc4mWPQT"; 
export const EARLY_ACCESS_COST = "1"; 
export const INVITES_FOR_EA = 5;
export const INVITES_FOR_NFT = 10;

export const SOCIAL_LINKS = {
  TWITTER: "https://twitter.com/aetheria_skylands",
  TELEGRAM: "https://t.me/aetheria_skylands"
} as const;

/**
 * Визначає базову адресу API.
 * ЗАРАЗ: Примусово використовує Render URL для стабільного з'єднання.
 */
const getApiBaseUrl = (): string => {
  // Тимчасово коментуємо перевірку локалхоста, щоб ти міг тестувати 
  // реальний бекенд прямо зі свого комп'ютера без помилок.
  /*
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return "http://localhost:5000";
    }
  }
  */
  
  // Твоє працююче посилання на Render (без слеша в кінці)
  return "https://aetheria-skylands.onrender.com";
};

/**
 * Генерує абсолютне посилання на tonconnect-manifest.json.
 */
const getManifestUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    const url = new URL(window.location.href);
    const manifestPath = new URL('/tonconnect-manifest.json', url.origin);
    return manifestPath.toString();
  } catch (error) {
    console.error("Помилка генерації Manifest URL:", error);
    return "";
  }
};

// Експортуємо готові константи
export const API_BASE_URL = getApiBaseUrl();
export const MANIFEST_URL = getManifestUrl();