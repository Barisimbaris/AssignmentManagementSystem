import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log('📤 API İstek:', config.method.toUpperCase(), config.url);
    
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token eklendi:', token.substring(0, 30) + '...');
    } else {
      console.warn('⚠️ TOKEN BULUNAMADI! Request gönderiliyor ama token yok!');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Yanıt:', response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      console.log('❌ API Hatası:', error.config?.url, status, data?.message);
      
      switch (status) {
        case 401:
          console.log('🔒 Unauthorized - Token geçersiz veya yok!');
          break;
        case 403:
          console.log('🚫 Forbidden - Yetkisiz erişim');
          break;
        case 404:
          console.log('🔍 Not Found');
          break;
        case 500:
          console.log('💥 Server error');
          break;
        default:
          console.log('⚠️ Error:', data?.message || 'Something went wrong');
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.log('🌐 Network error - Bağlantı yok');
      return Promise.reject({ message: 'Network error - Please check your connection' });
    } else {
      console.log('⚠️ Request error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default apiClient;