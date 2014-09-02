/*globals jQuery, window, ko*/
(function($, window, ko, undefined) {
	"use strict";

	var PLAYLIST_HTML_ID = "#playlist";
	var SEARCHRESULTS_HTML_ID = "#searchResults";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var lists = slothyx.lists = {};

	//TODO load on startup

	var playlistModel = {
		playlist: ko.observableArray()
	};

	var searchResultsModel = {
		searchResults: ko.observableArray()
	};

	$(function() {
		ko.applyBindingsToNode($(PLAYLIST_HTML_ID).get(0), null, playlistModel);
		ko.applyBindingsToNode($(SEARCHRESULTS_HTML_ID).get(0), null, searchResultsModel);
	});


	/*****PUBLIC API*****/
	lists.addVideo = function(originalVideo) {
		//copies the object
		var video = copy(originalVideo);
		addVideoInternal(video);
	};

	lists.setSearchResults = function(searchResults) {
		searchResultsModel.searchResults.removeAll();
		for(var index in searchResults) {
			if(searchResults.hasOwnProperty(index)) {
				(function(searchResults, index){
					var searchResult = searchResults[index];
					var newSearchResult = copy(searchResult);
					newSearchResult.addToPlaylist = function() {
						lists.addVideo(searchResult);
					};
					searchResultsModel.searchResults.push(newSearchResult);
				})(searchResults, index);
			}
		}
	};


	/*****PRIVATE HELPER*****/
	function addVideoInternal(video) {
		video.play = function() {
			//TODO tmp
			slothyx.localPlayer.getPlayer().load(video.id);
		};
		video.remove = function(){
			//TODO do nothing now
		};
		playlistModel.playlist.push(video);
	}

	function copy(object) {
		return $.extend(true, {}, object);
	}

})(jQuery, window, ko);