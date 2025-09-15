// API/donationAPI.ts

// 🔧 API Functions Included:
// Donation Management:

// addDonator() - Add new donator with first donation (ADMIN only)
// getAllDonators() - Get all donators with their donations
// getDonatorById() - Get single donator by ID
// updateDonator() - Update donator details (ADMIN only)
// updateDonation() - Update donation payment details (ADMIN only)

// Summary & Reports:

// getDonationSummary() - Get overall donation summary
// getDonationsByBook() - Get donations by book number (ADMIN only)
// getBookSummary() - Get book-wise summary (ADMIN only)

// ==================== TYPES & INTERFACES ====================

export type PaymentMethod = 'Not Done' | 'Cash' | 'Online';
export type DonationStatus = 'PAID' | 'PARTIAL' | 'PENDING';

export interface Role {
  id: string;
  name: string;
}

export interface Donation {
  id: number;
  userId: string;
  donatorId: number;
  amount: number;
  paidAmount: number;
  balance: number;
  status: DonationStatus;
  paymentMethod: PaymentMethod;
  bookNumber?: string;
  createdAt: string;
  updatedAt: string;
  donator?: Donator;
}

export interface Donator {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  totalAmount?: number;
  balanceAmount?: number;
  createdAt: string;
  updatedAt: string;
  donations: Donation[];
}

// ==================== REQUEST INTERFACES ====================

export interface AddDonatorRequest {
  name: string;
  phone?: string;
  address?: string;
  amount: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  bookNumber?: string;
}

export interface UpdateDonatorRequest {
  name?: string;
  email?: string;
  totalAmount?: number;
  balanceAmount?: number;
}

export interface UpdateDonationRequest {
  donationId: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  name?: string;
}

// ==================== RESPONSE INTERFACES ====================

export interface DonationSummary {
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

export interface BookSummary extends DonationSummary {
  bookNumber: string;
}

export interface UpdateDonationResponse {
  donation: Donation;
  donorTotals: {
    totalPaid: number;
    totalBalance: number;
  };
}

export interface ApiErrorResponse {
  error: string;
}

// ==================== ERROR HANDLING ====================

export class DonationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ==================== API CONFIGURATION ====================

// const API_BASE_URL =
//   'https://donation-1-efzw.onrender.com/' || 'http://localhost:4000';

import {API_BASE_URL} from '../../src/config';
// Helper function to get auth headers
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error || 'API request failed';
    throw new DonationApiError(errorMessage, response.status);
  }

  return data as T;
}

// ==================== DONATION API FUNCTIONS ====================

export const donationAPI = {
  // ➕ Add Donator with first donation (ADMIN only)
  addDonator: async (
    donatorData: AddDonatorRequest,
    token: string,
  ): Promise<Donator> => {
    try {
      const response = await fetch(`${API_BASE_URL}/donators`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(donatorData),
      });

      return await handleApiResponse<Donator>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // 📋 Get all Donators (with donations)
  getAllDonators: async (): Promise<Donator[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/donators`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await handleApiResponse<Donator[]>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // 📊 Get donation summary (total amount, paid, balance)
  getDonationSummary: async (): Promise<DonationSummary> => {
    try {
      const response = await fetch(`${API_BASE_URL}/donators/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await handleApiResponse<DonationSummary>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },
  // 📋 Get single Donator by ID
  getDonatorById: async (id: number): Promise<Donator> => {
    try {
      const response = await fetch(`${API_BASE_URL}/donators/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await handleApiResponse<Donator>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // ✏️ Update Donator (ADMIN only)
  updateDonator: async (
    id: number,
    updateData: UpdateDonatorRequest,
    token: string,
  ): Promise<Donator> => {
    try {
      const response = await fetch(`${API_BASE_URL}/donators/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updateData),
      });

      return await handleApiResponse<Donator>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // 💰 Update Donation (ADMIN only)
  updateDonation: async (
    donatorId: number,
    updateData: UpdateDonationRequest,
    token: string,
  ): Promise<UpdateDonationResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/donators/${donatorId}/donation`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(token),
          body: JSON.stringify(updateData),
        },
      );

      return await handleApiResponse<UpdateDonationResponse>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // 📖 Get donations by book number (ADMIN only)
  getDonationsByBook: async (
    bookNumber: string,
    token: string,
  ): Promise<Donation[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/donators/book/${bookNumber}`,
        {
          method: 'GET',
          headers: getAuthHeaders(token),
        },
      );

      return await handleApiResponse<Donation[]>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },

  // 📊 Get book-wise summary (ADMIN only)
  getBookSummary: async (
    bookNumber: string,
    token: string,
  ): Promise<BookSummary> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/donators/summary/book/${bookNumber}`,
        {
          method: 'GET',
          headers: getAuthHeaders(token),
        },
      );

      return await handleApiResponse<BookSummary>(response);
    } catch (error: any) {
      if (error instanceof DonationApiError) {
        throw error;
      }
      throw new DonationApiError(
        'Network error. Please check your connection.',
        0,
      );
    }
  },
};

// ==================== UTILITY FUNCTIONS ====================

export const donationUtils = {
  // Calculate donation status based on amounts
  calculateStatus: (amount: number, paidAmount: number): DonationStatus => {
    if (paidAmount >= amount) return 'PAID';
    if (paidAmount > 0) return 'PARTIAL';
    return 'PENDING';
  },

  // Calculate balance
  calculateBalance: (amount: number, paidAmount: number): number => {
    return amount - paidAmount;
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  },

  // Validate payment method
  isValidPaymentMethod: (method: string): method is PaymentMethod => {
    return ['Not Done', 'Cash', 'Online'].includes(method);
  },

  // Get status color for UI
  getStatusColor: (status: DonationStatus): string => {
    switch (status) {
      case 'PAID':
        return '#22C55E'; // Green
      case 'PARTIAL':
        return '#F59E0B'; // Yellow
      case 'PENDING':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  },
};
