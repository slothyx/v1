/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var VIDEO_TEXTFIELD_SELECTOR = '#newVideoId';
	var PROGRESS_SLIDER_SELECTOR = '#progressSlider';
	var DEFAULT_WINDOW_TITLE = "Slothyx Music";

	var UPDATE_INTERVAL_MS = 500;

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;

	//used for shorter reference
	var PLAYER_STATE = slothyx.util.PLAYER_STATE;

	function addPlaylist() {
		getPlayList().addPlaylist();
	}

	function deletePlaylist() {
		getPlayList().deleteCurrentPlaylist();
	}

	function sharePlaylist() {
		var code = _.reduce(getPlayList().getCurrentPlaylist().videos, function(code, video) {
			return code + video.id;
		}, "");
		slothyx.util.openTextBox(code);
	}

	function renameCurrentPlaylist() {
		getPlayList().renameCurrentPlaylist();
	}

	function openRemotePlayer() {
		window.open("player.html", "remotePlayer");
	}

	function requestFullscreen() {
		getPlayer().requestFullscreen();
	}

	function toggle() {
		if(stateModel.internalState() === PLAYER_STATE.PLAYING) {
			pause();
		} else {
			play();
		}
	}

	function play() {
		if(stateModel.internalState() === PLAYER_STATE.STOPPED) {
			getPlayList().selectNext();
		} else {
			stateModel.internalState(PLAYER_STATE.PLAYING);
			getPlayer().play();
		}
	}

	function pause() {
		stateModel.internalState(PLAYER_STATE.PAUSED);
		getPlayer().pause();
	}

	function stop() {
		//TODO check if needed
		stateModel.internalState(PLAYER_STATE.STOPPED);
		getPlayer().stop();
	}

	function getPlayer() {
		return slothyx.player.getPlayer();
	}

	function getPlayList() {
		return slothyx.lists.getPlaylist();
	}

	function getSearchResultList() {
		return slothyx.youtube.getSearchResultList();
	}

	function onSelectedVideo(video) {
		if(video !== null) {
			stateModel.internalState(PLAYER_STATE.PLAYING);
			getPlayer().load(video.id);
			setWindowTitle(video.title);
			$(PROGRESS_SLIDER_SELECTOR).slider('enable');
		} else {
			if(stateModel.replay) {
				getPlayList().selectNext();
			} else {
				stateModel.internalState(PLAYER_STATE.STOPPED);
				getPlayer().stop();
				setWindowTitle(DEFAULT_WINDOW_TITLE);
				$(PROGRESS_SLIDER_SELECTOR).slider('disable');
			}
		}
	}

	function setWindowTitle(title) {
		window.document.title = title;
	}

	function loadVideoFromTextField() {
		var callback = function(result) {
			_.forEach(result, function(video) {
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
	}

	function onShortcutRight() {
		getPlayList().selectNext();
	}

	function onShortcutSpace() {
		toggle();
	}

	var stateModel = {
		internalState: ko.observable(PLAYER_STATE.STOPPED),
		replay: false
	};
	stateModel.playing = ko.pureComputed(function() {
		return stateModel.internalState() === PLAYER_STATE.PLAYING;
	});

	function onYTPlayerStateChange(state) {
		switch(state) {
			case PLAYER_STATE.STOPPED:
				getPlayList().selectNext();
				break;
			case PLAYER_STATE.PLAYING:
			case PLAYER_STATE.PAUSED:
				stateModel.internalState(state);
				break;
			case PLAYER_STATE.INVALID:
				getPlayList().markCurrentVideoInvalid();
				getPlayList().selectNext();
				break;
		}
	}

	var progressSliderDragging = false;

	function progressChanged(progress) {
		if(!progressSliderDragging) {
			$(PROGRESS_SLIDER_SELECTOR).slider("value", progress);
		}
	}

	function onSearchResultSelected(video) {
		getPlayList().addVideo(video);
	}

	function getModel() {
		return slothyx.knockout.getModel();
	}

	/*****INIT*****/
	getPlayList().addVideoSelectedListener(onSelectedVideo);
	getSearchResultList().addSearchResultSelectedListener(onSearchResultSelected);
	getModel().contribute({
		stateModel: stateModel,
		playlistOptions: {
			items: [
				{content: "Share playlist", action: sharePlaylist},
				{content: "Rename current playlist", action: renameCurrentPlaylist},
				{content: "Delete current playlist", action: deletePlaylist},
				{content: "Open remote player", action: openRemotePlayer},
				{
					content: "<input id='test' type='checkbox'> Replay",
					action: function(event) {
						var element = $('#test');
						var checked = element.is(":checked");
						if(!$(event.target).is('#test')) {
							checked = !checked;
						}
						setTimeout(function() {
							element.prop("checked", checked);
							stateModel.replay = checked;
						}, 0);
						return false;
					}
				}
			]
		},
		toggle: toggle,
		loadVideoFromTextField: loadVideoFromTextField,
		progressSlider: {
			disabled: true,
			start: function() {
				progressSliderDragging = true;
			},
			stop: function(event, ui) {
				progressSliderDragging = false;
				getPlayer().setProgress(ui.value);
			}
		},
		volumeSlider: {
			orientation: "horizontal",
			value: 100,
			slide: function(event, ui) {
				getPlayer().setVolume(ui.value);
			}
		},
		addPlaylist: addPlaylist,
		requestFullscreen: requestFullscreen
	});

	window.setInterval(function() {
		progressChanged(getPlayer().getProgress());
	}, UPDATE_INTERVAL_MS);
	getPlayer().addStateListener(onYTPlayerStateChange);
	slothyx.util.registerShortcuts([
		{key: slothyx.util.KEYS.SPACE, action: onShortcutSpace},
		{key: slothyx.util.KEYS.RIGHT, action: onShortcutRight}
	]);

	slothyx.util.onStartUp(function() {

		var emails = [
			["Codemonkey", "Y29kZW1vbmtleUBzbG90aHl4LmNvbQ=="],
			["Styleparrot", "c3R5bGVwYXJyb3RAc2xvdGh5eC5jb20="],
			["Info", "aW5mb0BzbG90aHl4LmNvbQ=="],
		];

		_.forEach(emails, function(item) {
			var link = $('#emailTo' + item[0]);
			var email = atob(item[1]);
			link.attr("href", "mailto: " + email);
			link.text(email);
		});

	});

	slothyx.ytPlayer.addReadyListener(function(ytPlayer){
		getPlayer().setPlayer(ytPlayer);
	});

	slothyx.registerRemoteWindow = function(player) {
		getPlayer().setPlayer(player);
		return function() {
			getPlayer().setPlayer(slothyx.ytPlayer.getYTPlayer());
		};
	};

})(jQuery, window);

