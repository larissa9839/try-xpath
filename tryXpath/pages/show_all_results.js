/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    var relatedTabId;
    var executionId;

    function showAllResults(results) {
        document.getElementById("message").textContent = results.message;
        document.getElementById("title").textContent = results.title;
        document.getElementById("url").textContent = results.href;

        if (results.context) {
            let cont = results.context;
            document.getElementById("context-method").textContent
                = cont.method;
            document.getElementById("context-expression").textContent
                = cont.expression;
            document.getElementById("context-specified-result-type")
                .textContent
                = cont.specifiedResultType;
            document.getElementById("context-result-type").textContent
                = cont.resultType;
            document.getElementById("context-resolver").textContent
                = cont.resolver;
            let contTbody = document.getElementById("context-detail")
                .getElementsByTagName("tbody")[0];
            contTbody.appendChild(fu.createDetailTableHeader());
            if (cont.itemDetail) {
                fu.appendDetailRows(contTbody, [cont.itemDetail]);
            }
        } else {
            let area = document.getElementById("context-area");
            area.parentNode.removeChild(area);
        }

        var main = results.main;
        document.getElementById("main-method").textContent = main.method;
        document.getElementById("main-expression").textContent
            = main.expression;
        document.getElementById("main-specified-result-type").textContent
            = main.specifiedResultType;
        document.getElementById("main-result-type").textContent
            = main.resultType;
        document.getElementById("main-resolver").textContent = main.resolver;
        document.getElementById("main-count").textContent
            = main.itemDetails.length;
        var mainTbody = document.getElementById("main-details")
            .getElementsByTagName("tbody")[0];
        mainTbody.appendChild(fu.createDetailTableHeader());
        fu.appendDetailRows(mainTbody, main.itemDetails);
    };

    window.addEventListener("load", function() {
        chrome.runtime.sendMessage({ "event": "loadResults" },
                                   function (results) {
            if (results) {
                relatedTabId = results.tabId;
                executionId = results.executionId;
                showAllResults(results);
            }
        });

        var contDetail = document.getElementById("context-detail");
        contDetail.addEventListener("click", function(event) {
            var target = event.target;
            if (target.tagName.toLowerCase() === "button") {
                chrome.tabs.sendMessage(relatedTabId, {
                    "event": "focusContextItem",
                    "executionId": executionId
                });
            }
        });

        var mainDetails = document.getElementById("main-details");
        mainDetails.addEventListener("click", function(event) {
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
    });

})(window);
