
(function (window, undefined) {
    "use strict";

    var popupState = null;

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

    genericListener.listeners.focusItemInTab = function(message) {
        chrome.tabs.sendMessage(message.tabId, {
            "event": "focusItem",
            "index": message.index
        });
    };

})(window);
