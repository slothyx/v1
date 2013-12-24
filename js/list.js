var slothyx;

$(document).ready(function () {
    slothyx = {
        list: {
        }
    };

    slothyx.list.createList = function (parent, selectable, persist, dragable, handler) {
        return new slothyx.list.listConstructor(parent, selectable, persist, dragable, handler);
    };

    slothyx.list.listConstructor = function (parent, selectable, persist, dragable, handler) {
        var id = 0;
        var me = this;
        var onSelect = handler;  //onSelect-Eventhandler
        var template; //Rowtemplate
        var paramsArray = [];
        var uL;
        //Dragging
        var dragging = false;
        var allowSelect = true;

        var createRow = function (params) {
            if (params.length > 10) return "";

            paramsArray[id] = params;
            var rowId = parent.attr('id') + "-item-" + id;
            id++;
            var row = template;

            var regex;

            row = row.replace(/\$0/g, rowId);
            for (var i = 0; i < params.length; i++) {
                regex = new RegExp("\\$" + (i + 1), "g");
                row = row.replace(regex, params[i]);
            }

            var listItem = $("<li></li>").html(row);

            listItem.attr('id', rowId);
            if (dragable) {
                console.log("add Draglistener");
                listItem.on('mousedown', null, rowId, onDragStart);
            }

            listItem.click(function () {
                if (allowSelect) me.selectId(rowId);
            });

            listItem.addClass("slothyxlistitem");

            return listItem;
        };
        var getRowByIndex = function (index) {
            return uL.children().eq(index);
        };
        var setLocalStorage = function (saveString) {
            localStorage.setItem("slothyxlist." + parent.attr('id'), saveString);
        };
        var getLocalStorage = function () {
            return localStorage.getItem("slothyxlist." + parent.attr('id'));
        };
        //Dragging
        var onDragStart = function (event) {
            console.log("ondragstart");
            if (!dragable || dragging) return;

            var rowId = event.data;
            console.log("event.data: " + event.data);
            dragging = getRowByIndex(me.getIndexOfId(rowId));

            uL.children().on('mouseover', onMouseOver);

            var html = $('html');
            html.on('mouseup', onDragStop);
        };
        var onDragStop = function (event) {
            console.log("ondragstop");
            if (!dragable || !dragging) return;
            dragging = null;

            uL.children().off('mouseover', onMouseOver);

            var html = $('html');
            html.off('mouseup', onDragStop);

            //Disable oncLick for a ms
            setTimeout(function () {
                console.log("allowSelect = true");
                allowSelect = true
            }, 1);
        };
        var onMouseOver = function (event) {
            console.log("onmouseover");

            if (!dragable || !dragging) return;

            var thisId = $(this).attr('id');
            var draggingId = dragging.attr('id');

            if (thisId == draggingId) return;

            var draggingIndex = me.getIndexOfId(draggingId);
            var thisIndex = me.getIndexOfId(thisId);

            var diff = thisIndex - draggingIndex;
            while (diff != 0) {
                if (diff > 0) {
                    me.moveDownById(draggingId);
                    diff--;
                } else {
                    me.moveUpById(draggingId);
                    diff++;
                }
            }
            allowSelect = false;
        };

        this.size = function () {
            return uL.children().size();
        };
        this.getSelectedIndex = function () {
            if (!selectable) return -1;
            return uL.children().index($('#' + parent.attr('id') + ' .slothyxlistselecteditem'));
        };
        this.getElementByIndex = function (index) {
            return getRowByIndex(index).children();
        };
        this.getIndexOfId = function (id) {
            return uL.children().index($('#' + id));
        };
        this.selectIndex = function (index) {
            if (!selectable) return;
            var selectedIndex = this.getSelectedIndex();
            //Need index != -1  to stop playing video
            if (index != -1 && selectedIndex == index) {
                return;
            }
            if (selectedIndex != -1) {
                getRowByIndex(selectedIndex).removeClass("slothyxlistselecteditem");
            }

            if (index != -1) {
                getRowByIndex(index).addClass("slothyxlistselecteditem");
                if (onSelect) onSelect(this.getElementByIndex(index));
            } else {
                console.log("called onselect with null");
                if (onSelect) onSelect(null);
            }

        };
        this.selectId = function (id) {
            this.selectIndex(this.getIndexOfId(id));
        };
        this.selectNext = function () {
            var count = this.size();
            var selectedIndex = this.getSelectedIndex();
            this.selectIndex(selectedIndex + 1 >= count ? -1 : selectedIndex + 1);
        };
        this.addElement = function (params) {
            var row = createRow(params);
            uL.append(row);
            this.saveList();
        };
        this.removeElementById = function (id) {
            this.removeElementByIndex(this.getIndexOfId(id));
        };
        this.removeElementByIndex = function (index) {
            if (index == this.getSelectedIndex()) this.selectNext();
            paramsArray[getRowByIndex().attr('id)')] = null;
            getRowByIndex(index).remove();
            this.saveList();
        };
        this.clear = function () {
            uL.children().remove();
            setLocalStorage("");
            this.selectIndex(-1);
        };
        this.saveList = function () {
            if (persist) {
                setLocalStorage(this.getSaveString());
            }
        };
        this.getSaveString = function () {
            var rowId;
            var size = this.size();
            var saveObject = {entries: []};
            for (var i = 0; i < size; i++) {
                rowId = getRowByIndex(i).attr('id');
                rowId = rowId.substring(rowId.lastIndexOf("-") + 1);
                saveObject.entries[saveObject.entries.length] = paramsArray[rowId];
            }
            return JSON.stringify(saveObject);
        };
        this.loadList = function (loadString) {
            try {
                var loadObject = JSON.parse(loadString);
                for (var i = 0; i < loadObject.entries.length; i++) {
                    this.addElement(loadObject.entries[i]);
                }
            } catch (ignored) {

            }
        };
        this.getLoadString = function () {
            var loadString = getLocalStorage();
            loadString = loadString ? loadString : "";
            return loadString;
        };
        this.moveUpById = function (id) {
            this.moveUpByIndex(this.getIndexOfId(id));
        };
        this.moveUpByIndex = function (index) {
            if (index < 1 || index > this.size()) {
                return;
            }
            var row = getRowByIndex(index);
            var upperRow = getRowByIndex(index - 1);
            row.detach();
            upperRow.before(row);
            this.saveList();
        };
        this.moveDownById = function (id) {
            this.moveDownByIndex(this.getIndexOfId(id));
        };
        this.moveDownByIndex = function (index) {
            if (index < 0 || index + 1 >= this.size()) {
                return;
            }
            var row = getRowByIndex(index);
            var lowerRow = getRowByIndex(index + 1);
            row.detach();
            lowerRow.after(row);
            this.saveList();
        };

        //Init template
        template = parent.html().trim();
        parent.empty();

        //Init uL
        uL = $("<ul></ul>");
        uL.addClass("slothyxlist");
        parent.append(uL);

        //Try load playlist
        if (persist) {
            this.loadList(this.getLoadString());
        }

    };

    //Helper
    slothyx.list.sanitize = function (string) {
        var map = {};
        map["\\"] = "&#92;";
        map["\""] = "&#34;";
        map["'"] = "&#39;";
        map["<"] = "&#60;";
        map[">"] = "&#62;";
        //TODO create regex with loop (keys)

        return string.replace(/([\\"'<>])/g, function (match) {
            return "\\" + map[match];
        });
    };
});