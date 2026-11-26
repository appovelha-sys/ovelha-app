/**
 * Brain Engine — arquitetura de contexto permanente do Ovelha.
 *
 * Hierarquia de compilação (ordem de injeção no prompt):
 *   Segurança → Identidade → Fundamentos Essenciais → Personalidade → Comunicação → Contexto Individual
 *
 * Os pilares são compilados em tempo de publicação (não em cada requisição),
 * reduzindo custo via prompt caching da Anthropic.
 *
 * TODO: implementar persistência via Supabase + pgvector para recuperação semântica
 * dos fundamentos contextuais.
 */

export interface Pillar {
  id: "identidade" | "fundamentos" | "personalidade" | "comunicacao";
  content: string;
  publishedAt: string | null;
  tokenCount: number;
}

export interface BrainEngineContext {
  version: string;
  compiledAt: string | null;
  pillars: Pillar[];
  essentialFoundations: string[];
  totalTokens: number;
  cacheHit: boolean;
}

export interface BrainEngineMetrics {
  tokensIn: number;
  tokensOut: number;
  tokensCache: number;
  costUsd: number;
  latencyMs: number;
  model: string;
  contextTokens: number;
}

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.replace(/\s+/g, " ").trim().length / 4);
}

export function compilePermanentContext(pillars: Pillar[]): string {
  const sections: string[] = [];

  const identidade = pillars.find(p => p.id === "identidade");
  if (identidade?.content) {
    sections.push(`<identidade>\n${identidade.content}\n</identidade>`);
  }

  const fundamentos = pillars.find(p => p.id === "fundamentos");
  if (fundamentos?.content) {
    sections.push(`<fundamentos_essenciais>\n${fundamentos.content}\n</fundamentos_essenciais>`);
  }

  const personalidade = pillars.find(p => p.id === "personalidade");
  if (personalidade?.content) {
    sections.push(`<personalidade>\n${personalidade.content}\n</personalidade>`);
  }

  const comunicacao = pillars.find(p => p.id === "comunicacao");
  if (comunicacao?.content) {
    sections.push(`<comunicacao>\n${comunicacao.content}\n</comunicacao>`);
  }

  return sections.join("\n\n");
}

/** Recuperação semântica de fundamentos contextuais via pgvector (stub). */
export async function retrieveContextualFoundations(
  _query: string,
  _topK = 5,
): Promise<string[]> {
  // TODO: embeddings via text-embedding-3-small + pgvector no Supabase
  // const embedding = await openai.embeddings.create({ input: _query, model: "text-embedding-3-small" });
  // const { data } = await supabase.rpc("match_foundations", { query_embedding: embedding.data[0].embedding, match_count: _topK });
  return [];
}

/** Estimativa de custo em USD para Claude Sonnet 4.5 (Anthropic, Nov 2026). */
export function estimateCost(metrics: Pick<BrainEngineMetrics, "tokensIn" | "tokensOut" | "tokensCache">): number {
  const INPUT_PRICE = 3 / 1_000_000;
  const CACHE_PRICE = 0.3 / 1_000_000;
  const OUTPUT_PRICE = 15 / 1_000_000;
  return (
    (metrics.tokensIn - metrics.tokensCache) * INPUT_PRICE +
    metrics.tokensCache * CACHE_PRICE +
    metrics.tokensOut * OUTPUT_PRICE
  );
}

export { estimateTokens };
