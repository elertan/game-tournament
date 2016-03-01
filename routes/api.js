'use strict';

const express = require('express');
const router = express.Router();

router.use('/user', require('./api/user'));
router.use('/auth', require('./api/auth'));

module.exports = router;