import apiClient from '../client';

// Create group for assignment (Student - Leader only)
export const createGroup = async (groupData) => {
  try {
    const response = await apiClient.post('/Group/create', groupData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get my group for assignment (Student)
export const getMyGroup = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/Group/my-group/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get available students for group formation (Student)
export const getAvailableStudents = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/Group/available-students/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check if student can create group for assignment (Student)
export const canCreateGroup = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/Group/can-create/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all groups for assignment (Instructor)
export const getAssignmentGroups = async (assignmentId) => {
  try {
    const response = await apiClient.get(`/Group/assignment/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get group details with members
export const getGroupDetails = async (groupId) => {
  try {
    const response = await apiClient.get(`/Group/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check if current user is group leader (Student)
export const isGroupLeader = async (groupId) => {
  try {
    const response = await apiClient.get(`/Group/${groupId}/is-leader`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get group submission details
export const getGroupSubmission = async (groupId) => {
  try {
    const response = await apiClient.get(`/Group/${groupId}/submission`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
