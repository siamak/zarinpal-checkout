// @ts-ignore TS5097: Node ESM tests require explicit .ts extension.
import { API_BASE_URL, API_PATHS, MERCHANT_ID_LENGTH, START_PAY_BASE_URL } from './config.ts';
import type {
  Currency,
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  PaymentRequestInput,
  PaymentRequestResponse,
  PaymentVerificationInput,
  PaymentVerificationResponse,
  RefreshAuthorityInput,
  RefreshAuthorityResponse,
  UnverifiedTransactionsResponse,
  ZarinPalClientOptions,
  ZarinPalError
} from './types.ts';

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

interface HttpErrorData {
  errors?: ZarinPalError['errors'];
}

interface HttpError extends Error {
  response?: {
    data?: HttpErrorData;
  };
}

const VALID_CURRENCIES = new Set<Currency>(['IRR', 'IRT']);
const DEFAULT_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json'
} as const;

class FetchHttpClient implements HttpClient {
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;

  public constructor(options: ZarinPalClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.headers = {
      ...DEFAULT_HEADERS,
      ...(options.requestConfig?.headers ?? {}),
      ...(options.axiosConfig?.headers ?? {})
    };
  }

  public async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: this.headers,
        body: JSON.stringify(config.data),
        signal: controller.signal
      });

      const parsedData = await response.json() as T | HttpErrorData;

      if (!response.ok) {
        const httpError = new Error(`Request failed with status ${response.status}`) as HttpError;
        httpError.response = { data: parsedData as HttpErrorData };
        throw httpError;
      }

      return { data: parsedData as T };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function hasApiError(error: unknown): error is HttpError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const responseData = (error as HttpError).response?.data;
  return responseData !== undefined && typeof responseData === 'object' && responseData !== null && 'errors' in responseData;
}

export class ZarinPalCheckout {
  public readonly merchant: string;
  public readonly sandbox: boolean;
  public readonly currency: Currency;
  private readonly client: HttpClient;

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

    this.client = options.httpClient ?? new FetchHttpClient(options);
  }

  public async PaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResponse> {
    const metadata: RequestPayload['metadata'] = {
      ...(input.Email !== undefined ? { email: input.Email } : {}),
      ...(input.Mobile !== undefined ? { mobile: input.Mobile } : {})
    };

    const data = await this.request(API_PATHS.paymentRequest, {
      merchant_id: this.merchant,
      currency: this.currency,
      amount: input.Amount,
      callback_url: input.CallbackURL,
      description: input.Description,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {})
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
      ...(data.card_hash !== undefined ? { cardHash: data.card_hash } : {}),
      ...(data.card_pan !== undefined ? { cardPan: data.card_pan } : {}),
      ...(data.ref_id !== undefined ? { refId: data.ref_id } : {}),
      ...(data.fee_type !== undefined ? { feeType: data.fee_type } : {}),
      ...(data.fee !== undefined ? { fee: data.fee } : {})
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
      if (hasApiError(error) && error.response?.data?.errors) {
        throw error.response.data;
      }

      throw error;
    }
  }
}
