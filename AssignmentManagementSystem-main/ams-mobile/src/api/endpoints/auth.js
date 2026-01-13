import apiClient from '../client';

// Register - Yeni kullanıcı kaydı
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/Auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login - Kullanıcı girişi
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/Auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Change Password - Şifre değiştirme
export const changePassword = async (passwordData) => {
  try {
    const response = await apiClient.post('/Auth/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout (client-side only - token silme)
export const logout = async () => {
  // Token ve user bilgisini storage'dan sil
  // Bu işlem storage.js'de yapılacak
  return true;
};