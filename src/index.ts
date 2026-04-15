import { version } from '../package.json';
import { ZarinPalCheckout } from './zarinpal';
import type { Currency, ZarinPalClientOptions, ZarinPalModule } from './types';

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
export * from './types';
