/*globals jQuery, window, YT*/
(function($, window) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var player = slothyx.player = {};

	var proxyPlayer = new PlayerProxy();

	player.getPlayer = function() {
		return proxyPlayer;
	};

	function PlayerProxy() {
		//TODO buffer commands
		var self = this;
		var stateEvents = new slothyx.util.EventHelper(self, "State");
		var player = null;
		var state = {
			state: undefined,
			videoId: undefined,
			progress: 0,
			volumne: 100
		};

		self.load = function(id) {
			state.videoId = id;
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
			state.volumne = percentage;
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
		self.requestFullscreen = function() {
			if(player !== null) {
				player.requestFullscreen();
			}
		};

		/* custom */
		self.getPlayer = function() {
			return player;
		};
		self.setPlayer = function(newPlayer) {
			if(player !== null) {
				player.removeStateListener(onStateChange);
				state.progress = player.getProgress();
				player.stop();
			}
			player = null;
			initNewPlayer(newPlayer);
		};

		function onStateChange(newState) {
			state.state = newState;
			stateEvents.throwEvent(newState);
		}

		//init new player TODO move to implementing player
		function initNewPlayer(newPlayer) {
			if(state.state !== undefined) {
				newPlayer.setVolume(state.volumne);
				if(state.videoId !== undefined) {
					var tmpStateListener = function(state) {
						if(state === slothyx.util.PLAYER_STATE.PLAYING) {
							newPlayer.removeStateListener(tmpStateListener);
							newPlayer.setProgress(state.progress);
							if(state.state === slothyx.util.PLAYER_STATE.PAUSED) {
								newPlayer.pause();
							}
							player = newPlayer;
							player.addStateListener(onStateChange);
						}
					};
					newPlayer.addStateListener(tmpStateListener);
					newPlayer.load(state.videoId);
				} else {
					player = newPlayer;
					player.addStateListener(onStateChange);
				}
			} else {
				player = newPlayer;
				player.addStateListener(onStateChange);
			}
		}
	}

})(jQuery, window);