/*globals jQuery, window*/
(function($, window, undefined) {
	"use strict";

	var DEFAULT_TIMEOUT = 100;

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
		var ready = false;
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

		self.isReady = function() {
			return ready;
		};

		window.addEventListener("message", recieve);

		function recieve(message) {
			console.log(message);
			otherWindow = message.source;
			if(message.data === "close") {
				cleanup();
			} else {
				var command = JSON.parse(message.data);
				//TODO change to switch
				if(command.command === "stateChanged") {
					stateChangedEvents.throwEvent(command.params[0]);
				} else {
					if(command.command === "progressChanged") {
						progressEvents.throwEvent(command.params[0]);
					} else if(command.command === "hello") {
						ready = true;
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

		//start init function
		(function() {
			function sayHello() {
				if(ready) {
					clearInterval(intervalId);
				} else {
					postRaw("hello");
				}
			}

			var intervalId = setInterval(sayHello, DEFAULT_TIMEOUT);
		})();
	}

	function PassivePlayer() {
		var self = this;
		window.addEventListener("message", recieve);
		var otherWindow;

		function recieve(message) {
			console.log(message);
			otherWindow = message.source;
			//TODO close and hello into commands
			if(message.data === "close") {
				cleanup();
			} else if(message.data === "hello") {
				post("hello");
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

	var Command = slothyx.util.Command;

	function getLocalPlayer() {
		return slothyx.localPlayer.getPlayer();
	}

})(jQuery, window);