(function () {
  function isSupportedPlatform() {
    return location.hostname === "www.xiaohongshu.com" || location.hostname === "www.douyin.com";
  }

  function isSearchPage() {
    const path = `${location.pathname}${location.search}`.toLowerCase();
    return path.includes("search") || path.includes("sousuo");
  }

  function isRecommendationSurface() {
    if (isSearchPage()) return false;
    const visibleText = document.body ? document.body.innerText.slice(0, 5000) : "";
    return /推荐|发现|精选|为你推荐/.test(visibleText);
  }

  function getVisiblePageText() {
    const bodyText = document.body ? document.body.innerText.slice(0, 6000) : "";
    return `${document.title || ""}\n${bodyText}`;
  }

  self.AttentionSiteAdapter = { isSupportedPlatform, isRecommendationSurface, getVisiblePageText };
})();
