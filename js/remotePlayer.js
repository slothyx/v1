/*globals jQuery, window*/
(function($, window, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var remotePlayer = slothyx.remotePlayer = {};

	var currentlyActivePlayer = null;

	remotePlayer.initActivePlayer = function() {
		currentlyActivePlayer = new ActivePlayer();
		slothyx.localPlayer.setYTPlayer(currentlyActivePlayer);
	};

	remotePlayer.closeActivePlayer = function() {
		if(currentlyActivePlayer !== null) {
			currentlyActivePlayer.close();
			currentlyActivePlayer = null;
		}
	};

	remotePlayer.initPassivePlayer = function() {
		currentlyActivePlayer = new PassivePlayer();
	};

	function ActivePlayer() {
		var self = this;
		var otherWindow = window.open("player.html", "remotePlayer");
		var stateChangedEvents = new slothyx.util.EventHelper(self);
		var progressEvents = new slothyx.util.EventHelper(self, "addProgressListener", "removeProgressListener");

		self.load = function(id) {
			post("load", id);
		};
		self.pause = function() {
			post("pause");
		};
		self.play = function() {
			post("play");
		};
		self.stop = function() {
			post("stop");
		};
		self.setProgress = function(percentage) {
			post("setProgress", percentage);
		};
		self.setVolume = function(percentage) {
			post("setVolume", percentage);
		};

		self.close = function() {
			postRaw("close");
			cleanup();
		};

		window.addEventListener("message", recieve);

		function recieve(message) {
			otherWindow = message.source;
			console.log(message);
			if(message.data === "close") {
				cleanup();
			} else {
				var command = JSON.parse(message.data);
				//only one command
				if(command.command === "stateChanged") {
					stateChangedEvents.throwEvent(command.params[0]);
				} else {
					if(command.command === "progressChanged") {
						progressEvents.throwEvent(command.params[0]);
					}
				}
			}
		}

		function cleanup() {
			slothyx.localPlayer.resetPlayer();
		}

		function post(command) {
			var argArray = Array.slice(arguments);
			var commandObject = new Command(command, argArray.slice(1));
			postRaw(JSON.stringify(commandObject));
		}

		function postRaw(string) {
			otherWindow.postMessage(string, "*");
		}
	}

	function PassivePlayer() {
		var self = this;
		window.addEventListener("message", recieve);
		var otherWindow;

		function recieve(message) {
			otherWindow = message.source;
			if(message.data === "close") {
				cleanup();
			} else {
				var command = JSON.parse(message.data);
				var func = command.command;
				getLocalPlayer()[func].apply(getLocalPlayer(), command.params);
			}
		}

		self.close = function() {
			postRaw("close");
		};

		function cleanup() {
			window.close();
		}

		getLocalPlayer().addListener(onStateChanged);
		function onStateChanged(state) {
			post("stateChanged", state);
		}

		getLocalPlayer().addProgressListener(onProgressChanged);
		function onProgressChanged(progress) {
			post("progressChanged", progress);
		}

		function post(command) {
			var argArray = Array.slice(arguments);
			var commandObject = new Command(command, argArray.slice(1));
			if(otherWindow !== undefined) {
				postRaw(JSON.stringify(commandObject));
			}
		}

		function postRaw(string) {
			otherWindow.postMessage(string, "*");
		}
	}

	function Command(command, params) {
		this.command = command;
		this.params = params;
	}

	function getLocalPlayer() {
		return slothyx.localPlayer.getPlayer();
	}

})(jQuery, window);