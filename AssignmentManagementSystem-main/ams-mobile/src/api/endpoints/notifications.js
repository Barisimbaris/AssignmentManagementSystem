import apiClient from '../client';

// Get user notifications
export const getMyNotifications = async () => {
  try {
    const response = await apiClient.get('/Notification/my-notifications');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/Notification/unread-count');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/Notification/${notificationId}/mark-read`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
