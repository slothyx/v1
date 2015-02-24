/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	slothyx.requestFullscreen = function() {
		slothyx.localPlayer.requestFullscreen();
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

	slothyx.util.doWhenTrue(function() {
		callback = otherWindow.slothyx.registerRemoteWindow(slothyx.localPlayer.getPlayer());
	}, function() {
		return slothyx.localPlayer.getPlayer().isReady();
	});
})(jQuery, window);
