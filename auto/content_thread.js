// content_thread.js (cập nhật để đảm bảo tab download được đóng sau khi gửi message)
(function() {
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

window.addEventListener('message', async function(e) {
if (!e.data.action) return;


if(e.data.action === 'start_comment') {
  const textarea = document.querySelector('#fastpostmessage');
  const btnReply = document.querySelector('#fastpostsubmit');
  if (textarea && btnReply) {
    textarea.value = "Thanks for sharing";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    btnReply.click();
    await wait(60000);
  }
  // Đảm bảo gửi message về parent trước khi đóng tab
  if(window.opener) {
    window.opener.postMessage({action: 'thread_done'}, '*');
  }
  window.close();
}

if(e.data.action === 'start_download') {
  const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
  const rar = document.querySelector('p.attnm a[href]');
  if (rar) {
    chrome.runtime.sendMessage({
      action: 'download_file',
      url: rar.href,
      filename: encodeURIComponent(title) + '.rar'
    }, () => {
      // Sau khi gửi message download, báo parent và đóng tab
      if(window.opener) {
        window.opener.postMessage({action: 'thread_done'}, '*');
      }
      window.close();
    });
  } else {
    if(window.opener) {
      window.opener.postMessage({action: 'thread_done'}, '*');
    }
    window.close();
  }
}


});
})();
