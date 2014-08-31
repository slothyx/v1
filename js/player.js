/*globals $,console,slothyx,ko*/
$(function() {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	//startup knockout
	var viewModel = slothyx.viewModel = {
		activePlayer: ko.observable(null),
		mainWindow: ko.observable(null)
	};

	ko.applyBindings(viewModel);

	viewModel.activePlayer.subscribe(function(newPlayer) {
		newPlayer.addStateListener(playerStateChanged);
	});

	function post(message, params) {
		if(viewModel.mainWindow() !== null) {
			var cmd = {cmd: message};
			if(params !== undefined) {
				for(var param in params) {
					if(params.hasOwnProperty(param)) {
						cmd[param] = params[param];
					}
				}
			}
			console.log("posting: " + JSON.stringify(cmd));
			viewModel.mainWindow().postMessage(JSON.stringify(cmd), "*");
		}
	}

	function playerStateChanged(state) {
		post("stateChanged", {'state': state});
	}

	$(window).on('message', function(event) {
		if(viewModel.mainWindow() === null){
			viewModel.mainWindow(event.originalEvent.source);
			post("hello");
		}else{
			var data = event.originalEvent.data;
			parseCommand(JSON.parse(data));
		}
	});

	var handlermap = {
		"pause":undefined//TODO
	};

	function parseCommand(cmd) {
		var handler = handlermap[cmd.cmd];
		if(handler === undefined){
			console.log("unknown command: "+cmd.cmd);
		}else{
			handler(cmd);
		}
	}

});