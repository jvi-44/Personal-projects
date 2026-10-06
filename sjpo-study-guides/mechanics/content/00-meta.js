// Single source of truth for the SJPO Mechanics study guide.
// Read by tools/build.js (PDFs) and by platform/index.html (e-learning site).
// HTML strings use KaTeX delimiters: $...$ inline, $$...$$ display.
// Narration strings (s / intro) are plain spoken English for text-to-speech.
var H = String.raw;
var GUIDE = {
  title: "Mechanics",
  series: "SJPO Physics Study Guides",
  subtitle: "Lecture notes, worked examples and tutorial questions from past Singapore Junior Physics Olympiad papers",
  papers: ["SJPO 2018 General Round", "SJPO 2022 Individual Round", "SJPO 2024", "SJPO 2026"],
  chapters: [],
  tutorials: []
};
if (typeof module !== "undefined") module.exports = GUIDE;
