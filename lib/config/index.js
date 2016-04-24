'use strict';


var config = {
	https: 'https://www.zarinpal.com/pg/rest/WebGate/',
	sandbox: 'https://sandbox.zarinpal.com/pg/rest/WebGate/',
	merchantID: 36,
	API: {
		PR: 'PaymentRequest.json',
		PRX: 'PaymentRequestWithExtra.json',
		PV: 'PaymentVerification.json',
		PVX: 'PaymentVerificationWithExtra.json',
		RA: 'RefreshAuthority.json',
		UT: 'UnverifiedTransactions.json'
	},
	PG: function(sandbox) {
		if (sandbox == true) {
			return 'https://sandbox.zarinpal.com/pg/transaction/pay/';
		} else {
			return 'https://www.zarinpal.com/pg/transaction/pay/';
		}
	}
};

module.exports = config;
