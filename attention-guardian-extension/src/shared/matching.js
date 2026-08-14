(function () {
  const GENERIC_WORDS = new Set([
    "我要", "我想", "帮我", "看看", "查看", "搜索", "查询", "了解", "学习", "购买", "挑选", "找一下", "相关", "内容", "资料", "攻略", "一下", "关于"
  ]);

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[\p{P}\p{S}]/gu, "");
  }

  function extractKeywords(value) {
    const normalized = normalizeText(value).replace(
      /^(我要|我想|帮我|看看|查看|搜索|查询|了解|学习|购买|挑选|找一下|查|看)/,
      ""
    );
    const candidates = new Set();
    const chineseChunks = normalized.match(/[\u4e00-\u9fff]{2,}/g) || [];
    const latinChunks = normalized.match(/[a-z0-9]{2,}/g) || [];

    for (const chunk of [...chineseChunks, ...latinChunks]) {
      if (GENERIC_WORDS.has(chunk)) continue;
      if (chunk.length <= 4) {
        candidates.add(chunk);
        continue;
      }

      for (let length = 2; length <= Math.min(5, chunk.length); length += 1) {
        for (let start = 0; start <= chunk.length - length; start += 1) {
          const token = chunk.slice(start, start + length);
          if (!GENERIC_WORDS.has(token)) candidates.add(token);
        }
      }
    }

    return [...candidates].filter((token) => token.length >= 2);
  }

  function assessRelevance(goalText, pageText) {
    const keywords = extractKeywords(goalText);
    const normalizedPage = normalizeText(pageText);
    const matches = keywords.filter((keyword) => normalizedPage.includes(keyword));
    return {
      isRelated: matches.length > 0,
      matches,
      keywordCount: keywords.length
    };
  }

  self.AttentionMatcher = { normalizeText, extractKeywords, assessRelevance };
})();
