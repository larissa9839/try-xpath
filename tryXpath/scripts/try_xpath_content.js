
(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var context = null;
    var curResults = [];

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.execute = function(message, sender) {
        var sendMsg = Object.create(null);
        sendMsg.event = "showResultsInPopup";

        var res;
        if (message.context) {
            try {
                res = fu.execExpr(message.context.expression, message.context.method, {
                    "resultType": message.context.resultType,
                    "resolver": message.context.resolver
                });
                if (res.items.length >= 1) {
                    res.items[0].classList.add("tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf");
                    sendMsg.message = "The context is found.";
                } else {
                    sendMsg.message = "Any context is not found.";
                }
            } catch (e) {
                sendMsg.message = "An error occurred when getting a context. "
                    + e.message;
            }
            chrome.runtime.sendMessage(sendMsg);
        }
    }

})(window);
