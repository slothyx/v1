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

	//INIT knockout
	modelWrapper.contribute({util: {
		keys: {
			ENTER: 13,
			SPACE: 32
		}
	}});

	ko.bindingHandlers.optionsWheel = {
		init: function(element, valueAccessor) {
			$(element).options(valueAccessor());
		}
	};

	ko.bindingHandlers.onKey = {
		init: function(element, valueAccessor) {
			var options = valueAccessor();
			$(element).onKey(options.key, options.action);
		}
	};

	ko.bindingHandlers.slider = {
		init: function(element, valueAccessor) {
			$(element).slider(valueAccessor());
		}
	};

})(jQuery, window, ko);