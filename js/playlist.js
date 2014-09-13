/*globals jQuery, window, ko, _*/
(function($, window, ko, _, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var lists = slothyx.lists = {};

	/*****PLAYLIST API*****/
	var playlist = (function() {

		var PLAYLIST_HTML_ID = "#playlist";
		var PLAYLISTS_PERSIST_ID = "playlists";
		var PLAYLIST_DEFAULT_NAME = "Slothyx Playlist";

		var videoIdCount = 1;
		var playlistIdCount = 1;

		var playlistModel = lists.playlistModel = {
			playlists: null,
			playlist: null,
			video: null
		};

		var playlist = {};
		var videoSelectedEventHelper = createNewEventHelper(playlist);

		playlist.addVideo = function(video) {
			var playListVideo = new PlaylistVideo(video);
			playlistModel.playlist().videos.push(playListVideo);
			persistPlaylists();
		};

		playlist.addPlaylist = function() {
			var playlist = new PlaylistPlaylist(createNewPlaylist());
			playlistModel.playlists.push(playlist);
			playlistModel.playlist(playlist);
			persistPlaylists();
		};

		playlist.deleteCurrentPlaylist = function() {
			//TODO there always has to be one!
			var currentPlayListId = playlistModel.playlist().id;
			playlistModel.playlists.remove(function(playlist) {
				return playlist.id === currentPlayListId;
			});
			persistPlaylists();
		};

		playlist.getPlaylist = function() {
			return _.map(ko.unwrap(playlistModel.playlists), function(playlist) {
				return playlist.getPlaylist();
			});
		};

		playlist.changed = function() {
			persistPlaylists();
		};

		playlist.selectNext = function() {
			var videos = playlistModel.playlist().videos();
			if(playlistModel.video() === null) {
				if(videos.length !== 0) {
					selectVideo(videos[0]);
				}
			} else {
				var videoId = playlistModel.video().id;
				for(var i = 0; i < videos.length; i++) {
					if(videos[i].id === videoId) {
						selectVideo(videos[i + 1] || null);
					}
				}
			}
		};

		playlist.addVideoSelectedListener = function(callback) {
			videoSelectedEventHelper.addListener(callback);
		};

		function PlaylistVideo(video) {
			var self = this;
			self.id = videoIdCount++;
			self.video = video;
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
			self.name = playlist.name;
			self.videos = ko.observableArray(_.map(playlist.videos, function(video) {
				return new PlaylistVideo(video);
			}));
			self.getPlaylist = function() {
				return {
					name: self.name,
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
			persistPlaylists();
		}

		function selectVideo(video) {
			if(playlistModel.video() === null || video === null || playlistModel.video().id !== video.id) {
				playlistModel.video(video);
				videoSelectedEventHelper.throwEvent(video !== null ? video.video : null);
			}
		}

		function loadPlaylists() {
			return getPersister().get(PLAYLISTS_PERSIST_ID);
		}

		function persistPlaylists() {
			getPersister().put(PLAYLISTS_PERSIST_ID, playlist.getPlaylist());
		}

		/******INIT******/
		initPlaylists();

		$(function() {
			ko.applyBindings(playlistModel, $(PLAYLIST_HTML_ID).get(0));
		});

		return playlist;
	})();


	/*****SEARCHRESULTLIST API*****/
	var searchResultList = (function() {

		var SEARCHRESULTS_HTML_ID = "#searchResults";

		var searchResultsModel = {
			searchResults: ko.observableArray()
		};

		var searchResultList = {};

		searchResultList.setSearchResults = function(searchResults) {
			searchResultsModel.searchResults.removeAll();
			_.forEach(searchResults, function(searchResult) {
				var searchResultWrapper = new SearchResultWrapper(searchResult);
				searchResultsModel.searchResults.push(searchResultWrapper);
			});
		};

		function SearchResultWrapper(video) {
			var self = this;
			self.video = video;

			self.addToPlaylist = function() {
				lists.getPlaylist().addVideo(video);
			};
		}

		/******INIT******/
		$(function() {
			ko.applyBindings(searchResultsModel, $(SEARCHRESULTS_HTML_ID).get(0));
		});

		return searchResultList;
	})();


	/*****PUBLIC API*****/
	lists.getPlaylist = function() {
		return playlist;
	};

	lists.getSearchResultList = function() {
		return searchResultList;
	};

	/*****PRIVATE HELPER*****/
	function getPersister() {
		return slothyx.persist.getPersister();
	}

	function createNewEventHelper(object) {
		return new slothyx.util.EventHelper(object);
	}

})
(jQuery, window, ko, _);