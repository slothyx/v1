/*globals jQuery, window, ko, _*/
(function($, window, ko, _, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var lists = slothyx.lists = {};

	/*****PLAYLIST API*****/
	var playlist = (function() {

		var PLAYLIST_SELECT_HOLDER_SELECTOR = "#playlistSelectHolder";
		var PLAYLISTS_PERSIST_ID = "playlists";
		var PLAYLIST_SETTINGS_PERSIST_ID = "playlistSettings";
		var PLAYLIST_DEFAULT_NAME = "Slothyx Playlist";

		var videoIdCount = 1;
		var playlistIdCount = 1;

		//TODO remove model from public api
		var playlistModel = lists.playlistModel = {
			playlists: null,
			playlist: null,
			video: null
		};

		var playlist = {};
		var videoSelectedEventHelper = createNewEventHelper(playlist, "VideoSelected");

		playlist.selectNext = function() {
			selectNext();
		};

		playlist.addVideo = function(video) {
			var playListVideo = new PlaylistVideo(video);
			playlistModel.playlist().videos.push(playListVideo);
			persistPlaylists();
		};

		playlist.addPlaylist = function() {
			var newPlaylist = new PlaylistPlaylist(createNewPlaylist());
			playlistModel.playlists.push(newPlaylist);
			playlistModel.playlist(newPlaylist);
			persistPlaylists();
			setTimeout(function() {
				playlist.renameCurrentPlaylist();
			}, 0);
		};

		playlist.deleteCurrentPlaylist = function() {
			var currentPlaylists = playlistModel.playlists();
			var currentPlaylistId = playlistModel.playlist().id;
			var currentIndex = getIndexOfPlaylist(currentPlaylistId);
			playlistModel.playlists.remove(function(playlist) {
				return playlist.id === currentPlaylistId;
			});
			if(currentPlaylists.length === 0) {
				playlist.addPlaylist();
			}
			if(currentIndex >= currentPlaylists.length) {
				currentIndex = currentPlaylists.length - 1;
			}
			playlistModel.playlist(currentPlaylists[currentIndex]);
			persistPlaylists();
		};

		playlist.getCurrentPlaylist = function() {
			return playlistModel.playlist().getPlaylist();
		};

		playlist.changed = function() {
			persistPlaylists();
		};

		playlist.markCurrentVideoInvalid = function() {
			var currentVideo = playlistModel.video();
			if(currentVideo !== null) {
				currentVideo.invalid(true);
			}
		};

		var tmpSelectHolder;
		var focusListener;
		playlist.renameCurrentPlaylist = function() {

			tmpSelectHolder = $(PLAYLIST_SELECT_HOLDER_SELECTOR + ' .playlistSelect');
			tmpSelectHolder.detach();

			focusListener = function() {
				finishRenameCurrentPlaylist(true);
			};
			$(document).on('click', focusListener);
			var textField = $("<input type='text' class='playlistSelect'/>");
			textField.val(playlistModel.playlist().name());
			textField.onKey(slothyx.util.KEYS.ENTER, function() {
				finishRenameCurrentPlaylist(true);
			});
			textField.on('click', function() {
				return false;
			});
			$(PLAYLIST_SELECT_HOLDER_SELECTOR).append(textField);
			textField.get(0).select();
		};

		function finishRenameCurrentPlaylist(save) {
			var selectWrapper = $(PLAYLIST_SELECT_HOLDER_SELECTOR);
			var selectTextField = selectWrapper.find('.playlistSelect');
			var select = tmpSelectHolder;
			var newName = selectTextField.val();
			$(document).off('click', focusListener);
			selectTextField.remove();
			tmpSelectHolder = undefined;
			focusListener = undefined;

			if(save) {
				playlistModel.playlist().name(newName);
				persistPlaylists();
			}
			selectWrapper.append(select);
		}

		function PlaylistVideo(video) {
			var self = this;
			self.id = videoIdCount++;
			self.video = video;
			self.invalid = ko.observable(false);
			self.select = function() {
				selectVideo(self);
			};
			self.remove = function() {
				removeVideoByInternalId(self.id);
			};
			self.isSelected = function() {
				var video = playlistModel.video();
				return video !== null && self.id === video.id;
			};
		}

		//playlist for playlist (knockout)
		function PlaylistPlaylist(playlist) {
			var self = this;
			self.id = playlistIdCount++;
			self.name = ko.observable(playlist.name);
			self.videos = ko.observableArray(_.map(playlist.videos, function(video) {
				return new PlaylistVideo(video);
			}));
			self.getPlaylist = function() {
				return {
					name: self.name(),
					videos: _.map(ko.unwrap(self.videos), function(video) {
						return video.video;
					})
				};
			};
		}

		function initPlaylists() {
			var loadedPlaylists = loadPlaylists() || [createNewPlaylist()];

			playlistModel.playlists = ko.observableArray();
			_.forEach(loadedPlaylists, function(playlist) {
				playlistModel.playlists.push(new PlaylistPlaylist(playlist));
			});
			playlistModel.playlist = ko.observable(loadedPlaylists[0]);

			playlistModel.video = ko.observable(null);
		}

		function createNewPlaylist() {
			return {
				name: PLAYLIST_DEFAULT_NAME + " " + playlistIdCount,
				videos: []
			};
		}

		function removeVideoByInternalId(id) {
			playlistModel.playlist().videos.remove(function(item) {
				return id === item.id;
			});
			if(playlistModel.video() !== null && playlistModel.video().id === id) {
				playlist.selectNext();
			}
			persistPlaylists();
		}

		function loadPlaylists() {
			return getPersister().get(PLAYLISTS_PERSIST_ID);
		}

		function persistPlaylists() {
			getPersister().put(PLAYLISTS_PERSIST_ID, getPlaylists());
		}

		function getPlaylists() {
			return _.map(ko.unwrap(playlistModel.playlists), function(playlist) {
				return playlist.getPlaylist();
			});
		}

		function getIndexOfPlaylist(playlistId) {
			var playlists = playlistModel.playlists();
			for(var i = 0; i < playlists.length; i++) {
				if(playlists[i].id === playlistId) {
					return i;
				}
			}
			return -1;
		}

		/******PLAYSETTINGS******/

		//TODO remove from public api
		var playlistSettings = lists.playlistSettings = {
			shuffle: ko.observable(false),
			replay: ko.observable(false)
		};

		function initPlaylistSettings() {
			playlistSettings.shuffle.subscribe(function(value) {
				if(value === true) {
					//shuffle activated
					activateShuffle();
				}
			});

			var settings = loadPlaylistSettings();
			if(settings !== undefined && settings !== null) {
				playlistSettings.shuffle(settings.shuffle || false);
				playlistSettings.replay(settings.replay || false);
			}

			playlistSettings.shuffle.subscribe(persistPlaylistSettings);
			playlistSettings.replay.subscribe(persistPlaylistSettings);
		}

		function selectNext() {
			var video = null;

			if(playlistModel.playlist().videos().length !== 0) {
				if(playlistSettings.shuffle()) {
					video = findNextShuffleVideo();
				} else {
					video = findNextNormalVideo();
				}
			}
			selectVideo(video);
		}

		function findNextNormalVideo() {
			var videos = playlistModel.playlist().videos();
			if(playlistModel.video() === null) {
				return videos[0];
			} else {
				var videoId = playlistModel.video().id;
				for(var i = 0; i < videos.length; i++) {
					if(videos[i].id === videoId) {
						var video = videos[i + 1];
						if(video === undefined && playlistSettings.replay()) {
							//was last video and we do have replay active
							return videos[0];
						} else {
							return video || null;
						}
					}
				}
			}
			//no video found (maybe deleted)
			return videos[0];
		}


		var alreadyPlayedVideoIds = [];

		function activateShuffle() {
			alreadyPlayedVideoIds = [];
		}

		function findNextShuffleVideo() {
			var available = [];
			_.forEach(playlistModel.playlist().videos(), function(video) {
				if(!_.contains(alreadyPlayedVideoIds, video.id)) {
					available.push(video);
				}
			});
			if(available.length === 0) {
				alreadyPlayedVideoIds = [];
				if(!playlistSettings.replay()) {
					return null;
				} else {
					return findNextShuffleVideo();
				}
			}

			return available[_.random(0, available.length - 1)];
		}

		function selectVideo(video) {
			if(playlistModel.video() === null || video === null || playlistModel.video().id !== video.id) {
				if(video !== null){
					alreadyPlayedVideoIds.push(video.id);
				}
				playlistModel.video(video);
				videoSelectedEventHelper.throwEvent(video !== null ? video.video : null);
			}
		}

		function loadPlaylistSettings() {
			return getPersister().get(PLAYLIST_SETTINGS_PERSIST_ID);
		}

		function persistPlaylistSettings() {
			getPersister().put(PLAYLIST_SETTINGS_PERSIST_ID, {
				shuffle: playlistSettings.shuffle(),
				replay: playlistSettings.replay()
			});
		}

		/******INIT******/
		initPlaylists();
		initPlaylistSettings();

		slothyx.knockout.getModel().contribute({
			playlist: {
				playlistModel: playlistModel,
				playlistSettings: playlistSettings
			}
		});

		return playlist;
	})();

	/*****PUBLIC API*****/

	lists.getPlaylist = function() {
		return playlist;
	};

	/*****PRIVATE HELPER*****/
	function getPersister() {
		return slothyx.persist.getPersister();
	}

	function createNewEventHelper(object, addName, removeName) {
		return new slothyx.util.EventHelper(object, addName, removeName);
	}

})
(jQuery, window, ko, _);