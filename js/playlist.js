/*globals jQuery, window, ko, _*/
(function($, window, ko, _, undefined) {
	"use strict";

	var PLAYLIST_HTML_ID = "#playlist";
	var SEARCHRESULTS_HTML_ID = "#searchResults";
	var PLAYLISTS_PERSIST_ID = "playlists";
	var PLAYLIST_DEFAULT_NAME = "Slothyx Playlist";

	var videoIdCount = 1;
	var playlistIdCount = 1;

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var lists = slothyx.lists = {};


	var playlistModel = lists.playlistModel = {
		playlists: null,
		playlist: null
	};

	var searchResultsModel = {
		searchResults: ko.observableArray()
	};

	initPlaylists();

	$(function() {
		ko.applyBindings(playlistModel, $(PLAYLIST_HTML_ID).get(0));
		ko.applyBindings(searchResultsModel, $(SEARCHRESULTS_HTML_ID).get(0));
	});


	/*****PUBLIC API*****/
	lists.addVideo = function(video) {
		var playListVideo = new PlaylistVideo(video);
		playlistModel.playlist().videos.push(playListVideo);
		persistPlaylists();
	};

	lists.setSearchResults = function(searchResults) {
		searchResultsModel.searchResults.removeAll();
		_.forEach(searchResults, function(searchResult) {
			var searchResultWrapper = new SearchResultWrapper(searchResult);
			searchResultsModel.searchResults.push(searchResultWrapper);
		});
	};

	lists.addPlaylist = function() {
		var playlist = new Playlist(null);
		playlistModel.playlists.push(playlist);
		playlistModel.playlist(playlist);
		persistPlaylists();
	};

	lists.deleteCurrentPlaylist = function() {
		var currentPlayListId = playlistModel.playlist().id;
		playlistModel.playlists.remove(function(playlist) {
			return playlist.id === currentPlayListId;
		});
		persistPlaylists();
	};

	lists.changed = function() {
		persistPlaylists();
	};


	/*****PRIVATE HELPER*****/

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

	function SearchResultWrapper(video) {
		var self = this;
		self.video = video;

		self.addToPlaylist = function() {
			lists.addVideo(video);
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
		return getPersist().get(PLAYLISTS_PERSIST_ID);
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
		getPersist().put(PLAYLISTS_PERSIST_ID, cleanedPlaylists);
	}

	function getPersist() {
		return slothyx.persist;
	}

})(jQuery, window, ko, _);