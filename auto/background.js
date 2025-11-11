chrome.runtime.onMessage.addListener((msg, sender) => {


if (msg.action === "open_thread") {
chrome.tabs.create({ url: msg.url, active: false }, tab => {
chrome.storage.local.set({ currentTab: tab.id, index: msg.index });
});
}


if (msg.action === "download_file") {
chrome.downloads.download({
url: msg.url,
filename: msg.filename,
saveAs: false
});
}


if (msg.action === "thread_done") {
chrome.storage.local.get(["currentTab"], data => {
if (data.currentTab) {
chrome.tabs.remove(data.currentTab);
}
});


chrome.tabs.query({active:false},()=>{ chrome.runtime.sendMessage({ action: "next_thread" }); });
}
});