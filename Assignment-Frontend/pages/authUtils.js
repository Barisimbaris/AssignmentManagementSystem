(() => {
  const API_BASE_URL =
    window.__API_BASE_URL__ || "http://localhost:8080/api";

  const STORAGE_KEYS = {
    token: "ams.auth.token",
    user: "ams.auth.user"
  };

  const getAuthToken = () => sessionStorage.getItem(STORAGE_KEYS.token);

  const getAuthUser = () => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.user);
      return null;
    }
  };

  const saveAuthSession = ({ token, user }) => {
    if (!token || !user) {
      throw new Error("Eksik oturum bilgisi");
    }
    sessionStorage.setItem(STORAGE_KEYS.token, token);
    sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  };

  const getUserId = () => {
    const user = getAuthUser();
    return user?.id || user?.userId || null;
  };

  const clearAuthSession = () => {
    sessionStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem(STORAGE_KEYS.user);
  };

  const buildUrl = (path) => {
    if (!path) return API_BASE_URL;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const normalizePayload = (payload) => {
    if (!payload || typeof payload !== "object") {
      return payload;
    }
    
    // Result wrapper kontrolü - hem camelCase hem PascalCase
    const isSuccess = payload.isSuccess !== undefined ? payload.isSuccess : payload.IsSuccess;
    const hasResultWrapper = payload.isSuccess !== undefined || payload.IsSuccess !== undefined;
    
    if (hasResultWrapper) {
      if (!isSuccess) {
        // Hata durumu
        const errors = payload.errors || payload.Errors || [];
        const message = payload.message || payload.Message || errors[0] || "İşlem başarısız";
        const err = new Error(message);
        err.details = errors;
        throw err;
      }
      // Başarılı durum - data'yı döndür
      return payload.data ?? payload.Data ?? null;
    }
    
    // Result wrapper yok, direkt payload'ı döndür
    return payload;
  };

  const apiFetch = async (path, options = {}) => {
    try {
      const url = buildUrl(path);
      console.log(`[apiFetch] ${options.method || "GET"} ${url}`, options.body);

      const init = { method: "GET", ...options };
      const headers = new Headers(init.headers || {});
      const hasFormData = init.body instanceof FormData;

      if (init.body && !hasFormData && typeof init.body !== "string") {
        init.body = JSON.stringify(init.body);
      }

      if (!hasFormData && init.body) {
        headers.set("Content-Type", "application/json");
      }

      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      init.headers = headers;

      // Backend bağlantısını test et
      let response;
      try {
        response = await fetch(url, init);
      } catch (fetchError) {
        console.error("[apiFetch] ❌ Fetch hatası:", fetchError);
        
        // Backend çalışmıyor mu kontrol et
        if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
          const backendUrl = API_BASE_URL.replace("/api", "");
          const errorMsg = `Backend bağlantısı kurulamadı! Lütfen backend'in çalıştığını kontrol edin:\n${backendUrl}\n\nBackend'i başlatmak için:\ncd AssignmentManagementSystem-main\ndotnet run --project src/AMS.API --launch-profile http`;
          throw new Error(errorMsg);
        }
        throw fetchError;
      }

      let payload;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      console.log(`[apiFetch] Response ${response.status}:`, payload);

      if (!response.ok) {
        let message = response.statusText;
        
        // Hata mesajını daha detaylı parse et
        if (typeof payload === "string") {
          message = payload || response.statusText;
        } else if (payload && typeof payload === "object") {
          // Önce errors array'ini kontrol et
          if (Array.isArray(payload.errors) && payload.errors.length > 0) {
            message = payload.errors[0];
          } else if (Array.isArray(payload.Errors) && payload.Errors.length > 0) {
            message = payload.Errors[0];
          } 
          // Sonra message property'sini kontrol et
          else if (payload.message) {
            message = payload.message;
          } else if (payload.Message) {
            message = payload.Message;
          }
          // Son olarak error property'sini kontrol et (bazı API'ler error döner)
          else if (payload.error) {
            message = typeof payload.error === "string" ? payload.error : payload.error.message || payload.error.Message || response.statusText;
          } else if (payload.Error) {
            message = typeof payload.Error === "string" ? payload.Error : payload.Error.message || payload.Error.Message || response.statusText;
          }
        }
        
        const error = new Error(message);
        error.status = response.status;
        error.response = payload;
        
        console.error(`[apiFetch] HTTP ${response.status} hatası:`, {
          status: response.status,
          statusText: response.statusText,
          payload: payload,
          message: message
        });
        
        if (response.status === 401) {
          clearAuthSession();
        }
        throw error;
      }

      try {
        const normalized = normalizePayload(payload);
        console.log(`[apiFetch] Normalized:`, normalized);
        return normalized;
      } catch (normalizeError) {
        console.error("[apiFetch] normalizePayload hatası:", normalizeError);
        throw normalizeError;
      }
    } catch (error) {
      console.error(`[apiFetch] HATA:`, error);
      throw error;
    }
  };

  const ensureAuthenticated = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Lütfen giriş yapın");
    }
    return token;
  };

  const createToastElement = () => {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast hidden";
      document.body.appendChild(toast);
    }
    return toast;
  };

  const showToast = (message, isError = false) => {
    const toast = createToastElement();
    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  };

  // UTC'yi Türkiye saatine (UTC+3) çeviren helper fonksiyon
  const convertUTCToTurkishTime = (utcDateString) => {
    if (!utcDateString) return null;
    try {
      const date = new Date(utcDateString);
      if (Number.isNaN(date.getTime())) return null;
      
      // Backend'den gelen UTC string'i için, Türkiye offset'ini ekle
      const utcTime = date.getTime(); // UTC timestamp (ms)
      const turkishOffset = 3 * 60 * 60 * 1000; // UTC+3 = 3 saat = 10800000 ms
      const turkishTime = new Date(utcTime + turkishOffset);
      
      return turkishTime;
    } catch (e) {
      console.error("[convertUTCToTurkishTime] Hata:", e);
      return null;
    }
  };

  // Türkiye saatine göre tarih formatlama fonksiyonu
  const formatDateTurkish = (value) => {
    if (!value) return "-";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      
      // UTC'yi Türkiye saatine çevir
      const turkishDate = convertUTCToTurkishTime(value) || date;
      
      return turkishDate.toLocaleString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul"
      });
    } catch (e) {
      console.error("[formatDateTurkish] Hata:", e);
      return value;
    }
  };

  window.apiFetch = apiFetch;
  window.saveAuthSession = saveAuthSession;
  window.getAuthToken = getAuthToken;
  window.getAuthUser = getAuthUser;
  window.getUserId = getUserId;
  window.clearAuthSession = clearAuthSession;
  window.ensureAuthenticated = ensureAuthenticated;
  window.showToast = showToast;
  window.formatDateTurkish = formatDateTurkish;
  window.convertUTCToTurkishTime = convertUTCToTurkishTime;
})();