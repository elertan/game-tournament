'use strict';

const express = require('express');
const router = express.Router();

router.use('/resource', require('./users/resource'));

module.exports = router;