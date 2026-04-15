import ZarinpalCheckout from '../src/index';

async function run(): Promise<void> {
  const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', false, 'IRT');

  const response = await zarinpal.PaymentRequest({
    Amount: 1000,
    CallbackURL: 'https://example.com/payment/callback',
    Description: 'Order #123',
    Email: 'user@example.com',
    Mobile: '09120000000'
  });

  console.log(response);
}

void run();
