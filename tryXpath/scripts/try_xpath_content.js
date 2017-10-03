/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    const dummyItem = "";
    const dummyItems = [];

    var attributes = {
        "element": "data-tryxpath-element",
        "context": "data-tryxpath-context",
        "focused": "data-tryxpath-focused",
        "focusedAncestor": "data-tryxpath-focused-ancestor"
    };

    var classes = {
        "element": "tryxpath--element----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "context": "tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focused": "tryxpath--focused----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focusedAncestor": "tryxpath--focused-ancestor----f43c83f3-1920-4222-a721-0cc19c4ba9bf"
    };

    var prevMsg = null;
    var executionCount = 0;
    var savedClasses = [];
    var savedContextClass = null;
    var savedFocusedClass = null;
    var savedFocusedAncestorClasses = [];
    var contextItem = dummyItem;
    var currentItems = dummyItems;
    var focusedItem = dummyItem;
    var focusedAncestorItems = dummyItems;
    var cssInserted = false;

    function focusItem(item) {
        fu.removeAttrFromItem(attributes.focused, focusedItem);
        fu.removeAttrFromItems(attributes.focusedAncestor,
                               focusedAncestorItems);
        
        if (!item) {
            return;
        }

        if (fu.isElementItem(item)) {
            focusedItem = item;
        } else {
            focusedItem = fu.getParentElement(item);
        }

        focusedAncestorItems = fu.getAncestorElements(focusedItem);

        fu.setAttrToItem(attributes.focused, "true", focusedItem);
        fu.setIndexToItems(attributes.focusedAncestor, focusedAncestorItems);

        focusedItem.blur();
        focusedItem.focus();
        focusedItem.scrollIntoView();
    };

    function removeAttrs () {
        fu.removeAttrFromItems(attributes.focusedAncestor,
                               focusedAncestorItems);
        fu.removeAttrFromItem(attributes.focused, focusedItem);
        fu.removeAttrFromItems(attributes.element, currentItems);
        fu.removeAttrFromItem(attributes.context, contextItem);
    };

    function resetPrev() {
        removeAttrs();

        contextItem = dummyItem;
        currentItems = dummyItems;
        focusedItem = dummyItem;
        focusedAncestorItems = dummyItems;

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

        if (!cssInserted) {
            chrome.runtime.sendMessage({
                "event": "insertCss"
            });
        }

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

            fu.setAttrToItem(attributes.context, "true", contextItem);

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

        fu.setIndexToItems(attributes.element, currentItems);

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
        removeAttrs();
    };

    genericListener.listeners.setStyle = function () {
        removeAttrs();

        fu.setAttrToItem(attributes.context, "true", contextItem);
        fu.setIndexToItems(attributes.element, currentItems);
    };

    genericListener.listeners.finishInsertCss = function () {
        cssInserted = true;
    };


    chrome.runtime.sendMessage({ "event": "loadClasses" }, res => {
        classes = res;
    });

})(window);
