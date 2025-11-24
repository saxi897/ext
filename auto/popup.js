// popup.js
let links = [];
let allPopupLogs = []; // Mảng lưu trữ tất cả log từ popup

/* ---------- các nút start ---------- */
document.getElementById('btnTxt').onclick = () => downloadOnly('txt');
document.getElementById('btnJpg').onclick = () => downloadOnly('jpg');
document.getElementById('startDown').onclick = () => startAll('download');
document.getElementById('startComment').onclick = () => startAll('comment');
document.getElementById('translatePage').onclick = () => translateCurrentPage();
document.getElementById('addLink').onclick = () => addLinks();

// Lắng nghe log từ background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'log') {
    addLog(msg.data);
  }
  if (msg.action === 'thread_done') {
    addLog('✅ Nhận thread_done từ background');
  }
});

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  // Lưu log vào mảng
  allPopupLogs.push(logEntry);
  
  const logArea = document.getElementById('logArea');
  const logEntryElement = document.createElement('div');
  logEntryElement.textContent = logEntry;
  logArea.appendChild(logEntryElement);
  logArea.scrollTop = logArea.scrollHeight;
  console.log(message);
}

/* ---------- tạo file log tổng hợp từ popup ---------- */
function createPopupSummaryLog(mode, linksCount) {
  try {
    const summary = [
      '=== TỔNG KẾT POPUP ===',
      `Chế độ: ${mode}`,
      `Số link đã xử lý: ${linksCount}`,
      `Thời gian hoàn thành: ${new Date().toLocaleString()}`,
      `Tổng số log: ${allPopupLogs.length}`,
      '\n=== CHI TIẾT LOG ===',
      ...allPopupLogs
    ].join('\n');
    
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Tạo link download
    const a = document.createElement('a');
    a.href = url;
    a.download = `popup_${mode}_${new Date().toISOString().slice(0, 10)}_log.txt`;
    a.click();
    
    addLog(`📄 Đã tạo file log tổng hợp popup: ${a.download}`);
    
  } catch (error) {
    addLog(`❌ Lỗi tạo file log popup: ${error.message}`);
  }
}

/* ---------- add link ---------- */
function addLinks() {
  const raw = document.getElementById('linksInput').value.trim();
  if (!raw) return;
  links = raw.split('\n').map(l => l.trim()).filter(l => l);
  renderList();
}

function renderList() {
  const box = document.getElementById('logArea');
  box.innerHTML = '';
  links.forEach((l, i) => {
    const div = document.createElement('div');
    div.textContent = `${i + 1}. ${l}`;
    box.appendChild(div);
  });
}

/* ---------- start TẤT CẢ link ---------- */
async function startAll(mode) {
  if (links.length === 0) return alert('Chưa có link!');
  document.getElementById('startDown').disabled = true;
  document.getElementById('startComment').disabled = true;

  try {
    for (const url of links) {
      addLog('Mở: ' + url);
      await processPage(url, mode);
    }
    addLog('🎉 Hoàn thành tất cả link!');
	
	// Tạo file log tổng hợp khi hoàn thành
    createPopupSummaryLog(mode, links.length);
	
  } catch (error) {
    console.error('Lỗi:', error);
    addLog('❌ Có lỗi xảy ra: ' + error.message);
  } finally {
	  document.getElementById('startDown').disabled = false;
    document.getElementById('startComment').disabled = false;
  }
}

