const PASSIVE_PATTERNS = [
  /\b(?:is|are|was|were|be|been|being)\s+\w+ed\b/gi,
  /\b(?:is|are|was|were|be|been|being)\s+\w+en\b/gi,
  /\b(?:got|get|gets|getting)\s+\w+ed\b/gi,
];

const COMMON_WORDS = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "is",
  "are",
  "was",
  "were",
  "has",
  "had",
  "does",
  "did",
  "the",
  "its",
]);

function extractText(elements) {
  const chunks = [];
  for (const el of elements) {
    if (el.content) chunks.push(el.content);
    if (el.items) {
      for (const item of el.items) {
        chunks.push(typeof item === "string" ? item : item.text || "");
      }
    }
    if (el.rows) {
      for (const row of el.rows) {
        for (const cell of row) chunks.push(cell);
      }
    }
  }
  return chunks.join(". ");
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1");
}

function splitSentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  return vowelGroups ? vowelGroups.length : 1;
}

function fleschKincaid(sentences, words) {
  if (sentences.length === 0 || words.length === 0) return { grade: 0, score: 100 };
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLen = words.length / sentences.length;
  const avgSyllables = totalSyllables / words.length;
  const grade = 0.39 * avgSentenceLen + 11.8 * avgSyllables - 15.59;
  const score = 206.835 - 1.015 * avgSentenceLen - 84.6 * avgSyllables;
  return {
    grade: Math.max(0, Math.round(grade * 10) / 10),
    score: Math.max(0, Math.min(100, Math.round(score * 10) / 10)),
  };
}

function detectPassiveVoice(sentences) {
  const passive = [];
  for (let i = 0; i < sentences.length; i++) {
    for (const pattern of PASSIVE_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(sentences[i])) {
        passive.push({ sentence: sentences[i], index: i });
        break;
      }
    }
  }
  return passive;
}

function validateHeadingHierarchy(elements) {
  const issues = [];
  let lastLevel = 0;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const match = el.type.match(/^h(\d)$/);
    if (!match) continue;
    const level = parseInt(match[1]);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        element: i,
        type: el.type,
        content: el.content,
        expected: `h${lastLevel + 1}`,
        got: el.type,
        line: el.line,
      });
    }
    lastLevel = level;
  }
  return issues;
}

function analyzeVocabulary(words) {
  const cleaned = words
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
    .filter((w) => w.length > 2 && !COMMON_WORDS.has(w));
  const unique = new Set(cleaned);
  return {
    totalWords: words.length,
    uniqueWords: unique.size,
    richness: cleaned.length > 0 ? Math.round((unique.size / cleaned.length) * 100) / 100 : 0,
  };
}

function analyzeSectionBalance(elements) {
  const sections = [];
  let currentSection = null;
  let wordCount = 0;

  for (const el of elements) {
    if (el.type === "h1" || el.type === "h2") {
      if (currentSection) {
        sections.push({ heading: currentSection, words: wordCount });
      }
      currentSection = el.content;
      wordCount = 0;
    } else {
      const text = el.content || "";
      wordCount += text.split(/\s+/).filter((w) => w).length;
    }
  }
  if (currentSection) {
    sections.push({ heading: currentSection, words: wordCount });
  }

  if (sections.length < 2) return { sections, balanced: true, variance: 0 };

  const avg = sections.reduce((s, sec) => s + sec.words, 0) / sections.length;
  const variance =
    sections.reduce((s, sec) => s + Math.pow(sec.words - avg, 2), 0) / sections.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 0;

  return { sections, balanced: cv < 0.8, variance: Math.round(cv * 100) / 100 };
}

export function analyzeReadability(elements) {
  const rawText = extractText(elements);
  const plainText = stripMarkdown(rawText);
  const sentences = splitSentences(plainText);
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);

  const fk = fleschKincaid(sentences, words);
  const passive = detectPassiveVoice(sentences);
  const headingIssues = validateHeadingHierarchy(elements);
  const vocabulary = analyzeVocabulary(words);
  const sectionBalance = analyzeSectionBalance(elements);

  const avgSentenceLength =
    sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0;
  const passivePercent =
    sentences.length > 0 ? Math.round((passive.length / sentences.length) * 100) : 0;

  let score = 100;
  if (fk.grade > 12) score -= 15;
  else if (fk.grade > 10) score -= 8;
  else if (fk.grade > 8) score -= 3;
  if (passivePercent > 30) score -= 15;
  else if (passivePercent > 20) score -= 8;
  else if (passivePercent > 10) score -= 3;
  if (headingIssues.length > 0) score -= headingIssues.length * 5;
  if (avgSentenceLength > 25) score -= 10;
  else if (avgSentenceLength > 20) score -= 5;
  if (!sectionBalance.balanced) score -= 5;
  if (vocabulary.richness < 0.3 && words.length > 50) score -= 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    fleschKincaid: fk,
    avgSentenceLength,
    passiveVoice: { count: passive.length, percent: passivePercent, instances: passive },
    headingIssues,
    vocabulary,
    sectionBalance,
    wordCount: words.length,
    sentenceCount: sentences.length,
  };
}

export function getScoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export function getScoreLabel(score) {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Work";
}
