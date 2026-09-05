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

  if (endsWithWhitespace || BOUNDARY_PATTERN.test(lastCharacter)) {
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

export function createTtsChunker() {
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

    while (words.length >= 5) {
      const firstFiveWords =
        words.slice(0, 5);

      const boundaryIndex =
        firstFiveWords.findIndex((word) =>
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

      const fiveWords =
        words.splice(0, 5);

      chunks.push(
        fiveWords.join(" ")
      );
    }

    return chunks;
  }

  function flush() {
    const finalWords = [];

    if (remainder.trim()) {
      words.push(remainder.trim());
      remainder = "";
    }

    if (words.length > 0) {
      finalWords.push(words.join(" "));
      words = [];
    }

    return finalWords.join(" ").trim();
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