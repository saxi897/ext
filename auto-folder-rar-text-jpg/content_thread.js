(function() {
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function safeName(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim();
  }

  async function downloadAll() {
    const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
    const safeTitle = safeName(title);

    // === 1️⃣ Lấy link rar ===
    const rarLink = document.querySelector('p.attnm a[href]');
    // === 2️⃣ Lấy link hình (nếu có) ===
    const img = document.querySelector('.t_f img.zoom');
    // === 3️⃣ Lấy text nội dung ===
    const post = document.querySelector('.t_f');
    let textContent = '';
    if (post) {
      textContent = post.innerText.trim();
    }

    // === 4️⃣ Folder logic ===
    const folder = safeTitle + '/';

    // === 5️⃣ Tải file rar ===
    if (rarLink) {
      chrome.runtime.sendMessage({
        action: 'download_file',
        url: rarLink.href,
        filename: folder + safeTitle + '.rar'
      });
      await wait(1500);
    }

    // === 6️⃣ Tải hình nếu có ===
    if (img && img.src) {
      const imgExt = img.src.split('.').pop().split('?')[0];
      chrome.runtime.sendMessage({
        action: 'download_file',
        url: img.src,
        filename: folder + safeTitle + '_cover.' + imgExt
      });
      await wait(1500);
    }

    // === 7️⃣ Tải text nếu có ===
    if (textContent.length > 50) { // chỉ tạo nếu có nội dung đáng kể
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      chrome.runtime.sendMessage({
        action: 'download_file',
        url: url,
        filename: folder + safeTitle + '.txt'
      });
      await wait(1500);
    }

    // === 8️⃣ Báo hoàn thành về parent ===
    if (window.opener) {
      window.opener.postMessage({ action: 'thread_done' }, '*');
    }
    window.close();
  }

  // === 9️⃣ Nhận lệnh từ tab danh sách ===
  window.addEventListener('message', async function(e) {
    if (!e.data.action) return;

    if (e.data.action === 'start_comment') {
      const textarea = document.querySelector('#fastpostmessage');
      const btnReply = document.querySelector('#fastpostsubmit');
      if (textarea && btnReply) {
        textarea.value = "感谢楼主分享";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        btnReply.click();
        await wait(60000);
      }
      if (window.opener) {
        window.opener.postMessage({ action: 'thread_done' }, '*');
      }
      window.close();
    }

    if (e.data.action === 'start_download') {
      await downloadAll();
    }
  });
})();