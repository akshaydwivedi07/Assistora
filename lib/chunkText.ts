export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 150
) {
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanedText) {
    return [];
  }

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks: string[] = [];

  let start = 0;

  while (start < cleanedText.length) {
    let end = Math.min(
      start + chunkSize,
      cleanedText.length
    );

    // Try to end at a natural boundary
    if (end < cleanedText.length) {
      const paragraphBreak =
        cleanedText.lastIndexOf("\n\n", end);

      const sentenceBreak = Math.max(
        cleanedText.lastIndexOf(". ", end),
        cleanedText.lastIndexOf("? ", end),
        cleanedText.lastIndexOf("! ", end)
      );

      const bestBreak = Math.max(
        paragraphBreak,
        sentenceBreak
      );

      if (bestBreak > start + chunkSize * 0.6) {
        end = bestBreak + 1;
      }
    }

    const chunk = cleanedText
      .slice(start, end)
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= cleanedText.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}