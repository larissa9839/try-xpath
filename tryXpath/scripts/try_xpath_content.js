
(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    const elemClass
          = "tryxpath--element----f43c83f3-1920-4222-a721-0cc19c4ba9bf";
    const contextClass
          = "tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf";
    const focusedClass
          = "tryxpath--focused----f43c83f3-1920-4222-a721-0cc19c4ba9bf";

    const dummyItemDetail = { "type": "", "name": "", "value": "" };

    var prevMsg;
    var savedClasses = [];
    var savedContextClass = null;
    var savedFocusedClass = null;
    var currentItems = [];

    function resetPrev() {
        currentItems = [];
        fu.restoreItemClasses(savedClasses);
        fu.restoreItemClass(savedContextClass);
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.execute = function(message, sender) {
        resetPrev();

        var sendMsg = Object.create(null);
        var main = message.main;
        sendMsg.event = "showResultsInPopup";
        sendMsg.href = window.location.href;
        sendMsg.title = window.document.title;
        sendMsg.main = Object.create(null);
        sendMsg.main.specifiedResultType = main.resultType;
        sendMsg.main.expression = main.expression;
        sendMsg.main.method = main.method;
        sendMsg.main.resolver = main.resolver;
        sendMsg.main.itemDetails = [];

        var contItem = document;

        var contRes;
        if (message.context) {
            let cont = message.context;
            sendMsg.context = Object.create(null);
            sendMsg.context.specifiedResultType = cont.resultType;
            sendMsg.context.expression = cont.expression;
            sendMsg.context.method = cont.method;
            sendMsg.context.resolver = cont.resolver;
            sendMsg.context.itemDetail = dummyItemDetail;
            try {
                contRes = fu.execExpr(cont.expression, cont.method, {
                    "resultType": cont.resultType,
                    "resolver": cont.resolver
                });
            } catch (e) {
                sendMsg.message = "An error occurred when getting a context. "
                    + e.message;
                chrome.runtime.sendMessage(sendMsg);
                prevMsg = sendMsg;
                return;
            }

            if (contRes.items.length === 0) {
                sendMsg.message = "A context is not found."
                chrome.runtime.sendMessage(sendMsg);
                prevMsg = sendMsg;
                return;
            }
            contItem = contRes.items[0];
            sendMsg.context.itemDetail = fu.getItemDetail(contItem);
        }

        var mainRes;
        try {
            mainRes = fu.execExpr(main.expression, main.method, {
                "context": contItem,
                "resultType": main.resultType,
                "resolver": main.resolver
            });
        } catch (e) {
            sendMsg.message = "An error occurred when getting nodes. "
                + e.message;
            chrome.runtime.sendMessage(sendMsg);
            prevMsg = sendMsg;
            return;
        }

        currentItems = mainRes.items;
        savedContextClass = fu.saveItemClass(contItem);
        fu.addClassToItem(contextClass, contItem);
        savedClasses = fu.saveItemClasses(currentItems);
        fu.addClassToItems(elemClass, currentItems);

        sendMsg.message = "success";
        // sendMsg.main.itemDetails is needed.
        chrome.runtime.sendMessage(sendMsg);
    }

})(window);
