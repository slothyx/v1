/*globals jQuery, window, _*/
(function($, window, _, undefined) {
	"use strict";
	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var util = slothyx.util = {};

	util.Video = function(id, title, description, image) {
		var self = this;
		self.id = id;
		self.title = title;
		self.description = description;
		self.image = image;
	};

	util.EventHelper = function() {
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
	};

})(jQuery, window, _);