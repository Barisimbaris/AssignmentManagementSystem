import apiClient from '../client';

// Get all classes
export const getAllClasses = async () => {
  try {
    const response = await apiClient.get('/Class');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get class by ID
export const getClassById = async (classId) => {
  try {
    const response = await apiClient.get(`/Class/${classId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get instructor's classes
export const getMyClasses = async () => {
  try {
    const response = await apiClient.get('/Class/my-classes');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create class (Instructor/Admin)
export const createClass = async (classData) => {
  try {
    const response = await apiClient.post('/Class', classData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Enroll in class (Student)
export const enrollInClass = async (classId) => {
  try {
    const response = await apiClient.post(`/Class/${classId}/enroll`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Unenroll from class (Student)
export const unenrollFromClass = async (classId) => {
  try {
    const response = await apiClient.post(`/Class/${classId}/unenroll`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update class (Instructor/Admin)
export const updateClass = async (classId, classData) => {
  try {
    const response = await apiClient.put(`/Class/${classId}`, classData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete class (Admin)
export const deleteClass = async (classId) => {
  try {
    const response = await apiClient.delete(`/Class/${classId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};