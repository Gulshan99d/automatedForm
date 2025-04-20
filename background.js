chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "DATA_FETCHED") {
    chrome.storage.local.set({ fetchedData: msg.payload });
  }
});