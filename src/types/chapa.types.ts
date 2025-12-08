export interface IChapaCustomization {
  title?: string;
  description?: string;
  logo?: string;
}

export interface IChapaInitializePaymentInput {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: IChapaCustomization;
}

export interface IChapaInitializePaymentResponse {
  checkout_url: string;
  tx_ref: string;
}

export interface IChapaVerifyPaymentResponse {
  first_name: string;
  last_name: string;
  email: string;
  currency: string;
  amount: string;
  charge: string;
  mode: string;
  method: string;
  type: string;
  status: string;
  reference: string;
  tx_ref: string;
  customization?: IChapaCustomization;
  meta?: any;
  created_at: string;
  updated_at: string;
}

export interface IChapaWebhookPayload {
  event: string;
  data: {
    tx_ref: string;
    transaction_id: string;
    status: string;
    amount: number;
    currency: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
}

export enum ChapaPaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}