/* ---------- xử lý 1 LINK (mở tab mới) ---------- */
async function processPage(url, mode) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, async tab => {
      try {
        // chờ load xong
        await new Promise(r => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              r();
            }
          });
        });

        addLog('Đã load xong trang list');

        // inject content_list.js vào trang list
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_list.js']
          });
          addLog('Đã inject content_list.js');
        } catch (e) {
          addLog('Lỗi inject content_list: ' + e.message);
        }

        // inject: lấy tất cả normalthread
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getThreads
        });
        
        const threads = result[0]?.result || [];
        
        if (threads.length === 0) {
          addLog('Không tìm thấy thread nào trong trang này');
          chrome.tabs.remove(tab.id);
          resolve();
          return;
        }

        addLog(`Tìm thấy ${threads.length} thread`);

        // chạy từng thread
        for (const t of threads) {
          if (!t.url) continue;
          addLog('Xử lý thread: ' + t.title);
          await runThread(t.url, mode);
        }

        // đóng tab & sang link tiếp
        chrome.tabs.remove(tab.id);
        resolve();
      } catch (error) {
        addLog('Lỗi processPage: ' + error.message);
        reject(error);
      }
    });
  });
}

/* ---------- chạy 1 thread (mở tab mới) ---------- */
async function runThread(url, mode) {
  return new Promise(async (resolve) => {
    let tab;
    try {
      addLog(`Mở thread: ${url}`);
      
      // Mở tab mới cho thread
      tab = await chrome.tabs.create({ 
        url: url,
        active: false 
      });
      
      // Chờ tab load xong
      await new Promise(r => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            r();
          }
        });
      });

      addLog('Đã load xong thread');

      // KIỂM TRA content_thread.js đã có chưa, nếu chưa thì inject
      let contentThreadReady = false;
      try {
        // Thử gửi message để kiểm tra
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        if (response?.received) {
          contentThreadReady = true;
          addLog('content_thread.js đã sẵn sàng');
        }
      } catch (e) {
        addLog('content_thread.js chưa sẵn sàng, tiến hành inject');
      }

      // Nếu content_thread.js chưa có, inject thủ công
      if (!contentThreadReady) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_thread.js']
          });
          addLog('Đã inject content_thread.js');
          // Đợi script load
          await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
          addLog('Lỗi inject content_thread: ' + e.message);
        }
      }

      // Gửi message để kích hoạt download/comment
      try {
        const action = mode === 'download' ? 'start_download' : 'start_comment';
        addLog(`Gửi message: ${action}`);
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: action });
        if (response?.received) {
          addLog('Đã nhận phản hồi từ content_thread');
        } else {
          addLog('Đã gửi message thành công');
        }
      } catch (e) {
        addLog('Lỗi gửi message: ' + e.message);
        // Thử lại sau 2 giây
        await new Promise(r => setTimeout(r, 2000));
        try {
          await chrome.tabs.sendMessage(tab.id, { 
            action: mode === 'download' ? 'start_download' : 'start_comment' 
          });
          addLog('Gửi message lần 2 thành công');
        } catch (e2) {
          addLog('Lỗi gửi message lần 2: ' + e2.message);
        }
      }

      // Chờ thread hoàn thành (thông qua background)
      await new Promise(r => {
        const timeout = setTimeout(() => {
          addLog('Timeout thread, tiếp tục thread tiếp theo');
          chrome.runtime.onMessage.removeListener(listener);
          r();
        }, 120000);

        function listener(msg) {
          if (msg.action === 'thread_done') {
            addLog('Thread hoàn thành');
            chrome.runtime.onMessage.removeListener(listener);
            clearTimeout(timeout);
            r();
          }
        }
        
        chrome.runtime.onMessage.addListener(listener);
      });

      // Đóng tab thread
      await chrome.tabs.remove(tab.id);
      addLog('Đã đóng tab thread');
      resolve();
      
    } catch (error) {
      addLog('Lỗi runThread: ' + error.message);
      // Đảm bảo đóng tab nếu có lỗi
      if (tab?.id) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {}
      }
      resolve();
    }
  });
}

/* ---------- inject: lấy tất cả normalthread ---------- */
function getThreads() {
  console.log('Bắt đầu tìm thread...');
  const tbodies = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]'));
  console.log('Tìm thấy', tbodies.length, 'tbody');
  
  const threads = tbodies.map(tbody => {
    const a = tbody.querySelector('th a.xst');
    const thread = { 
      id: tbody.id, 
      title: a?.textContent?.trim() || 'unknown', 
      url: a?.href || '' 
    };
    console.log('Thread:', thread);
    return thread;
  });
  
  return threads;
}

