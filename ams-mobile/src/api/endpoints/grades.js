import apiClient from '../client';

// Get grade by ID
export const getGradeById = async (gradeId) => {
  try {
    const response = await apiClient.get(`/Grade/${gradeId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student's grades
export const getMyGrades = async () => {
  try {
    const response = await apiClient.get('/Grade/my-grades');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get grades by class (Instructor/Admin)
export const getGradesByClass = async (classId) => {
  try {
    const response = await apiClient.get(`/Grade/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create grade (Instructor/Admin)
export const createGrade = async (gradeData) => {
  try {
    const response = await apiClient.post('/Grade', gradeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Publish grades (Instructor/Admin)
export const publishGrades = async (gradeIds) => {
  try {
    const response = await apiClient.post('/Grade/publish', { gradeIds });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update grade (Instructor/Admin)
export const updateGrade = async (gradeId, gradeData) => {
  try {
    const response = await apiClient.put(`/Grade/${gradeId}`, gradeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete grade (Instructor/Admin)
export const deleteGrade = async (gradeId) => {
  try {
    const response = await apiClient.delete(`/Grade/${gradeId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};