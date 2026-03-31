/**
 * Input Normalization Utility (Backend)
 * Ensures consistent handling of user inputs for caching and AI processing
 * Handles: case sensitivity, extra whitespace, special characters, unicode
 * Real-world scenarios: copy-paste from web, typos, mixed punctuation, etc.
 */

/**
 * Normalize subject names with fuzzy matching + stop words removal
 * Handles abbreviations and misspellings
 * Examples: "bio" → "Biology", "math" → "Mathematics", "the mathe" → "Mathematics"
 *
 * STEP 1: Remove stop words first
 * STEP 2: Check predefined map
 * STEP 3: Use prefix/Levenshtein matching
 * STEP 4: Return with proper casing
 */
export function normalizeSubject(
  subject: string | null | undefined,
): string | null {
  if (typeof subject !== "string" || !subject.trim()) {
    return null;
  }

  // STEP 1: Remove stop words first
  let normalized = subject.trim().toLowerCase();
  const withoutStopWords = removeStopWords(normalized).trim();

  // If nothing left, use original normalized
  if (!withoutStopWords) {
    return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
  }

  // Subject mapping: abbreviations and common misspellings → canonical name
  const subjectMap: Record<string, string> = {
    // Mathematics
    math: "Mathematics",
    maths: "Mathematics",
    mathe: "Mathematics",
    mathem: "Mathematics",
    mathematic: "Mathematics",
    mathemat: "Mathematics",
    "math ": "Mathematics",
    mth: "Mathematics",
    mthl: "Mathematics",

    // Biology
    bio: "Biology",
    biolog: "Biology",
    biologi: "Biology",
    biol: "Biology",
    bioo: "Biology",

    // Chemistry
    chem: "Chemistry",
    chemist: "Chemistry",
    chemistri: "Chemistry",
    chemistry: "Chemistry",
    "chemist ": "Chemistry",
    ch: "Chemistry",

    // Physics
    physics: "Physics",
    physic: "Physics",
    phy: "Physics",
    phys: "Physics",
    physical: "Physics",

    // Science
    science: "Science",
    sci: "Science",
    sc: "Science",
    scie: "Science",

    // English
    english: "English",
    eng: "English",
    engl: "English",

    // History
    history: "History",
    hist: "History",
    histor: "History",
    hi: "History",

    // Geography
    geography: "Geography",
    geo: "Geography",
    geografi: "Geography",
    geog: "Geography",

    // Hindi
    hindi: "Hindi",
    hind: "Hindi",
    "hi ": "Hindi",

    // Computer Science
    computer: "ComputerScience",
    computersci: "ComputerScience",
    cs: "ComputerScience",
    coding: "ComputerScience",
    code: "ComputerScience",
    programm: "ComputerScience",

    // Economics
    economics: "Economics",
    econ: "Economics",
    economi: "Economics",

    // Political Science
    political: "PoliticalScience",
    politics: "PoliticalScience",
    pol: "PoliticalScience",

    // Psychology
    psychology: "Psychology",
    psych: "Psychology",
    psycholog: "Psychology",
  };

  // STEP 2: Exact match on stop-word-free version
  if (subjectMap[withoutStopWords]) {
    return subjectMap[withoutStopWords];
  }

  // STEP 3: Partial match - find keys that start with stop-word-free input
  for (const [key, value] of Object.entries(subjectMap)) {
    if (key.startsWith(withoutStopWords) || withoutStopWords.startsWith(key)) {
      return value;
    }
  }

  // If no match, return original with proper casing (capitalize first letter)
  return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding misspellings (distance <= 2 is considered a match)
 */
function levenshteinDistance(str1: string, str2: string): number {
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
 * Remove common English stop words from input
 * Ensures consistent normalization for: "photosynthesis", "the photosynthesis", "definition of photosynthesis"
 * All normalize to: "Photosynthesis"
 *
 * Applied BEFORE fuzzy matching to ensure similar inputs generate identical cache keys
 */
function removeStopWords(input: string): string {
  if (!input || !input.trim()) return "";

  const stopWords = new Set([
    // Articles
    "a",
    "an",
    "the",

    // Prepositions
    "of",
    "in",
    "on",
    "at",
    "to",
    "from",
    "with",
    "by",
    "for",
    "about",
    "into",
    "onto",
    "off",
    "out",
    "over",
    "under",
    "above",
    "below",

    // Definition/explanation words
    "what",
    "is",
    "are",
    "definition",
    "explain",
    "describe",
    "define",
    "mean",
    "meaning",
    "concept",
    "topic",
    "chapter",
    "section",
    "unit",
    "lesson",

    // Common verbs/conjunctions
    "and",
    "or",
    "but",
    "be",
    "been",
    "being",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",

    // Demonstratives
    "this",
    "that",
    "these",
    "those",
  ]);

  const words = input.toLowerCase().split(/\s+/);
  const filtered = words
    .filter(word => !stopWords.has(word.toLowerCase()))
    .filter(word => word.length > 0);

  return filtered.join(" ");
}

/**
 * Normalize topic/concept names with fuzzy matching + stop words removal
 * Handles common misspellings in biology, chemistry, physics topics
 * Examples: "photosynhtesis" → "Photosynthesis", "the mitocondria" → "Mitochondria"
 *
 * STEP 1: Remove stop words first (universal for all topics)
 * STEP 2: Check predefined map
 * STEP 3: Use Levenshtein distance for typos
 */
export function normalizeTopic(
  topic: string | null | undefined,
): string | null {
  if (typeof topic !== "string" || !topic.trim()) {
    return null;
  }

  let normalized = topic.trim().toLowerCase();

  // STEP 1: Remove stop words first (applies UNIVERSALLY to ALL topics)
  // Ensures: "photosynthesis", "the photosynthesis", "definition of photosynthesis" all normalize to same
  const withoutStopWords = removeStopWords(normalized).trim();

  // If nothing left after removing stop words, fall back to original normalized
  if (!withoutStopWords) {
    return topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();
  }

  // Common topic misspellings mapping
  const topicMap: Record<string, string> = {
    // Biology
    photosynthesis: "Photosynthesis",
    photosynhtesis: "Photosynthesis",
    photosysthesis: "Photosynthesis",
    photosynthsis: "Photosynthesis",
    photosynth: "Photosynthesis",

    mitochondria: "Mitochondria",
    mitocondria: "Mitochondria",
    mitochondrion: "Mitochondria",
    mitochindria: "Mitochondria",

    chloroplast: "Chloroplast",
    chloroplst: "Chloroplast",

    nucleus: "Nucleus",
    nucleu: "Nucleus",
    nucleas: "Nucleus",

    ribosome: "Ribosome",
    ribosme: "Ribosome",

    enzyme: "Enzyme",
    enyzme: "Enzyme",

    // Chemistry
    electronegativity: "Electronegativity",
    electrnegativty: "Electronegativity",

    oxidation: "Oxidation",
    oxydation: "Oxidation",

    reduction: "Reduction",
    reduation: "Reduction",

    catalyst: "Catalyst",
    catlayst: "Catalyst",

    polymer: "Polymer",
    polymr: "Polymer",

    ionic: "Ionic",
    ionnic: "Ionic",

    covalent: "Covalent",
    covalaent: "Covalent",

    // Physics
    velocity: "Velocity",
    velocty: "Velocity",
    velcity: "Velocity",

    acceleration: "Acceleration",
    accelaration: "Acceleration",

    momentum: "Momentum",
    mometnm: "Momentum",

    energy: "Energy",
    energi: "Energy",
    enrgy: "Energy",

    friction: "Friction",
    frction: "Friction",

    gravity: "Gravity",
    gravty: "Gravity",

    magnetic: "Magnetic",
    magntic: "Magnetic",

    // General
    analysis: "Analysis",
    anallysis: "Analysis",
    analysys: "Analysis",

    synthesis: "Synthesis",
    sythesis: "Synthesis",

    system: "System",
    systme: "System",

    process: "Process",
    procces: "Process",
  };

  // STEP 2: Check predefined mappings using stop-word-free version
  if (topicMap[withoutStopWords]) {
    return topicMap[withoutStopWords];
  }

  // Prefix matching
  for (const [key, value] of Object.entries(topicMap)) {
    if (key.startsWith(withoutStopWords) || withoutStopWords.startsWith(key)) {
      return value;
    }
  }

  // STEP 3: Levenshtein distance for typos (on stop-word-free version)
  const maxDistance = withoutStopWords.length > 10 ? 3 : 2;
  let closest: string | null = null;
  let minDistance = maxDistance;

  for (const [key] of Object.entries(topicMap)) {
    const distance = levenshteinDistance(withoutStopWords, key);
    if (distance < minDistance && distance > 0) {
      minDistance = distance;
      closest = topicMap[key];
    }
  }

  if (closest) {
    return closest;
  }

  // Return original with proper casing
  return topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();
}

/**
 * Normalize a single input string
 * Handles real-world edge cases:
 * - Various whitespace (spaces, tabs, newlines)
 * - Unicode diacritics (café → cafe)
 * - Special characters and punctuation
 * - Zero-width characters
 * - Multiple consecutive spaces/punctuation
 * - HTML entities (if pasted from web)
 * - Emoji and special symbols
 * - Hyphens in compound words (preserves them)
 * - Currency, percentage, degree symbols (removes them)
 *
 * @param input The input string to normalize
 * @returns Normalized string
 */
export function normalizeInput(input: string | null | undefined): string {
  if (!input) return "";

  let normalized = input
    // Convert to lowercase for case-insensitive comparison
    .toLowerCase()
    // ── Remove/normalize various whitespace types ──
    // Replace tabs, newlines, carriage returns with spaces
    .replace(/[\t\n\r]/g, " ")
    // Replace non-breaking spaces, em-space, en-space, etc with regular space
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    // ── Handle Unicode diacritics (café → cafe, naïve → naive) ──
    // Normalize to NFD (decomposed form) then remove diacritics
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    // ── Remove/normalize special characters ──
    // Remove common punctuation with spaces (allows multi-word)
    .replace(/[!?;:,\.•·]/g, " ")
    // Replace quotes and apostrophes with space (word boundary)
    .replace(/["'`'""]/g, " ")
    // Remove currency symbols, percentage, degree
    .replace(/[$€£¥%°]/g, " ")
    // Replace comparison operators
    .replace(/[<>≤≥]/g, " ")
    // Replace symbols commonly used in search: search operators only (not math)
    .replace(/[~|]/g, " ")
    // Replace most brackets with spaces
    .replace(/[(){}\[\]]/g, " ")
    .replace(/[<>]/g, " ")
    // Replace forward slashes with spaces (but keep for fractions in context)
    .replace(/[/\\]/g, " ")
    // Remove math/special symbols (for non-math inputs)
    .replace(/[×÷=±√∑∫∂∆∞→←]/g, " ")
    // Remove factorials, modulo, absolute value bars
    .replace(/[!%|]/g, " ")
    // Remove zero-width characters and other invisible Unicode
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    // ── Remove HTML entities if user pasted from web ──
    .replace(/&\w+;/g, " ")
    .replace(/&#\d+;/g, " ")
    // ── Remove emoji and complex Unicode symbols ──
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, " ")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, " ")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, " ")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, " ")
    // ── Collapse multiple consecutive spaces to single space ──
    .replace(/\s+/g, " ")
    // ── Trim leading and trailing whitespace ──
    .trim()
    // ── Remove duplicate words ──
    .split(" ")
    .filter((word, index, array) => index === 0 || word !== array[index - 1])
    .join(" ")
    .trim();

  // ── Enforce maximum length for efficiency ──
  if (normalized.length > 200) {
    normalized = normalized.substring(0, 200).trim();
  }

  return normalized;
}

/**
 * Normalize all string values in an object (recursive)
 * Useful for normalizing request parameters before cache key generation
 *
 * @param params The parameters object to normalize
 * @returns A new object with normalized string values
 */
export function normalizeParams(
  params: Record<string, any>,
): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      normalized[key] = value;
    } else if (typeof value === "string") {
      // 🎯 CRITICAL: Field-specific normalization for cache consistency
      // Ensures: "photosynthesis" = "the photosynthesis" = "definition of photosynthesis" ✓
      if (key === "topic") {
        // CRITICAL: Topic field uses fuzzy matching + stop words removal
        // Ensures topics normalize consistently
        normalized[key] = normalizeTopic(value);
      } else if (key === "subject") {
        // Subject field uses fuzzy matching + stop words removal
        // Ensures subjects normalize consistently (bio → Biology)
        normalized[key] = normalizeSubject(value);
      } else {
        // All other string fields: basic normalization (whitespace, unicode, case)
        normalized[key] = normalizeInput(value);
      }
    } else if (typeof value === "object" && Array.isArray(value)) {
      // Handle arrays - normalize string items based on context
      normalized[key] = value.map(item => {
        if (typeof item === "string") {
          // Array items: use basic normalization unless array is for topics/subjects
          return normalizeInput(item);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      // Handle nested objects
      normalized[key] = normalizeParams(value);
    } else {
      // Keep other types as-is (numbers, booleans, etc.)
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Normalize specific known text fields for dashboard tools
 * These fields are commonly used in cache keys and should always be normalized
 *
 * @param params The parameters object
 * @returns Object with normalized text fields
 */
export function normalizeToolParams(
  params: Record<string, any>,
): Record<string, any> {
  const textFields = [
    "topic",
    "subject",
    "content",
    "question",
    "text",
    "title",
    "description",
    "goal",
    "query",
    "input",
    "problem",
    "prompt",
  ];

  const normalized = { ...params };

  for (const field of textFields) {
    if (field in normalized && typeof normalized[field] === "string") {
      normalized[field] = normalizeInput(normalized[field]);
    }
  }

  return normalized;
}

/**
 * Normalize input for math problems (Maths Helper agent)
 * Preserves mathematical symbols (x², √, ∫, etc) which are crucial for math questions
 * Only removes punctuation/formatting, keeps all math notation
 *
 * @param input The input string to normalize
 * @returns Normalized string with math symbols preserved
 */
export function normalizeMathInput(input: string | null | undefined): string {
  if (!input) return "";

  let normalized = input
    // Convert to lowercase for case-insensitive comparison
    .toLowerCase()
    // ── Remove/normalize various whitespace types ──
    .replace(/[\t\n\r]/g, " ")
    // Replace non-breaking spaces
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    // ── Handle Unicode diacritics ──
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    // ── Remove/normalize special characters (NOT math symbols/operators!) ──
    // Remove punctuation but NOT: = ± √ ∑ ∫ ∂ ∆ ∞ × ÷ + - ^ . / (math)
    .replace(/[!?;:,•·]/g, " ")
    .replace(/["'`'""]/g, " ")
    // Only remove search operators (~, |), keep math operators (+ - ^ *)
    .replace(/[~|]/g, " ")
    // Keep parentheses/brackets in math (for grouping), remove only angle brackets
    .replace(/[<>]/g, " ")
    // Keep forward slash (used in fractions like 1/2)
    // Remove backslash (not used in math notation typically)
    .replace(/\\/g, " ")
    // ✨ PRESERVE mathematical symbols AND operators ✨
    // Keep: × ÷ = ± √ ∑ ∫ ∂ ∆ ∞ ² ³ + - ^ . / ( ) [ ] { }
    // Preserve degree symbol (°) for angles, trigonometry
    // Preserve colon (:) for ratios, set notation
    // Preserve factorial (!) for factorial notation
    // Preserve modulo (%) when preceded by numbers
    // Remove currency, only keep math
    .replace(/[$€£¥]/g, " ")
    // Remove arrows (→ ← ↑ ↓)
    .replace(/[→←↑↓]/g, " ")
    // Remove invisible Unicode
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    // Remove HTML entities
    .replace(/&\w+;/g, " ")
    .replace(/&#\d+;/g, " ")
    // Remove emoji only (keep math Unicode)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, " ")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, " ")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, " ")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, " ")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    // Trim and deduplicate words
    .trim()
    .split(" ")
    .filter((word, index, array) => index === 0 || word !== array[index - 1])
    .join(" ")
    .trim();

  // Enforce maximum length
  if (normalized.length > 200) {
    normalized = normalized.substring(0, 200).trim();
  }

  return normalized;
}

/**
 * Normalize tool params for math problems
 * Uses math-aware normalization that preserves mathematical symbols
 *
 * @param params The parameters object
 * @returns Object with math-aware normalized text fields
 */
export function normalizeToolParamsMath(
  params: Record<string, any>,
): Record<string, any> {
  const textFields = ["problem", "topic", "question", "content"];

  const normalized = { ...params };

  for (const field of textFields) {
    if (field in normalized && typeof normalized[field] === "string") {
      normalized[field] = normalizeMathInput(normalized[field]);
    }
  }

  return normalized;
}

/**
 * Detect if input contains mathematical content
 * Comprehensive detection for various math patterns and notations
 *
 * @param input The input string to check
 * @returns true if input contains mathematical content
 */
export function isMathContent(input: string | null | undefined): boolean {
  if (!input) return false;

  // Check for mathematical symbols and operators
  const mathSymbols = /[x²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉×÷=±√∑∫∂∆∞π∞θ≤≥\[\]\(\)°]/i;
  if (mathSymbols.test(input)) return true;

  // Check for common math patterns
  const mathPatterns = [
    /[a-zA-Z0-9][\s]?[+\-×÷=±][\s]?[a-zA-Z0-9]/, // "a + b", "5 - 3"
    /\d+[\s]?[\/][\s]?\d+/, // Fractions "1/2", "3/4"
    /\d+[\.][\d]/, // Decimals "3.14", "2.5"
    /\d+[\s]?[%]/, // Percentage "50%", "25 %"
    /[a-z]\d+|[a-z]\^/i, // Variables "x2", "x^" exponent
    /[\d]+[\s]?[\:][\s]?[\d]/, // Ratios "1:2", "3:4"
    /[\d]+[\s]?[°]/, // Degree notation "90°", "45 °"
    /[\d]+[\s]?[!]/, // Factorial "5!", "n!"
    /[a-z]\([^)]*\)/i, // Function notation "sin(x)", "log(2)"
    /sin|cos|tan|log|sqrt|power|mod|modulo/i, // Function names
    /equals|minus|plus|times|divide|squared|cubed/i, // Word forms
    /√|∫|∑|π|∞/, // Math symbols
    /[e|E][\s]?[\+\-]?[\s]?\d/, // Scientific notation "1e-5"
    /[≤≥<>]/, // Comparison operators
  ];

  return mathPatterns.some(pattern => pattern.test(input));
}

/**
 * Smart normalization that detects math content and applies appropriate strategy
 * If input contains math symbols → preserves them (math normalization)
 * If input is regular text → removes all special chars (standard normalization)
 *
 * @param input The input string to normalize
 * @returns Normalized string with smart symbol handling
 */
export function smartNormalizeInput(input: string | null | undefined): string {
  if (!input) return "";

  // Auto-detect if this is math content
  const hasMathContent = isMathContent(input);

  // Apply appropriate normalization strategy
  if (hasMathContent) {
    return normalizeMathInput(input); // Keep math symbols ✓
  } else {
    return normalizeInput(input); // Remove special chars
  }
}

/**
 * Smart tool params normalization
 * Automatically detects math content per field and applies appropriate normalization
 * Fields with math → preserve symbols
 * Fields without math → remove special chars
 *
 * @param params The parameters object
 * @returns Object with smart normalized text fields
 */
export function smartNormalizeToolParams(
  params: Record<string, any>,
): Record<string, any> {
  const textFields = [
    "topic",
    "subject",
    "content",
    "question",
    "text",
    "title",
    "description",
    "goal",
    "query",
    "input",
    "problem",
    "prompt",
  ];

  const normalized = { ...params };

  for (const field of textFields) {
    if (field in normalized && typeof normalized[field] === "string") {
      normalized[field] = smartNormalizeInput(normalized[field]);
    }
  }

  return normalized;
}
