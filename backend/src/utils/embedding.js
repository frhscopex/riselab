function xorshift32(seed) {
  let x = seed | 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967295;
  };
}

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

function embedText(text, dimensions = 1536) {
  const rand = xorshift32(hashText(text || "empty"));
  const vector = new Array(dimensions);
  for (let i = 0; i < dimensions; i += 1) {
    vector[i] = rand() * 2 - 1;
  }
  return vector;
}

function toVectorLiteral(vector) {
  return `[${vector.map((n) => Number(n).toFixed(6)).join(",")}]`;
}

function isValidEmbedding(vector, dimensions = 1536) {
  return (
    Array.isArray(vector) &&
    vector.length === dimensions &&
    vector.every((n) => Number.isFinite(Number(n)))
  );
}

module.exports = {
  embedText,
  isValidEmbedding,
  toVectorLiteral,
};
