import ZarinpalCheckout from '../src/index';

async function run(): Promise<void> {
  const zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

  const response = await zarinpal.RefreshAuthority({
    Authority: '000000000000000000000000000000000000',
    Expire: 1800
  });

  console.log(response);
}

void run();
