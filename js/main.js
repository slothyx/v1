/*globals jQuery, window*/
(function($, window, undefined) {
	"use strict";

	var SEARCH_TEXTFIELD_ID = '#searchText';
	var VIDEO_TEXTFIELD_ID = '#newVideoId';

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	/*****PUBLIC API*****/
	slothyx.play = function() {
		getYtPlayer().play();
	};

	slothyx.pause = function() {
		getYtPlayer().pause();
	};

	slothyx.stop = function() {
		getYtPlayer().stop();
	};

	slothyx.loadVideoFromTextField = function() {
		//TODO parse URL
		getYtPlayer().load($(VIDEO_TEXTFIELD_ID).val());
	};

	slothyx.searchYoutube = function() {
		slothyx.youtube.search($(SEARCH_TEXTFIELD_ID).val(), function(searchResult) {
			//TODO temporary
			$('#changelog').hide();
			getSearchResultList().setSearchResults(searchResult);
//			$('#searchResults').text(JSON.stringify(searchResult));
		});
	};

	slothyx.addPlaylist = function() {
		getPlayList().addPlaylist();
	};
	slothyx.deletePlaylist = function() {
		getPlayList().deleteCurrentPlaylist();
	};


	/*****PRIVATE HELPER*****/
	function getYtPlayer() {
		return slothyx.localPlayer.getPlayer();
	}

	function getPlayList() {
		return slothyx.lists.getPlaylist();
	}

	function getSearchResultList() {
		return slothyx.lists.getSearchResultList();
	}

})(jQuery, window);

