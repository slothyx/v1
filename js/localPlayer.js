/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YTPLAYER_RAW_HTML_ID = "slothyxPlayer";
	var YTPLAYER_HTML_ID = "#" + YTPLAYER_RAW_HTML_ID;


	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	var PLAYER_STATE = slothyx.util.PLAYER_STATE;
	var YT_STATE = {
		LOADING: -1,
		STOPPED: 0,
		PAUSED: 2,
		PLAYING: 1
	};
	var TRANSLATIONTABLE = {};
	TRANSLATIONTABLE[YT_STATE.LOADING] = PLAYER_STATE.STOPPED;
	TRANSLATIONTABLE[YT_STATE.STOPPED] = PLAYER_STATE.STOPPED;
	TRANSLATIONTABLE[YT_STATE.PAUSED] = PLAYER_STATE.PAUSED;
	TRANSLATIONTABLE[YT_STATE.PLAYING] = PLAYER_STATE.PLAYING;

	var proxyPlayer = new PlayerProxy();
	var ytPlayer;
	var localPayerOnStateChangeCallback;
	var localPayerOnErrorCallback;


	//needed in global scope
	window.onYouTubePlayerReady = function() {
		ytPlayer = new LocalPlayer(YTPLAYER_HTML_ID);
		proxyPlayer.setPlayer(ytPlayer);
	};

	window.onLocalPlayerStateChange = function(state) {
		if(localPayerOnStateChangeCallback !== undefined) {
			localPayerOnStateChangeCallback(state);
		}
	};
	window.onLocalPlayerError = function(error) {
		if(localPayerOnErrorCallback !== undefined) {
			localPayerOnErrorCallback(error);
		}
	};

	localPlayer.requestFullscreen = function() {
		ytPlayer.requestFullscreen();
	};

	localPlayer.getPlayer = function() {
		return proxyPlayer;
	};

	function LocalPlayer(id) {
		var self = this;
		var player = $(id)[0];
		var stateEvents = new slothyx.util.EventHelper(self, "State");

		self.load = function(id) {
			player.loadVideoById(id);
		};
		self.pause = function() {
			player.pauseVideo();
		};
		self.play = function() {
			player.playVideo();
		};
		self.stop = function() {
			self.load("");
		};
		self.setProgress = function(percentage) {
			player.seekTo(player.getDuration() / 100 * percentage, true);
		};
		self.setVolume = function(percentage) {
			player.setVolume(percentage);
		};
		self.isReady = function() {
			return player.setVolume && player.loadVideoById && player.pauseVideo && player.playVideo && player.seekTo && player.getDuration;
		};
		self.getProgress = function() {
			var progress = player.getCurrentTime() * 100 / player.getDuration();
			return isNaN(progress) ? 0 : progress;
		};
		self.getState = function() {
			return translate(player.getPlayerState());
		};

		/* custom */
		self.requestFullscreen = function() {
			var elem = player;
			if(elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if(elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			} else if(elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
			} else if(elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			}
		};
		localPayerOnStateChangeCallback = function(state) {
			stateEvents.throwEvent(translate(state));
		};
		localPayerOnErrorCallback = function(/*error*/) {
			stateEvents.throwEvent(PLAYER_STATE.INVALID);
		};
		player.addEventListener("onStateChange", "onLocalPlayerStateChange");
		player.addEventListener("onError", "onLocalPlayerError");

		function translate(ytState) {
			return TRANSLATIONTABLE[ytState] !== undefined ? TRANSLATIONTABLE[ytState] : PLAYER_STATE.PLAYING;
		}
	}

	function PlayerProxy() {
		//TODO buffer commands
		var self = this;
		var stateEvents = new slothyx.util.EventHelper(self, "State");
		var player = null;

		self.load = function(id) {
			if(player !== null) {
				player.load(id);
			}
		};
		self.pause = function() {
			if(player !== null) {
				player.pause();
			}
		};
		self.play = function() {
			if(player !== null) {
				player.play();
			}
		};
		self.stop = function() {
			if(player !== null) {
				player.stop();
			}
		};
		self.setProgress = function(percentage) {
			if(player !== null) {
				player.setProgress(percentage);
			}
		};
		self.setVolume = function(percentage) {
			if(player !== null) {
				player.setVolume(percentage);
			}
		};
		self.isReady = function() {
			if(player !== null) {
				return player.isReady();
			} else {
				return false;
			}
		};
		self.getProgress = function() {
			if(player !== null) {
				return player.getProgress();
			}
		};
		self.getState = function() {
			if(player !== null) {
				return player.getState();
			}
		};

		/* custom */
		self.getPlayer = function() {
			return player;
		};
		self.setPlayer = function(newPlayer) {
			if(player !== null) {
				player.removeStateListener(onStateChange);
				player.stop();
			}
			player = newPlayer;
			player.addStateListener(onStateChange);
		};

		function onStateChange(newState) {
			stateEvents.throwEvent(newState);
		}
	}

	slothyx.util.onStartUp(function() {
		var params = {allowScriptAccess: "always", wmode: "transparent"};
		var atts = {id: YTPLAYER_RAW_HTML_ID};
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "100%", "250", "8", null, null, params, atts);
	});

})(jQuery, window, swfobject);