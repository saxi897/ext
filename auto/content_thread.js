// content_thread.js
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

  /* ---------- CSS & UI ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #downUI{position:fixed;top:12px;right:310px;z-index:999999;display:flex;gap:8px;}
    #downUI button{padding:8px 12px;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:.2s;}
    #btnTxt{background:#10b981;}#btnTxt:hover{background:#059669;}
    #btnJpg{background:#3b82f6;}#btnJpg:hover{background:#2563eb;}
  `;
  document.head.appendChild(style);

  /* ---------- chỉ tải 1 loại ---------- */
  async function downloadOnly(type) {
    const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
    const safeTitle = safeName(title);
    const date   = extractDate(document.querySelector('.t_f')?.innerText || '');
    const folder = date + '/' + safeTitle + '/';

    if (type === 'txt') {
      const text = document.querySelector('.t_f')?.innerText.trim() || '';
      if (text.length < 50) { threadLog('Không có nội dung text'); return; }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const name = folder + safeTitle + '.txt';
      threadLog('TXT: ' + name);
      chrome.runtime.sendMessage({ action: 'download_file', url: URL.createObjectURL(blob), filename: name });
    }

    if (type === 'jpg') {
      const img = document.querySelector('.t_f img.zoom');
      if (!img?.src) { threadLog('Không có cover'); return; }
      const ext = img.src.split('.').pop().split('?')[0];
      const name = folder + safeTitle + '_cover.' + ext;
      threadLog('JPG: ' + name);
      chrome.runtime.sendMessage({ action: 'download_file', url: img.src, filename: name });
    }
  }

  /* ---------- tạo UI ---------- */
  function createDownUI() {
    const wrap = document.createElement('div');
    wrap.id = 'downUI';
    wrap.innerHTML =
      '<button id="btnTxt" title="Chỉ tải text">📄 Download TXT</button>' +
      '<button id="btnJpg" title="Chỉ tải cover">🖼 Download JPG</button>';
    document.body.appendChild(wrap);

    document.getElementById('btnTxt').onclick = () => downloadOnly('txt');
    document.getElementById('btnJpg').onclick = () => downloadOnly('jpg');
  }

  /* ---------- chỉ hiện UI khi KHÔNG phải LIST mở ---------- */
if (!window.opener || window.opener.location.origin !== window.location.origin) {
  console.log('[THREAD] Tab mở bằng tay → hiện UI');
  setTimeout(() => createDownUI(), 500);
} else {
  console.log('[THREAD] LIST mở tab → KHÔNG hiện UI');
  // vẫn chạy nếu LIST gọi #download / #comment
  const mode = location.hash.slice(1);
  if (mode === 'comment') startComment();
  else if (mode === 'download') downloadAll();
}

  /* ---------- comment (giữ lại nếu LIST gọi) ---------- */
  async function startComment() {
    const textarea = document.querySelector('#fastpostmessage');
    const btnReply = document.querySelector('#fastpostsubmit');
    if (!textarea || !btnReply) return;

    /* ---------- random 1 trong 3 câu ---------- */
	const comments = [
	'谢谢分享',
	'感谢楼主分享',
	'谢谢楼主分享，楼主辛苦了。',
	'谢谢楼主的分享~楼主辛苦了~',
	'感谢楼主无私的分享！'
	];
	const pick = comments[Math.floor(Math.random() * comments.length)];
	textarea.value = pick;
	threadLog('Comment: ' + pick);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    btnReply.click();
	

    /* ---------- random 1 → 2 phút ---------- */
	const delay = 60000 + Math.floor(Math.random() * 30000); // 60000 → 120000
	threadLog('Comment xong, chờ ' + (delay / 1000).toFixed(0) + 's trước khi báo xong...');
	await wait(delay);

    if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
    window.close();
  }

  /* ---------- download full (nếu LIST gọi) ---------- */
  async function downloadAll() {
    const title = document.querySelector('#thread_subject')?.textContent.trim() || 'novel';
    const safeTitle = safeName(title);
    const post   = document.querySelector('.t_f');
    const text   = post?.innerText.trim() || '';
    const date   = extractDate(text); // 2025-01-22
	const month  = date.slice(0, 7);  // 2025-01
	const year  = date.slice(0, 4);
	const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/'; // 2025-01/2025-01-22/《title》/

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
	/* ---------- gửi xong 3 file ---------- */
    for (const [idx, t] of tasks.entries()) {
  const uniqueName = t.name.replace(/(\.\w+)$/, '$1');
  chrome.runtime.sendMessage({ action: 'download_file', url: t.blob ? URL.createObjectURL(t.blob) : t.url, filename: uniqueName });
  await wait(1500);
}

/* ---------- random 1 → 2 phút ---------- */
const delay = Math.floor(Math.random() * 60000); // 60000 → 120000
threadLog('Đã gửi xong 3 file, chờ ' + (delay / 1000).toFixed(0) + 's...');
await wait(delay);

/* ---------- báo xong ---------- */
if (window.opener) window.opener.postMessage({ action: 'thread_done' }, '*');
window.close();
  }
})();
