# 💰 ZarinPal Checkout
ZarinPal Checkout implementation in Node.JS

## 💡 Installation

```bash
npm install zarinpal-checkout
```

## 🕹 Usage

Install package from `npm` and Import to Project:
```javascript
var ZarinpalCheckout = require('zarinpal-checkout');
```
Config package:
```javascript
var zarinpal = ZarinpalCheckout.create('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', false);

/**
 * PaymentRequest [module]
 * @return {String} URL [Payement Authority]
 */
zarinpal.PaymentRequest('1000', 'http://siamak.us', 'Hello NodeJS API.', 'hi@siamak.work', '09120000000', function (status, url) {
	if (status === 100) {
		console.log(url);
	}
});
```

### 🍦🍦🍦 [DEMO: ZarinPal Express checkout](https://github.com/siamakmokhtari/zarinpal-express-checkout).
---
## 🔆 TODO:
* Add Extra mode for API.
* Unit testing.

---
Please feel free to comment and contribute.

## 🍀 License
Copyright (c) 2016 Siamak Mokhtari. Licensed under [MIT](http://siamak.mit-license.org).

```
The MIT License (MIT)

Copyright (c) 2015 Siamak Mokhtari s.mokhtari75@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
