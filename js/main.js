/*globals jQuery, window, YT, ko*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var SEARCH_TEXTFIELD_ID = '#searchText';
	var VIDEO_TEXTFIELD_ID = '#newVideoId';
	var TOGGLE_BUTTON_ID = '#toggleButton';
	var SPACE_LISTENER_ID = 'html';

	var STATE_STOPPED = 0;
	var STATE_PLAYING = 1;
	var STATE_PAUSE = 2;
	var YT_STATE_STOPPED = 0;
	var YT_STATE_PLAYING = 1;
	var YT_STATE_PAUSE = 2;

	var ENTER_KEY_CODE = 13;
	var ENTER_SPACE_CODE = 32;


	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	/*****PUBLIC API*****/

	slothyx.toggle = function() {
		if(stateModel.internalState() === STATE_PLAYING) {
			slothyx.pause();
		} else {
			slothyx.play();
		}
	};

	slothyx.play = function() {
		if(stateModel.internalState() === STATE_STOPPED) {
			getPlayList().selectNext();
		} else {
			stateModel.internalState(STATE_PLAYING);
			getYtPlayer().play();
		}
	};

	slothyx.pause = function() {
		stateModel.internalState(STATE_PAUSE);
		getYtPlayer().pause();
	};

	slothyx.stop = function() {
		stateModel.internalState(STATE_STOPPED);
		getYtPlayer().stop();
	};

	slothyx.loadVideoFromTextField = function() {
		//TODO parse URL - add to playlist, not play it
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
			stateModel.internalState(STATE_PLAYING);
			getYtPlayer().load(video.id);
		} else {
			// TODO check "replay"
			stateModel.internalState(STATE_STOPPED);
			getYtPlayer().stop();
		}
	}

	var stateModel = {
		internalState: ko.observable(YT_STATE_STOPPED)
	};
	stateModel.playing = ko.pureComputed(function() {
		return stateModel.internalState() === YT_STATE_PLAYING;
	});

	function onYTPlayerStateChange(state) {
		switch(state) {
			case YT_STATE_STOPPED:
				getPlayList().selectNext();
				break;
			case YT_STATE_PLAYING:
				stateModel.internalState(STATE_PLAYING);
				break;
			case YT_STATE_PAUSE:
				stateModel.internalState(STATE_PAUSE);
		}
	}

	function onSearchRelated(video) {
		slothyx.youtube.searchForRelated(video, function(result) {
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

	$(function() {
		ko.applyBindings(stateModel, $(TOGGLE_BUTTON_ID).get(0));
		$(SEARCH_TEXTFIELD_ID).on("keypress", function(event) {
			if(event.originalEvent.keyCode === ENTER_KEY_CODE) {
				slothyx.searchYoutube();
				return false;
			}
		});
		$(VIDEO_TEXTFIELD_ID).on("keypress", function(event) {
			if(event.originalEvent.keyCode === ENTER_KEY_CODE) {
				slothyx.loadVideoFromTextField();
				return false;
			}
		});
		$(SPACE_LISTENER_ID).on("keypress", function(event) {
			if(event.originalEvent.charCode === ENTER_SPACE_CODE && event.target.tagName !== "INPUT" && event.target.tagName !== "BUTTON") {
				slothyx.toggle();
				return false;
			}
		});
	});

})(jQuery, window);

