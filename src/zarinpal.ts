import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL, API_PATHS, MERCHANT_ID_LENGTH, START_PAY_BASE_URL } from './config';
import type {
  Currency,
  PaymentRequestInput,
  PaymentRequestResponse,
  PaymentVerificationInput,
  PaymentVerificationResponse,
  RefreshAuthorityInput,
  RefreshAuthorityResponse,
  UnverifiedTransactionsResponse,
  ZarinPalClientOptions,
  ZarinPalError
} from './types';

interface RequestPayload {
  merchant_id: string;
  currency?: Currency;
  amount?: number;
  callback_url?: string;
  description?: string;
  metadata?: {
    email?: string;
    mobile?: string;
  };
  authority?: string;
  expire?: number;
}

interface ApiData {
  code: number;
  message: string;
  authority?: string;
  authorities?: string[];
  card_hash?: string;
  card_pan?: string;
  ref_id?: number;
  fee_type?: string;
  fee?: number;
}

const VALID_CURRENCIES = new Set<Currency>(['IRR', 'IRT']);

export class ZarinPalCheckout {
  public readonly merchant: string;
  public readonly sandbox: boolean;
  public readonly currency: Currency;
  private readonly client: AxiosInstance;

  public constructor(merchantId: string, options: ZarinPalClientOptions = {}) {
    if (merchantId.length !== MERCHANT_ID_LENGTH) {
      throw new Error(`The MerchantID must be ${MERCHANT_ID_LENGTH} characters.`);
    }

    this.merchant = merchantId;
    this.sandbox = options.sandbox ?? false;
    this.currency = options.currency ?? 'IRT';

    if (!VALID_CURRENCIES.has(this.currency)) {
      throw new Error("Invalid currency. Valid options are 'IRR' or 'IRT'.");
    }

    this.client = axios.create({
      timeout: options.timeoutMs ?? 10_000,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      ...options.axiosConfig
    });
  }

  public async PaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResponse> {
    const data = await this.request(API_PATHS.paymentRequest, {
      merchant_id: this.merchant,
      currency: this.currency,
      amount: input.Amount,
      callback_url: input.CallbackURL,
      description: input.Description,
      metadata: {
        email: input.Email,
        mobile: input.Mobile
      }
    });

    return {
      status: data.code,
      authority: data.authority ?? '',
      url: `${this.getStartPayUrl()}${data.authority ?? ''}`
    };
  }

  public async PaymentVerification(input: PaymentVerificationInput): Promise<PaymentVerificationResponse> {
    const data = await this.request(API_PATHS.paymentVerification, {
      merchant_id: this.merchant,
      amount: input.Amount,
      authority: input.Authority
    });

    return {
      status: data.code,
      message: data.message,
      cardHash: data.card_hash,
      cardPan: data.card_pan,
      refId: data.ref_id,
      feeType: data.fee_type,
      fee: data.fee
    };
  }

  public async UnverifiedTransactions(): Promise<UnverifiedTransactionsResponse> {
    const data = await this.request(API_PATHS.unverifiedTransactions, {
      merchant_id: this.merchant
    });

    return {
      code: data.code,
      message: data.message,
      authorities: data.authorities ?? []
    };
  }

  public async RefreshAuthority(input: RefreshAuthorityInput): Promise<RefreshAuthorityResponse> {
    const data = await this.request(API_PATHS.refreshAuthority, {
      merchant_id: this.merchant,
      authority: input.Authority,
      expire: input.Expire
    });

    return {
      code: data.code,
      message: data.message
    };
  }

  public TokenBeautifier(token: string): string[] {
    return token.split(/\b0+/g);
  }

  private getApiBaseUrl(): string {
    return this.sandbox ? API_BASE_URL.sandbox : API_BASE_URL.production;
  }

  private getStartPayUrl(): string {
    return this.sandbox ? START_PAY_BASE_URL.sandbox : START_PAY_BASE_URL.production;
  }

  private async request(path: string, payload: RequestPayload): Promise<ApiData> {
    const url = `${this.getApiBaseUrl()}${path}`;

    try {
      const response = await this.client.request<{ data: ApiData }>({
        url,
        method: 'POST',
        data: payload
      });

      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError<{ errors?: ZarinPalError['errors'] }>(error) && error.response?.data?.errors) {
        throw error.response.data;
      }

      throw error;
    }
  }
}
