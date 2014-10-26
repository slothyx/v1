/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YTPLAYER_RAW_HTML_ID = "slothyxPlayer";
	var YTPLAYER_HTML_ID = "#" + YTPLAYER_RAW_HTML_ID;
	var UPDATE_INTERVAL_MS = 1000;

	var STATE_PAUSED = 0;
	var STATE_PLAYING = 1;
	var STATE_STOPPED = 2;

	$(function() {
		var params = { allowScriptAccess: "always" };
		var atts = { id: YTPLAYER_RAW_HTML_ID };
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "320", "300", "8", null, null, params, atts);
	});

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	var playerProxy = new PlayerProxy();
	var ytPlayer;
	var localPayerOnStateChangeCallback;

	localPlayer.onYouTubePlayerReady = function() {
		ytPlayer = new LocalPlayer(YTPLAYER_HTML_ID);
		playerProxy.setPlayer(ytPlayer);
	};

	localPlayer.requestFullscreen = function() {
		ytPlayer.requestFullscreen();
	};

	localPlayer.getPlayer = function() {
		return playerProxy;
	};

	localPlayer.onLocalPlayerStateChange = function(state) {
		if(localPayerOnStateChangeCallback !== undefined) {
			localPayerOnStateChangeCallback(state);
		}
	};

	localPlayer.setYTPlayer = function(player) {
		playerProxy.setPlayer(player);
		ytPlayer.hide();
	};

	localPlayer.resetPlayer = function() {
		ytPlayer.show();
		playerProxy.setPlayer(ytPlayer);
	};

	function LocalPlayer(id) {
		var self = this;
		var player = $(id)[0];
		var events = new slothyx.util.EventHelper(self);
		var progressEvents = new slothyx.util.EventHelper(self, "addProgressListener", "removeProgressListener");
		var timerId;

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
			console.log("duration: "+player.getDuration());
			player.seekTo(player.getDuration() / 100 * percentage, true);
		};
		self.setVolume = function(percentage) {
			player.setVolume(percentage);
		};
		self.hide = function() {
			stopProgressUpdater();
			$(id).hide(0);
		};
		self.show = function() {
			startProgressUpdater();
			$(id).show(0);
		};
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
		self.isReady = function() {
			return player.setVolume && player.loadVideoById && player.pauseVideo && player.playVideo && player.seekTo && player.getDuration;
		};
		localPayerOnStateChangeCallback = function(state) {
			events.throwEvent(state);
		};
		player.addEventListener("onStateChange", "slothyx.localPlayer.onLocalPlayerStateChange");
		startProgressUpdater();

		function startProgressUpdater() {
			timerId = setInterval(function() {
				progressEvents.throwEvent(player.getCurrentTime() * 100 / player.getDuration());
			}, UPDATE_INTERVAL_MS);
		}

		function stopProgressUpdater() {
			clearInterval(timerId);
		}
	}

	function PlayerProxy() {
		//TODO buffer commands
		var self = this;
		var events = new slothyx.util.EventHelper(self);
		var progressEvents = new slothyx.util.EventHelper(self, "addProgressListener", "removeProgressListener");
		var player = null;
		var state = {
			state: STATE_STOPPED,
			loadedVideoId: null,
			progress: 0,
			volumne: 100
		};

		self.load = function(id) {
			state.state = STATE_PLAYING;
			state.loadedVideoId = id;
			if(player !== null) {
				player.load(id);
			}
		};
		self.pause = function() {
			state.state = STATE_PAUSED;
			if(player !== null) {
				player.pause();
			}
		};
		self.play = function() {
			state.state = STATE_PLAYING;
			if(player !== null) {
				player.play();
			}
		};
		self.stop = function() {
			state.state = STATE_STOPPED;
			if(player !== null) {
				player.stop();
			}
		};
		self.setProgress = function(percentage) {
			state.progress = percentage;
			if(player !== null) {
				player.setProgress(percentage);
			}
		};
		self.setVolume = function(percentage) {
			state.volumne = percentage;
			if(player !== null) {
				player.setVolume(percentage);
			}
		};
		self.setPlayer = function(newPlayer) {
			if(player !== null) {
				player.removeListener(onStateChange);
				player.removeProgressListener(onProgressChange);
				player.stop();
			}
			player = newPlayer;
			player.addListener(onStateChange);
			player.addProgressListener(onProgressChange);
			slothyx.util.doWhenTrue(initPlayerFromState, player.isReady);
		};
		function onStateChange(newState) {
			events.throwEvent(newState);
		}

		function onProgressChange(progress) {
			state.progress = progress;
			progressEvents.throwEvent(progress);
		}

		function initPlayerFromState() {
			player.setVolume(state.volumne);
			if(state.state !== STATE_STOPPED) {
				player.load(state.loadedVideoId);
				player.setProgress(state.progress);
				if(state.state === STATE_PAUSED) {
					player.pause();
				}
			}
		}
	}

})(jQuery, window, swfobject);

//needed in global scope
function onYouTubePlayerReady() {
	"use strict";
	window.slothyx.localPlayer.onYouTubePlayerReady();
}