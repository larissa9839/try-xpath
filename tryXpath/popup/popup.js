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
    const helpClass = "help";
    const invalidTabId = browser.tabs.TAB_ID_NONE;
    const invalidExecutionId = NaN;
    const invalidFrameId = -1;

    var mainWay, mainExpression, contextCheckbox, contextHeader, contextBody,
        contextWay, contextExpression, resolverHeader, resolverBody,
        resolverCheckbox, resolverExpression, frameHeader, frameCheckbox,
        frameBody, frameIdList, frameIdExpression, resultsMessage,
        resultsTbody, contextTbody, resultsCount, resultsFrameId,
        detailsPageCount, helpBody, helpCheckbox;

    var relatedTabId = invalidTabId;
    var relatedFrameId = invalidFrameId;
    var executionId = invalidExecutionId;
    var resultedDetails = [];
    const detailsPageSize = 50;
    var detailsPageIndex = 0;

    function sendToActiveTab(msg, opts) {
        var opts = opts || {};
        return browser.tabs.query({
            "active": true,
            "currentWindow": true
        }).then(tabs => {
            return browser.tabs.sendMessage(tabs[0].id, msg, opts);
        });
    };

    function sendToSpecifiedFrame(msg) {
        var frameId = getSpecifiedFrameId();
        return Promise.resolve().then(() => {
            return browser.tabs.executeScript({
                "file": "/scripts/try_xpath_check_frame.js",
                "frameId": frameId
            });
        }).then(ress => {
            if (ress[0]) {
                return;
            }
            return execContentScript();
        }).then(() => {
            sendToActiveTab(msg, { "frameId": frameId });
        }).catch(e => {
            showError("An error occurred. The frameId may be incorrect.",
                      frameId);
        });
    };

    function collectPopupState() {
        var state = Object.create(null);
        state.helpCheckboxChecked = helpCheckbox.checked;
        state.mainWayIndex = mainWay.selectedIndex;
        state.mainExpressionValue = mainExpression.value;
        state.contextCheckboxChecked = contextCheckbox.checked;
        state.contextWayIndex = contextWay.selectedIndex;
        state.contextExpressionValue = contextExpression.value;
        state.resolverCheckboxChecked = resolverCheckbox.checked;
        state.resolverExpressionValue = resolverExpression.value;
        state.frameCheckboxChecked = frameCheckbox.checked;
        state.specifiedFrameId = getSpecifiedFrameId();
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

    function changeHelpVisible() {
        var helps = document.getElementsByClassName(helpClass);
        if (helpCheckbox.checked) {
            for (var i = 0; i < helps.length; i++) {
                helps[i].classList.remove(noneClass);
            }
        } else {
            for (var i = 0; i < helps.length; i++) {
                helps[i].classList.add(noneClass);
            }
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

        return msg;
    };

    function getSpecifiedFrameId () { 
        if (!frameCheckbox.checked) {
            return 0;
        }
        var id = frameIdList.selectedOptions[0].getAttribute("data-frame-id");
        if (id === "manual") {
            return parseInt(frameIdExpression.value, 10);
        }
        return parseInt(id, 10);
    };

    function execContentScript() {
        return browser.tabs.executeScript({
            "file": "/scripts/try_xpath_functions.js",
            "allFrames": true
        }).then(() => {
            return browser.tabs.executeScript({
                "file": "/scripts/try_xpath_content.js",
                "allFrames": true
            });
        });
    };

    function sendExecute() {
        sendToSpecifiedFrame(makeExecuteMessage());
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
        }).catch(fu.onError);
    };

    function showError(message, frameId) {
        relatedTabId = invalidTabId;
        relatedFrameId = invalidFrameId;
        executionId = invalidExecutionId;

        resultsMessage.textContent = message;
        resultedDetails = [];
        resultsCount.textContent = resultedDetails.length;
        resultsFrameId.textContent = frameId;
        
        fu.updateDetailsTable(contextTbody, [])
            .catch(fu.onError);
        showDetailsPage(0);
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
        relatedFrameId = sender.frameId;
        executionId = message.executionId;

        resultsMessage.textContent = message.message;
        resultedDetails = message.main.itemDetails;
        resultsCount.textContent = resultedDetails.length;
        resultsFrameId.textContent = sender.frameId;

        if (message.context) {
            fu.updateDetailsTable(contextTbody, [message.context.itemDetail])
                .catch(fu.onError);
        }

        showDetailsPage(0);
    };

    genericListener.listeners.restorePopupState = function (message) {
        var state = message.state;

        if (state !== null) {
            helpCheckbox.checked = state.helpCheckboxChecked;
            mainWay.selectedIndex = state.mainWayIndex;
            mainExpression.value = state.mainExpressionValue;
            contextCheckbox.checked = state.contextCheckboxChecked;
            contextWay.selectedIndex = state.contextWayIndex;
            contextExpression.value = state.contextExpressionValue;
            resolverCheckbox.checked = state.resolverCheckboxChecked;
            resolverExpression.value = state.resolverExpressionValue;
            frameCheckbox.checked = state.frameCheckboxChecked;
            frameIdExpression.value = state.specifiedFrameId;
        }

        changeHelpVisible();
        changeContextVisible();
        changeResolverVisible();
        changeFrameVisible();

        sendToSpecifiedFrame({ "event": "requestShowResultsInPopup" });
    };

    genericListener.listeners.addFrameId = function (message, sender) {
        var opt = document.createElement("option");
        opt.setAttribute("data-frame-id", sender.frameId);
        opt.textContent = sender.frameId;
        frameIdList.appendChild(opt);
    };

    window.addEventListener("load", () => {
        helpBody = document.getElementById("help-body");
        helpCheckbox = document.getElementById("help-switch");
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
        frameIdList = document.getElementById("frame-id-list");
        frameIdExpression = document.getElementById("frame-id-expression");
        resultsMessage = document.getElementById("results-message");
        resultsCount = document.getElementById("results-count");
        resultsFrameId = document.getElementById("results-frame-id");
        resultsTbody = document.getElementById("results-details")
            .getElementsByTagName("tbody")[0];
        contextTbody = document.getElementById("context-detail")
            .getElementsByTagName("tbody")[0];
        detailsPageCount = document.getElementById("details-page-count");

        helpBody.addEventListener("click", changeHelpVisible);
        helpBody.addEventListener("keypress", changeHelpVisible);

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
        frameIdExpression.addEventListener("keypress", handleExprEnter);
        document.getElementById("get-all-frame-id").addEventListener(
            "click", () => {
                fu.emptyChildNodes(frameIdList);
                
                var opt = document.createElement("option");
                opt.setAttribute("data-frame-id", "manual");
                opt.textContent = "Manual";
                frameIdList.appendChild(opt);

                browser.tabs.executeScript({
                    "code": "browser.runtime.sendMessage"
                        + "({\"event\":\"addFrameId\"});",
                    "allFrames": true
                }).catch(fu.onError);
            });

        document.getElementById("show-previous-results").addEventListener(
            "click", () => {
                sendToSpecifiedFrame({ "event": "requestShowResultsInPopup"});
            });

        document.getElementById("focus-frame").addEventListener(
            "click", () => {
                sendToSpecifiedFrame({ "event": "focusFrame"});
            });

        document.getElementById("show-all-results").addEventListener(
            "click", () => {
                sendToSpecifiedFrame({ "event": "requestShowAllResults" });
            });

        document.getElementById("open-options").addEventListener(
            "click", () => {
                browser.runtime.openOptionsPage();
            });

        document.getElementById("set-style").addEventListener("click", () => {
            sendToSpecifiedFrame({ "event": "setStyle" });
        });

        document.getElementById("reset-style").addEventListener("click",()=> {
            sendToSpecifiedFrame({ "event": "resetStyle" });
        });

        document.getElementById("set-all-style").addEventListener(
            "click", () => {
                sendToActiveTab({ "event": "setStyle" });
            });

        document.getElementById("reset-all-style").addEventListener(
            "click",()=> {
                sendToActiveTab({ "event": "resetStyle" });
            });


        contextTbody.addEventListener("click", event => {
            if (event.target.tagName.toLowerCase() === "button") {
                browser.tabs.sendMessage(relatedTabId, {
                    "event": "focusContextItem",
                    "executionId": executionId,
                }, {
                    "frameId": relatedFrameId
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
                }, {
                    "frameId": relatedFrameId
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

        browser.runtime.sendMessage({ "event": "requestRestorePopupState" });
    });


})(window);
