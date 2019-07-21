/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    var detailKeys = ["type", "name", "value", "textContent"];
    var headerValues = ["Type", "Name", "Value", "textContent"];
    var relatedTabId;
    var relatedFrameId;
    var executionId;

    function showAllResults(results) {
        document.getElementById("message").textContent = results.message;
        document.getElementById("title").textContent = results.title;
        document.getElementById("url").textContent = results.href;
        document.getElementById("frame-id").textContent = results.frameId;

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
            if (cont.itemDetail) {
                fu.updateDetailsTable(contTbody, [cont.itemDetail], {
                    "headerValues": headerValues,
                    "detailKeys": detailKeys
                }).catch(fu.onError);
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
        fu.updateDetailsTable(mainTbody, main.itemDetails, {
            "headerValues": headerValues,
            "detailKeys": detailKeys
        }).catch(fu.onError);
    };

    function makeTextDownloadUrl(text) {
        return URL.createObjectURL(new Blob([text], { "type": "text/plain"}));
    };

    function makeInfoText(results) {
        let cont = results.context;
        let main = results.main;
        return `[Information]
Message:     ${results.message}
Title:       ${results.title}
URL:         ${results.href}
frameId:     ${results.frameId}

${!cont ? "" : `[Context information]
Method:                  ${cont.method}
Expression:              ${cont.expression}
Specified resultType:    ${cont.specifiedResultType}
resultType:              ${cont.resultType}
Resolver:                ${cont.resolver}

[Context detail]
${headerValues.join(", ")}
${fu.makeDetailText(cont.itemDetail, detailKeys, ", ")}
`}
[Main information]
Method:                  ${main.method}
Expression:              ${main.expression}
Specified resultType:    ${main.specifiedResultType}
resultType:              ${main.resultType}
Resolver:                ${main.resolver}
Count:                   ${main.itemDetails.length}

[Main details]
${["Index"].concat(headerValues).join(", ")}
${main.itemDetails.map((detail, ind) => {
      return fu.makeDetailText(detail, ["index"].concat(detailKeys), ", ", {
          "index": val => { return ind; }
      });
  }).join("\n")}
`;
    };

    function makeConvertedInfoText(results) {
        let cont = results.context;
        let main = results.main;
        return `[Information]
Message:     ${results.message}
Title:       ${results.title}
URL:         ${results.href}
frameId:     ${results.frameId}

${!cont ? "" : `[Context information]
Method:                  ${cont.method}
Expression(JSON):        ${JSON.stringify(cont.expression)}
Specified resultType:    ${cont.specifiedResultType}
resultType:              ${cont.resultType}
Resolver:                ${cont.resolver}

[Context detail]
Type, Name, Value(JSON), textContent(JSON)
${fu.makeDetailText(cont.itemDetail, detailKeys, ", ", {
    "value": JSON.stringify,
    "textContent": JSON.stringify
})}
`}
[Main information]
Method:                  ${main.method}
Expression(JSON):        ${JSON.stringify(main.expression)}
Specified resultType:    ${main.specifiedResultType}
resultType:              ${main.resultType}
Resolver:                ${main.resolver}
Count:                   ${main.itemDetails.length}

[Main details]
Index, Type, Name, Value(JSON), textContent(JSON)
${main.itemDetails.map((detail, ind) => {
      return fu.makeDetailText(detail, ["index"].concat(detailKeys), ", ", {
          "index": val => { return ind; },
          "value": JSON.stringify,
          "textContent": JSON.stringify
      });
  }).join("\n")}
`;
    };

    window.addEventListener("load", function() {
        browser.runtime.sendMessage({"event":"loadResults"}).then(results => {
            if (results) {
                relatedTabId = results.tabId;
                relatedFrameId = results.frameId;
                executionId = results.executionId;

                let expoText = document.getElementById("export-text");
                expoText.setAttribute(
                    "download", `tryxpath-${results.title}.txt`);
                expoText.href =  makeTextDownloadUrl(makeInfoText(results));
                let expoPartConv = document.getElementById(
                    "export-partly-converted");
                expoPartConv.setAttribute(
                    "download", `tryxpath-converted-${results.title}.txt`);
                expoPartConv.href =  makeTextDownloadUrl(
                    makeConvertedInfoText(results));

                showAllResults(results);
            }
        }).catch(fu.onError);

        var contDetail = document.getElementById("context-detail");
        contDetail.addEventListener("click", function(event) {
            var target = event.target;
            if (target.tagName.toLowerCase() === "button") {
                browser.tabs.sendMessage(relatedTabId, {
                    "event": "focusContextItem",
                    "executionId": executionId
                }, {
                    "frameId": relatedFrameId
                });
            }
        });

        var mainDetails = document.getElementById("main-details");
        mainDetails.addEventListener("click", function(event) {
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
    });

})(window);
