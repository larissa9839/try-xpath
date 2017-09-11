
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
            document.getElementById("context-method").textContent
                = results.context.method;
            document.getElementById("context-expression").textContent
                = results.context.expression;
            document.getElementById("context-specified-result-type")
                .textContent
                = results.context.specifiedResultType;
            document.getElementById("context-result-type").textContent
                = results.context.resultType;
            document.getElementById("context-resolver").textContent
                = results.context.resolver;
            var contTbody = document.getElementById("context-detail")
                .getElementsByTagName("tbody")[0];
            contTbody.appendChild(fu.createDetailTableHeader());
            fu.appendDetailRows(contTbody, [results.context.itemDetail]);
        }
        document.getElementById("main-method").textContent
            = results.main.method;
        document.getElementById("main-expression").textContent
            = results.main.expression;
        document.getElementById("main-specified-result-type").textContent
            = results.main.specifiedResultType;
        document.getElementById("main-result-type").textContent
            = results.main.resultType;
        document.getElementById("main-resolver").textContent
            = results.main.resolver;
        var mainTbody = document.getElementById("main-details")
            .getElementsByTagName("tbody")[0];
        mainTbody.appendChild(fu.createDetailTableHeader());
        fu.appendDetailRows(mainTbody, results.main.itemDetails);
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
