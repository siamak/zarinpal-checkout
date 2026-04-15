export type Currency = 'IRR' | 'IRT';

export interface PaymentRequestInput {
  Amount: number;
  CallbackURL: string;
  Description: string;
  Email?: string;
  Mobile?: string;
}

export interface PaymentRequestResponse {
  status: number;
  authority: string;
  url: string;
}

export interface PaymentVerificationInput {
  Amount: number;
  Authority: string;
}

export interface PaymentVerificationResponse {
  status: number;
  message: string;
  cardHash?: string;
  cardPan?: string;
  refId?: number;
  feeType?: string;
  fee?: number;
}

export interface UnverifiedTransactionsResponse {
  code: number;
  message: string;
  authorities: string[];
}

export interface RefreshAuthorityInput {
  Authority: string;
  Expire: number;
}

export interface RefreshAuthorityResponse {
  code: number;
  message: string;
}

export interface ZarinPalError {
  errors: {
    code: number;
    message: string;
    validations?: Record<string, string[]>;
  };
}

export interface HttpRequestConfig {
  url: string;
  method: 'POST';
  data: unknown;
}

export interface HttpResponse<T = unknown> {
  data: T;
}

export interface HttpClient {
  request: <T = unknown>(config: HttpRequestConfig) => Promise<HttpResponse<T>>;
}

export interface DefaultHttpClientOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface ZarinPalClientOptions {
  sandbox?: boolean;
  currency?: Currency;
  timeoutMs?: number;
  requestConfig?: Omit<DefaultHttpClientOptions, 'timeoutMs'>;
  /** @deprecated Use requestConfig instead. */
  axiosConfig?: Omit<DefaultHttpClientOptions, 'timeoutMs'>;
  httpClient?: HttpClient;
}

export interface ZarinPalModule {
  version: string;
  create: (merchantId: string, sandbox?: boolean, currency?: Currency) => ZarinPal;
  createWithOptions: (merchantId: string, options?: ZarinPalClientOptions) => ZarinPal;
}

export interface ZarinPal {
  readonly merchant: string;
  readonly sandbox: boolean;
  readonly currency: Currency;
  PaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResponse>;
  PaymentVerification(input: PaymentVerificationInput): Promise<PaymentVerificationResponse>;
  UnverifiedTransactions(): Promise<UnverifiedTransactionsResponse>;
  RefreshAuthority(input: RefreshAuthorityInput): Promise<RefreshAuthorityResponse>;
  TokenBeautifier(token: string): string[];
}
