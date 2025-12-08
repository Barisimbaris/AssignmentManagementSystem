import apiClient from '../client';

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/User/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/User/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all students
export const getAllStudents = async () => {
  try {
    const response = await apiClient.get('/User/students');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all instructors
export const getAllInstructors = async () => {
  try {
    const response = await apiClient.get('/User/instructors');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/User/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user (Admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/User/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};