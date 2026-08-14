global.self = global;
require("../src/shared/matching.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const related = AttentionMatcher.assessRelevance("查防晒霜", "油痘肌防晒霜挑选指南");
assert(related.isRelated, "应识别出与防晒霜相关的内容");

const unrelated = AttentionMatcher.assessRelevance("查防晒霜", "明星机场穿搭合集");
assert(!unrelated.isRelated, "不应把无关内容判定为相关");

assert(AttentionMatcher.extractKeywords("查防晒霜").includes("防晒霜"), "应提取核心中文关键词");
console.log("matching tests passed");
