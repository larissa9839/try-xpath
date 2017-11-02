/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    // alias
    var tx = tryXpath;
    var fu = tryXpath.functions;

    var document = window.document;

    const defaultAttributes = {
        "element": "data-tryxpath-element",
        "context": "data-tryxpath-context",
        "focused": "data-tryxpath-focused",
        "focusedAncestor": "data-tryxpath-focused-ancestor",
        "frame": "data-tryxpath-frame",
        "frameAncestor": "data-tryxpath-frame-ancestor"
    };

    var elementAttr, contextAttr, focusedAttr, ancestorAttr, frameAttr,
        frameAncestorAttr, style, message, testElement;

    function isValidAttrName(name) {
        try {
            testElement.setAttribute(name, "testValue");
        } catch (e) {
            return false;
        }
        return true;
    };

    function isValidAttrNames(names) {
        for (var p in names) {
            if (!isValidAttrName(names[p])) {
                return false;
            }
        }
        return true;
    };

    function loadDefaultCss() {
        return new Promise((resolve, reject) => {
            var req = new XMLHttpRequest();
            req.open("GET",
                     browser.runtime.getURL("/css/try_xpath_insert.css"));
            req.responseType = "text";
            req.onreadystatechange = function () {
                if (req.readyState === XMLHttpRequest.DONE) {
                    resolve(req.responseText);
                }
            };
            req.send();
        });
    };

    window.addEventListener("load", () => {
        elementAttr = document.getElementById("element-attribute");
        contextAttr = document.getElementById("context-attribute");
        focusedAttr = document.getElementById("focused-attribute");
        ancestorAttr = document.getElementById("ancestor-attribute");
        frameAttr = document.getElementById("frame-attribute");
        frameAncestorAttr = document.getElementById(
            "frame-ancestor-attribute");
        style = document.getElementById("style");
        message = document.getElementById("message");

        browser.runtime.sendMessage({ "event": "loadOptions" }).then(res => {
            elementAttr.value = res.attributes.element;
            contextAttr.value = res.attributes.context;
            focusedAttr.value = res.attributes.focused;
            ancestorAttr.value = res.attributes.focusedAncestor;
            frameAttr.value = res.attributes.frame;
            frameAncestorAttr.value = res.attributes.frameAncestor;
            
            style.value = res.css;
        }).catch(fu.onError);

        document.getElementById("save").addEventListener("click", () => {
            var styleValue = style.value;
            var attrs = Object.create(null);
            attrs.element = elementAttr.value;
            attrs.context = contextAttr.value;
            attrs.focused = focusedAttr.value;
            attrs.focusedAncestor = ancestorAttr.value;
            attrs.frame = frameAttr.value;
            attrs.frameAncestor = frameAncestorAttr.value;

            if (!isValidAttrNames(attrs)) {
                message.textContent = "There is a invalid attribute.";
                return;
            }

            browser.storage.sync.set({
                "attributes": attrs,
                "css": styleValue
            }).then(() => {
                message.textContent
                    = "Success. Please click the \"Set style\" button in "
                    + " the popup to apply new options.";
            }).catch(err => {
                message.textContent = "Failure. " + err.message;
            });
        });

        document.getElementById("show-default").addEventListener(
            "click", () => {
                elementAttr.value = defaultAttributes.element;
                contextAttr.value = defaultAttributes.context;
                focusedAttr.value = defaultAttributes.focused;
                ancestorAttr.value = defaultAttributes.focusedAncestor;
                frameAttr.value = defaultAttributes.frame;
                frameAncestorAttr.value = defaultAttributes.frameAncestor;
                
                loadDefaultCss().then(css => {
                    style.value = css;
                });
            });
    });

    testElement = document.createElement("div");

})(window);
