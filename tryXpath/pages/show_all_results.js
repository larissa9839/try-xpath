
(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    function showAllResults(results) {
        document.getElementById("message").textContent = results.message;
        document.getElementById("title").textContent = results.title;
        document.getElementById("url").textContent = results.url;

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

    // test showAllResults
    window.addEventListener("load", function() {
        var details = [];
        for (var i = 0; i < 20000; i++) {
            let detail = {};
            detail.type = "type" + i;
            detail.name = "name" + i;
            detail.value = "value" + i;
            details.push(detail);
        }

        showAllResults({
            "message": "message value",
            "title": "title value",
            "url": "URL VALUE",
            "context": {
                "method": "CONTEXT METHOD",
                "expression": "CONTEXT EXPRESSION",
                "specifiedResultType": "CONTEXT SPECIFIED",
                "resultType": "CONTEXT RESULTTYPE",
                "resolver": "CONTEXT RESOLVER",
                "itemDetail": {
                    "type": "CONTEXT ITEM TYPE",
                    "name": "CONTEXT ITEM NAME",
                    "value": "CONTEXT ITEM VALUE"
                }
            },
            "main": {
                "method": "MAIN METHOD",
                "expression": "MAIN EXPRESSION",
                "specifiedResultType": "MAIN SPECIFIED",
                "resultType": "MAIN RESULTTYPE",
                "resolver": "MAIN RESOLVER",
                "itemDetails": details
            },
        });
    });

})(window);
