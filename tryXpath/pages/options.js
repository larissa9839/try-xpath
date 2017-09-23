
(function (window, undefined) {
    "use strict";

    var document = window.document;

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

    });

})(window);
