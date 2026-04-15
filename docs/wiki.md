# zarinpal-checkout — Complete API Wiki

A modern, type-safe ZarinPal payment gateway client for Node.js (v18+).

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Creating a Client](#creating-a-client)
   - [create()](#create)
   - [createWithOptions()](#createwithoptions)
   - [ZarinPalClientOptions](#zarinpalclientoptions)
4. [Methods](#methods)
   - [PaymentRequest](#paymentrequest)
   - [PaymentVerification](#paymentverification)
   - [UnverifiedTransactions](#unverifiedtransactions)
   - [RefreshAuthority](#refreshauthority)
   - [TokenBeautifier](#tokenbeautifier)
5. [Instance Properties](#instance-properties)
6. [Type Reference](#type-reference)
7. [Error Handling](#error-handling)
8. [Sandbox Mode](#sandbox-mode)
9. [API Endpoints](#api-endpoints)
10. [ZarinPal Response Codes](#zarinpal-response-codes)

---

## Installation

```bash
npm install zarinpal-checkout
# or
pnpm add zarinpal-checkout
# or
yarn add zarinpal-checkout
```

**Requirements:** Node.js v18 or higher.

---

## Quick Start

```typescript
import ZarinpalCheckout from 'zarinpal-checkout';

const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

// Create a payment
const payment = await zarinpal.PaymentRequest({
  Amount: 50000,
  CallbackURL: 'https://yoursite.com/verify',
  Description: 'Order #1234',
});

// Redirect the user
console.log(payment.url); // https://www.zarinpal.com/pg/StartPay/<authority>

// After user returns, verify the payment
const verified = await zarinpal.PaymentVerification({
  Amount: 50000,
  Authority: payment.authority,
});

if (verified.status === 100) {
  console.log('Payment successful. Ref ID:', verified.refId);
}
```

---

## Creating a Client

### `create()`

Simple factory function for quick client creation.

```typescript
import ZarinpalCheckout from 'zarinpal-checkout';

const zarinpal = ZarinpalCheckout.create(merchantId, sandbox?, currency?);
```

| Parameter    | Type       | Default | Description                         |
|-------------|------------|---------|-------------------------------------|
| `merchantId` | `string`   | —       | 36-character UUID merchant ID        |
| `sandbox`    | `boolean`  | `false` | Enable sandbox (test) environment    |
| `currency`   | `Currency` | `'IRT'` | Payment currency (`'IRT'` or `'IRR'`) |

**Example:**

```typescript
// Production, default IRT currency
const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

// Sandbox mode with IRR currency
const sandbox = ZarinpalCheckout.create(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  true,
  'IRR'
);
```

---

### `createWithOptions()`

Advanced factory accepting an options object. Exported both as a named export and on the default object.

```typescript
import { createWithOptions } from 'zarinpal-checkout';

const zarinpal = createWithOptions(merchantId, options?);
```

| Parameter    | Type                    | Description                          |
|-------------|-------------------------|--------------------------------------|
| `merchantId` | `string`                | 36-character UUID merchant ID         |
| `options`    | `ZarinPalClientOptions` | Optional configuration object         |

**Example:**

```typescript
import { createWithOptions } from 'zarinpal-checkout';

const zarinpal = createWithOptions('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', {
  sandbox: false,
  currency: 'IRT',
  timeoutMs: 15000,
  axiosConfig: {
    proxy: { host: '127.0.0.1', port: 8080 },
  },
});
```

---

### `ZarinPalClientOptions`

All fields are optional.

```typescript
interface ZarinPalClientOptions {
  sandbox?: boolean;
  currency?: Currency;
  timeoutMs?: number;
  axiosConfig?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>;
  httpClient?: HttpClient;
}
```

| Field         | Type                    | Default   | Description                                          |
|--------------|-------------------------|-----------|------------------------------------------------------|
| `sandbox`     | `boolean`               | `false`   | Route requests to ZarinPal sandbox endpoints          |
| `currency`    | `Currency`              | `'IRT'`   | `'IRT'` (Toman) or `'IRR'` (Rial)                   |
| `timeoutMs`   | `number`                | `10000`   | HTTP request timeout in milliseconds                  |
| `axiosConfig` | `AxiosRequestConfig`    | `{}`      | Extra axios config (headers, proxy, etc.) merged in   |
| `httpClient`  | `HttpClient`            | axios     | Inject a custom HTTP client (useful for testing)      |

---

## Methods

### `PaymentRequest`

Creates a new payment authority. Call this before redirecting the user to ZarinPal.

```typescript
PaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResponse>
```

#### Input

```typescript
interface PaymentRequestInput {
  Amount: number;        // Payment amount in the configured currency
  CallbackURL: string;   // Full URL ZarinPal redirects to after payment
  Description: string;   // Human-readable description of the payment
  Email?: string;        // (optional) Customer email for pre-filling the form
  Mobile?: string;       // (optional) Customer mobile for pre-filling the form
}
```

| Field         | Type     | Required | Description                                 |
|--------------|----------|----------|---------------------------------------------|
| `Amount`      | `number` | Yes      | Payment amount (IRT: Toman, IRR: Rial)       |
| `CallbackURL` | `string` | Yes      | Redirect URL after payment                   |
| `Description` | `string` | Yes      | Order / payment description                  |
| `Email`       | `string` | No       | Pre-fills customer email on payment page      |
| `Mobile`      | `string` | No       | Pre-fills customer mobile on payment page     |

#### Response

```typescript
interface PaymentRequestResponse {
  status: number;      // ZarinPal response code (100 = success)
  authority: string;   // Payment authority token
  url: string;         // Full redirect URL (StartPay + authority)
}
```

#### Example

```typescript
const payment = await zarinpal.PaymentRequest({
  Amount: 100000,
  CallbackURL: 'https://yoursite.com/payment/verify',
  Description: 'Purchase of order #5678',
  Email: 'customer@example.com',
  Mobile: '09120000000',
});

if (payment.status === 100) {
  // Redirect user to payment.url
  res.redirect(payment.url);
}
```

---

### `PaymentVerification`

Verifies a payment after the user returns from ZarinPal. The `Authority` and `Status` query parameters are appended to your `CallbackURL` by ZarinPal.

```typescript
PaymentVerification(input: PaymentVerificationInput): Promise<PaymentVerificationResponse>
```

#### Input

```typescript
interface PaymentVerificationInput {
  Amount: number;      // Must match the original PaymentRequest amount
  Authority: string;   // The authority value from the callback query string
}
```

| Field       | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| `Amount`    | `number` | Yes      | Same amount used in `PaymentRequest`      |
| `Authority` | `string` | Yes      | Authority token received in callback URL  |

#### Response

```typescript
interface PaymentVerificationResponse {
  status: number;      // 100 = verified, 101 = already verified
  message: string;     // Human-readable status
  cardHash?: string;   // SHA256 hash of the card number
  cardPan?: string;    // Masked card number (e.g. 6037****1234)
  refId?: number;      // ZarinPal reference ID (keep for records)
  feeType?: string;    // Fee deduction type
  fee?: number;        // Fee amount deducted
}
```

#### Callback URL parsing example

```typescript
// Express.js GET /payment/verify
app.get('/payment/verify', async (req, res) => {
  const { Authority, Status } = req.query;

  if (Status !== 'OK') {
    return res.send('Payment cancelled by user.');
  }

  const result = await zarinpal.PaymentVerification({
    Amount: 100000,
    Authority: Authority as string,
  });

  if (result.status === 100) {
    res.send(`Payment verified! Ref ID: ${result.refId}`);
  } else if (result.status === 101) {
    res.send('This payment was already verified.');
  } else {
    res.send(`Verification failed (code ${result.status})`);
  }
});
```

---

### `UnverifiedTransactions`

Returns a list of payment authorities that have been paid but not yet verified. Useful for recovering payments that were interrupted (e.g., the user closed the browser before verification ran).

```typescript
UnverifiedTransactions(): Promise<UnverifiedTransactionsResponse>
```

#### Response

```typescript
interface UnverifiedTransactionsResponse {
  code: number;            // ZarinPal response code
  message: string;         // Status message
  authorities: string[];   // Array of unverified authority strings
}
```

#### Example

```typescript
const result = await zarinpal.UnverifiedTransactions();

if (result.code === 100) {
  for (const authority of result.authorities) {
    // Attempt verification for each unverified authority
    const verify = await zarinpal.PaymentVerification({
      Amount: EXPECTED_AMOUNT,
      Authority: authority,
    });
    console.log(authority, verify.status);
  }
}
```

---

### `RefreshAuthority`

Extends the expiration time of a payment authority. By default authorities expire after 30 minutes; use this to give customers more time.

```typescript
RefreshAuthority(input: RefreshAuthorityInput): Promise<RefreshAuthorityResponse>
```

#### Input

```typescript
interface RefreshAuthorityInput {
  Authority: string;   // Authority token to refresh
  Expire: number;      // New expiry duration in seconds (min: 1800)
}
```

| Field       | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| `Authority` | `string` | Yes      | The authority token to extend             |
| `Expire`    | `number` | Yes      | New TTL in seconds (1800 = 30 minutes)    |

#### Response

```typescript
interface RefreshAuthorityResponse {
  code: number;      // ZarinPal response code
  message: string;   // Status message
}
```

#### Example

```typescript
const result = await zarinpal.RefreshAuthority({
  Authority: 'A0000000000000000000000000000000123456789',
  Expire: 3600,  // extend to 1 hour
});

if (result.code === 100) {
  console.log('Authority refreshed successfully.');
}
```

---

### `TokenBeautifier`

A utility that splits a payment authority token into display-friendly segments by breaking on word boundaries that follow leading zeros.

```typescript
TokenBeautifier(token: string): string[]
```

| Parameter | Type     | Description                   |
|----------|----------|-------------------------------|
| `token`   | `string` | The authority token to split   |

**Returns:** `string[]` — array of token segments.

#### Example

```typescript
const parts = zarinpal.TokenBeautifier('A0000012340056789');
// => ['A', '12340', '56789']
```

> **Note:** This method exists for backward compatibility. Most integrations do not need it.

---

## Instance Properties

After creating a client, three read-only properties are available:

```typescript
client.merchant  // string  — the merchant ID supplied at construction
client.sandbox   // boolean — whether sandbox mode is active
client.currency  // Currency — 'IRT' or 'IRR'
```

**Example:**

```typescript
const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', true, 'IRR');

console.log(zarinpal.merchant);  // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
console.log(zarinpal.sandbox);   // true
console.log(zarinpal.currency);  // 'IRR'
```

---

## Type Reference

### `Currency`

```typescript
type Currency = 'IRR' | 'IRT';
```

- `'IRT'` — Iranian Toman (default)
- `'IRR'` — Iranian Rial

### `HttpClient`

Implement this interface to inject a custom HTTP client (e.g., for testing or corporate proxies):

```typescript
interface HttpClient {
  request: <T = unknown>(config: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
}
```

### `ZarinPalError`

The shape of errors thrown when the ZarinPal API returns an error response:

```typescript
interface ZarinPalError {
  errors: {
    code: number;
    message: string;
    validations?: Record<string, string[]>;  // field-level validation errors
  };
}
```

---

## Error Handling

### Construction errors

The constructor throws synchronously for invalid configuration:

```typescript
// Throws: "The MerchantID must be 36 characters."
ZarinpalCheckout.create('bad-id');

// Throws: "Invalid currency. Valid options are 'IRR' or 'IRT'."
ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', false, 'USD' as any);
```

### API errors

When ZarinPal returns an error response, the library re-throws the parsed `ZarinPalError` object:

```typescript
try {
  const result = await zarinpal.PaymentRequest({ ... });
} catch (err) {
  // err is a ZarinPalError:
  // { errors: { code: -9, message: 'Invalid parameters', validations: { Amount: ['required'] } } }
  const error = err as ZarinPalError;
  console.error(error.errors.code, error.errors.message);
  if (error.errors.validations) {
    console.error('Validation errors:', error.errors.validations);
  }
}
```

### Network errors

If the request fails at the network level (timeout, DNS, etc.), the raw axios error is re-thrown:

```typescript
try {
  const result = await zarinpal.PaymentRequest({ ... });
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.error('Network error:', err.message);
  }
}
```

---

## Sandbox Mode

Use sandbox mode during development so no real money is charged. Sandbox URLs are automatically used when `sandbox: true`.

```typescript
const zarinpal = ZarinpalCheckout.create(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  true  // enable sandbox
);
```

| Environment | API Base URL                                        | StartPay URL                                          |
|------------|-----------------------------------------------------|-------------------------------------------------------|
| Production  | `https://payment.zarinpal.com/pg/v4/payment/`       | `https://www.zarinpal.com/pg/StartPay/`               |
| Sandbox     | `https://sandbox.zarinpal.com/pg/v4/payment/`       | `https://sandbox.zarinpal.com/pg/StartPay/`           |

---

## API Endpoints

| Method                   | HTTP Path             | Full Production URL                                                  |
|-------------------------|-----------------------|----------------------------------------------------------------------|
| `PaymentRequest`         | `request.json`        | `https://payment.zarinpal.com/pg/v4/payment/request.json`            |
| `PaymentVerification`    | `verify.json`         | `https://payment.zarinpal.com/pg/v4/payment/verify.json`             |
| `UnverifiedTransactions` | `unVerified.json`     | `https://payment.zarinpal.com/pg/v4/payment/unVerified.json`         |
| `RefreshAuthority`       | `refresh.json`        | `https://payment.zarinpal.com/pg/v4/payment/refresh.json`            |

All requests are HTTP **POST** with a JSON body.

---

## ZarinPal Response Codes

Common `status`/`code` values returned by the API:

| Code  | Meaning                                                   |
|-------|-----------------------------------------------------------|
| `100` | Success / Verified                                        |
| `101` | Payment already verified (duplicate verification attempt) |
| `-1`  | Incomplete information                                    |
| `-2`  | IP or merchant code is invalid                            |
| `-3`  | With the given amount, Shaparak restrictions apply        |
| `-4`  | Merchant level is lower than silver                       |
| `-9`  | Invalid parameters                                        |
| `-10` | Issue with merchant code / IP                             |
| `-11` | Merchant code is not active                               |
| `-12` | Sufficient attempts exceeded                              |
| `-15` | Terminal user suspended                                   |
| `-16` | Merchant level is lower than silver                       |
| `-30` | Merchant does not allow settlement of floating shares     |
| `-31` | Settlement account not set                               |
| `-32` | Amount cannot be divided into shares                      |
| `-33` | Share percentages do not add up to 100                    |
| `-34` | Amount too large for the number of shares                 |
| `-35` | Too many shares (max 10 allowed)                          |
| `-40` | Invalid extra parameters                                  |
| `-41` | Invalid CallbackURL (must be HTTPS in production)         |
| `-42` | Invalid validity period for authority                     |
| `-50` | Amounts do not match                                      |
| `-51` | Payment failed                                            |
| `-52` | Final confirmation from bank failed                       |
| `-53` | Authority does not belong to this merchant                |
| `-54` | Authority has expired                                     |

---

## `version`

The library exports a `version` string:

```typescript
import ZarinpalCheckout from 'zarinpal-checkout';
console.log(ZarinpalCheckout.version); // '1.0.0'

// or as a named export:
import { version } from 'zarinpal-checkout';
```
