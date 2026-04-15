// @ts-ignore TS5097: Node ESM tests require explicit .ts extension.
import { ZarinPalCheckout } from './zarinpal.ts';
import type { Currency, ZarinPalClientOptions, ZarinPalModule } from './types.ts';

const version = '1.0.0';

const createWithOptions = (merchantId: string, options: ZarinPalClientOptions = {}): ZarinPalCheckout => {
  return new ZarinPalCheckout(merchantId, options);
};

const create = (merchantId: string, sandbox = false, currency: Currency = 'IRT'): ZarinPalCheckout => {
  return createWithOptions(merchantId, { sandbox, currency });
};

const ZarinpalCheckout: ZarinPalModule = {
  version,
  create,
  createWithOptions
};

export { ZarinPalCheckout, create, createWithOptions, version };
export default ZarinpalCheckout;
// @ts-ignore TS5097: Node ESM tests require explicit .ts extension.
export * from './types.ts';
