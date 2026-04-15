export const API_BASE_URL = {
  production: 'https://payment.zarinpal.com/pg/v4/payment/',
  sandbox: 'https://sandbox.zarinpal.com/pg/v4/payment/'
} as const;

export const API_PATHS = {
  paymentRequest: 'request.json',
  paymentVerification: 'verify.json',
  unverifiedTransactions: 'unVerified.json',
  refreshAuthority: 'refresh.json'
} as const;

export const START_PAY_BASE_URL = {
  production: 'https://www.zarinpal.com/pg/StartPay/',
  sandbox: 'https://sandbox.zarinpal.com/pg/StartPay/'
} as const;

export const MERCHANT_ID_LENGTH = 36;
