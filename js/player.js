/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	var YT_PLAYER_HOLDER_ID = "#ytPlayer";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	slothyx.requestFullscreen = function() {
		slothyx.localPlayer.requestFullscreen();
	};

	var otherWindow = window.opener;
	if(otherWindow === undefined) {
		window.close();
	}
	var callbacks = otherWindow.slothyx.registerRemoteWindow();

	slothyx.util.onStartUp(function() {
		var player = callbacks.getPlayer();
		$(YT_PLAYER_HOLDER_ID).get(0).appendChild(player);
		window.onbeforeunload = function() {
			callbacks.remoteClosed(player);
		};
	});
})(jQuery, window);
