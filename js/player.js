$(document).ready(
    function () {
        //Load YoutubePlayer
        var params = { allowScriptAccess: "always" };
        var atts = { id: "myytPlayer" };
        swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
            "ytPlayer", "425", "356", "8", null, null, params, atts);

        $(window).on('message', onMessage);
        $(window).unload(onUnload);
    }
);

var ytPlayer;
var mainWindow;
var commandMap = {};
commandMap["pause"] = onPauseCommand;
commandMap["play"] = onPlayCommand;
commandMap["close"] = onCloseCommand;
commandMap["loadvideo"] = onLoadVideoCommand;
commandMap["fullscreen"] = onFullscreenCommand;

function onMessage(event) {
    event = event.originalEvent;
    console.log("player recieved: " + event.data);
    if (!mainWindow) {
        if (event.data == "slothyxhello") {
            mainWindow = event.source;
            mainWindow.postMessage("slothyxhello", "*");
        }
        return;
    }

    var msg = event.data;
    if (msg.indexOf("slothyx") == 0) {
        var cmd = msg.substring("slothyx".length, msg.length);
        if (cmd.indexOf(":") != -1) {
            var para = cmd.substring(cmd.indexOf(":") + 1, cmd.length);
            cmd = cmd.substring(0, cmd.indexOf(":"));
            commandMap[cmd](para);
        } else {
            commandMap[cmd]();
        }
    }
}

function onYouTubePlayerReady(playerId) {
    ytPlayer = $("#myytPlayer").get(0);
    ytPlayer.addEventListener("onStateChange", "onYtPlayerStateChange");
}

function onYtPlayerStateChange(state) {
    mainWindow.postMessage("slothyxstatechanged:" + state, "*");
}

function onUnload() {
    mainWindow.postMessage("slothyxclosed", "*");
}

function onPauseCommand() {
    if (ytPlayer) {
        ytPlayer.pauseVideo();
    }
}
function onPlayCommand() {
    if (ytPlayer) {
        ytPlayer.playVideo();
    }
}
function onCloseCommand() {
    window.close();
}
function onLoadVideoCommand(id) {
    if (ytPlayer) {
        ytPlayer.loadVideoById(id);
    }
}

function onFullscreenCommand() {
    var videoElement = document.getElementById("myytPlayer");
    if (videoElement.mozRequestFullScreen) {
        videoElement.mozRequestFullScreen();
    } else {
        videoElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
}