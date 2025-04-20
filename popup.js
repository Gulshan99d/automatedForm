chrome.storage.local.get("fetchedData", (res) => {
  const output = document.getElementById("output");
  if (res.fetchedData) {
    output.innerHTML = `<strong>Title:</strong> ${res.fetchedData.title}<br><strong>URL:</strong> ${res.fetchedData.url}`;
  } else {
    output.innerText = "ad todos as you want.";
  }
});

window.addEventListener("unload", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "REMOVE_BUTTON" });
  });
});