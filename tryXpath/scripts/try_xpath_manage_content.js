/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    var contentState = {
        "isScriptExecuted": false
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);
    browser.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.loadContentState = function (message, sender,
                                                           sendResponse) {
        sendResponse(contentState);
        return true;
    };

    genericListener.listeners.finishScriptExecuteAll = function () {
        contentState.isScriptExecuted = true;
    };

})(window);
