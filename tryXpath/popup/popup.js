
(function (window) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    var mainWay, mainExpression, contextCheckbox, contextWay,
        contextExpression, resolverCheckbox, resolverExpression,
        resultsMessage, resultsTbody, resultsCount;

    var relatedTabId, executionId;

    function sendToActiveTab(msg) {
        chrome.tabs.query({ "active": true, "currentWindow": true },
                          function (tabs) {
                              chrome.tabs.sendMessage(tabs[0].id, msg);
                          });
    };

    function collectPopupState() {
        var state = Object.create(null);
        state.mainWayIndex = mainWay.selectedIndex;
        state.mainExpressionValue = mainExpression.value;
        state.contextCheckboxChecked = contextCheckbox.checked;
        state.contextWayIndex = contextWay.selectedIndex;
        state.contextExpressionValue = contextExpression.value;
        state.resolverCheckboxChecked = resolverCheckbox.checked;
        state.resolverExpressionValue = resolverExpression.value;
        return state;
    };

    function makeExecuteMessage() {
        var msg = Object.create(null);
        msg.event = "execute";

        var resol;
        if (resolverCheckbox.checked) {
            resol = resolverExpression.value;
        } else {
            resol = null;
        }

        var way = mainWay.selectedOptions[0];
        msg.main = Object.create(null);
        msg.main.expression = mainExpression.value;
        msg.main.method = way.getAttribute("data-method");
        msg.main.resultType = way.getAttribute("data-type");
        msg.main.resolver = resol;

        if (contextCheckbox.checked) {
            let way = contextWay.selectedOptions[0];
            msg.context = Object.create(null);
            msg.context.expression = contextExpression.value;
            msg.context.method = way.getAttribute("data-method");
            msg.context.resultType = way.getAttribute("data-type");
            msg.context.resolver = resol;
        }

        return msg;
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);;
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.showResultsInPopup = function (message, sender){
        relatedTabId = sender.tab.id;
        executionId = message.executionId;

        resultsMessage.textContent = message.message;
        resultsCount.textContent = message.main.itemDetails.length;
        fu.emptyChildNodes(resultsTbody);
        fu.appendDetailRows(resultsTbody,
                            message.main.itemDetails.slice(0, 10));
    };

    genericListener.listeners.restorePopupState = function (message) {
        var state = message.state;
        mainWay.selectedIndex = state.mainWayIndex;
        mainExpression.value = state.mainExpressionValue;
        contextCheckbox.checked = state.contextCheckboxChecked;
        contextWay.selectedIndex = state.contextWayIndex;
        contextExpression.value = state.contextExpressionValue;
        resolverCheckbox.checked = state.resolverCheckboxChecked;
        resolverExpression.value = state.resolverExpressionValue;
    };

    window.addEventListener("load", function () {
        mainWay = document.getElementById("main-way");
        mainExpression = document.getElementById("main-expression");
        contextCheckbox = document.getElementById("context-switch");
        contextWay = document.getElementById("context-way");
        contextExpression = document.getElementById("context-expression");
        resolverCheckbox = document.getElementById("resolver-switch");
        resolverExpression = document.getElementById("resolver-expression");
        resultsMessage = document.getElementById("results-message");
        resultsCount = document.getElementById("results-count");
        resultsTbody = document.getElementById("results-detals")
            .getElementsByTagName("tbody")[0];

        document.getElementById("execute")
            .addEventListener("click", function() {
                sendToActiveTab(makeExecuteMessage());
            });

        document.getElementById("set-style")
            .addEventListener("click", function() {
                sendToActiveTab({ "event": "setStyle" });
            });

        document.getElementById("reset-style")
            .addEventListener("click", function() {
                sendToActiveTab({ "event": "resetStyle" });
            });

        document.getElementById("show-all-results")
            .addEventListener("click", function() {
                sendToActiveTab({ "event": "requestShowAllResults" });
            });

        resultsTbody.addEventListener("click", function(event) {
            var target = event.target;
            if (target.tagName.toLowerCase() === "button") {
                let ind = parseInt(target.getAttribute("data-index"), 10);
                chrome.tabs.sendMessage(relatedTabId, {
                    "event": "focusItem",
                    "executionId": executionId,
                    "index": ind
                });
            }
        });

        resultsTbody.appendChild(fu.createDetailTableHeader());

        sendToActiveTab({ "event": "requestShowResultsInPopup" });
        chrome.runtime.sendMessage({ "event": "requestRestorePopupState" });
    });

    window.addEventListener("unload", function () {
        var state = collectPopupState();
        chrome.runtime.sendMessage({
            "event": "storePopupState",
            "state": state
        });
    });

})(window);
