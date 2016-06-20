// Handle all messaging in this file (split it up in more files for groups and user-to-user chatting)

const co = require('co');

const Group = require('../models/group');
const ChatMessage = require('../models/chatMessage');
const profanityCheck = require('../modules/profanityCheck');

module.exports = function (io, socket) {
	socket.on('GroupChat/RejoinGroups', data => {
		if (!data) {
			data = {};
		}
		const id = data.id || socket.user._doc._id;
		Group.find({ $or: [{ owner: id }, { users: id }] }, (err, groups) => {
			if (err) {
				console.log(err);
				return;
			}
			
			for (var i = groups.length - 1; i >= 0; i--) {
				var joinThisGroup = true;
				for (var prop in io.sockets.adapter.sids[socket.id]) {
					if (io.sockets.adapter.sids[socket.id].hasOwnProperty(prop)) {
						if (prop == 'GroupChat/' + groups[i]._doc._id) {
							joinThisGroup = false;
							break;
						}
					}
				}
				if (joinThisGroup) {
					socket.join('GroupChat/' + groups[i]._id);
				}
			}
		});
	});

	socket.on('GroupChat/Message/New', data => {
		co(function *() {
			// Wait until profanityCheck initializes (adding words to the check)
			yield profanityCheck.init();

			// Filter the message from any bad words
			data.content = profanityCheck.replaceWords(data.content, 'pauper');

			// Find the last message send
			const msg = yield ChatMessage.findOne().sort({ created_at: -1 }).exec() 
			// If there is a message and the last message send is the same person as the new message
			if (msg && msg.sender == data.sender._id) {
				// Add a breakline in the last message and append the new message
				msg.content += "<br>" + data.content;
				// Wait for the message the save
				yield msg.save();
				// Emit to all in the chat the edit on the message
				io.to('GroupChat/' + data.receiver).emit('GroupChat/Client/Message/Edit', msg._id, msg.content);
				return;
			}

			// Create a new message
			var message = new ChatMessage();
			message.sender = data.sender._id;
			message.receiver = data.receiver;
			message.content = data.content;

			// Wait until the message saves
			yield message.save();
			// Set the id of the data we send the client (To see determine wether someone send the message or the person himself did)
			data._id = message._id;
			// Emit to all in chat the new message
			io.to('GroupChat/' + data.receiver).emit('GroupChat/Client/Message/New', data);
		});
	});
};