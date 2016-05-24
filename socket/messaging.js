// Handle all messaging in this file (split it up in more files for groups and user-to-user chatting)

const Group = require('../models/group');

module.exports = function (io, socket) {
	// socket.on('GroupShow/Message/JoinGroup', groupId => {		
	// 	socket.join('GroupShow/' + groupId); // GroupShow/asd2348masdasd
	// });

    socket.on('GroupShow/Message/New', data => {
		io.to('GroupShow/' + data.receiver).emit('GroupShow/Client/Message/New', data);
    });
};