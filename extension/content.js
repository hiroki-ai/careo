/**
 * content.js
 * 各就活サイトのDOM構造から企業情報を抽出するコンテンツスクリプト。
 * popup.js からのメッセージを受け取り、会社名・業界・URLを返す。
 */

/**
 * 複数のCSSセレクターを試して最初にテキストが取得できた要素の内容を返す。
 * @param {string[]} selectors
 * @returns {string}
 */
function queryFirst(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        if (text.length > 0) return text;
      }
    } catch (_) {
      // 不正なセレクターは無視
    }
  }
  return "";
}

/**
 * 現在のホストに合わせたセレクター設定を返す。
 */
function getSiteConfig() {
  const host = location.hostname;

  if (host.includes("mynavi.jp")) {
    return {
      companyName: [
        "h1.company-name",
        ".corp-name",
        "[class*='company'][class*='name']",
        ".js-companyName",
        "h1",
      ],
      industry: [
        "[class*='industry']",
        ".corp-industry",
        "dt:contains('業種') + dd",
      ],
    };
  }

  if (host.includes("rikunabi.com")) {
    return {
      companyName: [
        ".companyName",
        "h1.rig_slogan",
        "[data-company-name]",
        ".rg_corp_name",
        "h1",
      ],
      industry: [
        "[class*='industry']",
        ".rg_corp_industry",
      ],
    };
  }

  if (host.includes("onecareer.jp")) {
    return {
      companyName: [
        ".company-name",
        "h1",
        "[class*='companyName']",
        "[class*='company_name']",
      ],
      industry: [
        "[class*='industry']",
        "[class*='Industry']",
      ],
    };
  }

  if (host.includes("wantedly.com")) {
    return {
      companyName: [
        "h1",
        "[class*='company']",
        "[class*='Company']",
        "[class*='name']",
      ],
      industry: [
        "[class*='industry']",
        "[class*='category']",
      ],
    };
  }

  if (host.includes("offerbox.jp")) {
    return {
      companyName: [
        ".company-name",
        "h1",
        "[class*='company'][class*='name']",
        "[class*='companyName']",
      ],
      industry: [
        "[class*='industry']",
        "[class*='business']",
      ],
    };
  }

  // フォールバック
  return {
    companyName: ["h1", "[class*='company'][class*='name']", ".company-name"],
    industry: ["[class*='industry']"],
  };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getCompanyInfo") {
    const config = getSiteConfig();

    const companyName = queryFirst(config.companyName);
    const industry = queryFirst(config.industry);
    const pageUrl = location.href;
    const pageTitle = document.title;

    sendResponse({ companyName, industry, pageUrl, pageTitle });
  }
  // sendResponse を同期で呼ぶので true は不要
  return false;
});
