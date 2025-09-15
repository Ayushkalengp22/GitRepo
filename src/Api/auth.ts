// API/auth.ts

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
  // Add other role properties if needed
}

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  error: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const API_BASE_URL = 'http://localhost:4000';

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error status codes based on your backend
        const errorMessage = data.error || 'Login failed';
        throw new ApiError(errorMessage, response.status);
      }

      // Return the successful response
      return data as LoginResponse;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof ApiError) {
        throw error; // Re-throw API errors
      }

      // Handle network/connection errors
      throw new ApiError(
        'Network error. Please check your connection and try again.',
        0,
      );
    }
  },

  // You can add more auth methods here later
  // logout: async () => { ... },
  // refreshToken: async (token: string) => { ... },
  // forgotPassword: async (email: string) => { ... },
};
