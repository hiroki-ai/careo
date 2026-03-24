/**
 * background.js (Service Worker)
 * careoai.jp からの外部メッセージを受信してトークンを保存する。
 *
 * Careo 側のログイン後ページで以下を実行することで連携できる:
 *   chrome.runtime.sendMessage(EXTENSION_ID, { action: 'setToken', token: JWT });
 */

// content script (auth_relay.js) からの内部メッセージ
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setToken" && request.token) {
    chrome.storage.local.set({ careo_token: request.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.action === "clearToken") {
    chrome.storage.local.remove("careo_token", () => {
      sendResponse({ success: true });
    });
    return true;
  }
  sendResponse({ success: false, error: "Unknown action" });
});

// careoai.jp 以外の外部ページからの直接メッセージ（将来の externally_connectable 用）
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  // careoai.jp 以外からのメッセージは無視
  if (!sender.origin || sender.origin !== "https://careoai.jp") {
    sendResponse({ success: false, error: "Unauthorized origin" });
    return;
  }

  if (request.action === "setToken" && request.token) {
    chrome.storage.local.set({ careo_token: request.token }, () => {
      sendResponse({ success: true });
    });
    return true; // 非同期応答のため true を返す
  }

  if (request.action === "clearToken") {
    chrome.storage.local.remove("careo_token", () => {
      sendResponse({ success: true });
    });
    return true;
  }

  sendResponse({ success: false, error: "Unknown action" });
});
