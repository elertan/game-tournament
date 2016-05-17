// Handle all messaging in this file (split it up in more files for groups and user-to-user chatting)

module.exports = function (io, socket) {
	socket.on('GroupShow/Message/JoinGroup', groupId => {

		// Leave any previous group chats
		for (var prop in io.sockets.adapter.sids[socket.id]) {
			if (io.sockets.adapter.sids[socket.id].hasOwnProperty(prop)) {
				if (prop.indexOf('GroupShow/') > -1) {
					console.log('Leaving ' + prop);
					socket.leave(prop);
				}
			}
		}
		
		socket.join('GroupShow/' + groupId);
	});

    socket.on('GroupShow/Message/New', data => {
    	io.to('GroupShow/' + data.receiver).emit('GroupShow/Client/Message/New', data);
    });
};