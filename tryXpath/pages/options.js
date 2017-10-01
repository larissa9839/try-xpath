/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (window, undefined) {
    "use strict";

    var document = window.document;

    const defaultClasses = {
        "element": "tryxpath--element----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "context": "tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focused": "tryxpath--focused----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focusedAncestor": "tryxpath--focused-ancestor----f43c83f3-1920-4222-a721-0cc19c4ba9bf"
    };

    var elementClass, contextClass, focusedClass, ancestorClass, style,
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
        elementClass = document.getElementById("element-class");
        contextClass = document.getElementById("context-class");
        focusedClass = document.getElementById("focused-class");
        ancestorClass = document.getElementById("ancestor-class");
        style = document.getElementById("style");
        message = document.getElementById("message");

        chrome.runtime.sendMessage({ "event": "loadOptions" }, res => {
            elementClass.value = res.classes.element;
            contextClass.value = res.classes.context;
            focusedClass.value = res.classes.focused;
            ancestorClass.value = res.classes.focusedAncestor;
            style.value = res.css;
        });

        document.getElementById("save").addEventListener("click", () => {
            var styleValue = style.value;
            var classes = Object.create(null);
            classes.element = elementClass.value;
            classes.context = contextClass.value;
            classes.focused = focusedClass.value;
            classes.focusedAncestor = ancestorClass.value;

            if (!isValidClasses(classes)) {
                message.textContent = "There is a invalid class.";
                return;
            }

            chrome.storage.sync.set({
                "classes": classes,
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
                elementClass.value = defaultClasses.element;
                contextClass.value = defaultClasses.context;
                focusedClass.value = defaultClasses.focused;
                ancestorClass.value = defaultClasses.focusedAncestor;
                
                loadDefaultCss(css => {
                    style.value = css;
                });
            });
    });


    testElement = document.createElement("div");

})(window);
