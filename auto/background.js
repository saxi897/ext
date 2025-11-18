// background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("📩 Background nhận message:", msg);

    // ✅ Mở thread mới để download
    if (msg.action === "open_thread" && msg.url) {
        chrome.tabs.create({ url: msg.url, active: false }, tab => {
            chrome.storage.local.set({ currentTab: tab.id });
        });
    }

    // ✅ Tiến hành download (RAR / hình / TXT)
    if (msg.action === "download_file" && msg.url && msg.filename) {
        chrome.downloads.download({
            url: msg.url,
            filename: msg.filename,
            saveAs: false
        }, downloadId => {
            if (chrome.runtime.lastError) {
                console.error("❌ Download lỗi:", chrome.runtime.lastError.message);
            } else {
                console.log("⬇️ Download:", msg.filename);
            }
        });
    }

    // ✅ Đóng tab thread khi xong
    if (msg.action === "thread_done") {
        chrome.storage.local.get(["currentTab"], data => {
            if (data.currentTab) {
                chrome.tabs.remove(data.currentTab);
                chrome.storage.local.remove("currentTab");
            }
        });
        chrome.runtime.sendMessage({ action: "next_thread" });
    }
});