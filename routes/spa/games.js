'use strict';

const co = require('co');
const express = require('express');
const router = express.Router();

const isAuth = require('../../middleware/isAuth');

var ge = {};
require('../../modules/game-extensions').then(gExtensions => {
	ge = gExtensions;
});

router.get('/', isAuth, (req, res) => {
	co(function *() {
		res.render('spa/games/index', { ge: ge });
	}).catch(err => {
		res.status(500);
		res.end();
	});
});

router.get('/show', isAuth, (req, res) => {
	co(function *() {
		res.render('spa/games/show', { ge: ge });
	}).catch(err => {
		res.status(500);
		res.end();
	});
});

router.get('/show/:gameName', isAuth, (req, res) => {
	for (var i = 0; i < ge.extensions.length; i++) {
		var extension = ge.extensions[i];
		if (extension.shortname == req.params.gameName) {
			res.json(extension);
			return;
		}
	}
	res.status(404);
	res.end();
});

module.exports = router;