
(function (window, undefined) {
    "use strict";

    var popupState = null;
    var results = {};

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

})(window);
