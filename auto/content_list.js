// content_list.js
(function () {
  let runningComment = false;
  let runningDownload = false;
  let startIdx = 1, endIdx = 1;          // biến chung

  /* ---------- chờ có #threadlist ---------- */
  function waitForThreadList(tries = 0) {
    if (tries > 50) return;
    if (!document.querySelector('#threadlist')) {
      return setTimeout(() => waitForThreadList(tries + 1), 100);
    }
    initUI();
  }
  waitForThreadList();

  /* ---------- tạo UI duy nhất ---------- */
  function initUI() {
  /* ---------- thêm CSS ---------- */
const style = document.createElement('style');
style.textContent = `
  #ctrlPanel {
    position: fixed;
    top: 12px;
    right: 12px;
    width: 200px;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 12px;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    font-size: 13px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,.08);
  }
  #ctrlPanel .row {
    margin-bottom: 8px;
    text-align: center;
  }
  #ctrlPanel input {
    width: 60px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    text-align: center;
    font-size: 13px;
  }
  #ctrlPanel button {
    width: 100%;
    padding: 8px 0;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: #fff;
  }
  #ctrlPanel .apply {
    background: #10b981; /* xanh lá */
  }
  #ctrlPanel .apply:hover {
    background: #059669;
  }
  #ctrlPanel .startC {
    background: #3b82f6; /* xanh dương */
    margin-bottom: 6px;
  }
  #ctrlPanel .startC:hover {
    background: #2563eb;
  }
  #ctrlPanel .startD {
    background: #f97316; /* cam */
  }
  #ctrlPanel .startD:hover {
    background: #ea580c;
  }
  #ctrlPanel .startC.stop,
  #ctrlPanel .startD.stop {
    background: #ef4444;
  }
  #ctrlPanel .startC.stop:hover,
  #ctrlPanel .startD.stop:hover {
    background: #dc2626;
  }
  #tdInfo {
    margin-top: 6px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
  }
  .normalthread-num {
    position: absolute;
    top: 4px;
    left: 4px;
    background: #3b82f6;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 4px;
    z-index: 10;
  }`
;
document.head.appendChild(style);

/* ---------- tạo UI theo hình ---------- */
const wrap = document.createElement('div');
wrap.id = 'ctrlPanel';
wrap.innerHTML =
  /* dòng 1: Start */
  '<div class="row" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;">Start&nbsp;<input id="tdStart" type="number" min="1" value="1"></div>' +
  
  /* dòng 2: End */
  '<div class="row" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;">End&nbsp;<input id="tdEnd" type="number" min="1"></div>' +
  
  /* dòng 3: Apply (xanh lá) */
  '<div class="row"><button class="apply" id="tdApply">Apply</button></div>' +

  /* dòng 4: START COMMENT (xanh dương) */
  '<div class="row"><button class="startC" id="btnComment">START COMMENT</button></div>' +

  /* dòng 5: START DOWNLOAD (cam) */
  '<div class="row"><button class="startD" id="btnDownload">START DOWNLOAD</button></div>' +

  /* dòng 6: Tổng */
  '<div id="tdInfo">Tổng: 0</div>';
document.body.appendChild(wrap);

  /* đánh số & mặc định */
  updateNumbers();
  document.getElementById('tdApply').onclick = () => {
    const max = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]')).length;
    startIdx = Math.max(1, parseInt(document.getElementById('tdStart').value) || 1);
    endIdx   = Math.max(1, parseInt(document.getElementById('tdEnd').value)   || max);
    if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];
    document.getElementById('tdInfo').textContent = 'Đã chọn: ' + startIdx + ' → ' + endIdx;
  };

  /* sự kiện nút START */
  document.getElementById('btnComment').onclick  = () => toggle('comment');
  document.getElementById('btnDownload').onclick = () => toggle('download');
}

  /* ---------- đánh số thứ tự ---------- */
  function updateNumbers() {
    const tbodies = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]'));
    document.querySelectorAll('.normalthread-num').forEach(el => el.remove());
    tbodies.forEach((tbody, idx) => {
      const badge = document.createElement('span');
      badge.className = 'normalthread-num';
      badge.textContent = idx + 1;
      badge.style.cssText = 'position:absolute;background:#ff6600;color:#fff;font-size:10px;padding:2px 4px;border-radius:3px;z-index:10;';
      tbody.style.position = 'relative';
      tbody.prepend(badge);
    });
    const max = tbodies.length;
    document.getElementById('tdEnd').placeholder = max;
    document.getElementById('tdEnd').value = max;
    document.getElementById('tdInfo').textContent = 'Tổng: ' + max;
  }

  /* ---------- toggle start/stop ---------- */
  function toggle(mode) {
    const isComment = mode === 'comment';
    const oldRunning = isComment ? runningComment : runningDownload;
    const newRunning = !oldRunning;
    if (isComment) runningComment = newRunning; else runningDownload = newRunning;

    document.getElementById(isComment ? 'btnComment' : 'btnDownload').textContent =
      newRunning ? (isComment ? 'STOP COMMENT' : 'STOP DOWNLOAD')
                 : (isComment ? 'START COMMENT' : 'START DOWNLOAD');

    if (newRunning) startProcessing(mode);
  }

  /* ---------- xử lý theo đoạn đã chọn ---------- */
  async function startProcessing(type) {
    const tbodiesAll = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]'));
    const tbodies = tbodiesAll.slice(startIdx - 1, endIdx);
    console.log('[LIST] Xử lý từ', startIdx, '→', endIdx, '/ tổng', tbodiesAll.length);

    for (let i = 0; i < tbodies.length; i++) {
      if ((type === 'comment' && !runningComment) || (type === 'download' && !runningDownload)) break;
      const a = tbodies[i].querySelector('th.new a.xst, th.common a.xst');
      if (!a) continue;
      console.log('[LIST] Mở thread:', a.href);
      const mode = type === 'comment' ? 'comment' : 'download';
      const tab  = window.open(a.href + '#' + mode, '_blank');
      if (!tab) continue;

      /* chờ tab con báo xong */
      await new Promise(resolve => {
        function onDone(e) { if (e.data?.action === 'thread_done') { window.removeEventListener('message', onDone); resolve(); } }
        window.addEventListener('message', onDone);
        setTimeout(() => { window.removeEventListener('message', onDone); resolve(); }, 80000);
      });

      if (!tab.closed) tab.close();
    }
    console.log('[LIST] Hoàn thành chuỗi');
    runningComment = runningDownload = false;
    document.getElementById('btnComment').textContent = 'START COMMENT';
    document.getElementById('btnDownload').textContent = 'START DOWNLOAD';
  }
})();
