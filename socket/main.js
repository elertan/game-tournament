const jsonwebtoken = require('jsonwebtoken');
const config = require('../config');

const socketMessaging = require('./messaging');

module.exports = function (io) {
    io.on('connection', function (socket) {
        socket.on('init', function (data, cb) {

        });
        socket.on('login', function (jwt, cb) {
            jsonwebtoken.verify(jwt, config.secret, function (err, user) {
                if (err) {
                    cb(err);
                    return;
                }

                socket.user = user;
                cb(null, user);
            });
        });
        socket.on('logout', function () {
            if (socket.user) {
                delete socket.user;
            }
        });

        socket.on('test', function () {
            
        });

        // SPLIT IN DIFFERENT FILES
        socketMessaging(io, socket);

    });
};