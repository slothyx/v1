/*globals jQuery, window, _*/
(function($, window, _, undefined) {
	"use strict";
	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var util = slothyx.util = {};
	var ENTER_KEY_CODE = 13;
	var DATA_ATTRIBUTE = "enterevent";

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

	util.initTextFields = function(object) {
		//TODO make data-attribute parameter
		$('input[data-' + DATA_ATTRIBUTE + ']').each(function() {
			var self = $(this);
			self.on("keypress", function(event) {
				if(event.originalEvent.keyCode === ENTER_KEY_CODE) {
					object[self.data(DATA_ATTRIBUTE)]();
					return false;
				}
			});
		});
	};

	util.onStartUp = function(callback){
		$(callback);
	};

})(jQuery, window, _);