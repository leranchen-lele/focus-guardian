(function () {
  const CHECK_INTERVAL_MS = 30 * 1000;
  const BASE_UNRELATED_DURATION_MS = 5 * 60 * 1000;
  let activeGoal = null;
  let firstNudgeDismissed = false;
  let unrelatedSince = null;
  let reminderOpen = false;

  initialize();

  async function initialize() {
    await loadGoal();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.activeGoal) {
        activeGoal = changes.activeGoal.newValue || null;
        unrelatedSince = null;
      }
    });

    if (activeGoal && !activeGoal.leisureMode) showInitialNudge();
    window.setInterval(evaluateAttention, CHECK_INTERVAL_MS);
    window.setTimeout(evaluateAttention, 5000);
  }

  async function loadGoal() {
    const result = await chrome.storage.local.get("activeGoal");
    activeGoal = result.activeGoal || null;
  }

  function evaluateAttention() {
    if (!activeGoal || activeGoal.leisureMode || !firstNudgeDismissed || reminderOpen || document.hidden) return;
    if (Date.now() < (activeGoal.snoozedUntil || 0)) return;
    if (!AttentionSiteAdapter.isSupportedPlatform() || !AttentionSiteAdapter.isRecommendationSurface()) {
      unrelatedSince = null;
      return;
    }

    const goalText = `${activeGoal.summary} ${activeGoal.details || ""}`;
    const assessment = AttentionMatcher.assessRelevance(goalText, AttentionSiteAdapter.getVisiblePageText());
    if (assessment.isRelated) {
      unrelatedSince = null;
      return;
    }

    unrelatedSince = unrelatedSince || Date.now();
    const feedbackBuffer = Math.min(activeGoal.feedbackCount || 0, 3) * 60 * 1000;
    if (Date.now() - unrelatedSince >= BASE_UNRELATED_DURATION_MS + feedbackBuffer) showDistractionReminder();
  }

  function showInitialNudge() {
    const card = createCard("目标守护", "你现在要做的是：", activeGoal.summary);
    const close = makeButton("知道了", "attention-guardian-primary");
    close.addEventListener("click", () => {
      firstNudgeDismissed = true;
      card.remove();
    });
    card.querySelector(".attention-guardian-actions").append(close);
    document.documentElement.append(card);
  }

  function showDistractionReminder() {
    reminderOpen = true;
    const card = createCard("目标守护", "你似乎已经偏离刚才的目标。", `原目标：${activeGoal.summary}`);
    const returnButton = makeButton("回到目标", "attention-guardian-primary");
    const continueButton = makeButton("继续浏览", "attention-guardian-secondary");
    const notDistractedButton = makeButton("不是分心", "attention-guardian-secondary");

    returnButton.addEventListener("click", () => {
      card.remove();
      reminderOpen = false;
      unrelatedSince = null;
      showFocusOverlay();
    });
    continueButton.addEventListener("click", () => resolveFeedback(card, "continue"));
    notDistractedButton.addEventListener("click", () => resolveFeedback(card, "not-distracted"));
    card.querySelector(".attention-guardian-actions").append(returnButton, continueButton, notDistractedButton);
    document.documentElement.append(card);
  }

  function resolveFeedback(card, action) {
    chrome.runtime.sendMessage({ type: "feedback", action }, (response) => {
      if (response?.activeGoal) activeGoal = response.activeGoal;
      card.remove();
      reminderOpen = false;
      unrelatedSince = null;
    });
  }

  function showFocusOverlay() {
    document.querySelector(".attention-guardian-focus")?.remove();
    const card = createCard("回到目标", "继续完成这件事：", activeGoal.summary);
    card.classList.add("attention-guardian-focus");
    const close = makeButton("关闭提醒", "attention-guardian-secondary");
    close.addEventListener("click", () => card.remove());
    card.querySelector(".attention-guardian-actions").append(close);
    document.documentElement.append(card);
  }

  function createCard(kicker, title, detail) {
    const card = document.createElement("section");
    card.className = "attention-guardian-card";
    const content = document.createElement("div");
    content.className = "attention-guardian-content";
    const kickerElement = document.createElement("p");
    kickerElement.className = "attention-guardian-kicker";
    kickerElement.textContent = kicker;
    const titleElement = document.createElement("h2");
    titleElement.className = "attention-guardian-title";
    titleElement.textContent = title;
    const detailElement = document.createElement("p");
    detailElement.className = "attention-guardian-goal";
    detailElement.textContent = detail;
    const actions = document.createElement("div");
    actions.className = "attention-guardian-actions";
    content.append(kickerElement, titleElement, detailElement, actions);
    card.append(content);
    return card;
  }

  function makeButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `attention-guardian-button ${className}`;
    button.textContent = label;
    return button;
  }
})();
