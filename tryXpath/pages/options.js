
(function (window, undefined) {
    "use strict";

    var document = window.document;

    var elements = {};
    
    window.addEventListener("load", function () {
        elements.elementClass = document.getElementById("element-class");
        elements.contextClass = document.getElementById("context-class");
        elements.focusedClass = document.getElementById("focused-class");
        elements.ancestorClass = document.getElementById("ancestor-class");
        elements.style = document.getElementById("style");

        chrome.runtime.sendMessage({ "event": "loadOptions" }, function (res){
            elements.elementClass.value = res.classes.element;
            elements.contextClass.value = res.classes.context;
            elements.focusedClass.value = res.classes.focused;
            elements.ancestorClass.value = res.classes.focusedAncestor;
            elements.style.value = res.css;
        });
    });

})(window);
