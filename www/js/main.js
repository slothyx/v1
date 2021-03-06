/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var DEFAULT_WINDOW_TITLE = "Slothyx Music";
	var SNAPSHOT_PERSIST_KEY = "playerState";
	var SLOTHYX_PLAYLIST_SHARE_PREFIX = "SLOTHYXPLAYLIST";

	var UPDATE_PROGRESS_INTERVAL_MS = 500;
	var UPDATE_SNAPSHOT_INTERVAL_MS = 500;

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
		slothyx.util.openTextBox(SLOTHYX_PLAYLIST_SHARE_PREFIX + code);
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
			progressSlider.slider('enable');
		} else {
			stateModel.internalState(PLAYER_STATE.STOPPED);
			getPlayer().stop();
			setWindowTitle(DEFAULT_WINDOW_TITLE);
			progressSlider.slider('disable');
		}
	}

	function setWindowTitle(title) {
		window.document.title = title;
	}

	function magicInputGo() {
		var callback = function(result) {
			_.forEach(result, function(video) {
				getPlayList().addVideo(video);
			});
		};
		var text = magicInputQuery();
		magicInputQuery('');
		var regexResult = /v=([A-Za-z0-9_-]{11})/.exec(text);
		if(regexResult !== null) {
			slothyx.youtube.loadVideoData([regexResult[1]], callback);
		} else if(text.length >= SLOTHYX_PLAYLIST_SHARE_PREFIX.length + 11 && text.indexOf(SLOTHYX_PLAYLIST_SHARE_PREFIX) === 0 && text.substring(SLOTHYX_PLAYLIST_SHARE_PREFIX.length, text.length).length % 11 === 0) {
			text = text.substring(SLOTHYX_PLAYLIST_SHARE_PREFIX.length, text.length);
			var videoIds = [];
			for(var i = 0; i <= text.length; i += 11) {
				videoIds.push(text.substring(i, i + 11));
			}
			slothyx.youtube.loadVideoData(videoIds, callback);
		} else {
			slothyx.youtube.search(text);
		}
	}

	function onShortcutRight() {
		getPlayList().selectNext();
	}

	function onShortcutLeft() {
		//more then 5% done of video
		if(getPlayer().getProgress() > 5) {
			getPlayer().setProgress(0);
		} else {
			getPlayList().selectPrevious();
		}
	}

	function onShortcutSpace() {
		toggle();
	}

	//TODO reorder variable
	var magicInputQuery = ko.observable('');
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
				progressSlider.slider('disable');
				break;
			case PLAYER_STATE.PLAYING:
			case PLAYER_STATE.PAUSED:
				progressSlider.slider('enable');
				stateModel.internalState(state);
				break;
			case PLAYER_STATE.INVALID:
				getPlayList().markCurrentVideoInvalid();
				getPlayList().selectNext();
				break;
		}
	}

	var progressSlider;
	var volumeSlider;
	var tvSet;
	var progressSliderDragging = false;

	function progressChanged(progress) {
		if(!progressSliderDragging) {
			progressSlider.slider("value", progress);
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
				{content: "Open remote player", action: openRemotePlayer}
			]
		},
		toggle: toggle,
		progressSliderGrabber: function(grabbedProgressSlider) {
			progressSlider = $(grabbedProgressSlider);
			progressSlider.slider(
				{
					disabled: true,
					start: function() {
						progressSliderDragging = true;
					},
					stop: function(event, ui) {
						progressSliderDragging = false;
						getPlayer().setProgress(ui.value);
					}
				});
		},
		volumeSliderGrabber: function(grabbedVolumeSlider) {
			volumeSlider = $(grabbedVolumeSlider);
			$(volumeSlider).slider(
				{
					orientation: "horizontal",
					value: 100,
					slide: function(event, ui) {
						getPlayer().setVolume(ui.value);
					}
				});
		},
		addPlaylist: addPlaylist,
		requestFullscreen: requestFullscreen,
		magicInputQuery: magicInputQuery,
		magicInputGo: magicInputGo,
		selectPrevious: onShortcutLeft,
		selectNext: onShortcutRight,
		tvSetGrabber: function(grabbedTvSetElement) {
			tvSet = grabbedTvSetElement;
		}
	});

	window.setInterval(function() {
		progressChanged(getPlayer().getProgress());
	}, UPDATE_PROGRESS_INTERVAL_MS);

	getPlayer().addStateListener(onYTPlayerStateChange);

	slothyx.util.registerShortcuts([
		{key: slothyx.util.KEYS.SPACE, action: onShortcutSpace},
		{key: slothyx.util.KEYS.RIGHT, action: onShortcutRight},
		{key: slothyx.util.KEYS.LEFT, action: onShortcutLeft}
	]);

	slothyx.util.onStartUp(function() {

		var emails = [
			["Codemonkey", "Y29kZW1vbmtleUBzbG90aHl4LmNvbQ=="],
			["Styleparrot", "c3R5bGVwYXJyb3RAc2xvdGh5eC5jb20="],
			["Info", "aW5mb0BzbG90aHl4LmNvbQ=="]
		];

		_.forEach(emails, function(item) {
			var link = $('#emailTo' + item[0]);
			var email = atob(item[1]);
			link.attr("href", "mailto: " + email);
			link.text(email);
		});

	});

	slothyx.ytPlayer.addReadyListener(function(ytPlayer) {
		getPlayer().setPlayer(ytPlayer);
	});

	slothyx.registerRemoteWindow = function(player) {
		getPlayer().setPlayer(player);
		$(tvSet).hide();
		return function() {
			getPlayer().setPlayer(slothyx.ytPlayer.getYTPlayer());
			$(tvSet).show();
		};
	};

	var playerSnapshot = slothyx.persist.getPersister().get(SNAPSHOT_PERSIST_KEY);
	if(playerSnapshot !== undefined) {
		slothyx.util.doWhenTrue(function() {
			//it's strange when it starts autoplaying
			playerSnapshot.state = PLAYER_STATE.PAUSED;
			getPlayer().setPlayerSnapshot(playerSnapshot);
			if(playerSnapshot.volume !== undefined) {
				volumeSlider.slider('value', playerSnapshot.volume);
			}
			startSnapshotInterval();
		}, function() {
			return getPlayer().isReady();
		});
	} else {
		startSnapshotInterval();
	}

	function startSnapshotInterval() {
		setInterval(function() {
			var playerSnapshot = getPlayer().getPlayerSnapshot();
			if(playerSnapshot !== undefined) {
				slothyx.persist.getPersister().put(SNAPSHOT_PERSIST_KEY, playerSnapshot);
			}
		}, UPDATE_SNAPSHOT_INTERVAL_MS);
	}

})(jQuery, window);

