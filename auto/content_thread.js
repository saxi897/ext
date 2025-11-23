// content_thread.js  (KHÔNG có UI)
(function () {
  /* ---------- utils ---------- */
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function safeName(name) { return name.replace(/[\\/:*?"<>|]/g, '_').trim(); }

  /* ---------- log gửi về cha ---------- */
  function threadLog(...args) {
    const msg = '[THREAD] ' + args.map(a => String(a)).join(' ');
    console.log(msg);
    if (window.opener) window.opener.postMessage({ action: 'log', data: msg }, '*');
  }

  /* ---------- tìm ngày trong text ---------- */
  function extractDate(text) {
  // 1. yyyy-mm-dd đứng trước "完结" (có thể có space)
  let m = text.match(/(\d{4}-\d{2}-\d{2})\s*完结/);
  if (m) return m[1]; // 2025-04-28

  // 2. dd/mm/yyyy đứng trước "完结"
  m = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*完结/);
  if (m) return m[1].split('/').reverse().join('-'); // 28/04/2025 → 2025-04-28

  // 3. không có → hôm nay
  return new Date().toISOString().slice(0, 10);
}

  /* ---------- download full ---------- */
  async function downloadAll() {
    const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
    const safeTitle = safeName(title);
    const post   = document.querySelector('.t_f');
    const text   = post?.innerText.trim() || '';
    const date   = extractDate(text);
    const month  = date.slice(0, 7);  // 2025-01
	const year  = date.slice(0, 4);
	const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';

    const tasks = [];

    const rarLink = document.querySelector('p.attnm a[href]');
    if (rarLink) tasks.push({ url: rarLink.href, name: folder + safeTitle + '.rar' });

    const img = document.querySelector('.t_f img.zoom');
    if (img?.src) {
      const ext = img.src.split('.').pop().split('?')[0];
      tasks.push({ url: img.src, name: folder + safeTitle + '_cover.' + ext });
    }

    if (text.length > 50) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      tasks.push({ blob: blob, name: folder + safeTitle + '.txt' });
    }

    threadLog('Tải ' + safeTitle + tasks.length + ' file vào folder ' + date + '/');
    for (const [idx, t] of tasks.entries()) {
      const uniqueName = t.name.replace(/(\.\w+)$/, '$1');
      chrome.runtime.sendMessage({ action: 'download_file', url: t.blob ? URL.createObjectURL(t.blob) : t.url, filename: uniqueName });
      await wait(1500);
    }

    /* ---------- random 1 → 1,5 phút ---------- */
    const delay = 60000 + Math.floor(Math.random() * 30000); // 60000 → 90000 ms
    threadLog('Đã gửi xong, chờ ' + (delay / 1000).toFixed(0) + 's trước khi báo xong...');
    await wait(delay);

    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  }

  /* ---------- comment (random 1-1,5 phút) ---------- */
  async function startComment() {
    const comments = [
    '谢谢分享',
	'感谢楼主分享',
	'谢谢楼主分享，楼主辛苦了。',
	'谢谢楼主的分享~楼主辛苦了~',
	'感谢楼主无私的分享！'
    ];
    const pick = comments[Math.floor(Math.random() * comments.length)];
    const textarea = document.querySelector('#fastpostmessage');
    const btnReply = document.querySelector('#fastpostsubmit');
    if (!textarea || !btnReply) return;

    textarea.value = pick;
    threadLog('Comment ngẫu nhiên: ' + pick);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    btnReply.click();

    const delay = 60000 + Math.floor(Math.random() * 30000); // 60000 → 90000 ms
    threadLog('Comment xong, chờ ' + (delay / 1000).toFixed(0) + 's trước khi báo xong...');
    await wait(delay);

    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  }

  /* ---------- nhận lệnh từ LIST ---------- */
  window.addEventListener('message', e => {
    if (e.data?.action === 'start_download') downloadAll();
    if (e.data?.action === 'start_comment') startComment();
  });

  /* ---------- auto chạy nếu LIST mở (KHÔNG hiện UI) ---------- */
  const mode = location.hash.slice(1);
  if (window.opener && (location.pathname.startsWith('/thread-') || location.search.includes('mod=viewthread'))) {
    setTimeout(() => {
      if (mode === 'comment') startComment();
      else if (mode === 'download') downloadAll();
    }, 2000);
  }
})();