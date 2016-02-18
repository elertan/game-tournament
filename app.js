'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const config = require('./config');

const app = express();

mongoose.connect(config.database.url);
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use(require('./routes/main'));

// Listen
app.listen(config.port, function() {
	console.log('Server is running on port ' + config.port);
});