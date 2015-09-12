/*globals window, ko*/
(function(window, undefined) {
	"use strict";

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var messages = slothyx.messages = {};

	var messagesModel = {
		messages: ko.observableArray()
	};

	slothyx.knockout.getModel().contribute({
		messages: messagesModel
	});

	messages.addInfoMessage = function(message) {
		var messageObject = {
			message: message,
			remove: function() {
				messagesModel.messages.remove(messageObject);
			}
		};
		messagesModel.messages.push(messageObject);
	};

	//TODO remove debug messages
	//messages.addInfoMessage("HI, TEST");
	//messages.addInfoMessage("OH NOES SOMETHING IS WRONG!");
	//messages.addInfoMessage("Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.");

})
(window);