
(function (window, undefined) {
    "use strict";

    var document = window.document;

    const defaultClasses = {
        "element": "tryxpath--element----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "context": "tryxpath--context----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focused": "tryxpath--focused----f43c83f3-1920-4222-a721-0cc19c4ba9bf",
        "focusedAncestor": "tryxpath--focused-ancestor----f43c83f3-1920-4222-a721-0cc19c4ba9bf"
    };

    var elements = {};
    elements.test = document.createElement("div");

    function isValidClass(clas) {
        try {
            elements.test.classList.add(clas);
        } catch (e) {
            return false;
        }
        elements.test.setAttribute("class", "");
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

    window.addEventListener("load", function () {
        elements.elementClass = document.getElementById("element-class");
        elements.contextClass = document.getElementById("context-class");
        elements.focusedClass = document.getElementById("focused-class");
        elements.ancestorClass = document.getElementById("ancestor-class");
        elements.style = document.getElementById("style");
        elements.message = document.getElementById("message");

        chrome.runtime.sendMessage({ "event": "loadOptions" }, function (res){
            elements.elementClass.value = res.classes.element;
            elements.contextClass.value = res.classes.context;
            elements.focusedClass.value = res.classes.focused;
            elements.ancestorClass.value = res.classes.focusedAncestor;
            elements.style.value = res.css;
        });

        document.getElementById("save").addEventListener("click", function() {
            var style = elements.style.value;
            var classes = Object.create(null);
            classes.element = elements.elementClass.value;
            classes.context = elements.contextClass.value;
            classes.focused = elements.focusedClass.value;
            classes.focusedAncestor = elements.ancestorClass.value;

            if (!isValidClasses(classes)) {
                elements.message.textContent = "There is a invalid class.";
                return;
            }

            chrome.runtime.sendMessage({
                "event": "changeOptions",
                "css": style,
                "classes": classes
            });
            elements.message.textContent = "Success.";
        });

        document.getElementById("show-default").addEventListener(
            "click", function () {
                elements.elementClass.value = defaultClasses.element;
                elements.contextClass.value = defaultClasses.context;
                elements.focusedClass.value = defaultClasses.focused;
                elements.ancestorClass.value = defaultClasses.focusedAncestor;

                loadDefaultCss(function (css) {
                    elements.style.value = css;
                });
            });
    });

})(window);
