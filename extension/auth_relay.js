/**
 * auth_relay.js
 * careoai.jp 上で動作するコンテンツスクリプト。
 * ログインページからの window.postMessage を受け取り、
 * バックグラウンド Service Worker にトークンを中継する。
 */

window.addEventListener("message", (event) => {
  // 同一オリジンのメッセージのみ受け付ける
  if (event.origin !== "https://careoai.jp") return;
  if (!event.data || event.data.type !== "CAREO_AUTH_TOKEN") return;

  const token = event.data.token;
  if (!token || typeof token !== "string") return;

  chrome.runtime.sendMessage({ action: "setToken", token }, (response) => {
    if (chrome.runtime.lastError) {
      // 拡張機能が無効化されている場合は無視
      return;
    }
    if (response?.success) {
      // トークン保存成功をページに通知（任意）
      window.postMessage({ type: "CAREO_TOKEN_SAVED" }, "https://careoai.jp");
    }
  });
});
