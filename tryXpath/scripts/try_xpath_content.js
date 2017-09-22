
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
    const focusedAncestorClass
       = "tryxpath--focused-ancestor----f43c83f3-1920-4222-a721-0cc19c4ba9bf";

    var prevMsg = null;
    var executionCount = 0;
    var savedClasses = [];
    var savedContextClass = null;
    var savedFocusedClass = null;
    var savedFocusedAncestorClasses = [];
    var contextItem = null;
    var currentItems = [];

    function focusItem(item) {
        fu.restoreItemClasses(savedFocusedAncestorClasses);
        savedFocusedAncestorClasses = [];
        fu.restoreItemClass(savedFocusedClass);
        savedFocusedClass = null;
        
        if (!item) {
            return;
        }

        var elem;
        if (fu.isElementItem(item)) {
            elem = item;
        } else {
            elem = fu.getParentElement(item);
        }

        var ancestors = fu.getAncestorElements(elem);

        savedFocusedClass = fu.saveItemClass(elem);
        fu.addClassToItem(focusedClass, elem);
        savedFocusedAncestorClasses = fu.saveItemClasses(ancestors);
        fu.addClassToItems(focusedAncestorClass, ancestors);

        elem.blur();
        elem.focus();
        elem.scrollIntoView();
    };

    function restoreAllClass() {
        fu.restoreItemClasses(savedFocusedAncestorClasses);
        savedFocusedAncestorClasses = [];
        fu.restoreItemClass(savedFocusedClass);
        savedFocusedClass = null;
        fu.restoreItemClasses(savedClasses);
        savedClasses = [];
        fu.restoreItemClass(savedContextClass);
        savedContextClass = null;
    };

    function resetPrev() {
        restoreAllClass();

        contextItem = null;
        currentItems = [];

        prevMsg = null;
        executionCount++;
    };

    function makeTypeStr(resultType) {
        if ((typeof(resultType) === "number")
            && (resultType === resultType)) {
            return fu.getXpathResultStr(resultType) + "(" + resultType + ")";
        }
        return "";
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

        chrome.runtime.sendMessage({
            "event": "insertCss"
        });

        var sendMsg = Object.create(null);
        var main = message.main;
        sendMsg.event = "showResultsInPopup";
        sendMsg.executionId = executionCount;
        sendMsg.href = window.location.href;
        sendMsg.title = window.document.title;

        var mainType = fu.getXpathResultNum(main.resultType);
        sendMsg.main = Object.create(null);
        sendMsg.main.method = main.method;
        sendMsg.main.expression = main.expression;
        sendMsg.main.specifiedResultType = makeTypeStr(mainType);
        sendMsg.main.resultType = "";
        sendMsg.main.resolver = main.resolver;
        sendMsg.main.itemDetails = [];

        contextItem = document;

        if (message.context) {
            let cont = message.context;
            let contType = fu.getXpathResultNum(cont.resultType);
            sendMsg.context = Object.create(null);
            sendMsg.context.method = cont.method;
            sendMsg.context.expression = cont.expression;
            sendMsg.context.specifiedResultType = makeTypeStr(contType);
            sendMsg.context.resolver = cont.resolver;
            sendMsg.context.itemDetail = null;

            let contRes;
            try {
                contRes = fu.execExpr(cont.expression, cont.method, {
                    "resultType": contType,
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
                sendMsg.message = "A context is not found.";
                chrome.runtime.sendMessage(sendMsg);
                prevMsg = sendMsg;
                return;
            }
            contextItem = contRes.items[0];

            savedContextClass = fu.saveItemClass(contextItem);
            fu.addClassToItem(contextClass, contextItem);

            sendMsg.context.resultType = makeTypeStr(contRes.resultType);
            sendMsg.context.itemDetail = fu.getItemDetail(contextItem);
        }

        var mainRes;
        try {
            mainRes = fu.execExpr(main.expression, main.method, {
                "context": contextItem,
                "resultType": mainType,
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

        savedClasses = fu.saveItemClasses(currentItems);
        fu.addClassToItems(elemClass, currentItems);

        sendMsg.message = "Success.";
        sendMsg.main.resultType = makeTypeStr(mainRes.resultType);
        sendMsg.main.itemDetails = fu.getItemDetails(currentItems);
        chrome.runtime.sendMessage(sendMsg);
        prevMsg = sendMsg;
        return;
    }

    genericListener.listeners.focusItem = function(message) {
        if (message.executionId === executionCount) {
            focusItem(currentItems[message.index]);
        }
    };

    genericListener.listeners.focusContextItem = function(message) {
        if (message.executionId === executionCount) {
            focusItem(contextItem);
        }
    };

    genericListener.listeners.requestShowResultsInPopup = function () {
        if (prevMsg) {
            prevMsg.event = "showResultsInPopup";
            chrome.runtime.sendMessage(prevMsg);
        }
    };

    genericListener.listeners.requestShowAllResults = function () {
        if (prevMsg) {
            prevMsg.event = "showAllResults";
            chrome.runtime.sendMessage(prevMsg);
        }
    }

    genericListener.listeners.resetStyle = function () {
        restoreAllClass();
    };

    genericListener.listeners.setStyle = function () {
        restoreAllClass();        

        savedContextClass = fu.saveItemClass(contextItem);
        fu.addClassToItem(contextClass, contextItem);
        savedClasses = fu.saveItemClasses(currentItems);
        fu.addClassToItems(elemClass, currentItems);
    };

})(window);