async function downloadOnly(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPageData
  });
  
  if (!results || !results[0] || !results[0].result) {
    addLog('Không thể lấy dữ liệu trang');
    return;
  }
  
  const { title, text, imgSrc, date } = results[0].result;

  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').trim();
  const month  = date.slice(0, 7);
  const year  = date.slice(0, 4);
  const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';

  if (type === 'txt') {
    if (!text) {
      addLog('Không có nội dung text!');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url: url, filename: folder + safeTitle + '.txt' });
    addLog('Đã tải xuống file txt');
  }

  if (type === 'jpg') {
    if (!imgSrc) {
      addLog('Không có cover!');
      return;
    }
    const ext = imgSrc.split('.').pop().split('?')[0];
    await chrome.downloads.download({ url: imgSrc, filename: folder + safeTitle + '_cover.' + ext });
    addLog('Đã tải xuống cover');
  }

  window.close();
}

function getPageData() {
  const title = document.querySelector('#thread_subject')?.textContent?.trim() || 'novel';
  const text = document.querySelector('.t_f')?.innerText?.trim() || '';
  const img = document.querySelector('.t_f img.zoom');
  const imgSrc = img?.src || '';
  const raw = document.querySelector('.t_f')?.innerText || '';
  const clean = raw.replace(/<i[^>]*>.*?<\/i>/gi, '');

  // Hàm extractDate cho popup (giống với content_thread.js)
  function extractDate(text) {
    console.log('🔍 [Popup] Tìm ngày trong text:', text.substring(0, 100)); // Log 100 ký tự đầu
    
    // 1. yyyy-mm-dd完结 (có thể có space)
    let m = text.match(/(\d{4}-\d{2}-\d{2})\s*完结/);
    if (m) return m[1];

    // 2. dd/mm/yyyy完结
    m = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*完结/);
    if (m) return m[1].split('/').reverse().join('-');

    // 7. yyyy.mm.dd không có "完结"
    m = text.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
    if (m) {
      const parts = m[1].split('.');
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return new Date().toISOString().slice(0, 10);
  }

  const date = extractDate(clean);

  return { title, text, imgSrc, date };
}

/* ---------- nút dịch trang ---------- */
async function translateCurrentPage() {
  try {
    // Lấy tab đang active
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      addLog('Không tìm thấy tab nào');
      return;
    }

    addLog('Đang dịch trang...');

    // Inject các script cần thiết
    try {
      // Inject qt.js trước
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['qt.js']
      });
      
      // Inject laongu.js sau
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['laongu.js']
      });
      
      addLog('Đã inject script dịch thuật');
    } catch (e) {
      addLog('Lỗi inject script: ' + e.message);
    }

    // Chờ script load
    await new Promise(r => setTimeout(r, 2000));

    // Gửi message để kích hoạt dịch
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'translate_page' });
      addLog('Đã kích hoạt dịch trang');
    } catch (e) {
      addLog('Lỗi kích hoạt dịch: ' + e.message);
      // Thử cách khác - execute script trực tiếp
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: manuallyActivateTranslation
      });
      addLog('Đã kích hoạt dịch bằng script trực tiếp');
    }

  } catch (error) {
    addLog('Lỗi dịch trang: ' + error.message);
  }
}

// Hàm chạy trong trang để kích hoạt dịch
function manuallyActivateTranslation() {
  if (typeof window.activateTranslation === 'function') {
    window.activateTranslation();
  } else {
    // Tạo nút dịch nếu chưa có
    const button = document.createElement('button');
    button.innerHTML = '🌐 Dịch';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10000;
    `;
    button.onclick = function() {
      if (typeof window.activateTranslation === 'function') {
        window.activateTranslation();
      }
    };
    document.body.appendChild(button);
    
    // Click nút sau 1 giây
    setTimeout(() => {
      button.click();
    }, 1000);
  }
}
