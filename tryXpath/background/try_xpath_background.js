
(function (window, undefined) {
    "use strict";

    var popupState = null;
    var results = {};
    var css = "";
    var classes = {
        "element": "tryxpath--element----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "context": "tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focused": "tryxpath--focused----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focusedAncestor": "tryxpath--focused-ancestor----f43c83f3-1920-4222-a721-0cc19c4ba9bf"
    };

    function loadDefaultCss(callback) {
        var req = new XMLHttpRequest();
        req.open("GET", chrome.runtime.getURL("/css/try_xpath_insert.css"));
        req.responseType = "text";
        req.onreadystatechange = function () {
            if (req.readyState === XMLHttpRequest.DONE) {
                callback(req.responseText);
            }
        };
        req.send();
    };

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

    genericListener.listeners.loadClasses = function (message, sender,
                                                      sendResponse) {
        sendResponse(classes);
        return true;
    };

    genericListener.listeners.loadOptions = function (message, sender,
                                                      sendResponse) {
        sendResponse({ "classes": classes, "css": css });
        return true;
    };

    chrome.storage.onChanged.addListener(changes => {
        if (changes.classes && changes.classes.newValue) {
            classes = changes.classes.newValue;
        }
        if (changes.css && changes.css.newValue) {
            css = changes.css.newValue;
        }
    });


    chrome.storage.sync.get({ "classes": classes, "css": null }, items => {
        classes = items.classes;
        if (items.css !== null) {
            css = items.css;
        } else {
            loadDefaultCss(text => {
                css = text;
            });
        }
    });

})(window);
