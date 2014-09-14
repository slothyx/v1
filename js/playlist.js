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
			video: null,
			playStrategies: null,
			playStrategy: null
		};

		var playlist = {};
		var videoSelectedEventHelper = createNewEventHelper(playlist, "addVideoSelectedListener", "removeVideoSelectedListener");

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
			var currentPlayListId = playlistModel.playlist().id;
			playlistModel.playlists.remove(function(playlist) {
				return playlist.id === currentPlayListId;
			});
			if(playlistModel.playlists().length === 0) {
				playlist.addPlaylist();
			}
			persistPlaylists();
		};

		playlist.getPlaylists = function() {
			return _.map(ko.unwrap(playlistModel.playlists), function(playlist) {
				return playlist.getPlaylist();
			});
		};

		playlist.changed = function() {
			persistPlaylists();
		};

		playlist.selectNext = function() {
			var strategy = playlistModel.playStrategy();
			if(strategy !== null) {
				strategy.selectNext();
			}
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

		function initPlayStrategies() {
			playlistModel.playStrategies = ko.observableArray();
			playlistModel.playStrategies.push(new ForwardStrategy());
			playlistModel.playStrategies.push(new BackwardStrategy());
			playlistModel.playStrategies.push(new ShuffleStrategy());

			playlistModel.playStrategy = ko.observable(playlistModel.playStrategies()[0]);
			playlistModel.playStrategy.subscribe(function(strategy) {
				strategy.reset();
			});
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
			if(playlistModel.video().id === id) {
				playlist.selectNext();
			}
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
			getPersister().put(PLAYLISTS_PERSIST_ID, playlist.getPlaylists());
		}

		/******PLAYSTRATEGIES******/
		function ForwardStrategy() {
			var self = this;
			self.name = "Default";
			self.reset = function() {
			};
			self.selectNext = function() {
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
		}

		function ShuffleStrategy() {
			var self = this;
			self.name = "Shuffle";
			self.reset = function() {
				alreadyPlayed = [];
			};
			var alreadyPlayed = [];
			self.selectNext = function() {
				var available = [];
				_.forEach(playlistModel.playlist().videos(), function(video) {
					if(!_.contains(alreadyPlayed, video.id)) {
						available.push(video);
					}
				});
				if(available.length === 0) {
					self.reset();
					selectVideo(null);
				} else {
					var random = _.random(0, available.length - 1);
					alreadyPlayed.push(available[random].id);
					selectVideo(available[random]);
				}
			};
		}

		function BackwardStrategy() {
			var self = this;
			self.name = "Backward";
			self.reset = function() {
			};
			self.selectNext = function() {
				var videos = playlistModel.playlist().videos();
				if(playlistModel.video() === null) {
					if(videos.length !== 0) {
						selectVideo(videos[videos.length - 1]);
					}
				} else {
					var videoId = playlistModel.video().id;
					for(var i = 0; i < videos.length; i++) {
						if(videos[i].id === videoId) {
							selectVideo(videos[i - 1] || null);
						}
					}
				}
			};
		}

		/******INIT******/
		initPlaylists();
		initPlayStrategies();

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
		var events = createNewEventHelper(searchResultList, "addSearchRelatedListener", "removeSearchRelatedListener");

		searchResultList.setSearchResults = function(searchResults) {
			searchResultsModel.searchResults.removeAll();
			searchResultList.addSearchResults(searchResults);
		};

		searchResultList.addSearchResults = function(searchResults) {
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

			self.searchRelated = function() {
				events.throwEvent(video);
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

	function createNewEventHelper(object, addName, removeName) {
		return new slothyx.util.EventHelper(object, addName, removeName);
	}

})
(jQuery, window, ko, _);