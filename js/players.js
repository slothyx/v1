/*globals $,console,slothyx*/
$(function() {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	function LocalPlayer(id) {
		var self = this;
		var ytPlayer = $('#' + id)[0]; //cannot work with jQuery
		var stateListener = [];

		self.pause = function() {
			ytPlayer.pauseVideo();
		};
		self.play = function() {
			ytPlayer.playVideo();
		};
		self.stop = function() {
			ytPlayer.loadVideoById("");
		};
		self.seekTo = function(time) {
			ytPlayer.seekTo(time);
		};
		self.loadVideo = function(listItem) {
			ytPlayer.loadVideoById(listItem.id);
		};
		self.getDuration = function() {
			return ytPlayer.getDuration();
		};
		self.addStateListener = function(listener) {
			//dont allow duplicates
			for(var i = 0; i < stateListener.length; i++) {
				if(stateListener[i] === listener) {
					return;
				}
			}
			stateListener.push(listener);
		};
		self.requestFullscreen = function() {
			if(ytPlayer.mozRequestFullScreen) {
				ytPlayer.mozRequestFullScreen();
			} else {
				ytPlayer.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		};
		self.cancelFullscreen = function() {
			if(ytPlayer.mozCancelFullScreen) {
				ytPlayer.mozCancelFullScreen();
			} else if(ytPlayer.webkitCancelFullScreen) {
				ytPlayer.webkitCancelFullScreen();
			}
		};
		self.onYtPlayerStateChange = function(state) {
			for(var i = 0; i < stateListener.length; i++) {
				stateListener[i](state);
			}
		};

		ytPlayer.addEventListener("onStateChange", "slothyx.localPlayer.onYtPlayerStateChange");
	}

	//ugly, but has to be
	window.onYouTubePlayerReady = function(playerId) {
		var player = slothyx.localPlayer = new LocalPlayer("myytPlayer");
		console.log("playerinit");
		//TODO not the nicest way
		slothyx.viewModel.activePlayer(player);
	};

	//Load YoutubePlayer
	var params = { allowScriptAccess: "always" };
	var atts = { id: "myytPlayer" };
	swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
		"ytPlayer", "425", "356", "8", null, null, params, atts);

	slothyx.NewWindowPlayer = function(onCloseCallback) {
		var self = this;
		var newWindow = window.open("player.html");
		var initialized = false;
		var stateListener = [];

		function post(message, params) {
			var cmd = {cmd: message};
			if(params !== undefined) {
				for(var param in params) {
					if(params.hasOwnProperty(param)) {
						cmd[param] = params[param];
					}
				}
			}
			console.log("posting: " + JSON.stringify(cmd));
			newWindow.postMessage(JSON.stringify(cmd), "*");
		}

		self.pause = function() {
			post("pause");
		};
		self.play = function() {
			post("play");
		};
		self.stop = function() {
			post("stop");
		};
		self.seekTo = function(time) {
			post("seekTo", {'time': time});
		};
		self.loadVideo = function(listItem) {
			post("loadVideo", {item: listItem});
		};
		self.getDuration = function() {
//			post("getDuration"); TODO
		};
		self.addStateListener = function(listener) {
			//dont allow duplicates
			for(var i = 0; i < stateListener.length; i++) {
				if(stateListener[i] === listener) {
					return;
				}
			}
			stateListener.push(listener);
		};
		self.requestFullscreen = function() {
			throw "this cannot be done on remote players!";
		};
		self.cancelFullscreen = function() {
			throw "this cannot be done on remote players!";
		};
		self.onYtPlayerStateChange = function(state) {
			for(var i = 0; i < stateListener.length; i++) {
				stateListener[i](state);
			}
		};

		function onMessage(data){
			initialized = true;
			console.log(data);
		}

		function callHello(){
			if(!initialized){
				post("hello");
				setTimeout(callHello, 1000);
			}
		}
		$(window).on('message', onMessage);
		callHello();
	};
});
