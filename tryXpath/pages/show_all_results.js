
(function (window, undefined) {
    "use strict";

    var document = window.document;

    function showAllResults(results) {
        document.getElementById("message").textContent = results.message;
        document.getElementById("title").textContent = results.title;
        document.getElementById("url").textContent = results.url;

        document.getElementById("context-method").textContent
            = results.context.method;
        document.getElementById("context-expression").textContent
            = results.context.expression;
        document.getElementById("context-specified-result-type").textContent
            = results.context.specifiedResultType;
        document.getElementById("context-result-type").textContent
            = results.context.resultType;
        document.getElementById("context-resolver").textContent
            = results.context.resolver;

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

    };

    // test showAllResults
    window.addEventListener("load", function() {
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
            },
            "main": {
                "method": "MAIN METHOD",
                "expression": "MAIN EXPRESSION",
                "specifiedResultType": "MAIN SPECIFIED",
                "resultType": "MAIN RESULTTYPE",
                "resolver": "MAIN RESOLVER",
            },
        });
    });

})(window);
