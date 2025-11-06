/**
 * Paystack API utility functions
 * Using direct HTTP calls instead of deprecated npm packages
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
      international_format_phone: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

/**
 * Verify a Paystack payment using the transaction reference
 */
export async function verifyPaystackPayment(reference: string): Promise<PaystackVerificationResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    throw error;
  }
}

/**
 * Get transaction details by ID
 */
export async function getPaystackTransaction(transactionId: string): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Paystack transaction:', error);
    throw error;
  }
}

/**
 * List transactions with optional filters
 */
export async function listPaystackTransactions(options: {
  perPage?: number;
  page?: number;
  customer?: string;
  status?: 'failed' | 'success' | 'abandoned';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  amount?: number;
} = {}): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  try {
    const url = `${PAYSTACK_BASE_URL}/transaction?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing Paystack transactions:', error);
    throw error;
  }
}

/**
 * Initialize a transaction (for server-side initiated payments)
 */
export async function initializePaystackTransaction(data: {
  email: string;
  amount: number; // Amount in kobo (for NGN) or cents (for USD, etc.)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: any;
}): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error);
    throw error;
  }
}

/**
 * Convert amount to Paystack's expected format (kobo for NGN, cents for others)
 */
export function convertToPaystackAmount(amount: number, currency: string): number {
  // Paystack expects amounts in the smallest currency unit
  // NGN: kobo (1 NGN = 100 kobo)
  // USD: cents (1 USD = 100 cents)
  // GHS: pesewas (1 GHS = 100 pesewas)
  return Math.round(amount * 100);
}

/**
 * Convert from Paystack amount format back to standard amount
 */
export function convertFromPaystackAmount(amount: number, currency: string): number {
  return amount / 100;
}

/**
 * Validate payment amount and currency
 */
export function validatePaymentData(amount: number, currency: string, email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!currency || !['NGN', 'USD', 'GHS', 'ZAR', 'KES'].includes(currency)) {
    errors.push('Invalid currency. Supported: NGN, USD, GHS, ZAR, KES');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email address is required');
  }

  // Minimum amounts (in main currency unit)
  const minimums: { [key: string]: number } = {
    NGN: 100,   // ₦100
    USD: 1,     // $1
    GHS: 1,     // GH₵1
    ZAR: 10,    // R10
    KES: 100,   // KSh100
  };

  if (currency && minimums[currency] && amount < minimums[currency]) {
    errors.push(`Minimum amount for ${currency} is ${minimums[currency]}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  verifyPaystackPayment,
  getPaystackTransaction,
  listPaystackTransactions,
  initializePaystackTransaction,
  convertToPaystackAmount,
  convertFromPaystackAmount,
  validatePaymentData
};