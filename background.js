chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== "bookmarks") {
        return false;
    }

    chrome.bookmarks.getTree((nodes) => {
        sendResponse({ bookmarks: nodes });
    });

    return true;
});
