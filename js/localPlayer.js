/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YTPLAYER_RAW_HTML_ID = "slothyxPlayer";
	var YTPLAYER_HTML_ID = "#" + YTPLAYER_RAW_HTML_ID;
	var UPDATE_INTERVAL_MS = 500;

	var STATE_PAUSED = 0;
	var STATE_PLAYING = 1;
	var STATE_STOPPED = 2;

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	localPlayer.STATE_PAUSED = STATE_PAUSED;
	localPlayer.STATE_PLAYING = STATE_PLAYING;
	localPlayer.STATE_STOPPED = STATE_STOPPED;

	var ytPlayer;
	var localPayerOnStateChangeCallback;


	//needed in global scope
	window.onYouTubePlayerReady = function() {
		ytPlayer = new LocalPlayer(YTPLAYER_HTML_ID);
	};

	window.onLocalPlayerStateChange = function(state) {
		if(localPayerOnStateChangeCallback !== undefined) {
			localPayerOnStateChangeCallback(state);
		}
	};

	localPlayer.requestFullscreen = function() {
		ytPlayer.requestFullscreen();
	};

	localPlayer.getPlayer = function() {
		return ytPlayer;
	};

	function LocalPlayer(id) {
		var self = this;
		var player = $(id)[0];
		var timerId;
		var playerProxy;
		var stateEvents = new slothyx.util.EventHelper(self, "State");
		var progressEvents = new slothyx.util.EventHelper(self, "Progress");

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
		self.setProxy = function(proxy) {
			playerProxy = proxy;
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
			stateEvents.throwEvent(state);
		};
		player.addEventListener("onStateChange", "onLocalPlayerStateChange");
		startProgressUpdater();

		function isReady() {
			return player.setVolume && player.loadVideoById && player.pauseVideo && player.playVideo && player.seekTo && player.getDuration;
		}

		function startProgressUpdater() {
			timerId = setInterval(function() {
				progressEvents.throwEvent(player.getCurrentTime() * 100 / player.getDuration());
			}, UPDATE_INTERVAL_MS);
		}

		function stopProgressUpdater() {
			clearInterval(timerId);
		}
	}

	slothyx.util.onStartUp(function() {
		var params = {allowScriptAccess: "always", wmode: "transparent"};
		var atts = {id: YTPLAYER_RAW_HTML_ID};
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "100%", "250", "8", null, null, params, atts);
	});

})(jQuery, window, swfobject);