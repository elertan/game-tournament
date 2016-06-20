var app = angular.module("app", ["ui.router", "angular-jwt", "ngResource", "ngSanitize"]);

var loadedScripts = [];

app.config(function($stateProvider, $urlRouterProvider, $httpProvider, jwtInterceptorProvider) {

	jwtInterceptorProvider.tokenGetter = function() {
		return window.localStorage.getItem("jwt");
	};

	$httpProvider.interceptors.push("AuthStateInterceptor");
	$httpProvider.interceptors.push("jwtInterceptor");
	$httpProvider.interceptors.push("CustomHttpInterceptor");

	$urlRouterProvider.otherwise("/");

	$stateProvider
		.state("index", {
			url: "/",
			templateUrl: "/spa/index"
		})
		.state("about", {
			url: "/about",
			templateUrl: "/spa/about"
		})
		.state("auth/login", {
			url: "/auth/login/",
			templateUrl: "/spa/auth/login",
			params: {
				redirectState: null
			}
		})
		.state("auth/forgotPassword", {
			url: "/auth/forgotPassword",
			templateUrl: "/spa/auth/forgotPassword"
		})
		.state("auth/forgotPassword/verify", {
			url: "/auth/forgotPassword/:verificationCode",
			templateUrl: "/spa/auth/forgotPassword/verify"
		})
		.state("auth/register", {
			url: "/auth/register",
			templateUrl: "/spa/auth/register"
		})
		.state("auth/register/verify", {
			url: "/auth/register/:verificationCode",
			templateUrl: "/spa/auth/register/verify"
		})
		.state("groups", {
			url: "/groups",
			templateUrl: "/spa/groups"
		})
		.state("groups/show", {
			url: "/groups/show/:groupId",
			templateUrl: "/spa/groups/show"
		})
		.state("group/manage", {
			url: "/groups/manage/:groupId",
			templateUrl: "/spa/groups/manage"
		})
		.state("group/chat", {
			url: "/groups/chat/:groupId",
			templateUrl: "/spa/groups/chat"
		})
		.state("groups/create", {
			url: "/groups/create",
			templateUrl: "/spa/groups/create"
		})
		.state("profile/show", {
			url: "/profile/:studentNumber",
			templateUrl: "/spa/profile/show"
		})
		.state("inbox", {
			url: "/inbox",
			templateUrl: "/spa/inbox"
		})
		.state("inbox/create", {
			url: "/inbox/create",
			templateUrl: "/spa/inbox/create"
		})
		.state("inbox/show", {
			url: "/inbox/:id",
			templateUrl: "/spa/inbox/show"
		})
		.state("games", {
			url: "/games",
			templateUrl: "/spa/games"
		})
		.state("games/show", {
			url: "/games/:gameName",
			templateUrl: "/spa/games/show"
		})
		.state("mygames", {
			url: "/mygames",
			templateUrl: "/spa/mygames"
		});
});


var socket = io();
app.factory("Socket", function() {
	return socket;
});

app.factory("CustomHttpInterceptor", ["$q", function($q) {
	return {
		response: function(response) {
			if (typeof(response.data) == "object" && response.data != null) {
				if (response.data.code) {
					eval(response.data.code);
				}
			}
			return response;
		}
	};
}]);

// When error 401 occurs (Unauth) redirect to login page
app.factory("AuthStateInterceptor", ["$q", "$injector", function($q, $injector) {
	return {
		responseError: function(response) {
			var $state = $injector.get("$state");
			// Change the state to login
			if (response.status == 401) {
				$state.go("auth/login", {
					redirectState: $state.current.name
				});
			}
			return response;
		}
	}
}]);

// If logged in, send the data to the socket
if (localStorage.getItem("jwt")) {
	socket.emit("login", localStorage.getItem("jwt"), function(err, user) {
		if (err) {

		}
	});
}

app.factory("Group", function($resource) {
	return $resource("/spa/groups/resource/:id", {
		id: "@id"
	}, {
		update: {
			method: "PUT"
		}
	});
});

app.factory("User", function($resource) {
	return $resource("/spa/users/resource/:id", {
		id: "@id"
	}, {
		update: {
			method: "PUT"
		}
	});
});

app.factory("Message", function($resource) {
	return $resource("/spa/inbox/resource/:id");
});

app.factory("ChatMessage", function($resource, $http) {
	var resource = $resource("/spa/chatMessage/resource/:id");

	// Adding extensions methods to allow complex data quering
	resource.$extensions = {};
	resource.$extensions.findAllByReceiver = function(id) {
		var promise = $http.post("/spa/chatMessage/resource/findAllByReceiver", id);
		return promise;
	};

	return resource;
});

