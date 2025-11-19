importScripts('jszip.min.js'); // nếu dùng background page, hoặc import nếu MV3

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'zip_and_download') return;

  (async () => {
    const zip = new JSZip();
    const folder = zip.folder(msg.folder);

    /* fetch rar & jpg, add blob txt */
    for (const f of msg.files) {
      if (f.blob) {
        folder.file(f.name, f.blob);
      } else {
        const res = await fetch(f.url);
        const blob = await res.blob();
        folder.file(f.name, blob);
      }
    }

    /* tạo zip & tải */
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url     = URL.createObjectURL(zipBlob);
    chrome.downloads.download({
      url        : url,
      filename   : msg.folder.replace('/', '') + '.zip',
      saveAs     : false
    }, () => URL.revokeObjectURL(url));
  })();

  sendResponse(); // non-persistent
});
});
