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
    const wrap = document.createElement('div');
    wrap.id = 'ctrlPanel';
    wrap.style.cssText =
      'position:fixed;top:10px;right:20px;z-index:999999;background:#fff;border:1px solid #999;padding:8px;border-radius:6px;font-size:12px;width:200px;';
    wrap.innerHTML =
      'Start <input id="tdStart" type="number" min="1" value="1" style="width:50px"><br>' +
      'End <input id="tdEnd" type="number" min="1" style="width:50px"><br>' +
      '<button id="tdApply">Apply</button> ' +
      '<button id="btnComment">START COMMENT</button> ' +
      '<button id="btnDownload">START DOWNLOAD</button>' +
      '<div id="tdInfo" style="margin-top:4px;color:#555"></div>';
    document.body.appendChild(wrap);

    /* đánh số & giá trị mặc định */
    updateNumbers();
    document.getElementById('tdApply').onclick = () => {
      const max = Array.from(document.querySelectorAll('#threadlist table > tbody[id^="normalthread_"]')).length;
      startIdx = Math.max(1, parseInt(document.getElementById('tdStart').value) || 1);
      endIdx   = Math.max(1, parseInt(document.getElementById('tdEnd').value)   || max);
      if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];
      document.getElementById('tdInfo').textContent = 'Đã chọn: ' + startIdx + ' → ' + endIdx;
    };

    /* sự kiện 2 nút START */
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
