(async function() {
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
const textarea = document.querySelector('#fastpostmessage');
const btnReply = document.querySelector('#fastpostsubmit');
if (textarea && btnReply) {
textarea.value = "谢谢楼主分享";
textarea.dispatchEvent(new Event("input", { bubbles: true }));
btnReply.click();
await wait(60000); // 1 phút
}
chrome.runtime.sendMessage({ action: "thread_done" });
})();