
(function (window, undefined) {
    "use strict";

    var popupState = null;
    var results = {};
    var css = "";

    (function loadCss() {
        var req = new XMLHttpRequest();
        req.open("GET", chrome.runtime.getURL("/css/try_xpath_insert.css"));
        req.responseType = "text";
        req.onreadystatechange = function () {
            if (req.readyState === XMLHttpRequest.DONE) {
                css = req.responseText;
            }
        };
        req.send();
    })();

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.storePopupState = function (message) {
        popupState = message.state;
    }

    genericListener.listeners.requestRestorePopupState = function (message) {
        if (popupState) {
            chrome.runtime.sendMessage({
                "event": "restorePopupState",
                "state": popupState
            });
        }
    }

    genericListener.listeners.showAllResults = function(message, sender) {
        delete message.event;
        results = message;
        results.tabId = sender.tab.id;
        chrome.tabs.create({ "url": "/pages/show_all_results.html" });
    };

    genericListener.listeners.loadResults = function (message, sender,
                                                      sendResponse) {
        sendResponse(results);
        return true;
    };

    genericListener.listeners.insertCss = function (message, sender) {
        var id = sender.tab.id;
        chrome.tabs.insertCSS(id, { "code": css }, function () {
            if (chrome.runtime.lastError === null) {
                chrome.tabs.sendMessage(id, { "event": "finishInsertCss" });
            };
        });
    };

})(window);
