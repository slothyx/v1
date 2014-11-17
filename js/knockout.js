/*globals jQuery, window, ko*/
(function($, window, ko, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var knockout = slothyx.knockout = {};

	var modelWrapper = (function() {
		var model = knockout.model = {};
		slothyx.util.onStartUp(function() {
			ko.applyBindings(model);
		});

		var wrapper = {};

		wrapper.contribute = function(object) {
			contribute(model, object);
		};

		function contribute(model, object) {
			_.forEach(object, function(item, name) {
				if(model[name] === undefined) {
					model[name] = item;
				} else {
					contribute(model[name], item);
				}
			});
		}

		return wrapper;
	})();

	knockout.getModel = function() {
		return modelWrapper;
	};

})(jQuery, window, ko);