/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var popupState = null;
    var popupCss = "body{width:367px;height:auto;}";
    var results = {};
    var css = "";
    var attributes = {
        "element": "data-tryxpath-element",
        "context": "data-tryxpath-context",
        "focused": "data-tryxpath-focused",
        "focusedAncestor": "data-tryxpath-focused-ancestor",
        "frame": "data-tryxpath-frame",
        "frameAncestor": "data-tryxpath-frame-ancestor"
    };

    function loadDefaultCss() {
        return new Promise((resolve, reject) => {
            var req = new XMLHttpRequest();
            req.open("GET",
                     browser.runtime.getURL("/css/try_xpath_insert.css"));
            req.responseType = "text";
            req.onreadystatechange = function () {
                if (req.readyState === XMLHttpRequest.DONE) {
                    resolve(req.responseText);
                }
            };
            req.send();
        });
    }

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);
    browser.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.storePopupState = function (message) {
        popupState = message.state;
    }

    genericListener.listeners.requestRestorePopupState = function (message) {
        browser.runtime.sendMessage({
            "event": "restorePopupState",
            "state": popupState
        });
    };

    genericListener.listeners.requestInsertStyleToPopup = function () {
        browser.runtime.sendMessage({
            "event": "insertStyleToPopup",
            "css": popupCss
        });
    };

    genericListener.listeners.showAllResults = function(message, sender) {
        delete message.event;
        results = message;
        results.tabId = sender.tab.id;
        results.frameId = sender.frameId;
        browser.tabs.create({ "url": "/pages/show_all_results.html" });
    };

    genericListener.listeners.loadResults = function (message, sender,
                                                      sendResponse) {
        sendResponse(results);
        return true;
    };

    genericListener.listeners.updateCss = function (message, sender) {
        var id = sender.tab.id;
        var frameId = sender.frameId;

        for (let removeCss in message.expiredCssSet) {
            browser.tabs.removeCSS(id, {
                "code": removeCss,
                "frameId": frameId
            }).then(() => {
                return browser.tabs.sendMessage(id, {
                    "event": "finishRemoveCss",
                    "css": removeCss
                }, {
                    "frameId": frameId
                });
            }).catch(fu.onError);
        }

        browser.tabs.insertCSS(id, {
            "code":css,
            "cssOrigin": "author",
            "frameId": frameId
        }).then(() => {
            return browser.tabs.sendMessage(id, {
                "event": "finishInsertCss",
                "css": css
            }, {
                "frameId": frameId
            });
        }).catch(fu.onError);
    };

    genericListener.listeners.loadOptions = function (message, sender,
                                                      sendResponse) {
        sendResponse({ "attributes": attributes, "css": css });
        return true;
    };

    genericListener.listeners.requestSetContentInfo = function (message,
                                                                sender) {
        browser.tabs.sendMessage(sender.tab.id, {
            "event": "setContentInfo",
            "attributes": attributes
        }, {
            "frameId": sender.frameId
        });
    };

    browser.storage.onChanged.addListener(changes => {
        if (changes.attributes && ("newValue" in changes.attributes)) {
            attributes = changes.attributes.newValue;
        }
        if (changes.css && ("newValue" in changes.css)) {
            css = changes.css.newValue;
        }
    });


    browser.storage.sync.get({
        "attributes": attributes,
        "css": null
    }).then(items => {
        attributes = items.attributes;
        if (items.css !== null) {
            return items.css;
        } else {
            return loadDefaultCss();
        }
    }).then(loadedCss => {
        css = loadedCss;
    }).catch(fu.onError);

})(window);
