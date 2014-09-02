/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YT_PLAYER_ID = "slothyxPlayer";
	$(function() {
		var params = { allowScriptAccess: "always" };
		var atts = { id: YT_PLAYER_ID };
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "425", "356", "8", null, null, params, atts);
	});

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	var ytPlayer;

	function LocalPlayer(id) {
		var self = this;
		var player = $("#" + id)[0];

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
			self.load(null);
		};
	}

	//TODO maybe move
	localPlayer.Video = function(id, title, description, image) {
		var self = this;
		self.id = id;
		self.title = title;
		self.description = description;
		self.image = image;
	};

	localPlayer.onYouTubePlayerReady = function() {
		ytPlayer = new LocalPlayer(YT_PLAYER_ID);
		//TODO notify someone?
	};

	localPlayer.getPlayer = function() {
		return ytPlayer;
	};

})(jQuery, window, swfobject);

//needed in global scope
function onYouTubePlayerReady() {
	"use strict";
	window.slothyx.localPlayer.onYouTubePlayerReady();
}