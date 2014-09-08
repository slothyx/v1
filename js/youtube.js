/*globals jQuery, gapi, _*/
(function($, window, _, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var youtube = slothyx.youtube = {};

	var Video = slothyx.util.Video;

	youtube.search = function(query, callback) {
		//TODO caching/paginating
		var options = {
			q: query,
			part: "id,snippet",
			fields: "items(id,snippet)",
			maxResults: "5"
		};
		var request = gapi.client.youtube.search.list(options);
		request.execute(function(response) {
			callback(_.map(response.result.items, function(item) {
				return new Video(item.id.videoId, item.snippet.title, item.snippet.description,
					item.snippet.thumbnails.default.url);
			}));
		});
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