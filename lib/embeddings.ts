const JINA_API_URL =
  "https://api.jina.ai/v1/embeddings";

type EmbeddingTask =
  | "retrieval.passage"
  | "retrieval.query";

export async function createEmbedding(
  text: string,
  task: EmbeddingTask = "retrieval.passage"
) {
  const apiKey = process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "JINA_API_KEY is missing in .env.local"
    );
  }

  const response = await fetch(JINA_API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },

    body: JSON.stringify({
      model: "jina-embeddings-v3",
      input: [text],
      task,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Jina Embeddings API error: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  const embedding =
    data?.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error(
      "Jina API returned no embedding."
    );
  }

  return embedding;
}