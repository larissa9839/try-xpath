/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    var document = window.document;

    const defaultAttributes = {
        "element": "data-tryxpath-element",
        "context": "data-tryxpath-context",
        "focused": "data-tryxpath-focused",
        "focusedAncestor": "data-tryxpath-focused-ancestor"
    };

    var elementAttr, contextAttr, focusedAttr, ancestorAttr, style,
        message, testElement;

    function isValidClass(clas) {
        try {
            testElement.classList.add(clas);
        } catch (e) {
            return false;
        }
        testElement.setAttribute("class", "");
        return true;
    };

    function isValidClasses(classes) {
        for (var p in classes) {
            if (!isValidClass(classes[p])) {
                return false;
            }
        }
        return true;
    };

    function loadDefaultCss(callback) {
        var req = new XMLHttpRequest();
        req.open("GET", chrome.runtime.getURL("/css/try_xpath_insert.css"));
        req.responseType = "text";
        req.onreadystatechange = function () {
            if (req.readyState === XMLHttpRequest.DONE) {
                callback(req.responseText);
            }
        };
        req.send();
    };

    window.addEventListener("load", () => {
        elementAttr = document.getElementById("element-attribute");
        contextAttr = document.getElementById("context-attribute");
        focusedAttr = document.getElementById("focused-attribute");
        ancestorAttr = document.getElementById("ancestor-attribute");
        style = document.getElementById("style");
        message = document.getElementById("message");

        chrome.runtime.sendMessage({ "event": "loadOptions" }, res => {
            elementAttr.value = res.attributes.element;
            contextAttr.value = res.attributes.context;
            focusedAttr.value = res.attributes.focused;
            ancestorAttr.value = res.attributes.focusedAncestor;
            style.value = res.css;
        });

        document.getElementById("save").addEventListener("click", () => {
            var styleValue = style.value;
            var attrs = Object.create(null);
            attrs.element = elementAttr.value;
            attrs.context = contextAttr.value;
            attrs.focused = focusedAttr.value;
            attrs.focusedAncestor = ancestorAttr.value;

            /* ToDo
            if (!isValidClasses(classes)) {
                message.textContent = "There is a invalid class.";
                return;
            }
            */

            chrome.storage.sync.set({
                "attributes": attrs,
                "css": styleValue
            }, () => {
                var err = chrome.runtime.lastError;
                if (err) {
                    message.textContent = "Failure. " + err.message;
                } else {
                    message.textContent = "Success.";
                }
            });
        });

        document.getElementById("show-default").addEventListener(
            "click", () => {
                elementAttr.value = defaultAttributes.element;
                contextAttr.value = defaultAttributes.context;
                focusedAttr.value = defaultAttributes.focused;
                ancestorAttr.value = defaultAttributes.focusedAncestor;
                
                loadDefaultCss(css => {
                    style.value = css;
                });
            });
    });

    testElement = document.createElement("div");

})(window);
