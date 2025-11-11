(async function() {
const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
const rar = document.querySelector('p.attnm a[href]');
if (rar) {
chrome.runtime.sendMessage({
action: 'download_file',
url: rar.href,
filename: title + '.rar'
});
}
chrome.runtime.sendMessage({ action: 'thread_done' });
})();