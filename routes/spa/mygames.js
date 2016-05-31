'use strict';

const co = require('co');

const express = require('express');
const router = express.Router();

const isAuth = require('../../middleware/isAuth');

router.get('/', isAuth, (req, res) => {
	co(function *() {
		res.render('spa/mygames/index');
	}).catch(err => {

	});
});

module.exports = router;