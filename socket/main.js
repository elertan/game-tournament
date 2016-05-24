const jsonwebtoken = require('jsonwebtoken');
const config = require('../config');

const Group = require('../models/group');

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
                
                Group.find({ $or: [{ owner: user._doc._id }, { users: user._doc._id }] }, (err, groups) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        
                        for (var i = groups.length - 1; i >= 0; i--) {
                            socket.join('GroupShow/' + groups[i]._id);
                        }
                    });

                cb(null, user);
            });
        });
        socket.on('logout', function () {
            if (socket.user) {
                delete socket.user;
            }
            
            //Leave any previous group chats
            for (var prop in io.sockets.adapter.sids[socket.id]) {
                if (io.sockets.adapter.sids[socket.id].hasOwnProperty(prop)) {
                    if (prop.indexOf('GroupShow/') > -1) {
                        console.log('Leaving ' + prop);
                        socket.leave(prop);
                    }
                }
            }
        });

        socket.on('test', function () {
            
        });

        // SPLIT IN DIFFERENT FILES
        socketMessaging(io, socket);

    });
};