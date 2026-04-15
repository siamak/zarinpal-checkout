import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ZarinpalCheckout, { createWithOptions, version, ZarinPalCheckout } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Mock HTTP client
// ---------------------------------------------------------------------------

interface RequestCall {
  url: string;
  method: string;
  data: unknown;
}

class MockHttpClient {
  public readonly calls: RequestCall[] = [];
  private nextResponse: unknown = { data: { data: {} } };

  public setResponse(response: unknown): void {
    this.nextResponse = response;
  }

  public async request(payload: RequestCall): Promise<unknown> {
    this.calls.push(payload);
    return this.nextResponse;
  }
}

// Helpers
const MERCHANT = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

function makeClient(overrides: Parameters<typeof createWithOptions>[1] = {}) {
  const mockClient = new MockHttpClient();
  const client = createWithOptions(MERCHANT, { httpClient: mockClient as never, ...overrides });
  return { client, mockClient };
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe('module exports', () => {
  test('default export has create, createWithOptions, and version', () => {
    assert.equal(typeof ZarinpalCheckout.create, 'function');
    assert.equal(typeof ZarinpalCheckout.createWithOptions, 'function');
    assert.equal(typeof ZarinpalCheckout.version, 'string');
  });

  test('named version export matches default export', () => {
    assert.equal(version, ZarinpalCheckout.version);
    assert.equal(version, '1.0.0');
  });

  test('ZarinPalCheckout class is exported as a named export', () => {
    assert.equal(typeof ZarinPalCheckout, 'function');
    const instance = new ZarinPalCheckout(MERCHANT);
    assert.ok(instance instanceof ZarinPalCheckout);
  });
});

// ---------------------------------------------------------------------------
// Client construction
// ---------------------------------------------------------------------------

describe('client construction', () => {
  test('create() returns an instance with correct defaults', () => {
    const client = ZarinpalCheckout.create(MERCHANT);
    assert.equal(client.merchant, MERCHANT);
    assert.equal(client.sandbox, false);
    assert.equal(client.currency, 'IRT');
  });

  test('create() accepts sandbox=true and currency=IRR', () => {
    const client = ZarinpalCheckout.create(MERCHANT, true, 'IRR');
    assert.equal(client.sandbox, true);
    assert.equal(client.currency, 'IRR');
  });

  test('createWithOptions() applies all options', () => {
    const client = createWithOptions(MERCHANT, { sandbox: true, currency: 'IRR', timeoutMs: 5000 });
    assert.equal(client.sandbox, true);
    assert.equal(client.currency, 'IRR');
  });

  test('throws when merchantId is shorter than 36 characters', () => {
    assert.throws(
      () => ZarinpalCheckout.create('too-short'),
      /MerchantID/
    );
  });

  test('throws when merchantId is longer than 36 characters', () => {
    assert.throws(
      () => ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-extra'),
      /MerchantID/
    );
  });

  test('throws when merchantId is empty', () => {
    assert.throws(
      () => ZarinpalCheckout.create(''),
      /MerchantID/
    );
  });

  test('throws for invalid currency', () => {
    assert.throws(
      () => createWithOptions(MERCHANT, { currency: 'USD' as never }),
      /Invalid currency/
    );
  });

  test('instance properties reflect constructor arguments', () => {
    const client = ZarinpalCheckout.create(MERCHANT, true, 'IRR');
    assert.equal(client.merchant, MERCHANT);
    assert.equal(client.sandbox, true);
    assert.equal(client.currency, 'IRR');
  });
});

// ---------------------------------------------------------------------------
// PaymentRequest
// ---------------------------------------------------------------------------

describe('PaymentRequest', () => {
  test('returns mapped response on success', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, authority: 'AUTH001' } } });

    const result = await client.PaymentRequest({
      Amount: 10000,
      CallbackURL: 'https://example.com/cb',
      Description: 'Test payment',
    });

    assert.equal(result.status, 100);
    assert.equal(result.authority, 'AUTH001');
    assert.equal(result.url, 'https://www.zarinpal.com/pg/StartPay/AUTH001');
  });

  test('includes Email and Mobile in metadata when provided', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, authority: 'AUTH002' } } });

    await client.PaymentRequest({
      Amount: 5000,
      CallbackURL: 'https://example.com/cb',
      Description: 'With metadata',
      Email: 'user@example.com',
      Mobile: '09120000001',
    });

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    const metadata = sent['metadata'] as Record<string, unknown>;
    assert.equal(metadata['email'], 'user@example.com');
    assert.equal(metadata['mobile'], '09120000001');
  });

  test('omits metadata when Email and Mobile are absent', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, authority: 'AUTH003' } } });

    await client.PaymentRequest({
      Amount: 1000,
      CallbackURL: 'https://example.com/cb',
      Description: 'No metadata',
    });

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    assert.equal(sent['metadata'], undefined);
  });

  test('sends correct production endpoint', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, authority: 'X' } } });

    await client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://payment.zarinpal.com/pg/v4/payment/request.json'
    );
  });

  test('sends correct sandbox endpoint', async () => {
    const { client, mockClient } = makeClient({ sandbox: true });
    mockClient.setResponse({ data: { data: { code: 100, authority: 'X' } } });

    await client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
    );
  });

  test('sandbox url points to sandbox StartPay', async () => {
    const { client, mockClient } = makeClient({ sandbox: true });
    mockClient.setResponse({ data: { data: { code: 100, authority: 'SANDAUTH' } } });

    const result = await client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' });

    assert.equal(result.url, 'https://sandbox.zarinpal.com/pg/StartPay/SANDAUTH');
  });

  test('sends merchant_id and currency in payload', async () => {
    const { client, mockClient } = makeClient({ currency: 'IRR' });
    mockClient.setResponse({ data: { data: { code: 100, authority: 'Y' } } });

    await client.PaymentRequest({ Amount: 9000, CallbackURL: 'https://x.com', Description: 'D' });

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    assert.equal(sent['merchant_id'], MERCHANT);
    assert.equal(sent['currency'], 'IRR');
    assert.equal(sent['amount'], 9000);
  });

  test('returns empty authority string when API omits it', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: -9 } } });

    const result = await client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' });
    assert.equal(result.authority, '');
  });
});

