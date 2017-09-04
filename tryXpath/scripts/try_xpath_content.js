
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
    genericListener.listeners = {};

    genericListener.listeners.execute = function(message, sender) {
        var sendMsg = {};
        sendMsg.contextExpr = message.contextExpr;
        sendMsg.contextExprWay = message.contextExprWay;
        sendMsg.expr = message.expr;
        sendMsg.exprWay = message.exprWay;
        sendMsg.exprResultType = message.exprResultType;
        sendMsg.resolvingDict = message.resolvingDict;

        sendMsg.url = window.location.href;
        sendMsg.title = window.document.title;

        var resolver = null;
        if (sendMsg.contextExprWay === "XPath"
            || sendMsg.exprWay === "XPath") {
            if (!fu.isValidResolver(sendMsg.resolvingDict)) {
                sendMsg.success = false;
                sendMsg.message = "Invalid resolver. "
                    + JSON.stringify(sendMsg.resolvingDict, null, 2);
                sendMsg.context = null;
                sendMsg.results = [];
                sendMsg.event = "showResultsInPopup";
                chrome.runtime.sendMessage(sendMsg);
                return ;
            }
            resolver = fu.makeResolver(sendMsg.resolvingDict);
        }

    }

    chrome.runtime.onMessage.addListener(genericListener);

})(window);
