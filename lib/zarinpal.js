/**
 * zarinpal-checkout • Simple implementation of ZarinPal Node.js. so you can quickly start using API.
 * @author Siamak Mokhtari <hi@siamak.work>
 * @date 4/27/15.
 */

'use strict';

var request = require('request');
var config = require('./config');
var VERSION = "0.0.1";


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
 * @param  {Function} Callback
 */
ZarinPal.prototype.PaymentRequest = function(Amount, CallbackURL, Description, Email, Mobile, Callback) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Amount: Amount,
		CallbackURL: CallbackURL,
		Description: Description,
		Email: Email,
		Mobile: Mobile
	};


	self.request(self.url, config.API.PR, 'POST', params, function(data) {
		if (typeof Callback === 'function') {
			if (!data.error) {
				// var token = self.TokenBeautifier(data.Authority)[1];
				Callback(data.Status, config.PG(self.debug) + data.Authority);
			} else {
				Callback(data.error);
			}
		}
	});
};

/**
 * Validate Payment from Authority.
 * @param  {number} Amount
 * @param  {String} Authority
 * @param  {String} Callback
 */
ZarinPal.prototype.PaymentVerification = function(Amount, Authority, Callback) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Amount: Amount,
		Authority: Authority
	};

	self.request(self.url, config.API.PV, 'POST', params, function(data) {
		if (typeof Callback === 'function') {
			if (!data.error) {
				Callback(data.Status, data.RefID);
			} else {
				Callback(data.error);
			}
		}
	});
};


/**
 * Get Unverified Transactions
 * @param  {number} Amount
 * @param  {String} Authority
 * @param  {String} Callback
 */
ZarinPal.prototype.UnverifiedTransactions = function(Callback) {
	var self = this;
	var params = {
		MerchantID: self.merchant
	};

	self.request(self.url, config.API.UT, 'POST', params, function(data) {
		if (typeof Callback === 'function') {
			if (!data.error) {
				Callback(data.Status, data.Authorities);
			} else {
				Callback(data.error);
			}
		}
	});
};


/**
 * Refresh Authority
 * @param  {number} Amount
 * @param  {String} Authority
 * @param  {Function} Callback
 */
ZarinPal.prototype.RefreshAuthority = function(Authority, Expire, Callback) {
	var self = this;
	var params = {
		MerchantID: self.merchant,
		Authority: Authority,
		ExpireIn: Expire
	};

	self.request(self.url, config.API.RA, 'POST', params, function(data) {
		if (typeof Callback === 'function') {
			if (!data.error) {
				Callback(data.Status);
			} else {
				Callback(data.error);
			}
		}
	});
};


/**
 * `request` module with ZarinPal structure.
 * @param  {String}   url
 * @param  {String}   module
 * @param  {String}   method
 * @param  {String}   data
 * @param  {Function} callback
 */
ZarinPal.prototype.request = function(url, module, method, data, callback) {
	var self   = this,
		url    = url + module;

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

	request(options, function (error, response, body) {
		if (error) {
			console.error(error);
			return false
		}

		callback(body);
	});

	return self;
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
