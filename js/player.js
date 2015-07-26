/*globals jQuery, window, YT*/
(function($, window, undefined) {
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
			}
			return false;
		};
		self.getProgress = function() {
			if(player !== null) {
				return player.getProgress();
			}
			return 0;
		};
		self.getState = function() {
			if(player !== null) {
				return player.getState();
			}
			return undefined;
		};
		self.requestFullscreen = function() {
			if(player !== null) {
				player.requestFullscreen();
			}
		};
		self.getPlayerSnapshot = function() {
			if(player !== null) {
				return player.getPlayerSnapshot();
			}
			return undefined;
		};
		self.setPlayerSnapshot = function(playerSnapshot) {
			if(player !== null) {
				return player.setPlayerSnapshot(playerSnapshot);
			}
		};

		/* custom */
		self.getPlayer = function() {
			return player;
		};
		self.setPlayer = function(newPlayer) {
			if(player !== null) {
				player.removeStateListener(onStateChange);
				newPlayer.setPlayerSnapshot(player.getPlayerSnapshot());
				player.stop();
			}
			newPlayer.addStateListener(onStateChange);
			player = newPlayer;
		};

		function onStateChange(newState) {
			stateEvents.throwEvent(newState);
		}

	}

})(jQuery, window);