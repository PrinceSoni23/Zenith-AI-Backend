/**
 * In-Memory Cache Service with TTL (Time-To-Live)
 * Simple, dependency-free caching solution that works without Redis
 */

interface CacheEntry {
  value: any;
  expiresAt: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Set cache value with TTL in seconds
   */
  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get cache value if it hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 🎯 SIMILARITY SEARCH - Find cached responses for similar topics
   * Shared across all users via backend cache!
   *
   * Algorithm: When student B searches "photns", find "photons" in backend cache
   * - Loop through cached keys
   * - Extract topic from each key
   * - Calculate Levenshtein distance
   * - If similarity > 70%, return cached response (0 AI calls!)
   *
   * Example:
   *  Student A: searches "photons" → cached by backend
   *  Student B: searches "photns" → finds exact "photons" in cache → returns cached answer
   *  Cost: $0 (shared cache!) ✓
   */
  findSimilarCachedResponse<T>(
    topic: string,
  ): { response: T; cachedTopic: string; similarity: number } | null {
    if (!topic || topic.trim().length === 0) return null;

    const topicLower = topic.toLowerCase().trim();
    let bestMatch: {
      response: T;
      cachedTopic: string;
      similarity: number;
      key: string;
    } | null = null;

    // Loop through all cached entries
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      // Skip expired entries
      if (Date.now() > entry.expiresAt) {
        continue;
      }

      // Extract topic from cache key
      // Key format: "agent-type:topic={value}&other={value}"
      const topicMatch = key.match(/topic=([^&]+)/);
      if (!topicMatch) continue;

      try {
        const cachedTopic = JSON.parse(decodeURIComponent(topicMatch[1]));
        if (!cachedTopic || typeof cachedTopic !== "string") continue;

        // Calculate similarity using Levenshtein distance
        const similarity = this.calculateSimilarity(
          topicLower,
          cachedTopic.toLowerCase(),
        );

        // Accept matches > 70% similar
        if (similarity > 0.7) {
          // Keep the best match (highest similarity)
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = {
              response: entry.value as T,
              cachedTopic,
              similarity,
              key,
            };
          }
        }
      } catch (e) {
        // Skip entries with parsing errors
        continue;
      }
    }

    if (bestMatch !== null) {
      console.log(
        `[Backend Cache] SIMILARITY HIT: "${topic}" matched "${bestMatch.cachedTopic}" (${Math.round(bestMatch.similarity * 100)}% similar)`,
      );

      return {
        response: bestMatch.response,
        cachedTopic: bestMatch.cachedTopic,
        similarity: bestMatch.similarity,
      };
    }

    return null;
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein distance converted to similarity score
   * 1.0 = identical, 0.0 = completely different
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // If strings are exactly same
    if (str1 === str2) return 1.0;

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);

    // Convert distance to similarity (0-1)
    // Similarity = 1 - (distance / maxLength)
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const similarity = 1 - distance / maxLength;
    return similarity;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Measures minimum edit operations needed (insert, delete, substitute)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len2 + 1)
      .fill(null)
      .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Get all topics currently in backend cache (for debugging)
   */
  getAllCachedTopics(): string[] {
    const topics: string[] = [];

    for (const [key] of this.cache.entries()) {
      const topicMatch = key.match(/topic=([^&]+)/);
      if (topicMatch) {
        try {
          const topic = JSON.parse(decodeURIComponent(topicMatch[1]));
          if (topic && typeof topic === "string") {
            topics.push(topic);
          }
        } catch (e) {
          // Skip parsing errors
        }
      }
    }

    return topics;
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }

  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
