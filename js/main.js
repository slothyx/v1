/*globals jQuery, window*/
(function($, window, undefined) {
	"use strict";

	var SEARCH_TEXTFIELD_ID = '#searchText';
	var VIDEO_TEXTFIELD_ID = '#newVideoId';

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	/*****PUBLIC API*****/
	slothyx.play = function(){
		getYtPlayer().play();
	};

	slothyx.pause = function() {
		getYtPlayer().pause();
	};

	slothyx.stop = function() {
		getYtPlayer().stop();
	};

	slothyx.loadVideoFromTextField= function() {
		//TODO parse URL
		getYtPlayer().load($(VIDEO_TEXTFIELD_ID).val());
	};

	slothyx.searchYoutube = function() {
		slothyx.youtube.search($(SEARCH_TEXTFIELD_ID).val(),function(searchResult){
			//TODO temporary
			$('#changelog').hide();
			getLists().setSearchResults(searchResult);
//			$('#searchResults').text(JSON.stringify(searchResult));
		});
	};

	slothyx.addPlaylist = function() {
		getLists().addPlaylist();
	};
	slothyx.deletePlaylist = function() {
		getLists().deleteCurrentPlaylist();
	};



	/*****PRIVATE HELPER*****/
	function getYtPlayer() {
		return slothyx.localPlayer.getPlayer();
	}
	function getLists() {
		return slothyx.lists;
	}

})(jQuery, window);

