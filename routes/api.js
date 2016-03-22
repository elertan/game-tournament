'use strict';

const express = require('express');
const router = express.Router();

router.use('/user', require('./api/user'));
router.use('/auth', require('./api/auth'));
router.use('/groups', require('./api/groups'));

module.exports = router;