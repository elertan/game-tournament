'use strict';

// Require dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const jsonwebtoken = require('jsonwebtoken');

const config = require('./config');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Configure
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(config.database.url);

// Routes
app.use(require('./routes/main'));

// Handle sockets
require('./socket/main')(io);

// Listen
http.listen(config.port, function() {
	console.log('Server is running on port ' + config.port);
});