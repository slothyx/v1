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
		var playerObject = {};
		var stateEvents = new slothyx.util.EventHelper(playerObject, "State");
		var internalStateEvents = new slothyx.util.EventHelper();

		var videoId;
		var player = new window.YT.Player('ytPlayer', {
			height: '250',
			width: '343',
			playerVars: {'controls': 0},
			events: {
				'onStateChange': onStateChange,
				'onError': onError,
				'onReady': function() {
					onReady(playerObject);
				}
			}
		});

		playerObject.load = function(id) {
			videoId = id;
			player.loadVideoById(id);
		};
		playerObject.pause = function() {
			player.pauseVideo();
		};
		playerObject.play = function() {
			player.playVideo();
		};
		playerObject.stop = function() {
			player.stopVideo();
		};
		playerObject.setProgress = function(percentage) {
			player.seekTo(player.getDuration() / 100 * percentage, true);
		};
		playerObject.setVolume = function(percentage) {
			player.setVolume(percentage);
		};
		playerObject.isReady = function() {
			return player.setVolume && player.loadVideoById && player.pauseVideo && player.playVideo && player.seekTo && player.getDuration;
		};
		playerObject.getProgress = function() {
			var progress = player.getCurrentTime() * 100 / player.getDuration();
			return isNaN(progress) ? 0 : progress;
		};
		playerObject.getState = function() {
			return translate(player.getPlayerState());
		};

		playerObject.requestFullscreen = function() {
			if(player.requestFullscreen) {
				player.requestFullscreen();
			} else if(player.msRequestFullscreen) {
				player.msRequestFullscreen();
			} else if(player.mozRequestFullScreen) {
				player.mozRequestFullScreen();
			} else if(player.webkitRequestFullscreen) {
				player.webkitRequestFullscreen();
			}
		};

		playerObject.getPlayerSnapshot = function() {
			return {
				videoId: videoId,
				progress: playerObject.getProgress(),
				volumne: player.getVolume(),
				state: playerObject.getState()
			};
		};

		playerObject.setPlayerSnapshot = function(state) {
			throwStateEvents = false;
			if(state.volumne !== undefined) {
				player.setVolume(state.volumne);
			}
			if(state.videoId !== undefined) {
				playerObject.load(state.videoId);
				waitForLoading(function() {
					finishSetPlayerSnapshot(state);
				});
			} else {
				finishSetPlayerSnapshot(state);
			}
		};

		function finishSetPlayerSnapshot(state) {
			if(state.progress !== undefined) {
				playerObject.setProgress(state.progress);
				waitForLoading(function() {
					finishSetPlayerSnapshot2(state);
				});
			} else {
				finishSetPlayerSnapshot2(state);
			}
		}

		function finishSetPlayerSnapshot2(state) {
			if(state.state === PLAYER_STATE.PAUSED) {
				playerObject.pause();
			}
			throwStateEvents = true;
		}

		function onStateChange(event) {
			if(translate(event.data) !== undefined) {
				throwStateEvent(translate(event.data));
			}
		}

		function onError(/*error*/) {
			throwStateEvent(PLAYER_STATE.INVALID);
		}

		function translate(ytState) {
			return TRANSLATIONTABLE[ytState];
		}

		var throwStateEvents = true;

		function throwStateEvent(newState) {
			if(throwStateEvents) {
				stateEvents.throwEvent(newState);
			}
			internalStateEvents.throwEvent(newState);
		}

		function waitForLoading(callback) {
			var tmpListener = function(event) {
				if(event === PLAYER_STATE.PLAYING) {
					internalStateEvents.removeListener(tmpListener);
					callback();
				}
			};
			internalStateEvents.addListener(tmpListener);
		}
	}

})
(jQuery, window);