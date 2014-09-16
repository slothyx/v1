/*globals jQuery, gapi, _*/
(function($, window, _, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var youtube = slothyx.youtube = {};

	var Video = slothyx.util.Video;

	youtube.search = function(query, callback, optionOverride) {
		//TODO caching
		var options = {
			q: query,
			part: "id,snippet",
			type: "video",
			fields: "nextPageToken, items(id,snippet)",
			maxResults: "5"
		};
		if(optionOverride !== undefined) {
			for(var option in optionOverride) {
				if(optionOverride.hasOwnProperty(option)) {
					options[option] = optionOverride[option];
				}
			}
		}

		var request = gapi.client.youtube.search.list(options);
		request.execute(function(response) {
			if(response === undefined) {
				//TODO maybe empty callback?
				return;
			}
			var result = {};
			result.options = options;
			result.options.pageToken = response.result.nextPageToken;
			result.videos = _.map(response.result.items, function(item) {
				return new Video(item.id.videoId, item.snippet.title, item.snippet.description,
					item.snippet.thumbnails.default.url);
			});

			callback(result);
		});
	};

	youtube.loadMore = function(lastSearchResult, callback) {
		youtube.search(undefined, callback, lastSearchResult.options);
	};

	youtube.searchForRelated = function(video, callback) {
		youtube.search(undefined, callback, {relatedToVideoId: video.id});
	};

})(jQuery, window, _);


//need to be outside
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