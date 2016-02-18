'use strict';

const express = require('express');
const router = express.Router();

router.get('/user', function (req, res) {
	res.json({ msg: 'There are no users in the database' });
});

router.use('/auth', require('./api/auth'));

module.exports = router;