// popup.js
document.getElementById('btnTxt').onclick = () => downloadOnly('txt');
document.getElementById('btnJpg').onclick = () => downloadOnly('jpg');

async function downloadOnly(type) {
  // lấy tab đang active
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // inject code để lấy nội dung & ngày
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPageData
  });
  const { title, text, imgSrc, date } = results[0].result;

  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').trim();
  const month  = date.slice(0, 7);  // 2025-01
	const year  = date.slice(0, 4);
    const folder = year + '/' + month + '/' + date + '/' + safeTitle + '/';

  if (type === 'txt') {
    if (!text) return alert('Không có nội dung text!');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url: url, filename: folder + safeTitle + '.txt' });
  }

  if (type === 'jpg') {
    if (!imgSrc) return alert('Không có cover!');
    const ext = imgSrc.split('.').pop().split('?')[0];
    await chrome.downloads.download({ url: imgSrc, filename: folder + safeTitle + '_cover.' + ext });
  }

  window.close(); // đóng popup sau khi nhấn
}

// hàm chạy trong tab đang active
function getPageData() {
  const title = document.querySelector('#thread_subject')?.textContent?.trim() || 'novel';
  const text = document.querySelector('.t_f')?.innerText?.trim() || '';
  const img = document.querySelector('.t_f img.zoom');
  const imgSrc = img?.src || '';
  // tìm ngày trong text
	const raw = document.querySelector('.t_f')?.innerText || '';
	const clean = raw.replace(/<i[^>]*>.*?<\/i>/gi, ''); // loại bỏ thẻ <i>
	// 1. bắt yyyy-mm-dd (có thể có space) – sau bất kỳ chữ nào
	const m = clean.match(/(\d{4}-\d{2}-\d{2})\s*完结/);
	const date = m ? m[1] : new Date().toISOString().slice(0, 10);
	// 2. dd.mm.yyyy → chuyển thành yyyy-mm-dd
	const m2 = clean.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*完结/);
	if (m2) return m2[1].split('.').reverse().join('-').replace(/-(\d)\b/g, '-0$1'); // 2025.04.07 → 2025-04-07
  return { title, text, imgSrc, date };
}
