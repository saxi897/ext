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
  let allLogs = []; // Mảng lưu trữ tất cả log

  /* ---------- utils ---------- */
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function safeName(name) { return name.replace(/[\\/:*?"<>|]/g, '_').trim(); }

  /* ---------- log gửi về cha ---------- */
  function threadLog(...args) {
    const msg = '[THREAD] ' + args.map(a => String(a)).join(' ');
    console.log(msg);
	
	// Lưu log vào mảng
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = msg;
    allLogs.push(logEntry);
	
    // Gửi về content_list (nếu có)
    if (window.opener) {
      window.opener.postMessage({ action: 'log', data: logEntry }, '*');
    }
    
    // Gửi về background để chuyển tiếp đến popup
    try {
      chrome.runtime.sendMessage({ action: 'log', data: logEntry });
    } catch (e) {
      console.log('Không thể gửi log đến popup:', e.message);
    }
  }

  /* ---------- tìm ngày trong text ---------- */
function extractDate(text) {
  console.log('🔍 Tìm ngày trong text:', text.substring(0, 100));
  
  // 1. yyyy-mm-dd完结 (có thể có space)
  let m = text.match(/(\d{4}-\d{2}-\d{2})\s*完结/);
  if (m) {
    threadLog('Tìm thấy ngày (định dạng 1): ' + m[1]);
    return m[1];
  }

  // 2. dd/mm/yyyy完结
  m = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*完结/);
  if (m) {
    const parts = m[1].split('/');
    const year = parts[2];
    const month = parts[1].padStart(2, '0');
    const day = parts[0].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    threadLog('Tìm thấy ngày (định dạng 2): ' + date);
    return date;
  }

  // 3. yyyy.mm.dd không có "完结"
  m = text.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
  if (m) {
    const parts = m[1].split('.');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    threadLog('Tìm thấy ngày (định dạng 3): ' + date);
    return date;
  }

  const defaultDate = new Date().toISOString().slice(0, 10);
  threadLog('Không tìm thấy ngày, dùng mặc định: ' + defaultDate);
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
    const year   = date.slice(0, 4);
    const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';

    const tasks = [];

    // Tìm file RAR
    const rarLink = document.querySelector('p.attnm a[href]');
    if (rarLink) {
      threadLog('📦 Tìm thấy file RAR');
      tasks.push({ url: rarLink.href, name: folder + safeTitle + '.rar' });
    } else {
      threadLog('❌ Không tìm thấy file RAR');
    }

    // Tìm ảnh cover
    const img = document.querySelector('.t_f img.zoom');
    if (img?.src) {
      threadLog('🖼 Tìm thấy ảnh');
      const ext = img.src.split('.').pop().split('?')[0];
      tasks.push({ url: img.src, name: folder + safeTitle + '_cover.' + ext });
    } else {
      threadLog('❌ Không tìm thấy ảnh');
    }

    // Tạo file text
    if (text.length > 50) {
      threadLog('📄 Tìm thấy text');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      tasks.push({ blob: blob, name: folder + safeTitle + '.txt' });
    } else {
      threadLog('❌ Không tìm thấy text đủ dài');
    }

    if (tasks.length === 0) {
      threadLog('❌ Không tìm thấy gì để download');
      finishThread();
      return;
    }

    threadLog('🚀 Bắt đầu download ' + tasks.length + ' file');
    
    for (const [idx, t] of tasks.entries()) {
      const uniqueName = t.name.replace(/(\.\w+)$/, '$1');
      threadLog('⬇️ Download: ' + uniqueName);
      
      try {
        if (t.blob) {
          // Tạo URL từ blob
          const blobUrl = URL.createObjectURL(t.blob);
          chrome.runtime.sendMessage({ 
            action: 'download_file', 
            url: blobUrl, 
            filename: uniqueName 
          });
        } else {
          // URL trực tiếp
          chrome.runtime.sendMessage({ 
            action: 'download_file', 
            url: t.url, 
            filename: uniqueName 
          });
        }
        await wait(1500);
      } catch (e) {
        threadLog('❌ Lỗi download: ' + e.message);
      }
    }

    const delay = 60000 + Math.floor(Math.random() * 30000);
    threadLog('⏳ Đã gửi xong, chờ ' + (delay / 1000).toFixed(0) + 's');
    await wait(delay);
	
	  threadLog('✅ Hoàn thành thread');
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
    threadLog('🎯 Bắt đầu comment');
    
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
      threadLog('❌ Không tìm thấy form comment');
      finishThread();
      return;
    }

    textarea.value = pick;
    threadLog('💬 Comment: ' + pick);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    btnReply.click();

    const delay = 60000 + Math.floor(Math.random() * 30000);
    threadLog('⏳ Comment xong, chờ ' + (delay / 1000).toFixed(0) + 's');
    await wait(delay);
	
	  threadLog('✅ Hoàn thành thread');
    finishThread();
  }

/* ---------- tạo và download file log ---------- */
  function createAndDownloadLog() {
    try {
      const title = document.querySelector('#thread_subject')?.textContent?.trim() || 'novel';
      const safeTitle = safeName(title);
      const post = document.querySelector('.t_f');
      const text = post?.innerText?.trim() || '';
      const date = extractDate(text);
      const month = date.slice(0, 7);
      const year = date.slice(0, 4);
      const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';
      
      // Thêm thông tin tổng kết vào log
      const summary = [
        '\n\n=== TỔNG KẾT THREAD ===',
        `Tiêu đề: ${title}`,
        `Ngày: ${date}`,
        `Tổng số log: ${allLogs.length}`,
        `Thời gian kết thúc: ${new Date().toLocaleString()}`,
        '====================='
      ].join('\n');
      
      const fullLog = [
        '=== LOG THREAD ===',
        ...allLogs,
        summary
      ].join('\n');
      
      const logFilename = title + '_log.txt';
      const blob = new Blob([fullLog], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      threadLog(`📄 Tạo file log: ${logFilename} với ${allLogs.length} log entries`);
      
      chrome.runtime.sendMessage({ 
        action: 'download_file', 
        url: url, 
        filename: logFilename 
      });
      
    } catch (error) {
      threadLog(`❌ Lỗi tạo file log: ${error.message}`);
    }
  }
  
  /* ---------- kết thúc thread ---------- */
  function finishThread() {
    threadLog('🏁 Hoàn thành thread');
	
	  // Tạo và download file log
    createAndDownloadLog();
	
    // Gửi thông báo hoàn thành
    if (window.opener) {
      window.opener.postMessage({ action: 'thread_done' }, '*');
	    threadLog('📤 Đã gửi thread_done đến content_list');
    }
    
    try {
      chrome.runtime.sendMessage({ action: "thread_done" });
      threadLog('📤 Đã gửi thread_done đến background');
    } catch (e) {
      threadLog('❌ Không thể gửi thread_done đến background: ' + e.message);
    }
	
    isRunning = false;
	  threadLog('🔚 Kết thúc thread');
  }

  /* ---------- nhận lệnh từ POPUP (chrome.runtime) ---------- */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    threadLog('📩 Nhận message từ popup: ' + msg.action);
    
    // Handler cho ping
    if (msg.action === 'ping') {
      threadLog('🏓 Nhận ping, trả lời');
      sendResponse({ received: true });
      return true;
    }
    
    if (msg.action === 'start_download') {
      threadLog('🚀 Nhận lệnh download từ popup');
      downloadAll();
      sendResponse({ received: true });
      return true;
    }
    
    if (msg.action === 'start_comment') {
      threadLog('🚀 Nhận lệnh comment từ popup');
      startComment();
      sendResponse({ received: true });
      return true;
    }
    
    return true;
  });

  /* ---------- nhận lệnh từ CONTENT_LIST ---------- */
  window.addEventListener('message', (e) => {
    if (e.data && typeof e.data === 'object') {
      threadLog('📩 Nhận message từ content_list: ' + e.data.action);
      
      if (e.data.action === 'start_download' && !isRunning) {
        threadLog('🚀 Nhận lệnh download từ content_list');
        downloadAll();
      }
      
      if (e.data.action === 'start_comment' && !isRunning) {
        threadLog('🚀 Nhận lệnh comment từ content_list');
        startComment();
      }
    }
  });

  // Tự động chạy nếu có hash trong URL
  const hash = window.location.hash;
  if (hash === '#download' && !isRunning) {
    threadLog('🔍 Phát hiện hash #download, tự động chạy download');
    setTimeout(() => downloadAll(), 1000);
  } else if (hash === '#comment' && !isRunning) {
    threadLog('🔍 Phát hiện hash #comment, tự động chạy comment');
    setTimeout(() => startComment(), 1000);
  }

  console.log('✅ content_thread.js đã sẵn sàng, chờ lệnh');
})();