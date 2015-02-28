/*globals jQuery, window, _*/
(function($, window, _, undefined) {
	"use strict";
	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var util = slothyx.util = {};
	var DEFAULT_INTERVAL = 500; //half a second

	util.KEYS = {
		ENTER: 13,
		SPACE: 32,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40
	};

	util.Video = function(id, title, description, image) {
		var self = this;
		self.id = id;
		self.title = title;
		self.description = description;
		self.image = image;
	};

	util.EventHelper = function(object, addListenerName, removeListenerName) {

		if(addListenerName !== undefined && removeListenerName === undefined) {
			removeListenerName = "remove" + addListenerName + "Listener";
			addListenerName = "add" + addListenerName + "Listener";
		}

		var self = this;
		var listener = [];

		self.addListener = function(callback) {
			listener.push(callback);
		};

		self.removeListener = function(callback) {
			_.remove(listener, function(value) {
				return value === callback;
			});
		};

		self.throwEvent = function(event) {
			_.forEach(listener, function(callback) {
				callback(event);
			});
		};
		if(object !== undefined) {
			object[addListenerName || "addListener"] = self.addListener;
			object[removeListenerName || "removeListener"] = self.removeListener;
		}
	};

	util.onStartUp = function(callback) {
		$(callback);
	};

	util.doWhenTrue = function(callback, predicateCallback, time) {
		if(time === undefined) {
			time = DEFAULT_INTERVAL;
		}

		if(predicateCallback()) {
			callback();
		} else {
			setTimeout(function() {
				util.doWhenTrue(callback, predicateCallback, time);
			}, time);
		}
	};

	util.toArray = function(object) {
		var array = [];
		_.forEach(object, function(item) {
			array.push(item);
		});
		return array;
	};

	if($.widget) {

		$.widget("slothyx.options", {

			options: {
				items: [],
				rootClass: "options",
				paneClass: "optionsPane",
				entryClass: "optionsEntry",
				rootContent: "<i class='glyphicon glyphicon-cog'></i>"
			},

			_create: function() {
				this._state = {
					open: false,
					itemsPane: undefined
				};
				var element = $(this.element);
				element.addClass(this.options.rootClass);
				element.html(this.options.rootContent);
				this._createPane();
				var clickHandler = this._clickHandler.bind(this);
				var focusHandler = this._close.bind(this);
				element.on("click", clickHandler);
				$(document).on("click", focusHandler);
			},

			_createPane: function() {
				var itemsPane = this._state.itemsPane = $("<div style='display: none'/>");
				itemsPane.addClass(this.options.paneClass);
				var createEntry = this._createEntry.bind(this);
				_.forEach(this.options.items, function(item) {
					itemsPane.append(createEntry(item));
				});
				this.element.append(itemsPane);
			},

			_open: function() {
				this._state.itemsPane.css("display", "block");
				this._state.itemsPane.focus();
				this._state.open = true;
			},

			_close: function() {
				if(this._state.itemsPane !== undefined) {
					this._state.itemsPane.css("display", "none");
				}
				this._state.open = false;
			},

			_clickHandler: function() {
				if(this._state.open) {
					this._close();
				} else {
					this._open();
				}

				return false;
			},

			_createEntry: function(item) {
				var entry = $("<span />");
				if(item.action === undefined) {
					item.action = function() {
						return false;
					};
				}
				entry.on("click", item.action);
				entry.html(item.content);
				entry.addClass(this.options.entryClass);
				return entry;
			}
		});
	}

	$.fn.onKey = function(key, callback) {
		$(this).on("keydown", function(event) {
			if(event.which === key) {
				return callback(event) || false;
			}
		});
	};

	util.openTextBox = function(text) {
		var dialog = $(
			"<div class='dialog'>" +
			"<textarea>" + text + "</textarea>" +
			"</div>");
		var textArea = dialog.find("textarea");
		var closeFunction = function() {
			setTimeout(function() {
				dialog.remove();
			}, 0);
			return true;
		};
		dialog.on("keypress", closeFunction);
		textArea.on("focusout", closeFunction);


		$(window.document.body).prepend(dialog);
		textArea.select();
	};

	util.registerShortcuts = function(shortcuts) {
		var keys = _.pluck(shortcuts, "key");
		var actionMap = _.reduce(shortcuts, function(actionMap, shortcut) {
				actionMap[shortcut.key] = shortcut.action;
				return actionMap;
			}, {}
		);
		$(document).on("keydown", function(event) {
			if(_.indexOf(keys, event.which) !== -1 && event.originalEvent.getModifierState("Accel")) {
				actionMap[event.which]();
			}
		});
	};

})
(jQuery, window, _);