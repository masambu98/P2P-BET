import crypto from 'crypto';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
  initiatorName?: string;
  initiatorPassword?: string;
}

export const getMpesaConfig = (): MpesaConfig => {
  const env = process.env.MPESA_ENV || 'sandbox';
  
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '',
    environment: env as 'sandbox' | 'production',
    callbackUrl: process.env.MPESA_CALLBACK_URL || '',
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
  };
};

export const getMpesaBaseUrl = (): string => {
  const config = getMpesaConfig();
  return config.environment === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
};

export const generateMpesaPassword = (): string => {
  const config = getMpesaConfig();
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, -3);
  const passwordString = `${config.shortcode}${config.passkey}${timestamp}`;
  
  return crypto
    .createHash('sha256')
    .update(passwordString)
    .digest('base64');
};

export const generateMpesaTimestamp = (): string => {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, -3);
};

export interface MpesaStkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}

export interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackData {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{
      Name: string;
      Value: any;
    }>;
  };
}

export const validateMpesaPhone = (phone: string): boolean => {
  // Kenyan phone number validation
  const kenyanPhoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
  return kenyanPhoneRegex.test(phone);
};

export const formatMpesaPhone = (phone: string): string => {
  // Format phone number to 254XXXXXXXXX format
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return `254${cleaned.slice(1)}`;
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return `254${cleaned}`;
  }
  
  return cleaned;
};
