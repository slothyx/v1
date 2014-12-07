/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var SEARCH_TEXTFIELD_SELECTOR = '#searchText';
	var VIDEO_TEXTFIELD_SELECTOR = '#newVideoId';
	var PLAYLIST_CODE_SELECTOR = '#newPlaylistCode';
	var PLAYLIST_NAME_SELECTOR = '#newPlaylistName';
	var PROGRESS_SLIDER_SELECTOR = '#progressSlider';
	var VOLUME_SLIDER_SELECTOR = '#volumeSlider';
	var OPTIONS_HTML_SELECTOR = "#playlistOptions";
	var SPACE_LISTENER_SELECTOR = 'html';
	var DEFAULT_WINDOW_TITLE = "Slothyx Music";

	var STATE_STOPPED = 0;
	var STATE_PLAYING = 1;
	var STATE_PAUSE = 2;
	var YT_STATE_STOPPED = 0;
	var YT_STATE_PLAYING = 1;
	var YT_STATE_PAUSE = 2;

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
		//TODO move to youtube? do we need to know / should we know how to parse this?
		var callback = function(result) {
			_.forEach(result.videos, function(video) {
				getPlayList().addVideo(video);
			});
			$(VIDEO_TEXTFIELD_SELECTOR).val("");
		};
		var text = $(VIDEO_TEXTFIELD_SELECTOR).val();
		var regexResult = /v=([A-Za-z0-9_-]{11})/.exec(text);
		if(regexResult !== null) {
			slothyx.youtube.loadVideoData([regexResult[1]], callback);
		} else {
			if(text.length % 11 === 0) {
				var videoIds = [];
				for(var i = 0; i <= text.length; i += 11) {
					videoIds.push(text.substring(i, i + 11));
				}
				slothyx.youtube.loadVideoData(videoIds, callback);
			}
		}
	};

	var lastSearch;
	slothyx.searchYoutube = function() {
		lastSearch = undefined;
		slothyx.youtube.search($(SEARCH_TEXTFIELD_SELECTOR).val(), function(searchResult) {
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

	slothyx.generatePlaylistCode = function() {
		$(PLAYLIST_CODE_SELECTOR).val(_.reduce(getPlayList().getCurrentPlaylist().videos, function(code, video) {
			return code + video.id;
		}, ""));
		$(PLAYLIST_CODE_SELECTOR).get(0).select();
	};

	slothyx.renameCurrentPlaylist = function() {
		//TODO rework
		getPlayList().renameCurrentPlaylist($(PLAYLIST_NAME_SELECTOR).val());
	};

	slothyx.openRemotePlayer = function() {
		slothyx.remotePlayer.initActivePlayer();
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

	function onSelectedVideo(video) {
		if(video !== null) {
			stateModel.internalState(STATE_PLAYING);
			getYtPlayer().load(video.id);
			setWindowTitle(video.title);
			$(PROGRESS_SLIDER_SELECTOR).slider('enable');
		} else {
			// TODO check "replay"
			stateModel.internalState(STATE_STOPPED);
			getYtPlayer().stop();
			setWindowTitle(DEFAULT_WINDOW_TITLE);
			$(PROGRESS_SLIDER_SELECTOR).slider('disable');
		}
	}

	function setWindowTitle(title) {
		window.document.title = title;
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
				break;
		}
	}

	var progressSliderDragging = false;

	function onProgressChanged(progress) {
		if(!progressSliderDragging) {
			$(PROGRESS_SLIDER_SELECTOR).slider("value", progress);
		}
	}

	function onSearchRelated(video) {
		slothyx.youtube.searchForRelated(video, function(result) {
			lastSearch = result;
			getSearchResultList().setSearchResults(result.videos);
		});
	}

	function getModel() {
		return slothyx.knockout.getModel();
	}

	/*****INIT*****/
	getPlayList().addVideoSelectedListener(onSelectedVideo);
	getSearchResultList().addSearchRelatedListener(onSearchRelated);
	getYtPlayer().addListener(onYTPlayerStateChange);
	getModel().contribute({stateModel: stateModel});

	slothyx.util.onStartUp(function() {

		slothyx.util.initTextFields(slothyx);

		$(SPACE_LISTENER_SELECTOR).on("keypress", function(event) {
			if(event.originalEvent.charCode === ENTER_SPACE_CODE && event.target.tagName !== "INPUT" && event.target.tagName !== "BUTTON") {
				slothyx.toggle();
				return false;
			}
		});

		$(PROGRESS_SLIDER_SELECTOR).slider({
			disabled: true,
			start: function() {
				progressSliderDragging = true;
			},
			stop: function(event, ui) {
				progressSliderDragging = false;
				getYtPlayer().setProgress(ui.value);
			}
		});
		getYtPlayer().addProgressListener(onProgressChanged);

		$(VOLUME_SLIDER_SELECTOR).slider({
			orientation: "vertical",
			value: 100,
			slide: function(event, ui) {
				getYtPlayer().setVolume(ui.value);
			}
		});

		$(OPTIONS_HTML_SELECTOR).options({items: [
			{content: "Generate playlistcode", action: slothyx.generatePlaylistCode},
			{content: "Rename current playlist", action: slothyx.renameCurrentPlaylist},
			{content: "Delete current playlist", action: slothyx.deletePlaylist}
		]});
	});

})(jQuery, window);