// ---------------------------------------------------------------------------
// PaymentVerification
// ---------------------------------------------------------------------------

describe('PaymentVerification', () => {
  test('returns all mapped fields', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({
      data: {
        data: {
          code: 100,
          message: 'Paid',
          ref_id: 99999,
          card_pan: '6037****1234',
          card_hash: 'abc123hash',
          fee_type: 'Merchant',
          fee: 500,
        },
      },
    });

    const result = await client.PaymentVerification({ Amount: 10000, Authority: 'AUTH' });

    assert.equal(result.status, 100);
    assert.equal(result.message, 'Paid');
    assert.equal(result.refId, 99999);
    assert.equal(result.cardPan, '6037****1234');
    assert.equal(result.cardHash, 'abc123hash');
    assert.equal(result.feeType, 'Merchant');
    assert.equal(result.fee, 500);
  });

  test('omits optional fields absent from API response', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 101, message: 'Already verified' } } });

    const result = await client.PaymentVerification({ Amount: 1000, Authority: 'AUTH' });

    assert.equal(result.status, 101);
    assert.equal(result.message, 'Already verified');
    assert.equal('cardHash' in result, false);
    assert.equal('cardPan' in result, false);
    assert.equal('refId' in result, false);
    assert.equal('feeType' in result, false);
    assert.equal('fee' in result, false);
  });

  test('sends correct endpoint', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.PaymentVerification({ Amount: 500, Authority: 'AUTH_VER' });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://payment.zarinpal.com/pg/v4/payment/verify.json'
    );
  });

  test('sends authority and amount in payload', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.PaymentVerification({ Amount: 7500, Authority: 'MYAUTH' });

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    assert.equal(sent['authority'], 'MYAUTH');
    assert.equal(sent['amount'], 7500);
    assert.equal(sent['merchant_id'], MERCHANT);
  });

  test('sandbox uses sandbox verify endpoint', async () => {
    const { client, mockClient } = makeClient({ sandbox: true });
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.PaymentVerification({ Amount: 1, Authority: 'A' });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
    );
  });
});

// ---------------------------------------------------------------------------
// UnverifiedTransactions
// ---------------------------------------------------------------------------

describe('UnverifiedTransactions', () => {
  test('returns authorities array on success', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({
      data: { data: { code: 100, message: 'Success', authorities: ['A1', 'A2', 'A3'] } },
    });

    const result = await client.UnverifiedTransactions();

    assert.equal(result.code, 100);
    assert.equal(result.message, 'Success');
    assert.deepEqual(result.authorities, ['A1', 'A2', 'A3']);
  });

  test('returns empty array when authorities is absent', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'None' } } });

    const result = await client.UnverifiedTransactions();

    assert.deepEqual(result.authorities, []);
  });

  test('sends only merchant_id in payload', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK', authorities: [] } } });

    await client.UnverifiedTransactions();

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    assert.equal(sent['merchant_id'], MERCHANT);
    assert.equal(Object.keys(sent).length, 1);
  });

  test('sends correct endpoint', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK', authorities: [] } } });

    await client.UnverifiedTransactions();

    assert.equal(
      mockClient.calls[0]?.url,
      'https://payment.zarinpal.com/pg/v4/payment/unVerified.json'
    );
  });

  test('sandbox uses sandbox unVerified endpoint', async () => {
    const { client, mockClient } = makeClient({ sandbox: true });
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK', authorities: [] } } });

    await client.UnverifiedTransactions();

    assert.equal(
      mockClient.calls[0]?.url,
      'https://sandbox.zarinpal.com/pg/v4/payment/unVerified.json'
    );
  });
});

// ---------------------------------------------------------------------------
// RefreshAuthority
// ---------------------------------------------------------------------------

