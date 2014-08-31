/*globals $,ko,console,swfobject,gapi*/

$(function() {
		"use strict";

		console.log("start initializing...");

		//private functions

		function ListItem(id, title, description, thumbnail) {
			var self = this;
			self.id = id;
			self.title = title;
			self.description = description;
			self.thumbnail = thumbnail;
			self.play = function() {
				loadVideo(self);
			};
			self.remove = function() {
				remove(self);
			};
			self.addToPlaylist = function() {
				addToPlaylist(self);
			};
		}

		function stop() {
			loadVideo(null);
		}

		function loadVideo(listItem) {
			viewModel.activeElement(listItem);
			if(listItem !== null) {
				viewModel.activePlayer().loadVideo(listItem);
			} else {
				viewModel.activePlayer().stop();
			}
		}

		function remove(listItem) {
			if(viewModel.activeElement() === listItem) {
				playNext();
			}
			viewModel.playlist.remove(listItem);
		}

		function addToPlaylist(listItem) {
			viewModel.playlist.push(listItem);
		}

		function playNext() {
			var array = viewModel.playlist();
			var newIndex = viewModel.selectedIndex() + 1;
			var newItem = array[newIndex];
			if(newItem === undefined) {
				if(viewModel.repeatPlaylist()) {
					newItem = array[0];
				}
			}
			if(newItem !== undefined) {
				loadVideo(newItem);
			} else {
				stop();
			}
		}

		function searchYoutube(query, callback, options) {
			var params = {
				q: query,
				part: 'snippet',
				fields: 'items(id,snippet)',
				maxResults: '5',
				type: 'video'
			};
			for(var option in options) {
				if(options.hasOwnProperty(option)) {
					params[option] = options[option];
				}
			}
			var request = gapi.client.youtube.search.list(params);
			request.execute(
				function(data) {
					var items = data.items;
					var listItems = [];
					for(var item in items) {
						if(items.hasOwnProperty(item)) {
							item = items[item];
							listItems.push(new ListItem(item.id.videoId, item.snippet.title, item.snippet.description, item.snippet.thumbnails.default.url));
						}
					}
					callback(listItems);
				});
		}

		function getSearchText() {
			return $('#searchText').val();
		}

		function saveLocal(name, data) {
			localStorage[name] = data;
		}

		function getLocal(name) {
			return localStorage[name];
		}

		function resetLocal(name) {
			localStorage.removeItem(name);
		}

		function playerStateChanged(state) {
//			console.log("yt-state: " + state);
			if(state === 1) {
				viewModel.nowPlaying(true);
			} else {
				viewModel.nowPlaying(false);
			}
			if(state === 0) {
				playNext();
			}
		}

		//Public Methods
		var slothyx = window.slothyx || {};
		window.slothyx = slothyx;

		slothyx.toggleVideo = function() {
			if(viewModel.nowPlaying()) {
				viewModel.activePlayer().pause();
			} else {
				if(viewModel.activeElement() === null) {
					playNext();
				} else {
					viewModel.activePlayer().play();
				}
			}
		};
		slothyx.requestFullscreen = function() {
			//we can only fullscreen players on this window!
			if(viewModel.activePlayer() === slothyx.localPlayer) {
				slothyx.localPlayer.requestFullscreen();
			}
		};
		slothyx.openExternalPlayer = function() {
			viewModel.activePlayer(new slothyx.NewWindowPlayer(function(){/*TODO*/}));
		};
		slothyx.loadVideoById = function() {
			var $newVideo = $("#newVideoId");
			var id = $newVideo.val();
			$newVideo.val("");

			//Search for "v=***********"
			if(id.length > 11) {
				var index = id.search(/v=[a-zA-Z0-9_-]{11}/);
				if(index === -1) {
					return;
				}
				id = id.substring(index + 2, index + 13);
			} else if(id.length < 11) {
				return;
			}

			var request = gapi.client.youtube.videos.list({
				id: id,
				part: 'snippet',
				fields: 'items(id,snippet)'
			});
			request.execute(function(response) {
				if(response && response.items && response.items.length === 1) {
					var item = response.items[0];
					viewModel.playlist.push(new ListItem(item.id, item.snippet.title, item.snippet.description, item.snippet.thumbnails.default.url));
				}
			});
		};
		slothyx.clearPlaylist = function() {
			stop();
			viewModel.playlist.removeAll();
		};
		slothyx.search = function() {
			searchYoutube(getSearchText(), function(listItems) {
				//TODO still temp
				$('#changelog').remove();

				var list = viewModel.searchResults;
				list.removeAll();
				for(var item in listItems) {
					if(listItems.hasOwnProperty(item)) {
						item = listItems[item];
						list.push(item);
					}
				}
			});
		};
		slothyx.createRandomPlaylist = function() {
			searchYoutube(getSearchText(), function(data) {
				var maxTries = 50; //maybe dynamically?
				var maxHits = 5;
				while(maxHits > 0 && maxTries > 0) {
					var playlist = viewModel.playlist();
					var item = data[Math.floor(Math.random() * data.length)];
					var hit = true;
					for(var i = 0; i < playlist.length; i++) {
						if(playlist[i].id === item.id) {
							hit = false;
							break;
						}
					}
					if(hit) {
						maxHits--;
						viewModel.playlist.push(item);
					}
					maxTries--;
				}
			}, {maxResults: 50});
		};


		//Initializing stuff...

		//Init searchText
		$('#searchText').on("keyup", function(e) {
			if(e.keyCode === 13) {
				slothyx.search();
			}
		});

		//startup knockout
		var viewModel = slothyx.viewModel = {
			playlist: ko.observableArray(),
			searchResults: ko.observableArray(),
			nowPlaying: ko.observable(false),
			activeElement: ko.observable(null),
			activePlayer: ko.observable(null),
			repeatPlaylist: ko.observable(false)
		};

		viewModel.selectedIndex = ko.computed(function() {
			var array = viewModel.playlist();
			for(var i = 0; i < array.length; i++) {
				if(viewModel.activeElement() === array[i]) {
					return i;
				}
			}
			return -1;
		});

		viewModel.playlist.subscribe(function(newList) {
			saveLocal("playlist", JSON.stringify(ko.utils.unwrapObservable(newList)));
		});

		viewModel.activePlayer.subscribe(function(newPlayer) {
			newPlayer.addStateListener(playerStateChanged);
		});

		var knockoutMapping = {
			playlist: {
				'create': function(options) {
					var data = options.data;
					return new ListItem(data.id, data.title, data.description, data.thumbnail);
				}
			}
		};

		//load playlist (if existing)
		var playlist = getLocal("playlist");
		if(playlist !== undefined) {
			try {
				ko.mapping.fromJS({"playlist": JSON.parse(playlist)}, knockoutMapping, viewModel);
			} catch(e) {
				console.log(e);
				console.log("error loading playlist, resetting...");
				resetLocal("playlist");
			}
		}

		ko.applyBindings(slothyx.viewModel);

	}

);

//hate this
//On Google API loaded

function googleApiCallback() {
	"use strict";
	var API_KEY = "AIzaSyCdRfueQo-4w42pTRur9gFC0ammNREQ8QM";
	gapi.client.setApiKey(API_KEY);
	gapi.client.load('youtube', 'v3', youTubeApiCallback);
}

//Youtube Data API loaded
function youTubeApiCallback() {
	"use strict";
	$('#searchButton').fadeIn();
	$('#createPlaylistButton').fadeIn();
}