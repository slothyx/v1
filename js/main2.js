$(function () {
	var slothyx = {};
	window.slothyx = slothyx;

	//Load YoutubePlayer
	var params = { allowScriptAccess: "always" };
	var atts = { id: "myytPlayer" };
	swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
		"ytPlayer", "425", "356", "8", null, null, params, atts);

	//Init searchText
	$('input#searchText').keyup(function (e) {
		if (e.keyCode == 13) slothyx.searchYoutube()
	});

	var viewModel = slothyx.viewModel = new ViewModel();
	ko.applyBindings(viewModel);

	window.onYouTubePlayerReady = function (playerId) {
		ytPlayer = new LocalPlayer($("#myytPlayer").get(0));
		ytPlayer.activate();
		ytPlayer.addEventListener("onStateChange", "onYtPlayerStateChange");
	};

	window.onYtPlayerStateChange = function (state) {
		console.log("yt-playerstate:" + state);
		if (state == 0) {
			playlist.selectNext();
		}
	};

	var apiLoaded = false;
	var ytPlayer;
	var localPlayer; //Only once initialized and assigned

	//Player helpers
	slothyx.playVideo = function () {
		if (ytPlayer) {
			ytPlayer.playVideo();
		}
	}

	slothyx.pauseVideo = function () {
		if (ytPlayer) {
			ytPlayer.pauseVideo();
		}
	}

	slothyx.toggleVideo = function () {
		if (ytPlayer) {
			var state = ytPlayer.getPlayerState();
			if (state == 1) {
				slothyx.pauseVideo();
			} else if (!viewModel.nowPlaying()) {
				viewModel.nowPlaying(true); //ignore delay
				viewModel.playNext();
			} else {
				slothyx.playVideo();
			}
		}
	}

	slothyx.loadVideo = function () {
		if (apiLoaded) {
			var newVideo = $("#newVideoId");
			var id = newVideo.val();
			newVideo.val("");

			//Search for "v=***********"
			if (id.length > 11) {
				var index = id.search(/v=[a-zA-Z0-9_-]{11}/);
				if (index == -1) return;
				id = id.substring(index + 2, index + 13);
			} else if (id.length < 11) {
				return;
			}

			var request = gapi.client.youtube.videos.list({
				id: id,
				part: 'snippet',
				fields: 'items(id,snippet)'
			});
			request.execute(function (response) {
				if (response && response.items && response.items.length == 1) {
					viewModel.addVideo(response.items[0].id,
						response.items[0].snippet.title);
				}
			});
		}
	}

	function ViewModel() {
		var self = this;
		self.videos = ko.observableArray();
		self.searchResults = ko.observableArray();
		self.currentItem = ko.observable(undefined);
		self.nowPlaying = ko.observable(false);

		self.addVideo = function (id, title) {
			self.videos.push(new ListElement(id, title));
		};
		self.addSearchResult = function (id, title) {
			self.searchResults.push(new ListElement(id, title));
		};
		self.playNext = function () {
			var currentPlaying = ko.utils.unwrapObservable(self.currentItem);
			var newIndex;
			if (currentPlaying === null) {
				newIndex = 0;
			} else {
				newIndex = self.videos.indexOf(currentPlaying) + 1;
			}
			self.playVideo(self.videos()[newIndex]);
		};
		self.getIndexOfElement = function (element) {
			return self.indexOf(element);
		};
		self.playVideo = function (element) {
			self.currentItem(element);
			ytPlayer.loadVideoById((element !== null && element !== undefined) ? element.id : '');
		};
	}

	function ListElement(id, title) {
		var self = this;
		self.id = id;
		self.title = title;
		self.playMe = function () {
			viewModel.playVideo(self);
		};
		self.removeMe = function () {
			viewModel.videos.remove(self);
		};
	}

	//Youtube Data API loaded
	slothyx.youTubeApiCallback = function () {
		apiLoaded = true;
		$('#searchButton').fadeIn();
		$('#createPlaylistButton').fadeIn();
	}

	slothyx.searchYoutube = function () {
		if (!apiLoaded) return;

		//TODO not nice
		$('#changelog').remove();

		var request = gapi.client.youtube.search.list({
			q: $('#searchText').val(),
			part: 'snippet',
			fields: 'items(id,snippet)',
			maxResults: '30',
			type: 'video'
		});
		request.execute(onSearchReturn);
	}

	function onSearchReturn(response) {
		viewModel.searchResults.removeAll();

		for (var item in response.items) {
			viewModel.addSearchResult(response.items[item].id.videoId, response.items[item].snippet.title);
		}
	}

	slothyx.clearPlaylist = function () {
		playlist.clear();
	}

	slothyx.openExternalPlayer = function () {
		if (ytPlayer instanceof ExternalPlayer) return;

		ytPlayer.deactivate();
		localPlayer = ytPlayer;
		//TODO make stop function to stop malfunction of replayPlaylist
		viewModel.nowPlaying(false);
		$('#requestFullscreen').hide();
		$('#openExternalPlayer').hide();

		var commandMap = {};
		commandMap["closed"] = onRemotePlayerClosed;
		commandMap["statechanged"] = onYtPlayerStateChange;

		ytPlayer = new ExternalPlayer(window.open("player.html"), commandMap);
		ytPlayer.activate();
	}

	function onRemotePlayerClosed() {
		ytPlayer.deactivate();
		viewModel.nowPlaying(false);
		$('#requestFullscreen').show();
		$('#openExternalPlayer').show();

		ytPlayer = localPlayer;
		ytPlayer.activate();
	}

	slothyx.requestFullscreen = function () {
		if (ytPlayer) {
			ytPlayer.requestFullscreen();
		}
	}

	slothyx.cancelFullscreen = function () {
		if (ytPlayer) {
			ytPlayer.cancelFullscreen();
		}
	}

	//TODO DEBUG function
	slothyx.skipToEnd = function () {
		if (ytPlayer) {
			ytPlayer.seekTo(ytPlayer.getDuration() - 1, true);
		}
	}

	slothyx.createPlaylist = function () {
		var artist = $('#searchText').val();

		//TODO always -live?
		var request = gapi.client.youtube.search.list({
			q: artist + " -live",
			part: 'snippet',
			fields: 'items(id,snippet)',
			maxResults: '50',
			type: 'video'
		});
		request.execute(onCreatePlaylistSearchReturn);
	}

	function onCreatePlaylistSearchReturn(response) {
		var size = response.items.length;
		var maxSelectSize = 5;
		var selectSize = maxSelectSize > size ? size : maxSelectSize; //TODO make changeable
		var array = new Array(selectSize);
		var i = 0;
		var hit;

		while (i < selectSize) {
			array[i] = Math.floor(Math.random() * (size + 1));
			hit = false;
			for (var j = 0; j < i; j++) {
				if (array[j] == array[i]) {
					hit = true;
					break;
				}
			}
			if (!hit)i++;
		}

		for (i = 0; i < selectSize; i++) {
			viewModel.addVideo(response.items[array[i]].id.videoId, response.items[array[i]].snippet.title);
		}
	}
});

//On Google API loaded
var API_KEY = "AIzaSyCdRfueQo-4w42pTRur9gFC0ammNREQ8QM";
function googleApiCallback() {
	gapi.client.setApiKey(API_KEY);
	gapi.client.load('youtube', 'v3', slothyx.youTubeApiCallback);
}
