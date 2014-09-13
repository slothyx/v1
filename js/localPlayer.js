/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YTPLAYER_HTML_ID = "slothyxPlayer";
	$(function() {
		var params = { allowScriptAccess: "always" };
		var atts = { id: YTPLAYER_HTML_ID };
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "425", "356", "8", null, null, params, atts);
	});

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	var ytPlayer;
	var onStateChangeCallback;
	var events = new slothyx.util.EventHelper(localPlayer,"addYTPlayerListener","removeYTPlayerListener");

	function LocalPlayer(id) {
		var self = this;
		//TODO debug only (remove self.player)
		var player = self.player = $("#" + id)[0];
		var events = new slothyx.util.EventHelper(self);

		self.load = function(id) {
			player.loadVideoById(id);
		};
		self.pause = function() {
			player.pauseVideo();
		};
		self.play = function() {
			player.playVideo();
		};
		self.stop = function() {
			self.load("");
		};
		onStateChangeCallback = function(state) {
			events.throwEvent(state);
		};
		player.addEventListener("onStateChange","slothyx.localPlayer.onStateChange");
	}

	localPlayer.onYouTubePlayerReady = function() {
		setYTPlayer(new LocalPlayer(YTPLAYER_HTML_ID));
	};

	localPlayer.getPlayer = function() {
		return ytPlayer;
	};

	localPlayer.onStateChange = function(state){
		if(onStateChangeCallback !== undefined){
			onStateChangeCallback(state);
		}
	};

	function setYTPlayer(player){
		ytPlayer = player;
		events.throwEvent(player);
	}

})(jQuery, window, swfobject);

//needed in global scope
function onYouTubePlayerReady() {
	"use strict";
	window.slothyx.localPlayer.onYouTubePlayerReady();
}