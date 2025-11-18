// content_list.js
(function () {
  let runningComment = false;
  let runningDownload = false;

  // 🟧 Tạo nút START COMMENT
  const btnComment = document.createElement("div");
  btnComment.textContent = "START COMMENT";
  btnComment.style =
    "position: fixed; top: 40%; right: 20px; background: #4CAF50; color:white; padding:10px; border-radius:8px; cursor:pointer; z-index:999999";
  document.body.appendChild(btnComment);

  // 🟦 Tạo nút START DOWNLOAD
  const btnDownload = document.createElement("div");
  btnDownload.textContent = "START DOWNLOAD";
  btnDownload.style =
    "position: fixed; top: 50%; right: 20px; background: #2196F3; color:white; padding:10px; border-radius:8px; cursor:pointer; z-index:999999";
  document.body.appendChild(btnDownload);

  // 🟩 Khi bấm START COMMENT
  btnComment.onclick = () => {
    runningComment = !runningComment;
    btnComment.textContent = runningComment
      ? "STOP COMMENT"
      : "START COMMENT";
    if (runningComment) startProcessing("comment");
  };

  // 🟨 Khi bấm START DOWNLOAD
  btnDownload.onclick = () => {
    runningDownload = !runningDownload;
    btnDownload.textContent = runningDownload
      ? "STOP DOWNLOAD"
      : "START DOWNLOAD";
    if (runningDownload) startProcessing("download");
  };

  // 🧠 Xử lý danh sách thread
  async function startProcessing(type) {
    const tbodies = document.querySelectorAll("#threadlist table > tbody");
    for (let i = 1; i < tbodies.length; i++) {
      if (
        (type === "comment" && !runningComment) ||
        (type === "download" && !runningDownload)
      )
        break;

      const a = tbodies[i].querySelector("th.new a.xst, th.common a.xst");
      if (!a) continue;

      // Mở tab mới
      let tab = window.open(a.href, "_blank");

      await new Promise((r) => setTimeout(r, 5000));

      // Gửi message và chờ phản hồi
      await new Promise((resolve) => {
        function handleMessage(e) {
          if (e.data.action === "thread_done") {
            if (tab) tab.close();
            window.removeEventListener("message", handleMessage);
            resolve();
          }
        }
        window.addEventListener("message", handleMessage);
        if (tab)
          tab.postMessage(
            { action: type === "comment" ? "start_comment" : "start_download" },
            "*"
          );
      });

      await new Promise((r) => setTimeout(r, 5000));
    }
  }
})();