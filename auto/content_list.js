// content_list.js
(function () {
  let runningComment = false;
  let runningDownload = false;
  let startIdx = 1, endIdx = 1;

  /* ---------- chờ DOM ---------- */
  function waitForThreadList(tries = 0) {
    if (tries > 50) return;
    if (!document.querySelector('#threadlist')) {
      return setTimeout(() => waitForThreadList(tries + 1), 100);
    }
    initUI();
  }
  waitForThreadList();

/* ---------- hàm ghi log lên UI ---------- */
function addLog(text) {
  const box = document.getElementById('logArea');
  if (!box) return; // chưa có UI → thoát
  const line = document.createElement('div');
  line.textContent = '[LIST] ' + text;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight; // auto cuộn
  // giữ tối đa 50 dòng
  while (box.children.length > 50) box.firstChild.remove();
}

  /* ---------- UI ---------- */
function initUI() {
  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #ctrlPanel{
     position:fixed;top:12px;right:12px;width:270px;background:#ffffff;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:13px;color:#1f2937;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;flex-direction:column;gap:6px;
    }
    #ctrlPanel .row{display:flex;align-items:center;justify-content:space-between;gap:6px;}
    #ctrlPanel input{width:50px;padding:4px 6px;border:1px solid #d1d5db;border-radius:4px;text-align:center;font-size:13px;}
    #ctrlPanel button{padding:8px 5px;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:.2s;}
    #ctrlPanel .apply{background:#10b981;flex:0 0 auto;padding:6px 10px;}
    #ctrlPanel .apply:hover{background:#059669;}
    #ctrlPanel .startC{background:#3b82f6;}#ctrlPanel .startC:hover{background:#2563eb;}
    #ctrlPanel .startD{background:#f97316;}#ctrlPanel .startD:hover{background:#ea580c;}
    #ctrlPanel .startC.stop,#ctrlPanel .startD.stop{background:#ef4444;}
    #ctrlPanel .startC.stop:hover,#ctrlPanel .startD.stop:hover{background:#dc2626;}
    #tdInfo,#logArea{margin-top:4px;text-align:center;font-size:12px;color:#6b7280;}
    #logArea{border:1px solid #e5e7eb;border-radius:6px;padding:6px;font-family:monospace;font-size:12px;line-height:1.4;max-height:100px;overflow-y:auto;background:#f9fafb;}
    .normalthread-num{position:absolute;top:4px;left:4px;background:#3b82f6;color:#fff;font-size:11px;font-weight:600;padding:3px 6px;border-radius:4px;z-index:10;}
  `;
  document.head.appendChild(style);

  /* ---------- HTML 4 dòng ---------- */
  const wrap = document.createElement('div');
  wrap.id = 'ctrlPanel';
  wrap.innerHTML =
    /* dòng 1: Start - End - Apply */
    '<div class="row">' +
      '<span>Start</span><input id="tdStart" type="number" min="1" value="1">' +
      '<span>End</span><input id="tdEnd" type="number" min="1">' +
      '<button class="apply" id="tdApply">Apply</button>' +
    '</div>' +
    /* dòng 2: số thread */
    '<div id="tdInfo">Tổng: 0</div>' +
    /* dòng 3: nút (cùng hàng) */
    '<div class="row">' +
      '<button class="startD" id="btnDownload">START DOWNLOAD</button>' +
      '<button class="startC" id="btnComment">START COMMENT</button>' +
    '</div>' +
    /* dòng 4: bảng log */
    '<div id="logArea" title="Log từ tab con"></div>';
  document.body.appendChild(wrap);

  /* ---------- chức năng ---------- */
  updateNumbers();
  document.getElementById('tdApply').onclick = () => {
    const max = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]')).length;
    startIdx = Math.max(1, parseInt(document.getElementById('tdStart').value) || 1);
    endIdx   = Math.max(1, parseInt(document.getElementById('tdEnd').value)   || max);
    if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];
    addLog('[LIST] Đã chọn: ' + startIdx + ' → ' + endIdx);
  };
  document.getElementById('btnComment').onclick  = () => toggle('comment');
  document.getElementById('btnDownload').onclick = () => toggle('download');

  /* ---------- log area ---------- */
  const logArea = document.getElementById('logArea');
  window.addEventListener('message', e => {
    if (e.data?.action === 'log') addLog(e.data.data);
    if (e.data?.action === 'thread_done') window.removeEventListener('message', arguments.callee);
  });
  
}




  function updateNumbers() {
    const tbodies = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]'));
    document.querySelectorAll('.normalthread-num').forEach(el => el.remove());
    tbodies.forEach((tbody, idx) => {
		if (!document.body.contains(tbody)) return;
      const badge = document.createElement('span');
      badge.className = 'normalthread-num';
      badge.textContent = idx + 1;
      tbody.style.position = 'relative';
      tbody.prepend(badge);
    });
    const max = tbodies.length;
    document.getElementById('tdEnd').placeholder = max;
    document.getElementById('tdEnd').value = max;
    document.getElementById('tdInfo').textContent = 'Tổng: ' + max;
  }

  function toggle(mode) {
    const isComment = mode === 'comment';
    const oldRunning = isComment ? runningComment : runningDownload;
    const newRunning = !oldRunning;
    if (isComment) runningComment = newRunning; else runningDownload = newRunning;

    document.getElementById(isComment ? 'btnComment' : 'btnDownload').textContent =
      newRunning ? (isComment ? 'STOP COMMENT' : 'STOP DOWNLOAD') : (isComment ? 'START COMMENT' : 'START DOWNLOAD');

    if (newRunning) startProcessing(mode);
  }

  async function startProcessing(type) {
    const tbodiesAll = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]'));
    const tbodies = tbodiesAll.slice(startIdx - 1, endIdx);
    addLog('[LIST] Xử lý từ', startIdx, '→', endIdx, '/ tổng', tbodiesAll.length);

    for (let i = 0; i < tbodies.length; i++) {
      if ((type === 'comment' && !runningComment) || (type === 'download' && !runningDownload)) break;
      const a = tbodies[i].querySelector('th.new a.xst, th.common a.xst, th.lock a.xst');
      if (!a) continue;
      addLog('[LIST] Mở link:', a.href, '(link số ' + (startIdx + i) + ')');
      const mode = type === 'comment' ? 'comment' : 'download';
      const tab = window.open(a.href + '#' + mode, '_blank');
      if (!tab) continue;

      await new Promise(resolve => {
        function onDone(e) {
          if (e.data?.action === 'thread_done') {
            window.removeEventListener('message', onDone);
            resolve();
          }
        }
        window.addEventListener('message', onDone);
        setTimeout(() => {
          window.removeEventListener('message', onDone);
          resolve();
        }, 80000);
      });

      if (!tab.closed) tab.close();
    }
    addLog('[LIST] Hoàn thành chuỗi');
    runningComment = runningDownload = false;
    document.getElementById('btnComment').textContent = 'START COMMENT';
    document.getElementById('btnDownload').textContent = 'START DOWNLOAD';
  }
})();
