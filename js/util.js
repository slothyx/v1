/*globals jQuery, window, _*/
(function($, window, _, undefined) {
	"use strict";
	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var util = slothyx.util = {};
	var DATA_ATTRIBUTE = "enterevent";
	var DEFAULT_INTERVAL = 500; //half a second

	util.Video = function(id, title, description, image) {
		var self = this;
		self.id = id;
		self.title = title;
		self.description = description;
		self.image = image;
	};

	util.EventHelper = function(object, addListenerName, removeListenerName) {
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

	util.Command = function(command, params) {
		this.command = command;
		this.params = params;
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

			_state: {
				open: false
			},

			_create: function() {
				var element = $(this.element);
				element.addClass(this.options.rootClass);
				element.html(this.options.rootContent);
				var clickHandler = this._clickHandler.bind(this);
				var focusHandler = this._close.bind(this);
				element.on("click", clickHandler);
				$(document).on("click", focusHandler);
			},

			_close: function() {
				$(this.element).find("." + this.options.paneClass).remove();
				this._state.open = false;
			},

			_open: function() {
				var itemsPane = $("<div />");
				itemsPane.addClass(this.options.paneClass);
				var createEntry = this._createEntry.bind(this);
				_.forEach(this.options.items, function(item) {
					itemsPane.append(createEntry(item));
				});
				this.element.append(itemsPane);
				itemsPane.focus();
				this._state.open = true;
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
				entry.on("click", item.action);
				entry.html(item.content);
				entry.addClass(this.options.entryClass);
				return entry;
			}
		});
	}

	$.fn.onKey = function(key, callback) {
		$(this).on("keypress", function(event) {
			if(event.which === key) {
				return callback(event) || false;
			}
		});
	};

})(jQuery, window, _);