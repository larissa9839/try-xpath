window.addEventListener("load", function () {
    var area = document.getElementById("area");
    var result = document.getElementById("result");

    function sendToActiveTab(msg) {
        chrome.tabs.query({ "active": true, "currentWindow": true },
                          function (tabs) {
                              chrome.tabs.sendMessage(tabs[0].id, msg);
                          });
    }

    // クリックされたらメッセージを発する
    document.getElementById("send").addEventListener("click", function() {
        try {
            var msg = JSON.parse(area.value);
        } catch (e) {
            result.value = e.message;
        }
        sendToActiveTab(msg);
    });
    document.getElementById("send-to-all").addEventListener("click", function() {
        try {
            var msg = JSON.parse(area.value);
        } catch (e) {
            result.value = e.message;
        }
        chrome.runtime.sendMessage(msg);
    });

    window.addEventListener("unload", function () {
        chrome.runtime.sendMessage({
            "event": "storePopupState",
            "state": {
                "area": area.value
            }
        });
    });

    function genericListener(message, sender, sendResponse) {
        var listener = genericListener.listeners[message.event];
        if (listener) {
            return listener(message, sender, sendResponse);
        }
    };
    genericListener.listeners = Object.create(null);;
    chrome.runtime.onMessage.addListener(genericListener);

    genericListener.listeners.showResultsInPopup = function (message, sender) {
        message.tabId = sender.tab.id;
        result.value = JSON.stringify(message, null, 2);
        return ;
    };

    genericListener.listeners.restorePopupState = function (message) {
        area.value = message.state.area;
    };

    sendToActiveTab({ "event": "requestShowResultsInPopup" });
    chrome.runtime.sendMessage({ "event": "requestRestorePopupState" });
});
