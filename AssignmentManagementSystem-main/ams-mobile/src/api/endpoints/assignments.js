import apiClient from '../client';

// Get all assignments
export const getAllAssignments = async () => {
  try {
    const response = await apiClient.get('/Assignment');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get assignment by ID
export const getAssignmentById = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/Assignment/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student's assignments
export const getMyAssignments = async () => {
  try {
    const response = await apiClient.get('/Assignment/my-assignments');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create assignment (Instructor/Admin)
export const createAssignment = async (assignmentData) => {
  try {
    const response = await apiClient.post('/Assignment', assignmentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update assignment (Instructor/Admin)
export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    const response = await apiClient.put(`/Assignment/${assignmentId}`, assignmentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete assignment (Instructor/Admin)
export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await apiClient.delete(`/Assignment/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};