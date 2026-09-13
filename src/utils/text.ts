export function sentencesFrom(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function uniqueItems(items: string[], limit = 8): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(item);
    }
    if (output.length >= limit) break;
  }
  return output;
}

export function findMatchingSentences(text: string, keywords: string[], limit = 4): string[] {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return uniqueItems(
    sentencesFrom(text).filter((sentence) => loweredKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))),
    limit,
  );
}
