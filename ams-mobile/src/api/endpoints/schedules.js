import apiClient from '../client';

// Get schedule by ID
export const getScheduleById = async (scheduleId) => {
  try {
    const response = await apiClient.get(`/ClassSchedule/${scheduleId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get schedules by class ID
export const getSchedulesByClass = async (classId) => {
  try {
    const response = await apiClient.get(`/ClassSchedule/class/${classId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get my schedules (as instructor)
export const getMySchedules = async () => {
  try {
    const response = await apiClient.get('/ClassSchedule/my-schedules');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get weekly schedule for class
export const getWeeklySchedule = async (classId) => {
  try {
    const response = await apiClient.get(`/ClassSchedule/class/${classId}/weekly`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create schedule (Instructor only)
export const createSchedule = async (scheduleData) => {
  try {
    const response = await apiClient.post('/ClassSchedule', scheduleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update schedule (Instructor only)
export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await apiClient.put(`/ClassSchedule/${scheduleId}`, scheduleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete schedule (Instructor only)
export const deleteSchedule = async (scheduleId) => {
  try {
    const response = await apiClient.delete(`/ClassSchedule/${scheduleId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
