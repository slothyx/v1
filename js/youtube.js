/*globals jQuery, gapi, _, ko*/
(function($, window, _, ko, undefined) {
	"use strict";

	var MAX_RESULTS = "15";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var youtube = slothyx.youtube = {};

	var Video = slothyx.util.Video;

	youtube.search = function(query, callback, optionOverride) {
		if(callback === undefined) {
			callback = getDefaultSearchCallback(false);
		}
		if(query === undefined) {
			query = youtubeModel.searchQuery();
		}
		search(query, callback, optionOverride);
	};

	youtube.loadVideoData = function(videoIds, callback, optionOverride) {
		loadVideoData(videoIds, callback, optionOverride);
	};

	youtube.loadMore = function(callback) {
		if(callback === undefined) {
			callback = getDefaultSearchCallback(true);
		}
		search(undefined, callback, youtubeModel.lastSearchResult());
	};

	youtube.searchForRelated = function(video, callback) {
		youtube.search(undefined, callback, {relatedToVideoId: video.id});
	};

	function search(query, callback, optionOverride) {
		//TODO caching
		var options = getDefaultOptions();
		options.q = query;
		options.maxResults = MAX_RESULTS;

		doOptionOverride(options, optionOverride);

		var request = gapi.client.youtube.search.list(options);
		request.execute(getInternalCallbackWrapper(options, callback));

		youtubeModel.lastSearchResult(undefined);
	}

	function loadVideoData(videoIds, callback, optionOverride) {
		//TODO caching
		var options = getDefaultOptions();
		options.id = videoIds.join(',');

		doOptionOverride(options, optionOverride);

		var request = gapi.client.youtube.videos.list(options);
		request.execute(getInternalCallbackWrapper(options, callback));
	}

	function getInternalCallbackWrapper(options, callback) {
		return function(response) {
			if(response === undefined) {
				//TODO maybe empty callback?
				return;
			}

			var lastSearchResult = options;
			lastSearchResult.pageToken = response.result.nextPageToken;
			youtubeModel.lastSearchResult(lastSearchResult);

			var videos = _.map(response.result.items, function(item) {
				return new Video(item.id.videoId || item.id, item.snippet.title, item.snippet.description,
					item.snippet.thumbnails.default.url);
			});

			callback(videos);
		};
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
			}
		};
	}

	function getDefaultOptions() {
		return {
			part: "id,snippet",
			type: "video",
			fields: "nextPageToken, items(id,snippet)"
		};
	}

	/*****SEARCHRESULTLIST API*****/
	var searchResultList = (function() {

		var searchResultsModel = {
			searchResults: ko.observableArray()
		};

		var searchResultList = {};
		var searchResultSelectedEvent = new slothyx.util.EventHelper(searchResultList, "addSearchResultSelectedListener", "removeSearchResultSelectedListener");

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
				youtube.searchForRelated(video);
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
			youtube.loadMore();
		},
		searchYoutube: function() {
			youtube.search();
		}
	};
	youtubeModel.showLoadMoreButton = ko.pureComputed(function(){
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