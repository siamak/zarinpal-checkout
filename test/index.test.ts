import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import ZarinpalCheckout, { createWithOptions } from '../src';

const requestMock = vi.fn();

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');

  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({ request: requestMock })),
      isAxiosError: actual.default.isAxiosError
    }
  };
});

describe('zarinpal-checkout', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('exposes create API and version', () => {
    expect(typeof ZarinpalCheckout.create).toBe('function');
    expect(typeof ZarinpalCheckout.version).toBe('string');
  });

  it('creates payment request payload and maps response', async () => {
    requestMock.mockResolvedValue({
      data: {
        data: {
          code: 100,
          authority: 'A123'
        }
      }
    });

    const client = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', false, 'IRT');

    const response = await client.PaymentRequest({
      Amount: 1000,
      CallbackURL: 'https://example.com/callback',
      Description: 'Order #1',
      Email: 'hi@example.com',
      Mobile: '09120000000'
    });

    expect(response).toEqual({
      status: 100,
      authority: 'A123',
      url: 'https://www.zarinpal.com/pg/StartPay/A123'
    });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://payment.zarinpal.com/pg/v4/payment/request.json'
      })
    );
  });

  it('supports payment verification mapping', async () => {
    requestMock.mockResolvedValue({
      data: {
        data: {
          code: 100,
          message: 'Verified',
          ref_id: 12345,
          card_pan: '6037********1234'
        }
      }
    });

    const client = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

    const response = await client.PaymentVerification({ Amount: 1000, Authority: 'AUTH' });

    expect(response.status).toBe(100);
    expect(response.refId).toBe(12345);
  });

  it('supports unverified transactions API', async () => {
    requestMock.mockResolvedValue({
      data: {
        data: {
          code: 100,
          message: 'Success',
          authorities: ['A1', 'A2']
        }
      }
    });

    const client = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    const response = await client.UnverifiedTransactions();

    expect(response.authorities).toEqual(['A1', 'A2']);
  });

  it('supports refresh authority API', async () => {
    requestMock.mockResolvedValue({
      data: {
        data: {
          code: 100,
          message: 'Refreshed'
        }
      }
    });

    const client = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', true, 'IRR');
    const response = await client.RefreshAuthority({ Authority: 'AUTH', Expire: 1800 });

    expect(response).toEqual({ code: 100, message: 'Refreshed' });
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://sandbox.zarinpal.com/pg/v4/payment/refresh.json'
      })
    );
  });

  it('throws for invalid merchant id', () => {
    expect(() => ZarinpalCheckout.create('bad-id')).toThrow(/MerchantID/);
  });

  it('uses advanced options', () => {
    createWithOptions('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', {
      timeoutMs: 5000,
      sandbox: true,
      currency: 'IRR'
    });

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 5000 })
    );
  });
});
