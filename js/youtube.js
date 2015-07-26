/*globals jQuery, gapi, _, ko*/
(function($, window, _, ko, undefined) {
	"use strict";

	var RESULTS_DIV_SELECTOR = "#results";
	var MAX_RESULTS = "15";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var youtube = slothyx.youtube = {};

	var Video = slothyx.util.Video;

	youtube.loadVideoData = function(videoIds, callback) {
		if(callback === undefined) {
			callback = getDefaultSearchCallback(false);
		}

		loadVideoData(videoIds, callback);
	};


	function loadMore() {
		search(getDefaultSearchCallback(true), youtubeModel.lastSearchResult());
	}

	function searchForRelated(video) {
		search(getDefaultSearchCallback(false), {relatedToVideoId: video.id});
	}

	function search(callback, optionOverride) {
		//TODO caching
		if(callback === undefined) {
			callback = getDefaultSearchCallback(false);
		}

		var options = {
			part: "id",
			fields: "items/id,nextPageToken",
			type: "video",
			q: youtubeModel.searchQuery(),
			maxResults: MAX_RESULTS,
			safeSearch: "moderate",
			videoEmbeddable: "true",
			videoSyndicated: "true"
		};

		doOptionOverride(options, optionOverride);

		var request = gapi.client.youtube.search.list(options);
		request.execute(function(response) {
			var lastSearchResult = options;
			lastSearchResult.pageToken = response.result.nextPageToken;
			youtubeModel.lastSearchResult(lastSearchResult);
			var videoIds = _.map(response.items, function(item) {
				return item.id.videoId;
			});
			loadVideoData(videoIds, callback);
		});

		youtubeModel.lastSearchResult(undefined);
	}

	function loadVideoData(videoIds, callback) {
		//TODO caching
		var options = {
			part: "id,snippet",
			type: "video",
			fields: "nextPageToken, items(id,snippet)"
		};
		options.id = videoIds.join(',');

		var request = gapi.client.youtube.videos.list(options);
		request.execute(function(response) {
			if(response === undefined) {
				//TODO maybe empty callback?
				return;
			}

			var videos = _.map(response.items, function(item) {
				return new Video(item.id.videoId || item.id, item.snippet.title, item.snippet.description,
					item.snippet.thumbnails.default.url);
			});

			callback(videos);
		});
	}

	function doOptionOverride(options, optionOverride) {
		if(optionOverride !== undefined) {
			for(var option in optionOverride) {
				if(optionOverride.hasOwnProperty(option)) {
					options[option] = optionOverride[option];
				}
			}
		}
	}

	function getDefaultSearchCallback(appendVideos) {
		return function(searchResults) {
			if(appendVideos) {
				youtube.getSearchResultList().addSearchResults(searchResults);
			} else {
				youtube.getSearchResultList().setSearchResults(searchResults);
				$(RESULTS_DIV_SELECTOR).scrollTop(0);
				window.scrollTo(0,0);
			}
		};
	}

	/*****SEARCHRESULTLIST API*****/
	var searchResultList = (function() {

		var searchResultsModel = {
			searchResults: ko.observableArray()
		};

		var searchResultList = {};
		var searchResultSelectedEvent = new slothyx.util.EventHelper(searchResultList, "SearchResultSelected");

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
				searchResultSelectedEvent.throwEvent(video);
			};

			self.searchRelated = function() {
				searchForRelated(video);
			};
		}

		/******INIT******/
		slothyx.knockout.getModel().contribute({youtube: {searchResultsModel: searchResultsModel}});
		return searchResultList;
	})();

	youtube.getSearchResultList = function() {
		return searchResultList;
	};

	var youtubeModel = {
		lastSearchResult: ko.observable(),
		searchQuery: ko.observable(''),
		loadMore: function() {
			//done to avoid parameters from event
			loadMore();
		},
		searchYoutube: function() {
			//done to avoid parameters from event
			search();
		}
	};
	youtubeModel.showLoadMoreButton = ko.pureComputed(function() {
		return youtubeModel.lastSearchResult() !== undefined;
	});

	slothyx.knockout.getModel().contribute({youtube: youtubeModel});


})(jQuery, window, _, ko);


//TODO move inside
function googleApiCallback() {
	"use strict";
	var API_KEY = "AIzaSyCdRfueQo-4w42pTRur9gFC0ammNREQ8QM";
	gapi.client.setApiKey(API_KEY);
	gapi.client.load('youtube', 'v3', youTubeApiCallback);
}

//Youtube Data API loaded
function youTubeApiCallback() {
	"use strict";
	//TODO not nice
	$("#searchButton").fadeIn();
	//TODO callback?
}