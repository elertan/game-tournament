'use strict';

const express = require('express');
const router = express.Router();

router.get('/user', function (req, res) {
	res.send('User route');
});

module.exports = router;