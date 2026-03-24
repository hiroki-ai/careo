/**
 * popup.js
 * ポップアップのメインロジック。
 * 1. 認証チェック（chrome.storage.local の careo_token）
 * 2. 就活サイト判定 → content.js に企業情報を問い合わせ
 * 3. フォーム表示 & Careo API への POST
 */

const CAREO_API = "https://careoai.jp/api/extension/add-company";

const JOB_SITE_PATTERNS = [
  { pattern: /job\.mynavi\.jp/, name: "マイナビ" },
  { pattern: /job\.rikunabi\.com/, name: "リクナビ" },
  { pattern: /www\.onecareer\.jp/, name: "ワンキャリア" },
  { pattern: /www\.wantedly\.com/, name: "Wantedly" },
  { pattern: /offerbox\.jp/, name: "OfferBox" },
];

// ---- DOM refs ----
const viewNotLoggedIn = document.getElementById("view-not-logged-in");
const viewForm = document.getElementById("view-form");
const viewSuccess = document.getElementById("view-success");
const siteBadge = document.getElementById("site-badge");
const addForm = document.getElementById("add-form");
const companyNameInput = document.getElementById("company-name");
const industrySelect = document.getElementById("industry");
const notesTextarea = document.getElementById("notes");
const statusSelect = document.getElementById("status");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const submitText = document.getElementById("submit-text");
const submitLoading = document.getElementById("submit-loading");
const successCompanyName = document.getElementById("success-company-name");
const addAnotherBtn = document.getElementById("add-another-btn");

// ---- Utilities ----

function showView(name) {
  [viewNotLoggedIn, viewForm, viewSuccess].forEach((v) => v.classList.add("hidden"));
  if (name === "not-logged-in") viewNotLoggedIn.classList.remove("hidden");
  if (name === "form") viewForm.classList.remove("hidden");
  if (name === "success") viewSuccess.classList.remove("hidden");
}

function setError(msg) {
  formError.textContent = msg;
  formError.classList.toggle("hidden", !msg);
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitText.classList.toggle("hidden", loading);
  submitLoading.classList.toggle("hidden", !loading);
}

function detectJobSite(url) {
  for (const site of JOB_SITE_PATTERNS) {
    if (site.pattern.test(url)) return site;
  }
  return null;
}

function setIndustryValue(industry) {
  if (!industry) return;
  const normalized = industry.trim();
  for (const opt of industrySelect.options) {
    if (opt.value && normalized.includes(opt.value)) {
      industrySelect.value = opt.value;
      return;
    }
  }
}

// ---- メイン初期化 ----

async function init() {
  // 1. トークン確認
  const { careo_token: token } = await chrome.storage.local.get("careo_token");
  if (!token) {
    showView("not-logged-in");
    return;
  }

  // 2. 現在のタブを取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    showView("form");
    return;
  }

  const jobSite = detectJobSite(tab.url);

  if (jobSite) {
    // 就活サイト: バッジ表示
    siteBadge.textContent = `${jobSite.name} で検出`;
    siteBadge.classList.remove("hidden");

    // content.js に企業情報を問い合わせ
    try {
      const info = await chrome.tabs.sendMessage(tab.id, { action: "getCompanyInfo" });
      if (info && info.companyName) {
        companyNameInput.value = info.companyName;
      }
      if (info && info.industry) {
        setIndustryValue(info.industry);
      }
    } catch (_) {
      // content script が未挿入 or エラーの場合は無視して手動入力へ
    }
  }

  showView("form");
}

// ---- フォーム送信 ----

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");

  const name = companyNameInput.value.trim();
  if (!name) {
    setError("企業名を入力してください");
    return;
  }

  const { careo_token: token } = await chrome.storage.local.get("careo_token");
  if (!token) {
    showView("not-logged-in");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(CAREO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        industry: industrySelect.value || undefined,
        notes: notesTextarea.value.trim() || undefined,
        status: statusSelect.value || "WISHLIST",
      }),
    });

    if (res.status === 401) {
      // トークン期限切れ → ログアウト扱い
      await chrome.storage.local.remove("careo_token");
      showView("not-logged-in");
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || `エラーが発生しました（${res.status}）`);
      return;
    }

    // 成功
    successCompanyName.textContent = name;
    showView("success");
  } catch (err) {
    setError("通信エラーが発生しました。インターネット接続を確認してください。");
  } finally {
    setLoading(false);
  }
});

// ---- 続けて追加する ----

addAnotherBtn.addEventListener("click", () => {
  // フォームをリセットして再表示
  addForm.reset();
  siteBadge.classList.add("hidden");
  setError("");
  showView("form");
  // 再度タブ情報を取得して自動入力
  init();
});

// ---- 起動 ----
init();
