$(document).ready(
    function () {
        //Load YoutubePlayer
        var params = { allowScriptAccess: "always" };
        var atts = { id: "myytPlayer" };
        swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
            "ytPlayer", "425", "356", "8", null, null, params, atts);

        //Init searchText
        $('input#searchText').keyup(function (e) {
            if (e.keyCode == 13) searchYoutube()
        });

        //Init Playlist
        setTimeout(function () {
            playlist = slothyx.list.createList($('#playlist'), true, true, true,
                function (element) {
                    if (element) {
                        //TODO add change title
                        loadVideoById(element.attr("data-videoId"));
                    } else {
                        if ($('input#repeat').prop('checked')) {
                            if (ytPlayer.isReady()) {
                                playlist.selectNext();
                            }
                        } else {
                            //TODO extract title
                            ytPlayer.stopVideo();
                            playing = false;
                        }
                    }
                });
            searchResults = slothyx.list.createList($('#searchResults'), false, false, false, null);
        }, 1);
    }
);

var playing = false;
var searchResults;
var playlist;
var apiLoaded = false;
var API_KEY = "AIzaSyCdRfueQo-4w42pTRur9gFC0ammNREQ8QM";
var ytPlayer;
var localPlayer; //Only once loaded

function onYouTubePlayerReady(playerId) {
    ytPlayer = new LocalPlayer($("#myytPlayer").get(0));
    ytPlayer.activate();
    ytPlayer.addEventListener("onStateChange", "onYtPlayerStateChange");
}

function onYtPlayerStateChange(state) {
    console.log("yt-playerstate:" + state);
    if (state == 0) {
        playlist.selectNext();
    } else {
        var toggleVideo = $("#toggleVideo").children();
        if (state == 1) {
            toggleVideo.removeClass("fa-play");
            toggleVideo.addClass("fa-pause");
        } else {
            toggleVideo.addClass("fa-play");
            toggleVideo.removeClass("fa-pause");
        }
    }
}

//Player helpers
function playVideo() {
    if (ytPlayer) {
        ytPlayer.playVideo();
    }
}

function pauseVideo() {
    if (ytPlayer) {
        ytPlayer.pauseVideo();
    }
}

function toggleVideo() {
    if (ytPlayer) {
        var state = ytPlayer.getPlayerState();
        if (state == 1) {
            pauseVideo();
        } else if (!playing) {
            playing = true;
            playlist.selectNext();
        } else {
            playVideo();
        }
    }

}

function loadVideo() {
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
                playlist.addElement([response.items[0].id, response.items[0].snippet.title]);
            }
        });
    }
}

function loadVideoById(id, title) {
    id = id ? id : "";
    if (ytPlayer) {
        ytPlayer.loadVideoById(id);
        playing = true;
    }
    if (title) {
        document.title = title;
    }
}

//On Google API loaded
function googleApiCallback() {
    gapi.client.setApiKey(API_KEY);
    gapi.client.load('youtube', 'v3', youTubeApiCallback);
}

//Youtube Data API loaded
function youTubeApiCallback() {
    apiLoaded = true;
    $('#searchButton').fadeIn();
    $('#createPlaylistButton').fadeIn();
}

function searchYoutube() {
    if (!apiLoaded) return;

    //TODO not nice
    $('#changelog').hide();

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
    searchResults.clear();

    for (var item in response.items) {
        searchResults.addElement([response.items[item].id.videoId, slothyx.list.sanitize(response.items[item].snippet.title), response.items[item].snippet.title]);
    }
}

function playListRemove(event, id) {
    playlist.removeElementById(id);
    event.stopPropagation();
}

function clearPlaylist() {
    playlist.clear();
}

function openExternalPlayer() {
    if (ytPlayer instanceof ExternalPlayer) return;

    ytPlayer.deactivate();
    localPlayer = ytPlayer;
    //TODO make stop function to stop malfunction of replayPlaylist
    playing = false;
    playlist.selectIndex(-1);
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
    playing = false;
    playlist.selectIndex(-1);
    $('#requestFullscreen').show();
    $('#openExternalPlayer').show();

    ytPlayer = localPlayer;
    ytPlayer.activate();
}

function requestFullscreen() {
    if (ytPlayer) {
        ytPlayer.requestFullscreen();
    }
}
function cancelFullscreen() {
    if (ytPlayer) {
        ytPlayer.cancelFullscreen();
    }
}

//TODO DEBUG function
function skipToEnd() {
    if (ytPlayer) {
        ytPlayer.seekTo(ytPlayer.getDuration() - 1, true);
    }
}

function createPlaylist() {
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
        playlist.addElement([response.items[array[i]].id.videoId, response.items[array[i]].snippet.title]);
    }
}