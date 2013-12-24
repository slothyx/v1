
//PlayerClasses
LocalPlayer = function (ytPlayer) {
    this.seekTo = function (time) {
        ytPlayer.seekTo(time);
    };
    this.pauseVideo = function () {
        ytPlayer.pauseVideo();
    };
    this.playVideo = function () {
        ytPlayer.playVideo();
    };
    this.stopVideo = function () {
        this.loadVideoById("");
    };
    this.getPlayerState = function () {
        return ytPlayer.getPlayerState();
    };
    this.loadVideoById = function (id) {
        ytPlayer.loadVideoById(id);
    };
    this.getDuration = function () {
        return ytPlayer.getDuration();
    };
    this.addEventListener = function (event, handler) {
        ytPlayer.addEventListener(event, handler);
    };
    this.activate = function () {
        $(ytPlayer).show();
    };
    this.deactivate = function () {
        this.stopVideo();
        $(ytPlayer).hide();
    };
    this.requestFullscreen = function () {
        if (ytPlayer.mozRequestFullScreen) {
            ytPlayer.mozRequestFullScreen();
        } else {
            ytPlayer.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    };
    this.cancelFullscreen = function () {
        if (ytPlayer.mozCancelFullScreen) {
            ytPlayer.mozCancelFullScreen();
        } else if (ytPlayer.webkitCancelFullScreen) {
            ytPlayer.webkitCancelFullScreen();
        }
    };
    this.isReady = function () {
        return true;
    }
};


//TODO review
ExternalPlayer = function (externalPlayer, commandMap) {
    var connected = false;
    var ytPlayerState = -1;
    this.seekTo = function (time) {

    };
    this.pauseVideo = function () {
        if (connected) {
            externalPlayer.postMessage("slothyxpause", "*");
        }
    };
    this.playVideo = function () {
        if (connected) {
            externalPlayer.postMessage("slothyxplay", "*");
        }
    };
    this.getPlayerState = function () {
        return ytPlayerState;
    };
    this.stopVideo = function () {
        this.loadVideoById("");
    };
    this.loadVideoById = function (id) {
        if (connected) {
            externalPlayer.postMessage("slothyxloadvideo:" + id, "*");
        }
    };
    this.getDuration = function () {

    };
    this.activate = function () {
        $(window).on('message', onMessage);
        initConnection();
    };
    this.deactivate = function () {
        this.stopVideo();
        $(window).off('message', onMessage);
    };
    this.requestClose = function () {
        if (connected) {
            externalPlayer.postMessage("slothyxclose");
        }
    };
    this.requestFullscreen = function () {
        //Cannot do
    };
    this.cancelFullscreen = function () {
        //Cannot do
    };

    var onMessage = function (event) {
        event = event.originalEvent;
        console.log("main recieved: " + event.data);
        if (!connected) {
            if (event.data == "slothyxhello") {
                connected = true;
            }
            return;
        }
        //TODO make library
        var msg = event.data;
        if (msg.indexOf("slothyx") == 0) {
            var cmd = msg.substring("slothyx".length, msg.length);
            if (cmd.indexOf(":") != -1) {
                var para = cmd.substring(cmd.indexOf(":") + 1, cmd.length);
                cmd = cmd.substring(0, cmd.indexOf(":"));
                //TODO not library
                if (cmd == "statechanged") {
                    ytPlayerState = para;
                }
                //TODO library
                commandMap[cmd](para);
            } else {
                commandMap[cmd]();
            }
        }
    };
    this.isReady = function () {
        return connected;
    };

    var initConnection = function () {
        if (!connected) {
            console.log("send hello...");
            externalPlayer.postMessage("slothyxhello", "*");
            setTimeout(function () {
                initConnection();
            }, 1000);
        }
    };
};