/*globals jQuery, window*/
(function($, window, undefined) {
	"use strict";

	var SLOTHYX_PERSIST_PREFIX = 'slothyx';

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var persist = slothyx.persist = {};

	var persister = (function() {
		var persister = {};
		persister.put = function(key, object) {
			var objects = getIntern();
			objects[key] = object;
			putIntern(objects);
		};

		persister.get = function(key) {
			return getIntern()[key];
		};

		function putIntern(objects) {
			window.localStorage.setItem(SLOTHYX_PERSIST_PREFIX, JSON.stringify(objects));
		}

		function getIntern() {
			try {
				return JSON.parse(window.localStorage.getItem(SLOTHYX_PERSIST_PREFIX)) || {};
			} catch(e) {
				window.localStorage.clear(SLOTHYX_PERSIST_PREFIX);
				slothyx.messages.addInfoMessage("Sorry, we could not parse your saved playlists :(");
			}
			return {};
		}

		return persister;
	})();

	persist.getPersister = function() {
		return persister;
	};

})(jQuery, window);