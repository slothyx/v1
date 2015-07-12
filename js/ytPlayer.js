/*globals jQuery, window, YT*/
(function($, window, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var ytPlayer = slothyx.ytPlayer = {};

	var PLAYER_STATE = slothyx.util.PLAYER_STATE;
	var YT_STATE = {
		STOPPED: 0,
		PAUSED: 2,
		PLAYING: 1
	};
	var TRANSLATIONTABLE = {};
	TRANSLATIONTABLE[YT_STATE.STOPPED] = PLAYER_STATE.STOPPED;
	TRANSLATIONTABLE[YT_STATE.PAUSED] = PLAYER_STATE.PAUSED;
	TRANSLATIONTABLE[YT_STATE.PLAYING] = PLAYER_STATE.PLAYING;

	var ytPlayerInstance = null;
	var readyEvent = new slothyx.util.EventHelper(ytPlayer, "Ready");

	//needed in global scope
	window.onYouTubeIframeAPIReady = function() {
		initPlayer();
	};

	ytPlayer.getYTPlayer = function() {
		return ytPlayerInstance;
	};

	function onReady(player) {
		ytPlayerInstance = player;
		readyEvent.throwEvent(player);
	}

	function initPlayer() {
		var self = {};
		var stateEvents = new slothyx.util.EventHelper(self, "State");

		var player = new window.YT.Player('ytPlayer', {
			height: '250',
			width: '343',
			playerVars: {'controls': 0},
			events: {
				'onStateChange': onStateChange,
				'onError': onError,
				'onReady': function() {
					onReady(self);
				}
			}
		});

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
			player.stopVideo();
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

		function onStateChange(event) {
			if(translate(event.data) !== undefined) {
				stateEvents.throwEvent(translate(event.data));
			}
		}

		function onError(/*error*/) {
			stateEvents.throwEvent(PLAYER_STATE.INVALID);
		}

		player.addEventListener("onStateChange", "onLocalPlayerStateChange");
		player.addEventListener("onError", "onLocalPlayerError");

		function translate(ytState) {
			return TRANSLATIONTABLE[ytState];
		}
	}

})
(jQuery, window);