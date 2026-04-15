import ZarinpalCheckout from '../src/index';

const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

const parts = zarinpal.TokenBeautifier('0000123400');
console.log(parts);
