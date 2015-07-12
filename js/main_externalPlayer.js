/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	slothyx.requestFullscreen = function() {
		slothyx.player.requestFullscreen();
	};

	var otherWindow = window.opener;
	if(otherWindow === undefined) {
		window.close();
	}
	var callback;

	window.onbeforeunload = function() {
		if(callback) {
			callback();
		}
	};

	slothyx.ytPlayer.addReadyListener(function(){
		callback = otherWindow.slothyx.registerRemoteWindow(slothyx.ytPlayer.getYTPlayer());
	});

})(jQuery, window);
