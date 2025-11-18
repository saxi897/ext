// content_thread.js
(function () {
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function safeName(name) { return name.replace(/[\\/:*?"<>|]/g, '_').trim(); }

  /* ---------- download ---------- */
  async function downloadAll() {
    const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
    const safeTitle = safeName(title);
    const folder = safeTitle + '/';

    const rarLink = document.querySelector('p.attnm a[href]');
    if (rarLink) {
      chrome.runtime.sendMessage({ action: 'download_file', url: rarLink.href, filename: folder + safeTitle + '.rar' });
      await wait(1500);
    }
    const img = document.querySelector('.t_f img.zoom');
    if (img?.src) {
      const imgExt = img.src.split('.').pop().split('?')[0];
      chrome.runtime.sendMessage({ action: 'download_file', url: img.src, filename: folder + safeTitle + '_cover.' + imgExt });
      await wait(1500);
    }
    const post = document.querySelector('.t_f');
    const textContent = post?.innerText.trim() || '';
    if (textContent.length > 50) {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      chrome.runtime.sendMessage({ action: 'download_file', url: url, filename: folder + safeTitle + '.txt' });
      await wait(1500);
    }
    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  }

  /* ---------- comment ---------- */
  async function startComment() {
    const textarea = document.querySelector('#fastpostmessage');
    const btnReply = document.querySelector('#fastpostsubmit');
    if (!textarea || !btnReply) return;

    textarea.value = '感谢楼主分享';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    btnReply.click();

    /* chờ thật sự xong (tối thiểu 60s) */
    await Promise.race([
      new Promise(res => {
        const orig = location.href;
        const t = setInterval(() => { if (location.href !== orig) { clearInterval(t); res(); } }, 300);
      }),
      new Promise(res => {
        const obs = new MutationObserver(() => {
          if (document.querySelector('.succeed, .alert_success, #messagetext p')) { obs.disconnect(); res(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }),
      new Promise(res => setTimeout(res, 65000)) // đủ 60s
    ]);

    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  }

  /* ---------- nhận lệnh + auto ---------- */
  window.addEventListener('message', e => {
    if (e.data?.action === 'start_download') downloadAll();
    if (e.data?.action === 'start_comment') startComment();
  });

  const mode = location.hash.slice(1); // #comment hoặc #download
  if (window.opener && (location.pathname.startsWith('/thread-') || location.search.includes('mod=viewthread'))) {
    setTimeout(() => {
      if (mode === 'comment') startComment();
      else downloadAll();
    }, 2000);
  }
})();
