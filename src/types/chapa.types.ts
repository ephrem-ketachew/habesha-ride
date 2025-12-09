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
  type?: string;
  tx_ref: string;
  transaction_id?: string;
  reference?: string;
  chapa_reference?: string;
  bank_reference?: string;
  status: string;
  amount: string | number;
  currency: string;
  charge?: string;
  payment_method?: string;
  method?: string;
  mode?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  mobile?: string;
  account_name?: string;
  account_number?: string;
  bank_id?: number;
  bank_name?: string;
  created_at: string;
  updated_at: string;
  customization?: IChapaCustomization;
  meta?: any;
  [key: string]: any;
}

export enum ChapaPaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}