describe('RefreshAuthority', () => {
  test('returns code and message on success', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'Refreshed' } } });

    const result = await client.RefreshAuthority({ Authority: 'AUTH_R', Expire: 1800 });

    assert.deepEqual(result, { code: 100, message: 'Refreshed' });
  });

  test('sends authority and expire in payload', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.RefreshAuthority({ Authority: 'MYTOKEN', Expire: 3600 });

    const sent = mockClient.calls[0]?.data as Record<string, unknown>;
    assert.equal(sent['authority'], 'MYTOKEN');
    assert.equal(sent['expire'], 3600);
    assert.equal(sent['merchant_id'], MERCHANT);
  });

  test('sends correct production endpoint', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.RefreshAuthority({ Authority: 'A', Expire: 1800 });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://payment.zarinpal.com/pg/v4/payment/refresh.json'
    );
  });

  test('sends correct sandbox endpoint', async () => {
    const { client, mockClient } = makeClient({ sandbox: true });
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });

    await client.RefreshAuthority({ Authority: 'A', Expire: 1800 });

    assert.equal(
      mockClient.calls[0]?.url,
      'https://sandbox.zarinpal.com/pg/v4/payment/refresh.json'
    );
  });
});

// ---------------------------------------------------------------------------
// TokenBeautifier
// ---------------------------------------------------------------------------

describe('TokenBeautifier', () => {
  // The regex is /\b0+/g — splits at a word-boundary followed by one or more zeros.
  // A word boundary occurs between \W and \w, or at start-of-string before \w.
  // All-alphanumeric tokens have no internal word boundaries, so they are not split.

  test('returns original token unchanged when all chars are alphanumeric', () => {
    const { client } = makeClient();
    // No word boundary inside an all-alphanumeric string → no split
    const parts = client.TokenBeautifier('A0000012340056789');
    assert.deepEqual(parts, ['A0000012340056789']);
  });

  test('splits a token that starts with leading zeros', () => {
    const { client } = makeClient();
    // Start-of-string is a word boundary when first char is \w, and first char is '0'
    const parts = client.TokenBeautifier('000ABC');
    assert.deepEqual(parts, ['', 'ABC']);
  });

  test('splits at non-word-char followed by leading zeros', () => {
    const { client } = makeClient();
    // Space (\W) before '0' (\w) → word boundary → match
    const parts = client.TokenBeautifier('X 00012');
    assert.deepEqual(parts, ['X ', '12']);
  });

  test('returns array with original string when no zeros present', () => {
    const { client } = makeClient();
    const parts = client.TokenBeautifier('ABCDEF');
    assert.deepEqual(parts, ['ABCDEF']);
  });

  test('handles empty string', () => {
    const { client } = makeClient();
    const parts = client.TokenBeautifier('');
    assert.ok(Array.isArray(parts));
  });

  test('returns string array for all elements', () => {
    const { client } = makeClient();
    const parts = client.TokenBeautifier('000A 00B');
    assert.ok(parts.every(p => typeof p === 'string'));
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('error handling', () => {
  test('re-throws ZarinPalError when API returns errors object', async () => {
    const mockClient = new MockHttpClient();
    const client = createWithOptions(MERCHANT, { httpClient: mockClient as never });

    // Simulate an axios-style error with response.data.errors
    const apiError = {
      isAxiosError: true,
      response: {
        data: {
          errors: { code: -9, message: 'Invalid parameters', validations: { Amount: ['required'] } },
        },
      },
    };

    mockClient.request = async () => { throw apiError; };

    await assert.rejects(
      () => client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' }),
      (err: unknown) => {
        const e = err as { errors: { code: number; message: string } };
        return e.errors?.code === -9 && e.errors?.message === 'Invalid parameters';
      }
    );
  });

  test('re-throws non-API errors as-is', async () => {
    const mockClient = new MockHttpClient();
    const client = createWithOptions(MERCHANT, { httpClient: mockClient as never });

    const networkError = new Error('Network timeout');
    mockClient.request = async () => { throw networkError; };

    await assert.rejects(
      () => client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' }),
      (err: unknown) => err === networkError
    );
  });
});

// ---------------------------------------------------------------------------
// Request method is always POST
// ---------------------------------------------------------------------------

describe('HTTP method', () => {
  test('PaymentRequest uses POST', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, authority: 'X' } } });
    await client.PaymentRequest({ Amount: 1, CallbackURL: 'https://x.com', Description: 'D' });
    assert.equal(mockClient.calls[0]?.method, 'POST');
  });

  test('PaymentVerification uses POST', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });
    await client.PaymentVerification({ Amount: 1, Authority: 'A' });
    assert.equal(mockClient.calls[0]?.method, 'POST');
  });

  test('UnverifiedTransactions uses POST', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK', authorities: [] } } });
    await client.UnverifiedTransactions();
    assert.equal(mockClient.calls[0]?.method, 'POST');
  });

  test('RefreshAuthority uses POST', async () => {
    const { client, mockClient } = makeClient();
    mockClient.setResponse({ data: { data: { code: 100, message: 'OK' } } });
    await client.RefreshAuthority({ Authority: 'A', Expire: 1800 });
    assert.equal(mockClient.calls[0]?.method, 'POST');
  });
});
