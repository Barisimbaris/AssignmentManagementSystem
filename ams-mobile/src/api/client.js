import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 saniye
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Her istekte token ekle
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
apiClient.interceptors.response.use(
  (response) => {
    // Başarılı response
    return response;
  },
  (error) => {
    // Hata durumları
    if (error.response) {
      // Backend'den gelen hatalar
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - Token geçersiz veya yok
          console.log('Unauthorized - Please login again');
          // TODO: Logout ve login sayfasına yönlendir
          break;
        case 403:
          // Forbidden - Yetkisiz erişim
          console.log('Forbidden - You do not have permission');
          break;
        case 404:
          // Not Found
          console.log('Resource not found');
          break;
        case 500:
          // Server Error
          console.log('Server error - Please try again later');
          break;
        default:
          console.log('Error:', data?.message || 'Something went wrong');
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // İstek gönderildi ama cevap alınamadı (network hatası)
      console.log('Network error - Please check your connection');
      return Promise.reject({ message: 'Network error - Please check your connection' });
    } else {
      // İstek oluşturulurken hata
      console.log('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default apiClient;