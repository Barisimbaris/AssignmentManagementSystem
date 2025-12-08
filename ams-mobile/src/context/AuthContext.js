import React, { createContext, useState, useEffect, useContext } from 'react';
import { saveToken, getToken, saveUser, getUser, clearStorage } from '../utils/storage';
import * as authAPI from '../api/endpoints/auth';

// Context oluştur
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Uygulama açılışında token kontrolü
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Token ve user bilgisini kontrol et
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const savedToken = await getToken();
      const savedUser = await getUser();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      console.log('🔄 AuthContext Login - İstek:', { email });
      
      const response = await authAPI.login({ email, password });
      
      console.log('✅ AuthContext Login - Yanıt:', response);
      
      if (response.isSuccess && response.data) {
        const { token: newToken, firstName, lastName, email: userEmail, role, userId } = response.data;
        
        // Token'ı kaydet
        await saveToken(newToken);
        setToken(newToken);
        
        // User objesi oluştur
        const userData = {
          id: userId,
          firstName,
          lastName,
          email: userEmail,
          role: role === 'Student' ? 1 : role === 'Instructor' ? 2 : 3,
        };
        
        console.log('📦 AuthContext - Kaydedilen user:', userData);
        
        await saveUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('❌ AuthContext Login error:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during login' 
      };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.isSuccess) {
        return { success: true, message: 'Registration successful' };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during registration' 
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await clearStorage();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  };

  // Change Password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword({
        oldPassword,
        newPassword,
        confirmPassword: newPassword,
      });
      
      if (response.isSuccess) {
        return { success: true, message: 'Password changed successfully' };
      }
      
      return { success: false, message: response.message || 'Password change failed' };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred' 
      };
    }
  };

  // Update user info
  const updateUserInfo = async (updatedUser) => {
    try {
      await saveUser(updatedUser);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false };
    }
  };

  // Context value
  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    changePassword,
    updateUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook - AuthContext'i kullanmak için
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};