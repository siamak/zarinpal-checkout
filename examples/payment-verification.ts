import ZarinpalCheckout from '../src/index';

async function run(): Promise<void> {
  const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

  const response = await zarinpal.PaymentVerification({
    Amount: 1000,
    Authority: '000000000000000000000000000000000000'
  });

  console.log(response);
}

void run();
