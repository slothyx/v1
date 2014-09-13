/*globals jQuery, window, YT*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var SEARCH_TEXTFIELD_ID = '#searchText';
	var VIDEO_TEXTFIELD_ID = '#newVideoId';

	var STATE_STOPPED = 0;
	var STATE_PLAYING = 1;
	var STATE_PAUSE = 2;
	var YT_STATE_STOPPED = 0;
	var YT_STATE_PLAYING = 1;
	var YT_STATE_PAUSE = 2;


	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	/*****PUBLIC API*****/
	slothyx.play = function() {
		if(internalState === STATE_STOPPED) {
			getPlayList().selectNext();
		} else {
			internalState = STATE_PLAYING;
			getYtPlayer().play();
		}
	};

	slothyx.pause = function() {
		internalState = STATE_PAUSE;
		getYtPlayer().pause();
	};

	slothyx.stop = function() {
		internalState = STATE_STOPPED;
		getYtPlayer().stop();
	};

	slothyx.loadVideoFromTextField = function() {
		//TODO parse URL
		getYtPlayer().load($(VIDEO_TEXTFIELD_ID).val());
	};

	var lastSearch;
	slothyx.searchYoutube = function() {
		slothyx.youtube.search($(SEARCH_TEXTFIELD_ID).val(), function(searchResult) {
			//TODO temporary
			$('#changelog').hide();
			$('#loadMore').show();
			lastSearch = searchResult;
			getSearchResultList().setSearchResults(searchResult.videos);
		});
	};
	var loadMoreCount = 0;
	slothyx.loadMore = function() {
		if(lastSearch !== undefined) {
			slothyx.youtube.loadMore(lastSearch, function(searchResult) {
				lastSearch = searchResult;
				getSearchResultList().addSearchResults(searchResult.videos);
				if(loadMoreCount > 0) {
					loadMoreCount--;
					slothyx.loadMore();
				}
			});
			lastSearch = undefined;
		} else {
			loadMoreCount++;
		}
	};

	slothyx.addPlaylist = function() {
		getPlayList().addPlaylist();
	};
	slothyx.deletePlaylist = function() {
		getPlayList().deleteCurrentPlaylist();
	};

	//TODO debug only
	slothyx.skipToEnd = function() {
		getYtPlayer().player.seekTo(getYtPlayer().player.getDuration() - 2, true);
	};


	/*****PRIVATE HELPER*****/
	var ytPlayer;

	function getYtPlayer() {
		return ytPlayer;
	}

	function setYtPlayer(player) {
		ytPlayer = player;
	}

	function getPlayList() {
		return slothyx.lists.getPlaylist();
	}

	function getSearchResultList() {
		return slothyx.lists.getSearchResultList();
	}

	function onSelectedVideo(video) {
		if(video !== null) {
			internalState = STATE_PLAYING;
			getYtPlayer().load(video.id);
		} else {
			// TODO check "replay"
			internalState = STATE_STOPPED;
			getYtPlayer().stop();
		}
	}

	var internalState = STATE_STOPPED;

	function onYTPlayerStateChange(state) {
		switch(state) {
			case YT_STATE_STOPPED:
				getPlayList().selectNext();
				break;
		}
	}

	function onSearchRelated(video) {
		slothyx.youtube.searchForRelated(video, function(result){
			lastSearch = result;
			getSearchResultList().setSearchResults(result.videos);
		});
	}

	/*****INIT*****/
	getPlayList().addVideoSelectedListener(onSelectedVideo);
	getSearchResultList().addSearchRelatedListener(onSearchRelated);
	slothyx.localPlayer.addYTPlayerListener(function(player) {
		setYtPlayer(player);
		player.addListener(onYTPlayerStateChange);
	});

})(jQuery, window);

