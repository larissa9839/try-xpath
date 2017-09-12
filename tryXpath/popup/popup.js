
(function (window) {
    "use strict";

    var document = window.document;

    var mainWay, mainExpression, contextCheckbox, contextWay,
        contextExpression;

    function sendToActiveTab(msg) {
        chrome.tabs.query({ "active": true, "currentWindow": true },
                          function (tabs) {
                              chrome.tabs.sendMessage(tabs[0].id, msg);
                          });
    };

    function makeExecuteMessage() {
        var msg = Object.create(null);
        msg.event = "execute";

        var way = mainWay.selectedOptions[0];
        msg.main = Object.create(null);
        msg.main.expression = mainExpression.value;
        msg.main.method = way.getAttribute("data-method");
        msg.main.resultType = way.getAttribute("data-type");
        msg.main.resolver = getResolver();

        if (contextCheckbox.checked) {
            let way = contextWay.selectedOptions[0];
            msg.context = Object.create(null);
            msg.context.expression = contextExpression.value;
            msg.context.method = way.getAttribute("data-method");
            msg.context.resultType = way.getAttribute("data-type");
            msg.context.resolver = getResolver();
        }

        return msg;
    };

    function getResolver() {
        return null;
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);;
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.showResultsInPopup = function (message, sender) {
        message.tabId = sender.tab.id;
        result.value = JSON.stringify(message, null, 2);
        return ;
    };

    genericListener.listeners.restorePopupState = function (message) {
        area.value = message.state.area;
    };

    window.addEventListener("load", function () {
        mainWay = document.getElementById("main-way");
        mainExpression = document.getElementById("main-expression");
        contextCheckbox = document.getElementById("context");
        contextWay = document.getElementById("context-way");
        contextExpression = document.getElementById("context-expression");

        document.getElementById("execute")
            .addEventListener("click", function() {
                sendToActiveTab(makeExecuteMessage());
            });

        sendToActiveTab({ "event": "requestShowResultsInPopup" });
        chrome.runtime.sendMessage({ "event": "requestRestorePopupState" });
    });

    window.addEventListener("load", function () {
        var area = document.getElementById("area");
        var result = document.getElementById("result");


        // クリックされたらメッセージを発する
        document.getElementById("send").addEventListener("click", function() {
            try {
                var msg = JSON.parse(area.value);
            } catch (e) {
                result.value = e.message;
            }
            sendToActiveTab(msg);
        });
        document.getElementById("send-to-all").addEventListener("click", function() {
            try {
                var msg = JSON.parse(area.value);
            } catch (e) {
                result.value = e.message;
            }
            chrome.runtime.sendMessage(msg);
        });

    });

    window.addEventListener("unload", function () {
        chrome.runtime.sendMessage({
            "event": "storePopupState",
            "state": {
                "area": area.value
            }
        });
    });

})(window);
