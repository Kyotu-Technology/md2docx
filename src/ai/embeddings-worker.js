let extractor = null;

async function initPipeline(onProgress) {
  if (extractor) return;
  const { pipeline, env } =
    await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3");
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  extractor = await pipeline("feature-extraction", "Xenova/BGE-small-en-v1.5", {
    device: "wasm",
    dtype: "q8",
    progress_callback: onProgress,
  });
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

let chunkIndex = [];

self.addEventListener("message", async (e) => {
  const { taskId, type } = e.data;

  if (type === "cancel") return;

  if (type === "index") {
    try {
      await initPipeline((progress) => {
        self.postMessage({ taskId, progress });
      });

      const { chunks } = e.data;
      const embeddings = [];
      for (const chunk of chunks) {
        const output = await extractor(chunk.text, { pooling: "mean", normalize: true });
        embeddings.push(output.data);
      }

      chunkIndex = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: Array.from(embeddings[i]),
      }));

      self.postMessage({ taskId, result: { indexed: chunkIndex.length } });
    } catch (err) {
      self.postMessage({ taskId, error: err.message });
    }
  }

  if (type === "search") {
    try {
      await initPipeline((progress) => {
        self.postMessage({ taskId, progress });
      });

      const { query, topK = 5 } = e.data;
      const queryOutput = await extractor(query, { pooling: "mean", normalize: true });
      const queryEmbedding = Array.from(queryOutput.data);

      const results = chunkIndex
        .map((chunk) => ({
          ...chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter((r) => r.similarity > 0.15);

      self.postMessage({ taskId, result: { results } });
    } catch (err) {
      self.postMessage({ taskId, error: err.message });
    }
  }
});
