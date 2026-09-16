const BOUNDARY_PATTERN = /[.!?,:;]/;

function splitCompleteWords(text) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return {
      words: [],
      remainder: "",
    };
  }

  const parts = normalized.split(" ");

  const lastCharacter =
    normalized[normalized.length - 1];

  const endsWithWhitespace =
    /\s$/.test(String(text));

  if (
    endsWithWhitespace ||
    BOUNDARY_PATTERN.test(lastCharacter)
  ) {
    return {
      words: parts,
      remainder: "",
    };
  }

  return {
    words: parts.slice(0, -1),
    remainder: parts[parts.length - 1],
  };
}

export function createTtsChunker(maxWords = 5) {
  const chunkLimit = Math.max(
    1,
    Number(maxWords) || 5
  );

  let words = [];
  let remainder = "";

  function addText(text) {
    const input =
      remainder + String(text || "");

    const result =
      splitCompleteWords(input);

    remainder = result.remainder;
    words.push(...result.words);

    const chunks = [];

    while (words.length >= chunkLimit) {
      const firstWords =
        words.slice(0, chunkLimit);

      const boundaryIndex =
        firstWords.findIndex((word) =>
          BOUNDARY_PATTERN.test(word)
        );

      if (boundaryIndex >= 0) {
        const boundaryWords =
          words.splice(
            0,
            boundaryIndex + 1
          );

        chunks.push(
          boundaryWords.join(" ")
        );

        continue;
      }

      const chunkWords =
        words.splice(0, chunkLimit);

      chunks.push(
        chunkWords.join(" ")
      );
    }

    return chunks;
  }

  function flush() {
    if (remainder.trim()) {
      words.push(remainder.trim());
      remainder = "";
    }

    const finalText =
      words.join(" ").trim();

    words = [];

    return finalText;
  }

  function reset() {
    words = [];
    remainder = "";
  }

  return {
    addText,
    flush,
    reset,
  };
}