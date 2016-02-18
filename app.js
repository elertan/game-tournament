'use strict';

const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');

const app = express();

// Routes
app.use(require('./routes/main'));

// Listen
app.listen(config.port, function() {
	console.log('Server is running on port ' + config.port);
});