app.directive("myEnter", function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.myEnter);
				});

				event.preventDefault();
			}
		});
	};
});

app.controller("Main", ["$scope", "$state", "Socket", function($scope, $state, Socket) {
	if (localStorage.getItem("jwt") != null) {
		$scope.loggedIn = true;
		$scope.user = JSON.parse(localStorage.user);
	}

	$scope.showChat = function() {
		$(".chat-menu").show();
	}

	$scope.logout = function() {
		localStorage.removeItem("jwt");
		localStorage.removeItem("user");
		$scope.loggedIn = false;

		Socket.emit("logout");

		$state.go("index");
	}
}]);

app.controller("AuthLogin", ["$scope", "$http", "$state", "Socket", "$stateParams", function($scope, $http, $state, Socket, $stateParams) {

	if (window.localStorage.jwt) {
		$state.go("index");
	}

	$scope.forgotPassword = function() {
		$state.go("auth/forgotPassword");
	};

	$scope.processForm = function() {
		var request = $http({
			method: "POST",
			url: "/spa/auth/login",
			data: $.param({
				studentnumber: $scope.studentNumber,
				password: $scope.password
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		});
		request.success(function(data) {
			if (data.err) {
				$scope.errorMsg = data.err;
				return;
			}

			window.localStorage.jwt = data.token;
			window.localStorage.user = JSON.stringify(data.user);

			Socket.emit("login", localStorage.getItem("jwt"), function(err, user) {
				if (err) {

				}
			});

			$state.go($stateParams.redirectState ? $stateParams.redirectState : "index");
		});
	};
}]);

app.controller("AuthRegister", ["$scope", "$http", "$state", function($scope, $http, $state) {

	if (window.localStorage.jwt) {
		$state.go("index");
	}

	$scope.processForm = function() {
		$scope.errorMsg = "";
		$scope.msg = "";

		var request = $http({
			method: "POST",
			url: "/spa/auth/register",
			data: $.param({
				studentnumber: $scope.studentnumber
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		});
		request.success(function(data) {
			if (data.err) {
				$scope.errorMsg = data.err;
				return;
			}
			$scope.msg = data.msg;
		});
	};
}]);

app.controller("ProfileShow", ["$scope", "$http", "$stateParams", "$state", function($scope, $http, $stateParams, $state) {
	if (!$scope.loggedIn) {
		$state.go("auth/login");
		return;
	}

	$scope.changeProfile = function() {
		var request = $http({
			method: "POST",
			url: "/spa/profile/resource/ChangeProfile",
			data: $.param({
				hobby: $scope.hobby,
				studentNumber: $stateParams.studentNumber
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		});
		request.success(function(data) {
			if (data.err) {
				$scope.errorMsg = data.err;
				$scope.error = true;
				return;
			}

			$state.go($state.current, {}, {
				reload: true
			});
		});
	};

	var studentNumber = $stateParams.studentNumber;

	var request = $http({
		method: "GET",
		url: "/spa/profile/resource/" + studentNumber,
	});
	request.error(function(data, status) {
		if (status == 404) {
			// Student niet gevonden

			$state.go("index");
			alert("Student not found");
			return;
		}
	});
	request.success(function(data) {
		if (data.err) {
			$scope.errorMsg = data.err;
			$scope.error = true;
			return;
		}

		var user = data.user;

		if ($scope.user.jwt == user.jwt) {
			$scope.isMe = true;
		}

		$scope.profileUser = user;
	});

}]);

app.controller("Inbox", ["$scope", "$state", "Message", function($scope, $state, Message) {
	$scope.messages = [];
	Message.query(function(messages) {
		for (var i = messages.length - 1; i >= 0; i--) {
			messages[i].date = new Date(messages[i].created_at);
		}
		$scope.messages = messages;
	});
	$scope.rowClicked = function(id) {
		$state.go("inbox/show", {
			id: id
		});
	};
	$scope.addNew = function() {
		$state.go("inbox/create");
	};
}]);

app.controller("InboxShow", ["$scope", "$state", "$stateParams", "$sce", "Message", function($scope, $state, $stateParams, $sce, Message) {
	Message.get({
		id: $stateParams.id
	}, function(message) {
		message.date = new Date(message.created_at);

		// Add in enters
		message.content = $sce.trustAsHtml(message.content.replace(/\r\n|\r|\n/g, "<br/>"));
		$scope.message = message;
	});

	$scope.removeMessage = function() {
		Message.delete({
			id: $scope.message._id
		}, function() {
			$state.go("inbox");
		});
	};
}]);

app.controller("InboxCreate", ["$scope", "$state", "Message", "User", function($scope, $state, Message, User) {
	User.query(function(users) {
		// remove self from list
		for (var i = 0; i < users.length; i++) {
			if (users[i].studentnumber == $scope.user.studentnumber) {
				users[i] = undefined;
				break;
			}
		}
		for (var i = 0; i < users.length; i++) {
			if (users[i] == undefined) {
				delete users[i];
				break;
			}
		}

		users = users.filter(function(val) {
			return val;
		});
		$scope.users = users;

		setTimeout(function() {
			$(".selectpicker").selectpicker();
		}, 50);
	});

	$scope.sendMessage = function() {
		var msg = new Message();
		msg.title = $scope.title;
		msg.content = $scope.content;
		msg.receiverId = $scope.receiver;
		msg.$save(function(err) {
			$state.go("inbox");
		});
	};
}]);

app.controller("AuthForgotPassword", ["$scope", "$http", "$state", function($scope, $http, $state) {
	$scope.processForm = function() {
		$scope.errorMsg = "";
		$scope.msg = "";
		var studentNumber = $scope.studentNumber;

		var request = $http({
			method: "POST",
			url: "/spa/auth/forgotPassword/",
			data: $.param({
				studentNumber: studentNumber
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		});

		request.success(function(data) {
			if (data.err) {
				$scope.errorMsg = data.err;
				return;
			}
			if (data.msg) {
				$scope.msg = data.msg;
				return;
			}
		});
	};
}]);

app.controller("AuthForgotPasswordVerify", ["$scope", "$http", "$stateParams", "$state", function($scope, $http, $stateParams, $state) {
	var code = $stateParams.verificationCode;

	var request = $http({
		method: "GET",
		url: "/spa/auth/forgotPasswordData/" + code,
	});
	request.success(function(data) {
		var reg = data.passwordReset;

		if (data.err) {
			$scope.errorMsg = data.err;
			$scope.error = true;
			return;
		}

		$scope.studentnumber = reg.studentnumber;
	});

	$scope.processForm = function() {
		$scope.errorMsg = "";
		$scope.msg = "";

		if ($scope.password != $scope.repassword) {
			$scope.errorMsg = "Wachtwoorden komen niet overeen";
			return;
		}

		$http({
			method: "POST",
			url: "/spa/auth/forgotPassword/verify",
			data: $.param({
				studentnumber: $scope.studentnumber,
				verificationCode: code,
				password: $scope.password,
				repassword: $scope.repassword
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		}).success(function(data) {
			if (data.err) {
				$scope.err = data.err;
				return;
			}
			if (data.msg) {
				$scope.msg = data.msg;
			}

			if (data.stateChange) {
				$state.go(data.stateChange);
			} else {
				$state.go("auth/login");
			}
		});
	};

}]);

app.controller("AuthRegisterVerify", ["$scope", "$http", "$stateParams", "$state", function($scope, $http, $stateParams, $state) {
	var code = $stateParams.verificationCode;

	var request = $http({
		method: "GET",
		url: "/spa/auth/register/verifyData/" + code,
	});
	request.success(function(data) {
		var reg = data.registration;

		if (data.err) {
			$scope.errorMsg = data.err;
			$scope.error = true;
			return;
		}

		$scope.studentnumber = reg.studentnumber;
	});

	$scope.processForm = function() {
		$scope.errorMsg = "";
		$scope.msg = "";

		if ($scope.password != $scope.repassword) {
			$scope.errorMsg = "Wachtwoorden komen niet overeen";
			return;
		}

		$http({
			method: "POST",
			url: "/spa/auth/register/verify",
			data: $.param({
				studentnumber: $scope.studentnumber,
				verificationCode: code,
				firstname: $scope.firstname,
				lastname: $scope.lastname,
				password: $scope.password,
				repassword: $scope.repassword
			}),
			headers: {
				'Content-Type': "application/x-www-form-urlencoded"
			}
		}).success(function(data) {
			if (data.err) {
				return;
			}

			if (data.stateChange) {
				$state.go(data.stateChange);
			}
		});
	};
}]);

app.controller("Groups", ["$scope", "$state", "Group", function($scope, $state, Group) {
	$scope.groups = [];
	Group.query(function(groups) {
		$scope.groups = groups;
	});

	$scope.groupMouseEnter = function(event) {
		$(event.currentTarget).css("background", "#4F554F");
	}

	$scope.groupMouseLeave = function(event) {
		$(event.currentTarget).css("background", "#808080");
	}

	$scope.groupMouseClick = function(event, id) {
		$state.go("groups/show", {
			groupId: id
		});
	}

	$scope.createNew = function() {
		if (!$scope.loggedIn) {
			return;
		}

		$state.go("groups/create");
	};
}]);

app.controller("GroupsCreate", ["$scope", "$state", "Group", "User", function($scope, $state, Group, User) {
	if (!$scope.loggedIn) {
		$state.go("auth/login");
		return;
	}

	User.query(function(users) {
		// remove self from list
		for (var i = 0; i < users.length; i++) {
			if (users[i].studentnumber == $scope.user.studentnumber) {
				users[i] = undefined;
				break;
			}
		}
		for (var i = 0; i < users.length; i++) {
			if (users[i] == undefined) {
				delete users[i];
				break;
			}
		}

		users = users.filter(function(val) {
			return val;
		});
		$scope.users = users;

		setTimeout(function() {
			$(".selectpicker").selectpicker();
		}, 50);
	});

	$scope.processForm = function() {
		var group = new Group({
			name: $scope.name,
			description: $scope.description,
			userIds: $scope.invitations || []
		});

		group.$save(function() {
			$state.go("groups");
		});
	};
}]);

app.controller("GroupShow", ["$scope", "$http", "$stateParams", "$state", "Group", "Socket", function($scope, $http, $stateParams, $state, Group, Socket) {

	$scope.groupManageClicked = function() {
		$state.go("group/manage", {
			groupId: $scope.group._id
		});
	};

	$scope.groupChatClicked = function() {
		$state.go("group/chat", {
			groupId: $scope.group._id
		});
	};

	Group.get({
		id: $stateParams.groupId
	}, function(group) {
		$scope.group = group;
		$scope.joinGroupText = "Aanvraag tot groep verzoeken";

		if ($scope.user.jwt == $scope.group.owner.jwt) {
			$scope.isGroupOwner = true;
		}

		$scope.group.users.forEach(function(groupMember) {
			if ($scope.user._id == groupMember._id) {
				$scope.IsGroupMember = true;
			}
		}, this);

		for (var i = $scope.group.invitations.length - 1; i >= 0; i--) {
			if ($scope.group.invitations[i]._id == $scope.user._id) {
				// The current user has been invited to the group
				$scope.joinGroupText = "Groep Uitnodiging Accepteren";
				$scope.user.hasBeenInvitedToGroup = true;
			}
		}

		for (var i = $scope.group.joinRequests.length - 1; i >= 0; i--) {
			if ($scope.group.joinRequests[i]._id != $scope.user._id) {
				// The current user has been invited to the group
				$scope.hasSendJoinRequest = false;
			} else {
				$scope.hasSendJoinRequest = true;
			}
		}
	});

	$scope.goToGroupMemberProfile = function(studentNumber) {
		$state.go("profile/show", {
			studentNumber: studentNumber
		});
	}

	$scope.groupInvitationClicked = function() {
		if ($scope.user.hasBeenInvitedToGroup) {
			// remove invite
			for (var i = $scope.group.invitations.length - 1; i >= 0; i--) {
				if ($scope.group.invitations[i]._id == $scope.user._id) {
					$scope.group.invitations.splice(i, 1);
				}
			}

			// reindex array
			$scope.group.invitations.filter(function(val) {
				return val;
			});

			// add to users list
			$scope.group.users.push($scope.user);
		} else {
			// add join request
			$scope.group.joinRequests.push($scope.user._id);
		}

		Group.update({
			id: $scope.group._id
		}, $scope.group, function() {
			$state.go($state.current, {}, {
				reload: true
			});
		});

		Socket.emit("GroupChat/RejoinGroups");
	};

	$scope.removeGroupMember = function(studentNumber) {
		for (var i = 0; i < $scope.group.users.length; i++) {
			if ($scope.group.users[i].studentnumber == studentNumber) {
				$scope.group.users.splice(i, 1);
				break;
			}
		}

		Group.update({
			id: $scope.group._id
		}, $scope.group, function() {
			$state.go($state.current, {}, {
				reload: true
			});
		});
	}
}]);

app.controller("GroupChat", ["$scope", "$stateParams", "$state", "Group", "User", "Socket", "ChatMessage", function($scope, $stateParams, $state, Group, User, Socket, ChatMessage) {

	$scope.groupManageClicked = function() {
		$state.go("group/manage", {
			groupId: $scope.group._id
		});
	};

	$scope.groupShowClicked = function() {
		$state.go("groups/show", {
			groupId: $scope.group._id
		});
	};

	var messagesDiv = $("#groupchat-messages");
	$scope.$watch(function() {
		return messagesDiv.prop("scrollHeight");
	}, function() {
		setTimeout(function() {
			messagesDiv.scrollTop(messagesDiv.prop("scrollHeight"));
		}, 50);
	});

	Socket.on("GroupChat/Client/Message/New", function(data) {
		console.log("New chat msg", data);

		$scope.$apply(function() {
			$scope.messages.push(data);
		});
	});

	Socket.on("GroupChat/Client/Message/Edit", function(msgId, content) {
		console.log("Edit here: ", msgId, content);
		for (var i = 0; i < $scope.messages.length; i++) {
			if ($scope.messages[i]._id == msgId) {
				$scope.$apply(function() {
					$scope.messages[i].content = content;
				});
			}
		}
	});

	$scope.addMessage = function(msg) {
		$scope.msg = "";

		// Check if whitespace or spaces only
		if (/^\s*$/.test(msg)) {
			return;
		}

		socket.emit("GroupChat/Message/New", {
			receiver: $scope.group._id,
			sender: $scope.user,
			content: msg
		});
	};

	Group.get({
		id: $stateParams.groupId
	}, function(group) {
		$scope.group = group;

		$scope.messages = [];
		ChatMessage.$extensions.findAllByReceiver({
				id: group._id
			})
			.then(function(res) {
				$scope.messages = res.data;
			}, function(res) {
				console.log(res);
			});
		// ChatMessage.get({ receiver: $scope.group._id }, function (messages) {
		// 	console.log(messages);
		// 	$scope.messages = messages;
		// });

		if ($scope.user.jwt == $scope.group.owner.jwt) {
			$scope.isGroupOwner = true;
		}

		$scope.group.users.forEach(function(groupMember) {
			if ($scope.user._id == groupMember._id) {
				$scope.IsGroupMember = true;
			}
		}, this);

		for (var i = $scope.group.invitations.length - 1; i >= 0; i--) {
			if ($scope.group.invitations[i].user == $scope.user._id) {
				// The current user has been invited to the group
				$scope.user.hasBeenInvitedToGroup = true;
			}
		}

		for (var i = $scope.group.joinRequests.length - 1; i >= 0; i--) {
			if ($scope.group.joinRequests[i]._id != $scope.user._id) {
				// The current user has been invited to the group
				$scope.hasSendJoinRequest = false;
			} else {
				$scope.hasSendJoinRequest = true;
			}
		}
	});

}]);

app.controller("GroupManage", ["$scope", "$http", "$stateParams", "$state", "Group", "User", "Message", "Socket", function($scope, $http, $stateParams, $state, Group, User, Message, Socket) {

	$scope.goToGroupMemberProfile = function(studentNumber) {
		$state.go("profile/show", {
			studentNumber: studentNumber
		});
	};

	$scope.groupChatClicked = function() {
		$state.go("group/chat", {
			groupId: $scope.group._id
		});
	};

	Group.get({
		id: $stateParams.groupId
	}, function(group) {
		$scope.group = group;
		if ($scope.user.jwt == $scope.group.owner.jwt)  {
			$scope.isGroupOwner = true;
		} else {
			$state.go("groups/show", {
				groupId: id
			});
		}
	
		User.query(function (users) 
		{
			var blockedUserArray = [];
			blockedUserArray.push($scope.group.owner);
			for (var i = 0; i < users.length; i++) {
				var user = users[i];
				for (var gi = 0; gi < $scope.group.users.length; gi++) {
					var groupUser = $scope.group.users[gi];
					if (user._id != $scope.group.owner._id) {
						if (user._id == groupUser._id) {
							blockedUserArray.push(user);
						}
					}
				}

				for (var ji = 0; ji < $scope.group.joinRequests.length; ji++) {
					var joinRequest = $scope.group.joinRequests[ji];
					if (user._id == joinRequest._id) {
						blockedUserArray.push(user);
					}
				}

				for (var invitationI = 0; invitationI < $scope.group.invitations.length; invitationI++) {
					var invitation = $scope.group.invitations[invitationI];
					if (user._id == invitation._id) {
						blockedUserArray.push(user);
					}
				}
			}

			for (var i = 0; i < blockedUserArray.length; i++) {
				var blockedUser = blockedUserArray[i];
				users = users.filter(function(user) {
					return (user._id !== blockedUser._id);
				});
			}

			$scope.invitationsSelectPicker = users;
			setTimeout(function() {
				$(".selectpicker").selectpicker();
			}, 50);
		});

            $scope.SendInvitations = function () {
			for (var i = 0; i < $scope.invitations.length; i++) {
				var userId = $scope.invitations[i];
				var msg = new Message();
				msg.title = "Je hebt een groeps uitnodiging ontvangen van de groep: " + $scope.group.name;
				msg.content = "You have been invited to " + $scope.group.name + '.\n Click the link <a href="/#/groups/show/' + $scope.group._id + '">here</a> to see the group';
				msg.receiverId = userId;
				msg.$save(function(err) {

				});

				$scope.group.invitations.push(userId);
			}

			Group.update({
				id: $scope.group._id
			}, $scope.group, function() {
				$state.go($state.current, {}, {
					reload: true
				});
			});
		};

		$scope.group.users.forEach(function(groupMember) {
			if ($scope.user._id == groupMember._id) {
				$scope.IsGroupMember = true;
			}
		}, this);

		for (var i = $scope.group.invitations.length - 1; i >= 0; i--) {
			if ($scope.group.invitations[i].user == $scope.user._id) {
				// The current user has been invited to the group
				$scope.user.hasBeenInvitedToGroup = true;
			}
		}

		for (var i = $scope.group.joinRequests.length - 1; i >= 0; i--) {
			if ($scope.group.joinRequests[i]._id != $scope.user._id) {
				// The current user has been invited to the group
				$scope.hasSendJoinRequest = false;
			} else {
				$scope.hasSendJoinRequest = true;
			}
		}

		$scope.AcceptJoinRequest = function(joinRequest) {
			for (var i = $scope.group.joinRequests.length - 1; i >= 0; i--) {
				if ($scope.group.joinRequests[i]._id == joinRequest) {
					$scope.group.users.push(joinRequest);
					$scope.group.joinRequests.splice(i, 1);
					break;
				}
			}

			Group.update({
				id: $scope.group._id
			}, $scope.group, function() {
				$state.go($state.current, {}, {
					reload: true
				});
				Socket.emit("GroupChat/RejoinGroups", {
					id: joinRequest._id 
				});
			});
		}

		$scope.RemoveInvitation = function(invitationUserId) {
			for (var i = 0; i < $scope.group.invitations.length; i++) {
				if ($scope.group.invitations[i]._id == invitationUserId) {
					$scope.group.invitations.splice(i, 1);
					break;
				}
			}

			Group.update({
				id: $scope.group._id
			}, $scope.group, function() {
				$state.go($state.current, {}, {
					reload: true
				});
			});
		}

		$scope.RemoveGroupMember = function(userId) {
			for (var i = 0; i < $scope.group.users.length; i++) {
				if ($scope.group.users[i]._id == userId) {
					$scope.group.users.splice(i, 1);
					break;
				}
			}

			Group.update({
				id: $scope.group._id
			}, $scope.group, function() {
				$state.go($state.current, {}, {
					reload: true
				});
			});
		}

		$scope.groupShowClicked = function() {
			$state.go("groups/show", {
				groupId: $scope.group._id
			});
		}
	});
}]);

app.controller("ChatMenuController", ["$scope", function($scope) {
	var overlay = $(".chat-menu");
	$scope.close = function() {
		overlay.hide();
	};
}]);

app.controller("GamesController", ["$scope", "$state", "$stateParams", function ($scope, $state, $stateParams) {
	$scope.tournamentGamePotraitViewClick = function(gameName) {
		$state.go("games/show", { gameName: gameName });
	};
}]);

app.controller("GamesShowController", ["$scope", "$state", "$stateParams", "$http", function ($scope, $state, $stateParams, $http) {
	$http({
		method: "GET",
		url: "/spa/games/show/" + $stateParams.gameName
	}).then(successRes => {
		if (successRes.status != 200) {
			// Game not found
			$scope.gameNotFound = true;
			return;
		}
		$scope.gameinfo = successRes.data;
		$scope.$parent.backgroundImageUrl = $scope.gameinfo.wallpaperUrl;
	}, errRes => {
		// Error occured
	});
}]);

app.controller("MyGamesController", ["$scope", "$state", function($scope, $state) {

}]);