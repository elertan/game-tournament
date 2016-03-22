'use strict';

const request = require('request');

const config = require('../config');

module.exports = function (settings, cb) {
	const cfg = {
		form: settings.form,
		uri: settings.uri
	};

	if (settings.apiUri) {
		cfg.uri = config.apiServer + settings.apiUri;
	}

	if (!request[settings.method]) {
		cb({ msg: 'Not a valid request method' }, null);
		return;
	}

	request[settings.method](cfg, function (err, httpRes, body) {
		if (err) {
			cb({ err: err }, null);
			return;
		}

		try {
			const data = JSON.parse(body);
			cb(null, data);
		} catch (ex) {
			cb({ msg: ex.message }, null);
		}
	});
};