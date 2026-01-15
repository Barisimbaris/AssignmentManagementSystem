import apiClient from '../client';

// Get all lesson plans (Instructor)
export const getAllLessonPlans = async () => {
  try {
    const response = await apiClient.get('/LessonPlan');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get lesson plan by ID
export const getLessonPlanById = async (lessonPlanId) => {
  try {
    const response = await apiClient.get(`/LessonPlan/${lessonPlanId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get lesson plans by class ID
export const getLessonPlansByClass = async (classId) => {
  try {
    const response = await apiClient.get(`/LessonPlan/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create lesson plan (Instructor)
export const createLessonPlan = async (lessonPlanData) => {
  try {
    const response = await apiClient.post('/LessonPlan', lessonPlanData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update lesson plan (Instructor)
export const updateLessonPlan = async (lessonPlanId, lessonPlanData) => {
  try {
    const response = await apiClient.put(`/LessonPlan/${lessonPlanId}`, lessonPlanData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete lesson plan (Instructor)
export const deleteLessonPlan = async (lessonPlanId) => {
  try {
    const response = await apiClient.delete(`/LessonPlan/${lessonPlanId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
