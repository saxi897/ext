// content_thread.js
(function () {
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function safeName(name) { return name.replace(/[\\/:*?"<>|]/g, '_').trim(); }

  /* ---------- download ---------- */
 async function downloadAll() {
  const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
  const safeTitle = safeName(title);

  /* ----- lấy 3 file ----- */
  const rarLink = document.querySelector('p.attnm a[href]');
  const img     = document.querySelector('.t_f img.zoom');
  const post    = document.querySelector('.t_f');

  const files = []; // [{name, url}, ...]

  if (rarLink) files.push({ name: safeTitle + '.rar', url: rarLink.href });
  if (img?.src) files.push({ name: safeTitle + '_cover.' + img.src.split('.').pop().split('?')[0], url: img.src });
  if (post) {
    const txtBlob = new Blob([post.innerText.trim()], { type: 'text/plain;charset=utf-8' });
    files.push({ name: safeTitle + '.txt', blob: txtBlob });
  }

  /* ----- gửi background zip ----- */
  chrome.runtime.sendMessage({ action: 'zip_and_download', files, folder: safeTitle + '/' }, () => {
    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  });
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

