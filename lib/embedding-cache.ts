/**
 * Embedding Cache: PostgreSQL pgvector-backed deduplication
 * 
 * Pattern: Store embeddings with similarity search
 * Use case: Find similar trends/queries and reuse embeddings (90% reuse target)
 * 
 * Schema required:
 * - embedding_cache table with:
 *   - id (UUID primary key)
 *   - namespace (text) — e.g., "trend", "explanation"
 *   - original_id (text) — reference to source
 *   - content (text) — original text
 *   - embedding (vector) — pgvector embedding
 *   - created_at (timestamp)
 *   - similarity_matches (int) — number of times this was reused
 */

export interface EmbeddingCacheEntry {
  id: string
  namespace: string
  originalId: string
  content: string
  embedding: number[] // pgvector format
  createdAt: Date
  similarityMatches: number
}

export interface SimilarityResult {
  cachedId: string
  originalId: string
  content: string
  similarity: number // 0-1
  similarityMatches: number
  reusedAt: Date
}

/**
 * SQL: Find similar embeddings in the cache
 * Returns cached embeddings with >0.8 cosine similarity
 * Usage: Before computing a new embedding, check if a similar one exists
 */
export const SQL_FIND_SIMILAR_EMBEDDINGS = `
WITH input_embedding AS (
  -- This parameter is bound at query time
  SELECT $1::vector AS embedding,
         $2::text AS namespace
)
SELECT 
  ec.id,
  ec.original_id,
  ec.content,
  1 - (ec.embedding <=> ie.embedding) AS similarity,
  ec.similarity_matches,
  ec.created_at
FROM embedding_cache ec
CROSS JOIN input_embedding ie
WHERE ec.namespace = ie.namespace
  AND 1 - (ec.embedding <=> ie.embedding) > 0.8  -- cosine similarity > 0.8
ORDER BY similarity DESC
LIMIT 5
`

/**
 * SQL: Store new embedding in cache
 * Increments similarity_matches for deduplication tracking
 */
export const SQL_STORE_EMBEDDING = `
INSERT INTO embedding_cache (
  id,
  namespace,
  original_id,
  content,
  embedding,
  similarity_matches,
  created_at
)
VALUES (
  gen_random_uuid(),
  $1::text,
  $2::text,
  $3::text,
  $4::vector,
  0,
  NOW()
)
RETURNING id, original_id, created_at
`

/**
 * SQL: Update reuse count when embedding is matched
 */
export const SQL_INCREMENT_REUSE = `
UPDATE embedding_cache
SET similarity_matches = similarity_matches + 1
WHERE id = $1::uuid
RETURNING id, similarity_matches
`

/**
 * SQL: Get cache statistics
 * Returns hit rate, storage size, and deduplication efficiency
 */
export const SQL_GET_CACHE_STATS = `
SELECT 
  COUNT(*) AS total_entries,
  COUNT(DISTINCT namespace) AS namespaces,
  ROUND(AVG(similarity_matches)::numeric, 2) AS avg_matches,
  MAX(similarity_matches) AS max_matches,
  ROUND(
    (SUM(similarity_matches)::numeric / NULLIF(COUNT(*), 0))::numeric,
    2
  ) AS dedup_efficiency,
  pg_size_pretty(
    SUM(octet_length(content)) + 
    COUNT(*) * 1536  -- typical embedding size
  ) AS storage_size,
  AGE(NOW(), MIN(created_at)) AS oldest_entry
FROM embedding_cache
`

/**
 * SQL: Prune old cache entries (older than 30 days with low matches)
 */
export const SQL_PRUNE_CACHE = `
DELETE FROM embedding_cache
WHERE created_at < NOW() - INTERVAL '30 days'
  AND similarity_matches < 2  -- Only keep entries that were reused at least twice
RETURNING COUNT(*) AS deleted
`

/**
 * SQL: Schema migration to create embedding_cache table
 */
export const SQL_CREATE_EMBEDDING_CACHE_TABLE = `
CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace TEXT NOT NULL,
  original_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,  -- OpenAI/Anthropic standard
  similarity_matches INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT embedding_cache_namespace_fk 
    FOREIGN KEY (namespace) 
    REFERENCES pg_enum(enumname) ON DELETE CASCADE
)
;

CREATE INDEX IF NOT EXISTS idx_embedding_cache_namespace 
  ON embedding_cache(namespace);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_original_id 
  ON embedding_cache(original_id);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_created_at 
  ON embedding_cache(created_at DESC);

-- Vector similarity index for fast search
CREATE INDEX IF NOT EXISTS idx_embedding_cache_vector 
  ON embedding_cache 
  USING ivfflat(embedding vector_cosine_ops)
  WITH (lists = 100);
`

/**
 * Helper: Convert embedding to pgvector format
 * pgvector expects a string like "[0.1, 0.2, 0.3, ...]"
 */
export function formatEmbeddingForPgVector(embedding: number[]): string {
  return `[${embedding.join(', ')}]`
}

/**
 * Helper: Parse pgvector format back to number[]
 */
export function parsePgVectorEmbedding(pgvectorStr: string): number[] {
  const cleaned = pgvectorStr.replace(/[\[\]]/g, '').trim()
  return cleaned.split(',').map(s => parseFloat(s.trim()))
}

/**
 * Embedding cache client interface
 */
export interface IEmbeddingCache {
  findSimilar(embedding: number[], namespace: string): Promise<SimilarityResult[]>
  store(namespace: string, originalId: string, content: string, embedding: number[]): Promise<string>
  incrementReuse(embeddingId: string): Promise<number>
  getStats(): Promise<Record<string, unknown>>
  prune(): Promise<number>
}

/**
 * Example: How to use with Supabase
 * 
 * ```typescript
 * const supabase = createServerClient()
 * 
 * // 1. Check if similar embedding exists
 * const { data: similar } = await supabase
 *   .rpc('find_similar_embeddings', {
 *     input_embedding: newEmbedding,
 *     namespace: 'trend'
 *   })
 * 
 * if (similar && similar.length > 0) {
 *   // Reuse the first match (highest similarity)
 *   const reused = similar[0]
 *   await supabase.rpc('increment_reuse', { embedding_id: reused.id })
 *   return reused.embedding  // Cache hit!
 * }
 * 
 * // 2. Store new embedding if no match
 * const { data: stored } = await supabase
 *   .rpc('store_embedding', {
 *     namespace: 'trend',
 *     original_id: trend.id,
 *     content: trend.title,
 *     embedding: newEmbedding
 *   })
 * ```
 */
