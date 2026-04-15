import { test } from 'node:test';
import assert from 'node:assert/strict';
import ZarinpalCheckout, { createWithOptions } from '../src/index.ts';

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

const merchantId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

test('exposes create API and version', () => {
  assert.equal(typeof ZarinpalCheckout.create, 'function');
  assert.equal(typeof ZarinpalCheckout.version, 'string');
});

test('maps payment request response and endpoint', async () => {
  const mockClient = new MockHttpClient();
  mockClient.setResponse({ data: { data: { code: 100, authority: 'A123' } } });

  const client = createWithOptions(merchantId, { httpClient: mockClient as never });
  const response = await client.PaymentRequest({
    Amount: 1000,
    CallbackURL: 'https://example.com/callback',
    Description: 'Order #1',
    Email: 'hi@example.com',
    Mobile: '09120000000'
  });

  assert.deepEqual(response, {
    status: 100,
    authority: 'A123',
    url: 'https://www.zarinpal.com/pg/StartPay/A123'
  });

  assert.equal(mockClient.calls[0]?.url, 'https://payment.zarinpal.com/pg/v4/payment/request.json');
});

test('supports payment verification mapping', async () => {
  const mockClient = new MockHttpClient();
  mockClient.setResponse({
    data: {
      data: {
        code: 100,
        message: 'Verified',
        ref_id: 12345,
        card_pan: '6037********1234'
      }
    }
  });

  const client = createWithOptions(merchantId, { httpClient: mockClient as never });
  const response = await client.PaymentVerification({ Amount: 1000, Authority: 'AUTH' });

  assert.equal(response.status, 100);
  assert.equal(response.refId, 12345);
});

test('supports unverified transactions API', async () => {
  const mockClient = new MockHttpClient();
  mockClient.setResponse({
    data: {
      data: {
        code: 100,
        message: 'Success',
        authorities: ['A1', 'A2']
      }
    }
  });

  const client = createWithOptions(merchantId, { httpClient: mockClient as never });
  const response = await client.UnverifiedTransactions();

  assert.deepEqual(response.authorities, ['A1', 'A2']);
});

test('supports refresh authority API in sandbox mode', async () => {
  const mockClient = new MockHttpClient();
  mockClient.setResponse({ data: { data: { code: 100, message: 'Refreshed' } } });

  const client = createWithOptions(merchantId, {
    sandbox: true,
    currency: 'IRR',
    httpClient: mockClient as never
  });

  const response = await client.RefreshAuthority({ Authority: 'AUTH', Expire: 1800 });

  assert.deepEqual(response, { code: 100, message: 'Refreshed' });
  assert.equal(mockClient.calls[0]?.url, 'https://sandbox.zarinpal.com/pg/v4/payment/refresh.json');
});

test('throws for invalid merchant id', () => {
  assert.throws(() => ZarinpalCheckout.create('bad-id'), /MerchantID/);
});

test('uses advanced options and custom HTTP client', async () => {
  const mockClient = new MockHttpClient();
  mockClient.setResponse({ data: { data: { code: 100, authority: 'AUTH' } } });

  const client = createWithOptions(merchantId, {
    timeoutMs: 5000,
    sandbox: true,
    currency: 'IRR',
    httpClient: mockClient as never
  });

  await client.PaymentRequest({
    Amount: 1000,
    CallbackURL: 'https://example.com/callback',
    Description: 'Order #2'
  });

  assert.equal(client.currency, 'IRR');
  assert.equal(mockClient.calls.length, 1);
});
