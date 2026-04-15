import ZarinpalCheckout from '../src/index';

const zarinpal = ZarinpalCheckout.create(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  false,
  'IRT'
);

console.log('Client created for merchant:', zarinpal.merchant);
