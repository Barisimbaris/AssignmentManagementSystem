import apiClient from '../client';

// Get all courses
export const getAllCourses = async () => {
  try {
    const response = await apiClient.get('/Course');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId) => {
  try {
    const response = await apiClient.get(`/Course/${courseId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create course (Admin)
export const createCourse = async (courseData) => {
  try {
    const response = await apiClient.post('/Course', courseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update course (Admin)
export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await apiClient.put(`/Course/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete course (Admin)
export const deleteCourse = async (courseId) => {
  try {
    const response = await apiClient.delete(`/Course/${courseId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};