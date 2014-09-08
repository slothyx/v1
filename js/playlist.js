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
			playlist: null
		};

		var playlist = {};
		playlist.addVideo = function(video) {
			var playListVideo = new PlaylistVideo(video);
			playlistModel.playlist().videos.push(playListVideo);
			persistPlaylists();
		};

		playlist.addPlaylist = function() {
			var playlist = new Playlist(null);
			playlistModel.playlists.push(playlist);
			playlistModel.playlist(playlist);
			persistPlaylists();
		};

		playlist.deleteCurrentPlaylist = function() {
			var currentPlayListId = playlistModel.playlist().id;
			playlistModel.playlists.remove(function(playlist) {
				return playlist.id === currentPlayListId;
			});
			persistPlaylists();
		};

		playlist.changed = function() {
			persistPlaylists();
		};

		function PlaylistVideo(video) {
			var self = this;
			self.id = videoIdCount++;
			self.video = video;
			self.play = function() {
				//TODO tmp
				slothyx.localPlayer.getPlayer().load(video.id);
			};
			self.remove = function() {
				removeVideoByInternalId(self.id);
			};
		}

		//TODO better difference between savable playlist(dto) and ko-playlist
		function Playlist(playlist) {
			var self = this;
			self.id = playlistIdCount++;
			self.name = playlist !== null ? playlist.name : (PLAYLIST_DEFAULT_NAME + ' ' + self.id); //TODO naming
			if(playlist !== null) {
				self.videos = ko.observableArray(_.map(playlist.videos, function(video) {
					return new PlaylistVideo(video);
				}));
			} else {
				self.videos = ko.observableArray();
			}
		}

		function initPlaylists() {
			var loadedPlaylists = loadPlaylists() || getDefaultPlaylists();

			playlistModel.playlists = ko.observableArray();
			_.forEach(loadedPlaylists, function(playlist) {
				playlistModel.playlists.push(new Playlist(playlist));
			});
			playlistModel.playlist = ko.observable(loadedPlaylists[0]);
		}

		function loadPlaylists() {
			return getPersister().get(PLAYLISTS_PERSIST_ID);
		}

		function getDefaultPlaylists() {
			return [null]; //TODO this is NOT a good solution
		}

		function removeVideoByInternalId(id) {
			playlistModel.playlist().videos.remove(function(item) {
				return id === item.id;
			});
			persistPlaylists();
		}

		function persistPlaylists() {
			//TODO look at this method... it is ugly
			var cleanedPlaylists = _.map(ko.unwrap(playlistModel.playlists), function(playlist) {
				return {
					name: playlist.name,
					videos: _.map(ko.unwrap(playlist.videos), function(video) {
						return video.video;
					})
				};
			});
			getPersister().put(PLAYLISTS_PERSIST_ID, cleanedPlaylists);
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

})(jQuery, window, ko, _);