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
        console.log("✅ Thread hoàn thành, đóng tab");
        if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        // Gửi signal để popup biết thread đã xong
        chrome.runtime.sendMessage({ action: "thread_done" });
    }
    
    if (msg.action === 'run') {
        // mở tab con của thread
        chrome.tabs.create({ url: msg.url + '#' + msg.mode, active: false }, tab => {
            setTimeout(() => {
                chrome.tabs.remove(tab.id);
                sendResponse();
            }, 2000);
        });
    }

    sendResponse();
    return true;
});