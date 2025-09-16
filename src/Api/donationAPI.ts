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
// downloadDonorsPDF() - Generate and download donors financial report PDF ✅ NEW

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
  user?: User;
  donator?: Donator;
}
export interface User {
  id: number;
  // email: string;
  name?: string;
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

// ✅ NEW: PDF Response interface
export interface PDFDownloadResponse {
  blob: Blob;
  filename: string;
}

// ==================== ERROR HANDLING ====================

export class DonationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

import {Alert} from 'react-native';
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

// ✅ NEW: Helper function to handle PDF responses
async function handlePDFResponse(
  response: Response,
): Promise<PDFDownloadResponse> {
  if (!response.ok) {
    // Try to get error message from response
    try {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'PDF generation failed';
      throw new DonationApiError(errorMessage, response.status);
    } catch {
      // If response is not JSON, use generic error
      throw new DonationApiError('PDF generation failed', response.status);
    }
  }

  const blob = await response.blob();

  // Extract filename from Content-Disposition header if available
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'donors_report.pdf'; // Default filename

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  return {blob, filename};
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

  // ✅ NEW: 📄 Download Donors Financial Report PDF
  downloadDonorsPDF: async (): Promise<PDFDownloadResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf`, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
        },
      });

      return await handlePDFResponse(response);
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

  // ✅ NEW: Save PDF blob to device (React Native specific)
  savePDFToDevice: async (blob: Blob, filename: string): Promise<string> => {
    try {
      // For React Native, you'll need react-native-fs or similar
      // This is a placeholder - actual implementation depends on your file handling setup

      // Convert blob to base64
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64Data = reader.result as string;
          // Remove the data:application/pdf;base64, prefix
          const base64 = base64Data.split(',')[1];

          // Here you would use react-native-fs or similar to save the file
          // Example with react-native-fs:
          // const RNFS = require('react-native-fs');
          // const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
          // RNFS.writeFile(path, base64, 'base64').then(() => resolve(path));

          // For now, return the base64 string
          resolve(base64);
        };

        reader.onerror = () => reject(new Error('Failed to read PDF blob'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new DonationApiError('Failed to save PDF to device', 0);
    }
  },

  // ✅ NEW: Show PDF download confirmation dialog
  showPDFDownloadDialog: (
    onConfirm: () => void,
    onCancel?: () => void,
  ): void => {
    Alert.alert(
      'Download PDF Report',
      'This will generate and download a complete financial report of all donors. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel' as const,
          onPress: onCancel,
        },
        {
          text: 'Download',
          style: 'default' as const,
          onPress: onConfirm,
        },
      ],
    );
  },

  // ✅ NEW: Show PDF success dialog
  showPDFSuccessDialog: (filePath: string): void => {
    Alert.alert(
      'PDF Downloaded Successfully!',
      `Report saved as: ${filePath}`,
      [
        {
          text: 'OK',
          style: 'default' as const,
        },
      ],
    );
  },

  // ✅ NEW: Show PDF error dialog
  showPDFErrorDialog: (error: string): void => {
    Alert.alert('PDF Download Failed', error, [
      {
        text: 'OK',
        style: 'default' as const,
      },
    ]);
  },

  // ✅ NEW: Generate filename with timestamp
  generatePDFFilename: (): string => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    return `donors_report_${timestamp}.pdf`;
  },
};
