/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";


	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	slothyx.requestFullscreen = function() {
		slothyx.localPlayer.requestFullscreen();
	};

	slothyx.remotePlayer.initPassivePlayer();
	window.onbeforeunload = slothyx.remotePlayer.closeActivePlayer;
})(jQuery, window);
