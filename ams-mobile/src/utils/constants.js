// API Base URL - Backend API'nizin adresi
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.137.1:5281/api'  // iPhone için local IP
  : 'https://your-production-api.com/api';

// Token storage key
export const TOKEN_KEY = '@ams_token';
export const USER_KEY = '@ams_user';

// Roles
export const ROLES = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
};

// File upload settings
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
};

// Assignment types
export const ASSIGNMENT_TYPES = {
  INDIVIDUAL: 0,
  GROUP: 1,
};

// Submission status
export const SUBMISSION_STATUS = {
  SUBMITTED: 0,
  GRADED: 1,
  LATE: 2,
};