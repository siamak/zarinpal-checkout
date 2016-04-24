/**
 * zarinpal-checkout • Simple implementation of ZarinPal Node.js. so you can quickly start using API.
 * @author Siamak Mokhtari <hi@siamak.work>
 * @date 4/27/15.
 */

'use strict';

var request = require('request-promise');
var config  = require('./config');
var VERSION = "0.1.3";

/**
 * Constructor for ZarinPal object.
 * @param {String} MerchantID
 * @param {bool} debug
 */
function ZarinPal(MerchantID, debug) {
	if (typeof MerchantID === 'string' && MerchantID.length === config.merchantID) {
		this.merchant = MerchantID;
	} else {
		console.error('The MerchantID must be 36 Characters.');
		return false;
	}
	this.debug = debug || false;

	this.url = (debug === true) ? config.sandbox : config.https;
}


/**
 * Get Authority from ZarinPal
 * @param  {number} Amount [Amount on Tomans.]
 * @param  {String} CallbackURL
 * @param  {String} Description
 * @param  {String} Email
 * @param  {String} Mobile
 */
ZarinPal.prototype.PaymentRequest = function(input) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Amount: input.Amount,
		CallbackURL: input.CallbackURL,
		Description: input.Description,
		Email: input.Email,
		Mobile: input.Mobile
	};

	var promise = new Promise(function (resolve, reject) {
		self.request2(self.url, config.API.PR, 'POST', params).then(function (data) {
			resolve({
				status: data.Status,
				url: config.PG(self.debug) + data.Authority
			});
		}).catch(function (err) {
			reject(err.message);
		});
	});

	return promise;
};


/**
 * Validate Payment from Authority.
 * @param  {number} Amount
 * @param  {String} Authority
 */
ZarinPal.prototype.PaymentVerification = function(input) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Amount: input.Amount,
		Authority: input.Authority
	};

	var promise = new Promise(function (resolve, reject) {
		self.request2(self.url, config.API.PV, 'POST', params).then(function (data) {
			resolve({
				status: data.Status,
				RefID: data.RefID
			});
		}).catch(function (err) {
			reject(err.message);
		});
	});

	return promise;
};


/**
 * Get Unverified Transactions
 * @param  {number} Amount
 * @param  {String} Authority
 */
ZarinPal.prototype.UnverifiedTransactions = function() {
	var self = this;
	var params = {
		MerchantID: self.merchant
	};

	var promise = new Promise(function (resolve, reject) {
		self.request2(self.url, config.API.UT, 'POST', params).then(function (data) {
			resolve({
				status: data.Status,
				authorities: data.Authorities
			});
		}).catch(function (err) {
			reject(err.message);
		});
	});

	return promise;
};


/**
 * Refresh Authority
 * @param  {number} Amount
 * @param  {String} Authority
 */
ZarinPal.prototype.RefreshAuthority = function(input) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Authority: input.Authority,
		ExpireIn: input.Expire
	};

	var promise = new Promise(function (resolve, reject) {
		self.request2(self.url, config.API.RA, 'POST', params).then(function (data) {
			resolve({
				status: data.Status
			});
		}).catch(function (err) {
			reject(err.message);
		});
	});

	return promise;
};


/**
 * `request` module with ZarinPal structure.
 * @param  {String}   url
 * @param  {String}   module
 * @param  {String}   method
 * @param  {String}   data
 * @param  {Function} callback
 */
ZarinPal.prototype.request2 = function(url, module, method, data) {
	var self = this,
			url  = url + module;

	var options = {
		method: method,
		url: url,
		headers: {
			'cache-control': 'no-cache',
			'content-type': 'application/json'
		},
		body: data,
		json: true
	};

	var promise = new Promise(function (resolve, reject) {
		request(options).then(function (body) {
			resolve(body);
		}).catch(function (err) {
			reject(err);
		});
	});

	return promise;
};


/**
 * Remove EXTRA ooooo!
 * @param {number} token [API response Authority]
 */
ZarinPal.prototype.TokenBeautifier = function (token) {
	return token.split(/\b0+/g);
};


/**
 * Export version module.
 */
exports.version = VERSION;


/**
 * Create ZarinPal object. Wrapper around constructor.
 */
exports.create = function(MerchantID, debug) {
	return new ZarinPal(MerchantID, debug);
};
