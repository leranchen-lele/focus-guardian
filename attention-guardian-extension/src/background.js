const GOAL_KEY = "activeGoal";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "feedback") {
    updateGoalFromFeedback(message.action).then(sendResponse);
    return true;
  }

  if (message?.type === "clear-session") {
    chrome.storage.session.clear().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function updateGoalFromFeedback(action) {
  const { [GOAL_KEY]: activeGoal } = await chrome.storage.local.get(GOAL_KEY);
  if (!activeGoal) return { ok: false };

  const now = Date.now();
  const updatedGoal = { ...activeGoal };
  if (action === "continue") updatedGoal.snoozedUntil = now + 2 * 60 * 1000;
  if (action === "not-distracted") {
    updatedGoal.feedbackCount = (updatedGoal.feedbackCount || 0) + 1;
    updatedGoal.snoozedUntil = now + 3 * 60 * 1000;
  }

  await chrome.storage.local.set({ [GOAL_KEY]: updatedGoal });
  return { ok: true, activeGoal: updatedGoal };
}
