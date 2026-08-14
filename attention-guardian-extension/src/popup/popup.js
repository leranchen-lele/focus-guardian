const GOAL_KEY = "activeGoal";
const form = document.querySelector("#goal-form");
const goalView = document.querySelector("#goal-view");
const status = document.querySelector("#status");

loadActiveGoal();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const summary = formData.get("summary").trim();
  if (!summary) return;
  const activeGoal = {
    id: crypto.randomUUID(),
    type: formData.get("goalType"),
    summary,
    details: formData.get("details").trim(),
    deadline: formData.get("deadline") || null,
    leisureMode: formData.get("leisureMode") === "on",
    feedbackCount: 0,
    startedAt: Date.now()
  };
  await chrome.storage.local.set({ [GOAL_KEY]: activeGoal });
  status.textContent = activeGoal.leisureMode ? "已开始自由浏览，本次不会提醒。" : "目标已开始。进入支持的网站后会提示你。";
  renderGoal(activeGoal);
});

document.querySelector("#end-goal").addEventListener("click", async () => {
  await chrome.storage.local.remove(GOAL_KEY);
  await chrome.runtime.sendMessage({ type: "clear-session" });
  form.reset();
  renderGoal(null);
  status.textContent = "当前目标已结束。";
});

document.querySelector("#new-goal").addEventListener("click", () => renderGoal(null));

document.querySelector("#clear-data").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  await chrome.runtime.sendMessage({ type: "clear-session" });
  form.reset();
  renderGoal(null);
  status.textContent = "所有本地数据已清除。";
});

async function loadActiveGoal() {
  const result = await chrome.storage.local.get(GOAL_KEY);
  renderGoal(result[GOAL_KEY] || null);
}

function renderGoal(activeGoal) {
  const hasGoal = Boolean(activeGoal);
  goalView.hidden = !hasGoal;
  form.hidden = hasGoal;
  if (!hasGoal) return;
  document.querySelector("#current-goal").textContent = activeGoal.summary;
  const labels = [activeGoal.type === "want" ? "最想做的事" : "最需要做的事"];
  if (activeGoal.leisureMode) labels.push("自由浏览，不提醒");
  if (activeGoal.deadline) labels.push(`完成时间：${new Date(activeGoal.deadline).toLocaleString("zh-CN")}`);
  document.querySelector("#goal-meta").textContent = labels.join(" · ");
}
