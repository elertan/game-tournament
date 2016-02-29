'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const config = require('./config');

const app = express();

mongoose.connect(config.database.url);
app.use(bodyParser.urlencoded({ extended: false }));

// Authentication
app.use(passport.initialize());
passport.use(require('./passport-strategies/jwt'));

// Routes
app.use(require('./routes/main'));

// Listen
app.listen(config.port, function() {
	console.log('Server is running on port ' + config.port);
});