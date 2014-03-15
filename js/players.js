/*globals $,console,slothyx*/
$(function() {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	function LocalPlayer(id) {
		var self = this;
		var ytPlayer = $('#' + id)[0]; //cannot work with jQuery
		var stateListener = [];

		self.pause = function() {
			ytPlayer.pauseVideo();
		};
		self.play = function() {
			ytPlayer.playVideo();
		};
		self.stop = function() {
			ytPlayer.loadVideoById("");
		};
		self.seekTo = function(time) {
			ytPlayer.seekTo(time);
		};
		self.loadVideo = function(listItem) {
			ytPlayer.loadVideoById(listItem.id);
		};
		self.getDuration = function() {
			return ytPlayer.getDuration();
		};
		self.addStateListener = function(listener) {
			//dont allow duplicates
			for(var i = 0; i < stateListener.length; i++) {
				if(stateListener[i] === listener){
					return;
				}
			}
			stateListener.push(listener);
		};
		self.onYtPlayerStateChange = function(state) {
			for(var i = 0; i < stateListener.length; i++) {
				stateListener[i](state);
			}
		};

		ytPlayer.addEventListener("onStateChange", "slothyx.localPlayer.onYtPlayerStateChange");
	}

	//ugly, but has to be TODO maybe we can back away from single player
	window.onYouTubePlayerReady = function(playerId) {
		var player = slothyx.localPlayer = new LocalPlayer("myytPlayer");
		console.log("playerinit");
		//TODO not the nicest way
		slothyx.viewModel.activePlayer(player);
	};

	//Load YoutubePlayer
	var params = { allowScriptAccess: "always" };
	var atts = { id: "myytPlayer" };
	swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
		"ytPlayer", "425", "356", "8", null, null, params, atts);

	//TODO remote player

});
