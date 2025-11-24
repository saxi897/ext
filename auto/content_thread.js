// content_thread.js
(function () {
  // KIỂM TRA ĐÃ CHẠY CHƯA - TRÁNH CHẠY 2 LẦN
  if (window.contentThreadLoaded) {
    console.log('⚠️ content_thread.js đã chạy rồi, bỏ qua');
    return;
  }
  window.contentThreadLoaded = true;
  
  console.log('✅ content_thread.js đã chạy - CHỈ 1 LẦN');

  let isRunning = false;

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
  console.log('🔍 Tìm ngày trong text:', text);
  
  // 1. yyyy-mm-dd完结 (có thể có space)
  let m = text.match(/(\d{4}-\d{2}-\d{2})\s*完结/);
  if (m) {
    return m[1];
  }

  // 2. dd/mm/yyyy完结
  m = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*完结/);
  if (m) {
    const date = m[1].split('/').reverse().join('-');
    return date;
  }

  // 7. THÊM: Định dạng yyyy.mm.dd không có "完结"
  m = text.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
  if (m) {
    const parts = m[1].split('.');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    return date;
  }

  const defaultDate = new Date().toISOString().slice(0, 10);
  return defaultDate;
}

  /* ---------- download full ---------- */
  async function downloadAll() {
    if (isRunning) {
      console.log('⚠️ downloadAll đang chạy, bỏ qua');
      return;
    }
    isRunning = true;
    
    console.log('🎯 Bắt đầu downloadAll');
    threadLog('Bắt đầu download');
    
    const title = document.querySelector('#thread_subject')?.textContent?.trim() || 'novel';
    const safeTitle = safeName(title);
    const post   = document.querySelector('.t_f');
    const text   = post?.innerText?.trim() || '';
    const date   = extractDate(text);
    const month  = date.slice(0, 7);
    const year  = date.slice(0, 4);
    const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';

    const tasks = [];

    const rarLink = document.querySelector('p.attnm a[href]');
    if (rarLink) {
      threadLog('Tìm thấy file RAR');
      tasks.push({ url: rarLink.href, name: folder + safeTitle + '.rar' });
    }

    const img = document.querySelector('.t_f img.zoom');
    if (img?.src) {
      threadLog('Tìm thấy ảnh cover');
      const ext = img.src.split('.').pop().split('?')[0];
      tasks.push({ url: img.src, name: folder + safeTitle + '_cover.' + ext });
    }

    if (text.length > 50) {
      threadLog('Tìm thấy text content');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      tasks.push({ blob: blob, name: folder + safeTitle + '.txt' });
    }

    if (tasks.length === 0) {
      threadLog('Không tìm thấy gì để download');
      finishThread();
      return;
    }

    threadLog('Bắt đầu download ' + tasks.length + ' file');
    
    for (const [idx, t] of tasks.entries()) {
      const uniqueName = t.name.replace(/(\.\w+)$/, '$1');
      threadLog('Download: ' + uniqueName);
      
      try {
        chrome.runtime.sendMessage({ 
          action: 'download_file', 
          url: t.blob ? URL.createObjectURL(t.blob) : t.url, 
          filename: uniqueName 
        });
        await wait(1500);
      } catch (e) {
        threadLog('Lỗi download: ' + e.message);
      }
    }

    const delay = 60000 + Math.floor(Math.random() * 30000);
    threadLog('Đã gửi xong, chờ ' + (delay / 1000).toFixed(0) + 's');
    await wait(delay);

    finishThread();
  }

  /* ---------- comment ---------- */
  async function startComment() {
    if (isRunning) {
      console.log('⚠️ startComment đang chạy, bỏ qua');
      return;
    }
    isRunning = true;
    
    console.log('🎯 Bắt đầu startComment');
    threadLog('Bắt đầu comment');
    
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
    
    if (!textarea || !btnReply) {
      threadLog('Không tìm thấy form comment');
      finishThread();
      return;
    }

    textarea.value = pick;
    threadLog('Comment: ' + pick);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    btnReply.click();

    const delay = 60000 + Math.floor(Math.random() * 30000);
    threadLog('Comment xong, chờ ' + (delay / 1000).toFixed(0) + 's');
    await wait(delay);

    finishThread();
  }

  /* ---------- kết thúc thread ---------- */
  function finishThread() {
    threadLog('Hoàn thành thread');
    chrome.runtime.sendMessage({ action: "thread_done" });
    if (window.opener) {
      window.opener.postMessage({ action: 'thread_done' }, '*');
    }
    isRunning = false;
  }

  /* ---------- nhận lệnh từ POPUP (chrome.runtime) ---------- */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('📩 content_thread nhận message:', msg);
    
    // THÊM: Handler cho ping
    if (msg.action === 'ping') {
      console.log('🏓 Nhận ping, trả lời');
      sendResponse({ received: true });
      return true;
    }
    
    if (msg.action === 'start_download') {
      console.log('🚀 Nhận lệnh download từ popup');
      downloadAll();
      sendResponse({ received: true });
    }
    if (msg.action === 'start_comment') {
      console.log('🚀 Nhận lệnh comment từ popup');
      startComment();
      sendResponse({ received: true });
    }
    return true;
  });

  /* ---------- nhận lệnh từ CONTENT_LIST (window.postMessage) ---------- */
  window.addEventListener('message', (e) => {
    console.log('📩 content_thread nhận message từ content_list:', e.data);
    
    if (e.data?.action === 'start_download' && !isRunning) {
      console.log('🚀 Nhận lệnh download từ content_list');
      downloadAll();
    }
    if (e.data?.action === 'start_comment' && !isRunning) {
      console.log('🚀 Nhận lệnh comment từ content_list');
      startComment();
    }
  });

  console.log('✅ content_thread.js đã sẵn sàng, chờ lệnh');
})();