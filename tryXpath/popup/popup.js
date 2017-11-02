/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    const noneClass = "none";

    var mainWay, mainExpression, contextCheckbox, contextHeader, contextBody,
        contextWay, contextExpression, resolverHeader, resolverBody,
        resolverCheckbox, resolverExpression, frameHeader, frameCheckbox,
        frameBody, frameExpression, resultsMessage, resultsTbody,
        contextTbody, resultsCount, detailsPageCount;

    var relatedTabId, executionId;
    var resultedDetails = [];
    const detailsPageSize = 50;
    var detailsPageIndex = 0;

    function sendToActiveTab(msg) {
        browser.tabs.query({
            "active": true,
            "currentWindow": true
        }).then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, msg);
        }).catch(fu.onError);
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
        state.frameCheckboxChecked = frameCheckbox.checked;
        state.frameExpressionValue = frameExpression.value;
        return state;
    };

    function changeContextVisible () {
        if (contextCheckbox.checked) {
            contextBody.classList.remove(noneClass);
        } else {
            contextBody.classList.add(noneClass);
        }
    };

    function changeResolverVisible () {
        if (resolverCheckbox.checked) {
            resolverBody.classList.remove(noneClass);
        } else {
            resolverBody.classList.add(noneClass);
        }
    };

    function changeFrameVisible () {
        if (frameCheckbox.checked) {
            frameBody.classList.remove(noneClass);
        } else {
            frameBody.classList.add(noneClass);
        }
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

        if (frameCheckbox.checked) {
            msg.frameDesignation = frameExpression.value;
        }

        return msg;
    };

    function sendExecute() {
        sendToActiveTab(makeExecuteMessage());        
    };

    function handleExprEnter (event) {
        if ((event.key === "Enter") && !event.shiftKey) {
            event.preventDefault();
            sendExecute();
        }
    };

    function showDetailsPage(index) {
        var max = Math.floor(resultedDetails.length / detailsPageSize);

        if (!Number.isFinite(index)) {
            index = 0;
        }
        index = Math.max(0, index);
        index = Math.min(index, max);

        var scrollY = window.scrollY;
        var scrollX = window.scrollX;

        fu.updateDetailsTable(resultsTbody, resultedDetails, {
            "begin": index * detailsPageSize,
            "end": (index * detailsPageSize) + detailsPageSize,
        }).then(() => {
            detailsPageCount.value = (index + 1);
            detailsPageIndex = index;
            window.scrollTo(scrollX, scrollY);
        });
    };

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);;
    browser.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.showResultsInPopup = function (message, sender){
        relatedTabId = sender.tab.id;
        executionId = message.executionId;

        resultsMessage.textContent = message.message;
        resultedDetails = message.main.itemDetails;
        resultsCount.textContent = resultedDetails.length;

        fu.updateDetailsTable(contextTbody, [message.context.itemDetail]);

        showDetailsPage(0);
    };

    genericListener.listeners.restorePopupState = function (message) {
        var state = message.state;

        if (state !== null) {
            mainWay.selectedIndex = state.mainWayIndex;
            mainExpression.value = state.mainExpressionValue;
            contextCheckbox.checked = state.contextCheckboxChecked;
            contextWay.selectedIndex = state.contextWayIndex;
            contextExpression.value = state.contextExpressionValue;
            resolverCheckbox.checked = state.resolverCheckboxChecked;
            resolverExpression.value = state.resolverExpressionValue;
            frameCheckbox.checked = state.frameCheckboxChecked;
            frameExpression.value = state.frameExpressionValue;
        }

        changeContextVisible();
        changeResolverVisible();
        changeFrameVisible();
    };

    window.addEventListener("load", () => {
        mainWay = document.getElementById("main-way");
        mainExpression = document.getElementById("main-expression");
        contextHeader = document.getElementById("context-header");
        contextCheckbox = document.getElementById("context-switch");
        contextBody = document.getElementById("context-body");
        contextWay = document.getElementById("context-way");
        contextExpression = document.getElementById("context-expression");
        resolverHeader = document.getElementById("resolver-header");
        resolverCheckbox = document.getElementById("resolver-switch");
        resolverBody = document.getElementById("resolver-body");
        resolverExpression = document.getElementById("resolver-expression");
        frameHeader = document.getElementById("frame-header");
        frameCheckbox = document.getElementById("frame-switch");
        frameBody = document.getElementById("frame-body");
        frameExpression = document.getElementById("frame-expression");
        resultsMessage = document.getElementById("results-message");
        resultsCount = document.getElementById("results-count");
        resultsTbody = document.getElementById("results-details")
            .getElementsByTagName("tbody")[0];
        contextTbody = document.getElementById("context-detail")
            .getElementsByTagName("tbody")[0];
        detailsPageCount = document.getElementById("details-page-count");

        document.getElementById("execute").addEventListener("click",
                                                            sendExecute);

        mainExpression.addEventListener("keypress", handleExprEnter);

        contextHeader.addEventListener("click", changeContextVisible);
        contextHeader.addEventListener("keypress", changeContextVisible);
        contextExpression.addEventListener("keypress", handleExprEnter);

        resolverHeader.addEventListener("click", changeResolverVisible);
        resolverHeader.addEventListener("keypress", changeResolverVisible);
        resolverExpression.addEventListener("keypress", handleExprEnter);

        frameHeader.addEventListener("click", changeFrameVisible);
        frameHeader.addEventListener("keypress", changeFrameVisible);
        frameExpression.addEventListener("keypress", handleExprEnter);

        document.getElementById("show-all-results").addEventListener(
            "click", () => {
                sendToActiveTab({ "event": "requestShowAllResults" });
            });

        document.getElementById("open-options").addEventListener(
            "click", () => {
                browser.runtime.openOptionsPage();
            });

        document.getElementById("set-style").addEventListener("click", () => {
            sendToActiveTab({ "event": "setStyle" });
        });

        document.getElementById("reset-style").addEventListener("click",()=> {
            sendToActiveTab({ "event": "resetStyle" });
        });

        contextTbody.addEventListener("click", event => {
            if (event.target.tagName.toLowerCase() === "button") {
                browser.tabs.sendMessage(relatedTabId, {
                    "event": "focusContextItem",
                    "executionId": executionId,
                });
            }
        });

        document.getElementById("previous-details-page").addEventListener(
            "click", () => {
                showDetailsPage(detailsPageIndex - 1);
            });
        document.getElementById("move-details-page").addEventListener(
            "click", () => {
                var count = parseInt(detailsPageCount.value, 10);
                showDetailsPage(count - 1);
            });
        document.getElementById("next-details-page").addEventListener(
            "click", () => {
                showDetailsPage(detailsPageIndex + 1);
            });

        resultsTbody.addEventListener("click", event => {
            var target = event.target;
            if (target.tagName.toLowerCase() === "button") {
                let ind = parseInt(target.getAttribute("data-index"), 10);
                browser.tabs.sendMessage(relatedTabId, {
                    "event": "focusItem",
                    "executionId": executionId,
                    "index": ind
                });
            }
        });

        window.addEventListener("unload", () => {
            var state = collectPopupState();
            browser.runtime.sendMessage({
                "event": "storePopupState",
                "state": state
            });
        });

        resultsTbody.appendChild(fu.createDetailTableHeader());
        contextTbody.appendChild(fu.createDetailTableHeader());

        sendToActiveTab({ "event": "requestShowResultsInPopup" });
        browser.runtime.sendMessage({ "event": "requestRestorePopupState" });
    });


})(window);
