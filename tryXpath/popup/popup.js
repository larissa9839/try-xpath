window.addEventListener("load", function () {
    var area = document.getElementById("area");
    var result = document.getElementById("result");

    // クリックされたらメッセージを発する
    document.getElementById("send").addEventListener("click", function() {
        var msg = JSON.parse(area.value);
        chrome.tabs.query({ "active": true, "currentWindow": true },
                          function (tabs) {
                              chrome.tabs.sendMessage(tabs[0].id, msg);
                          });
    });

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = {};

    genericListener.listeners.showResultsInPopup = function (message, sender){
        result.value = JSON.stringify(message);
        return ;
    };

    chrome.runtime.onMessage.addListener(genericListener);
});
