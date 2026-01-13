import apiClient from '../client';

// Get submission by ID
export const getSubmissionById = async (submissionId) => {
  try {
    const response = await apiClient.get(`/Submission/${submissionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student's submissions
export const getMySubmissions = async () => {
  try {
    const response = await apiClient.get('/Submission/my-submissions');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Submit assignment with file
export const submitAssignment = async (submissionData) => {
  try {
    const formData = new FormData();
    formData.append('assignmentId', submissionData.assignmentId);
    formData.append('comments', submissionData.comments || '');
    
    // Dosya ekleme
    if (submissionData.file) {
      formData.append('file', {
        uri: submissionData.file.uri,
        type: submissionData.file.mimeType,
        name: submissionData.file.name,
      });
    }

    const response = await apiClient.post('/Submission', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Resubmit assignment
export const resubmitAssignment = async (submissionId, submissionData) => {
  try {
    const formData = new FormData();
    formData.append('comments', submissionData.comments || '');
    
    // Dosya ekleme
    if (submissionData.file) {
      formData.append('file', {
        uri: submissionData.file.uri,
        type: submissionData.file.mimeType,
        name: submissionData.file.name,
      });
    }

    const response = await apiClient.put(`/Submission/${submissionId}/resubmit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Download submission file
export const downloadSubmission = async (submissionId) => {
  try {
    const response = await apiClient.get(`/Submission/${submissionId}/download`, {
      responseType: 'blob', // Dosya indirme için
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete submission
export const deleteSubmission = async (submissionId) => {
  try {
    const response = await apiClient.delete(`/Submission/${submissionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};