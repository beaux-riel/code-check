/**
 * User entity type definition
 */
export interface User {
  id: number;
  name: string;
  email: string;
  birthDate: string;
  isActive: boolean;
  role: 'user' | 'admin' | 'moderator';
  preferences?: UserPreferences;
}

/**
 * User preferences type
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

/**
 * API response type
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string;
  code: number;
  details?: string;
}
