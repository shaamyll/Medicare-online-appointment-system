import apiClient, { ApiResponse } from '@/lib/axios';
import { PayResponse, ReceiptData, PaymentMethod } from '../types/payment.types';

export const paymentsApi = {
  pay: async (appointmentId: number, method: PaymentMethod): Promise<PayResponse> => {
    const response = await apiClient.post<ApiResponse<PayResponse>>(
      `/appointments/${appointmentId}/pay`,
      { method }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Payment processing failed');
    }
    return response.data.data;
  },

  getReceipt: async (appointmentId: number): Promise<ReceiptData> => {
    const response = await apiClient.get<ApiResponse<ReceiptData>>(
      `/appointments/${appointmentId}/receipt`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch receipt');
    }
    return response.data.data;
  },

  collectPayment: async (appointmentId: number): Promise<PayResponse> => {
    const response = await apiClient.patch<ApiResponse<PayResponse>>(
      `/appointments/${appointmentId}/payment/collect`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Payment collection failed');
    }
    return response.data.data;
  },
};
