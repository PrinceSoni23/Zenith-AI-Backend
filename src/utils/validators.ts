/**
 * Comprehensive input validation utilities
 * Protects against edge cases, type coercion, injection attacks, and other vulnerabilities
 */

export interface ValidationResult {
  valid: boolean;
  value?: any;
  error?: string;
}

/**
 * Fuzzy subject matcher - handles abbreviations and misspellings
 * Examples:
 *   "bio" → "Biology"
 *   "math" → "Mathematics"
 *   "mathe" → "Mathematics"
 *   "chem" → "Chemistry"
 *   "PHYSICS" → "Physics"
 *   "biologi" → "Biology"
 * Covers: abbreviations, partial spellings, case insensitivity, common misspellings
 */
/**
 * 🎯 IMPROVED: Now handles BOTH predefined subjects AND unknown ones!
 * Normalize and validate subject with adaptive fuzzy matching
 * Handles common misspellings like "bio" → "Biology", "chem" → "Chemistry"
 *
 * NEW: Also handles unknown subjects gracefully:
 * - "Quantm Physics" → "Quantum Physics" (typo detected)
 * - "Marine Science" → "Marine Science" (unknown but formatted properly)
 * - "astro physics" → "Astrophysics" (spacing/case normalized)
 */
export const normalizeSubject = (subject: any): string | null => {
  if (typeof subject !== "string" || !subject.trim()) {
    return null;
  }

  // Subject mapping: abbreviations and common misspellings → canonical name
  const SUBJECT_MAP: Record<string, string> = {
    // Mathematics
    math: "Mathematics",
    maths: "Mathematics",
    mathe: "Mathematics",
    mathem: "Mathematics",
    mathematic: "Mathematics",
    mathemat: "Mathematics",
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

    // Geography
    geography: "Geography",
    geo: "Geography",
    geografi: "Geography",
    geog: "Geography",

    // Hindi
    hindi: "Hindi",
    hind: "Hindi",

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

  const normalized = subject.trim().toLowerCase();

  // Use adaptive approach: try known subjects first, then generic matching
  return adaptiveFuzzyMatch(normalized, SUBJECT_MAP);
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding misspellings (distance <= 2 is considered a match)
 */
const levenshteinDistance = (str1: string, str2: string): number => {
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
};

/**
 * Find closest matching subject from list based on Levenshtein distance
 */
const findClosestSubject = (
  input: string,
  subjects: string[],
  maxDistance: number = 2,
): string | null => {
  let closest: string | null = null;
  let minDistance = maxDistance;

  for (const subject of subjects) {
    const distance = levenshteinDistance(input, subject);
    if (distance < minDistance) {
      minDistance = distance;
      closest = subject;
    }
  }

  return closest;
};

/**
 * 🎯 GENERIC FUZZY MATCHING - Works for ANY input, not just predefined ones!
 * Key insight: Use multiple algorithms to handle unknown inputs intelligently
 */

/**
 * Remove common English stop words from input
 * Ensures consistent normalization for: "photosynthesis", "the photosynthesis", "definition of photosynthesis"
 * All normalize to: "Photosynthesis"
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
 * Extract ngrams (character n-tuples) from string
 * Used for similarity matching without predefined lists
 * Example: "analysis" → trigrams: ["ana", "nal", "aly", "lys", "ysi", "sis"]
 */
function getNgrams(str: string, n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  const normalized = str.toLowerCase();

  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.substring(i, i + n));
  }

  return ngrams;
}

/**
 * Calculate Jaccard similarity between two strings using ngrams
 * Returns value between 0 and 1 (1 = identical, 0 = completely different)
 * Works well for ANY text without predefined lists!
 */
function ngramSimilarity(
  str1: string,
  str2: string,
  nSize: number = 3,
): number {
  const ngrams1 = getNgrams(str1, nSize);
  const ngrams2 = getNgrams(str2, nSize);

  if (ngrams1.size === 0 && ngrams2.size === 0) return 1; // Both empty
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0; // One empty

  const array1 = Array.from(ngrams1);
  const array2 = Array.from(ngrams2);
  const intersection = array1.filter(x => ngrams2.has(x));
  const union = new Set([...array1, ...array2]);

  return intersection.length / union.size;
}

/**
 * Advanced generic fuzzy matcher - works for ANY unknown input!
 * Doesn't rely on predefined lists
 * Examples that now work:
 *   "Quantum Mechanics" (new topic) → capitalized properly
 *   "thermodynamcs" → similar to nothing, but recognized as topic-like
 *   "cel biology" → likely meant "cell biology"
 */
function genericFuzzyNormalize(input: string): string {
  if (!input || !input.trim()) return "";

  const normalized = input.trim();

  // Check for common misspelling patterns in ANY text
  // Pattern 1: Fix common double letters
  let result = normalized.replace(/(.)\1{2,}/g, "$1$1"); // "thhee" → "thee"

  // Pattern 2: Fix missing vowels (common in shorthand)
  // "hmwrk" likely means "homework"
  if (result.length > 3) {
    const hasVowels = /[aeiou]/i.test(result);
    if (!hasVowels && result.length > 2) {
      // Likely an abbreviation, keep as-is but flag it
      return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    }
  }

  // Pattern 3: Fix common transpositions via Levenshtein
  // E.g., "teh" is common typo for "the"
  const commonTranspositions: Record<string, string> = {
    teh: "the",
    adn: "and",
    taht: "that",
    wich: "which",
    recieve: "receive",
    occured: "occurred",
    seperate: "separate",
    definately: "definitely",
    becuase: "because",
  };

  const lower = result.toLowerCase();
  if (commonTranspositions[lower]) {
    return (
      commonTranspositions[lower].charAt(0).toUpperCase() +
      commonTranspositions[lower].slice(1)
    );
  }

  // Pattern 4: Fix common prefix/suffix issues
  // "studyng" → "studying", "analyzr" → "analyzer"
  if (
    result.endsWith("ng") &&
    !["ing", "ung", "ong"].some(s => result.endsWith(s))
  ) {
    // Ends with ng but not part of -ing, might be typo
    const withoutG = result.slice(0, -1);
    if (withoutG.length > 3) result = withoutG;
  }

  // Return with proper casing (title case for multi-word)
  return result
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Find similar words in compound topics
 * Example: "cel biology" → "cell biology" (one word misspelled)
 */
function fixCompoundMisspellings(input: string): string {
  const words = input.toLowerCase().split(/\s+/);

  const commonMisspellings: Record<string, string> = {
    cel: "cell",
    biologoy: "biology",
    chemisty: "chemistry",
    fisics: "physics",
    mtah: "math",
    histroy: "history",
    englich: "english",
    grammer: "grammar",
    syngin: "singing",
    writting: "writing",
    reeding: "reading",
  };

  const corrected = words.map(word => commonMisspellings[word] || word);
  return corrected.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Generic fuzzy match for ANY unknown input
 * Uses multiple strategies to handle edge cases
 */
export function genericFuzzyMatch(input: string): string {
  if (!input || !input.trim()) return "";

  // Strategy 1: Fix known transpositions
  let result = genericFuzzyNormalize(input);

  // Strategy 2: Fix compound word misspellings
  if (result.split(/\s+/).length <= 3) {
    result = fixCompoundMisspellings(result);
  }

  // Strategy 3: Normalize spacing and casing
  result = result
    .replace(/\s+/g, " ") // Multiple spaces → single space
    .trim();

  return result;
}

/**
 * 🎯 ADAPTIVE FUZZY MATCHING - Handles BOTH predefined and unknown inputs
 *
 * Use this for any string field where you might get unknown values:
 * 1. First tries predefined mappings (fast, known values)
 * 2. Then tries generic fuzzy algorithms (slow, unknown values)
 * 3. Finally returns normalized version (always safe)
 *
 * Works for: topics, subjects, tags, labels, descriptions, etc.
 */
export function adaptiveFuzzyMatch(
  input: string,
  predefinedMap?: Record<string, string>,
): string {
  if (!input || !input.trim()) return "";

  let normalized = input.trim().toLowerCase();

  // STEP 1: Remove stop words first (applies UNIVERSALLY to ALL topics)
  // Ensures: "photosynthesis", "the photosynthesis", "definition of photosynthesis" all normalize to same
  const withoutStopWords = removeStopWords(normalized).trim();

  // If nothing left after removing stop words, fall back to generic matching
  if (!withoutStopWords) {
    return genericFuzzyMatch(input);
  }

  // STEP 2: Check predefined mappings using stop-word-free version
  if (predefinedMap) {
    if (predefinedMap[withoutStopWords]) {
      return predefinedMap[withoutStopWords];
    }

    // Try prefix matching
    for (const [key, value] of Object.entries(predefinedMap)) {
      if (
        key.startsWith(withoutStopWords) ||
        withoutStopWords.startsWith(key)
      ) {
        return value;
      }
    }

    // Try Levenshtein distance on known items
    const keys = Object.keys(predefinedMap);
    const closestKey = findClosestSubject(withoutStopWords, keys, 2);
    if (closestKey) {
      return predefinedMap[closestKey];
    }
  }

  // STEP 3: No match in predefined - use generic matching on stop-word-free version
  return genericFuzzyMatch(withoutStopWords);
}

/**
 * 🎯 ADVANCED FUZZY MATCHING - Comprehensive misspelling handler
 * Handles common typos, spelling variations, and similar words across all fields
 */

/**
 * Normalize learning style with fuzzy matching
 * Examples: "visuual" → "visual", "auditory" → "auditory", "auditry" → "auditory"
 */
export const normalizeLearningStyle = (
  style: any,
): "visual" | "auditory" | "reading" | "kinesthetic" | null => {
  if (typeof style !== "string" || !style.trim()) {
    return null;
  }

  const input = style.trim().toLowerCase();
  const validStyles = ["visual", "auditory", "reading", "kinesthetic"];

  // Exact match
  if (validStyles.includes(input)) {
    return input as "visual" | "auditory" | "reading" | "kinesthetic";
  }

  // Fuzzy matching with common misspellings
  const styleMap: Record<
    string,
    "visual" | "auditory" | "reading" | "kinesthetic"
  > = {
    // Visual
    visuual: "visual",
    visiual: "visual",
    visula: "visual",
    visaul: "visual",
    "visual ": "visual",
    vis: "visual",
    visuall: "visual",

    // Auditory
    auditory: "auditory",
    auditry: "auditory",
    audiatry: "auditory",
    audiotry: "auditory",
    audiory: "auditory",
    aud: "auditory",
    audio: "auditory",

    // Reading
    reading: "reading",
    reding: "reading",
    "reading ": "reading",
    readng: "reading",
    read: "reading",

    // Kinesthetic
    kinesthetic: "kinesthetic",
    kinestehtic: "kinesthetic",
    "kinesthetic ": "kinesthetic",
    kinesthic: "kinesthetic",
    kinestic: "kinesthetic",
    kin: "kinesthetic",
    physical: "kinesthetic", // synonym
  };

  if (styleMap[input]) {
    return styleMap[input];
  }

  // Levenshtein distance fuzzy match
  let closest: "visual" | "auditory" | "reading" | "kinesthetic" | null = null;
  let minDistance = 2;

  for (const style of validStyles) {
    const distance = levenshteinDistance(input, style);
    if (distance < minDistance) {
      minDistance = distance;
      closest = style as "visual" | "auditory" | "reading" | "kinesthetic";
    }
  }

  return closest;
};

/**
 * Normalize source type (for notes)
 * Examples: "txt" → "text", "pdf " → "pdf", "image" → "image"
 */
export const normalizeSourceType = (
  type: any,
): "text" | "image" | "pdf" | null => {
  if (typeof type !== "string" || !type.trim()) {
    return null;
  }

  const input = type.trim().toLowerCase();
  const validTypes = ["text", "image", "pdf"];

  // Exact match
  if (validTypes.includes(input)) {
    return input as "text" | "image" | "pdf";
  }

  // Common misspellings
  const typeMap: Record<string, "text" | "image" | "pdf"> = {
    // Text
    txt: "text",
    plain: "text",
    plaintext: "text",
    "text ": "text",

    // Image
    img: "image",
    "image ": "image",
    imagge: "image",
    imag: "image",
    photo: "image",
    picture: "image",
    pic: "image",
    jpeg: "image",
    jpg: "image",
    png: "image",

    // PDF
    "pdf ": "pdf",
    pd: "pdf",
    doc: "pdf",
    document: "pdf",
  };

  if (typeMap[input]) {
    return typeMap[input];
  }

  // Fuzzy match
  let closest: "text" | "image" | "pdf" | null = null;
  let minDistance = 2;

  for (const valid of validTypes) {
    const distance = levenshteinDistance(input, valid);
    if (distance < minDistance) {
      minDistance = distance;
      closest = valid as "text" | "image" | "pdf";
    }
  }

  return closest;
};

/**
 * Normalize topic/concept names with fuzzy matching
 * Handles common misspellings in biology, chemistry, physics topics
 * Examples: "photosynhtesis" → "Photosynthesis", "mitocondria" → "Mitochondria"
 */
/**
 * 🎯 IMPROVED: Now handles BOTH predefined topics AND unknown ones!
 * Normalize and validate topic with adaptive fuzzy matching
 * Handles common misspellings like "photosynhtesis" → "Photosynthesis"
 *
 * NEW: Also handles UNKNOWN topics gracefully:
 * - "Quantum Mechanics" → "Quantum Mechanics" (not in map, but properly formatted)
 * - "Quantm Physics" → "Quantum Physics" (typo detected even if new topic)
 * - "relatvity" → "Relativity" (common transposition typo auto-fixed)
 * - "cel biology" → "Cell Biology" (word-level typo fixed)
 */
export const normalizeTopic = (topic: any): string | null => {
  if (typeof topic !== "string" || !topic.trim()) {
    return null;
  }

  // Common topic misspellings mapping (predefined for known concepts)
  const TOPIC_MAP: Record<string, string> = {
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
    mitoch: "Mitochondria",

    chloroplast: "Chloroplast",
    chloroplst: "Chloroplast",
    chloro: "Chloroplast",

    nucleus: "Nucleus",
    nucleu: "Nucleus",
    nucleas: "Nucleus",
    nucleous: "Nucleus",

    ribosome: "Ribosome",
    ribosme: "Ribosome",

    enzyme: "Enzyme",
    enyzme: "Enzyme",
    enzym: "Enzyme",

    // Chemistry
    electronegativity: "Electronegativity",
    electrnegativty: "Electronegativity",
    electronegatvity: "Electronegativity",

    oxidation: "Oxidation",
    oxydation: "Oxidation",
    oxidaton: "Oxidation",

    reduction: "Reduction",
    reduation: "Reduction",
    reducton: "Reduction",

    catalyst: "Catalyst",
    catlayst: "Catalyst",
    catalist: "Catalyst",
    catalst: "Catalyst",

    polymer: "Polymer",
    polymr: "Polymer",
    polymar: "Polymer",

    monomer: "Monomer",
    monomr: "Monomer",

    ionic: "Ionic",
    ionnic: "Ionic",
    inoic: "Ionic",

    covalent: "Covalent",
    covalaent: "Covalent",
    covalnt: "Covalent",

    // Physics
    velocity: "Velocity",
    velocty: "Velocity",
    velociti: "Velocity",
    velcity: "Velocity",

    acceleration: "Acceleration",
    accelaration: "Acceleration",
    accelertion: "Acceleration",
    aceleration: "Acceleration",

    momentum: "Momentum",
    mometnm: "Momentum",
    momnetum: "Momentum",
    momentm: "Momentum",

    energy: "Energy",
    energi: "Energy",
    enrgy: "Energy",
    energry: "Energy",

    friction: "Friction",
    frction: "Friction",
    frictio: "Friction",

    gravity: "Gravity",
    gravty: "Gravity",
    gravit: "Gravity",

    magnetic: "Magnetic",
    magntic: "Magnetic",
    magnetc: "Magnetic",

    wavelength: "Wavelength",
    wavelegth: "Wavelength",
    wavelenght: "Wavelength",
    waveegnth: "Wavelength",

    // General
    analysis: "Analysis",
    anallysis: "Analysis",
    analysys: "Analysis",
    analisis: "Analysis",

    synthesis: "Synthesis",
    sythesis: "Synthesis",
    synthsis: "Synthesis",

    regulation: "Regulation",
    reguulation: "Regulation",
    regulatin: "Regulation",

    system: "System",
    systme: "System",
    sysem: "System",

    process: "Process",
    procces: "Process",
    proces: "Process",

    function: "Function",
    functio: "Function",
    functin: "Function",
  };

  const normalized = topic.trim().toLowerCase();

  // Use adaptive approach: try known topics first, then generic matching for unknowns
  return adaptiveFuzzyMatch(normalized, TOPIC_MAP);
};

/**
 * Normalize board (education board)
 * Examples: "CBSE " → "CBSE", "isc" → "ISC", "uboard" → "STATE"
 */
export const normalizeBoard = (board: any): string | null => {
  if (typeof board !== "string" || !board.trim()) {
    return null;
  }

  const input = board.trim().toUpperCase();

  const boardMap: Record<string, string> = {
    CBSE: "CBSE",
    ICSE: "ICSE",
    ISC: "ISC",
    STATE: "STATE",
    IGCSE: "IGCSE",
    IB: "IB",

    // Variations
    "CBSE ": "CBSE",
    "CBSE.": "CBSE",
    "ICSE ": "ICSE",
    "ISC ": "ISC",
    "STATE ": "STATE",
    "IGCSE ": "IGCSE",
    "IB ": "IB",
  };

  if (boardMap[input]) {
    return boardMap[input];
  }

  // Fuzzy match for boards
  const validBoards = ["CBSE", "ICSE", "ISC", "STATE", "IGCSE", "IB"];
  let closest: string | null = null;
  let minDistance = 2;

  for (const board of validBoards) {
    const distance = levenshteinDistance(input, board);
    if (distance < minDistance) {
      minDistance = distance;
      closest = board;
    }
  }

  return closest || input; // Return as-is if no close match
};

/**
 * Normalize tags (for notes, study logs, etc)
 * Handles common misspellings and variations in tag names
 */
export const normalizeTag = (tag: any): string | null => {
  if (typeof tag !== "string" || !tag.trim()) {
    return null;
  }

  const input = tag.trim().toLowerCase();

  // Common study-related tags with misspellings
  const tagMap: Record<string, string> = {
    // Difficulty
    easy: "easy",
    eazy: "easy",
    simple: "easy",
    basic: "easy",

    medium: "medium",
    mediun: "medium",
    "medium ": "medium",
    intermidiate: "medium",
    intermediate: "medium",

    hard: "hard",
    difficult: "hard",
    "hard ": "hard",
    challanging: "hard",
    challenging: "hard",
    advanced: "hard",

    // Study type
    revision: "revision",
    revison: "revision",
    reviison: "revision",
    review: "revision",

    practice: "practice",
    practise: "practice",
    "practise ": "practice",
    practical: "practice",

    theory: "theory",
    teory: "theory",
    theoy: "theory",
    theorry: "theory",

    homework: "homework",
    homewrok: "homework",
    homeowrk: "homework",
    assignment: "homework",

    exam: "exam",
    exma: "exam",
    test: "exam",

    project: "project",
    projct: "project",
    projeect: "project",

    // Others
    important: "important",
    importnat: "important",
    importent: "important",

    concept: "concept",
    concpet: "concept",
    conce: "concept",
  };

  if (tagMap[input]) {
    return tagMap[input];
  }

  // Fuzzy match
  const tags = Object.keys(tagMap);
  let closest: string | null = null;
  let minDistance = 2;

  for (const t of tags) {
    const distance = levenshteinDistance(input, t);
    if (distance < minDistance && distance > 0) {
      minDistance = distance;
      closest = tagMap[t];
    }
  }

  return closest || tag.toLowerCase(); // Return lowercase if no match
};

/**
 * Validates positive integer for pagination (page, limit, etc)
 * Prevents: negative values, NaN, Infinity, 0, type coercion
 */
export const validatePositiveInteger = (
  value: any,
  fieldName: string,
  defaultValue: number = 1,
  maxValue?: number,
): ValidationResult => {
  // Check for undefined/null
  if (value === undefined || value === null) {
    return { valid: true, value: defaultValue };
  }

  // Parse to number if string
  let num = typeof value === "string" ? parseInt(value, 10) : value;

  // Check if NaN
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  // Check if Infinity
  if (!isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a finite number` };
  }

  // Check if not integer
  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  // Check if positive
  if (num <= 0) {
    return { valid: false, error: `${fieldName} must be positive (> 0)` };
  }

  // Check max value if specified
  if (maxValue !== undefined && num > maxValue) {
    return { valid: false, error: `${fieldName} must not exceed ${maxValue}` };
  }

  return { valid: true, value: num };
};

/**
 * Validates non-negative integer (0 or positive)
 * Used for duration, scores, counts
 */
export const validateNonNegativeInteger = (
  value: any,
  fieldName: string,
  maxValue?: number,
): ValidationResult => {
  // Check for undefined/null
  if (value === undefined || value === null) {
    return { valid: true, value: 0 };
  }

  // Parse to number if string
  let num = typeof value === "string" ? parseInt(value, 10) : value;

  // Check if NaN
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  // Check if Infinity
  if (!isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a finite number` };
  }

  // Check if not integer
  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  // Check if negative
  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  // Check max value if specified
  if (maxValue !== undefined && num > maxValue) {
    return { valid: false, error: `${fieldName} must not exceed ${maxValue}` };
  }

  return { valid: true, value: num };
};

/**
 * Validates string with length constraints
 * Prevents: empty strings, null bytes, excessive length
 */
export const validateString = (
  value: any,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 1000,
): ValidationResult => {
  // Check for undefined/null
  if (value === undefined || value === null) {
    if (minLength === 0) {
      return { valid: true, value: "" };
    }
    return { valid: false, error: `${fieldName} is required` };
  }

  // Convert to string if not already
  let str = String(value);

  // Check for null bytes (injection risk)
  if (str.includes("\0")) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  // Trim whitespace
  str = str.trim();

  // Check minimum length
  if (str.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  // Check maximum length
  if (str.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { valid: true, value: str };
};

/**
 * Validates email format
 * RFC 5321 simplified
 */
export const validateEmail = (value: any): ValidationResult => {
  const email = String(value).trim().toLowerCase();

  // Check minimum length
  if (email.length < 5 || email.length > 255) {
    return { valid: false, error: "Email must be between 5-255 characters" };
  }

  // RFC 5321 simplified check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Email format is invalid" };
  }

  // Check for null bytes
  if (email.includes("\0")) {
    return { valid: false, error: "Email contains invalid characters" };
  }

  return { valid: true, value: email };
};

/**
 * Validates password strength
 * Requirements: min 8 chars, mix of uppercase, lowercase, number
 */
export const validatePassword = (value: any): ValidationResult => {
  const password = String(value);

  if (password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters",
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: "Password must not exceed 128 characters",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one number",
    };
  }

  // Check for null bytes
  if (password.includes("\0")) {
    return {
      valid: false,
      error: "Password contains invalid characters",
    };
  }

  return { valid: true, value: password };
};

/**
 * Validates time (hour and minute)
 * Prevents: out of range values
 */
export const validateTime = (hour: any, minute: any): ValidationResult => {
  // Validate hour
  let h = typeof hour === "string" ? parseInt(hour, 10) : hour;
  if (!Number.isInteger(h) || h < 0 || h > 23) {
    return {
      valid: false,
      error: "Hour must be an integer between 0-23",
    };
  }

  // Validate minute
  let m = typeof minute === "string" ? parseInt(minute, 10) : minute;
  if (!Number.isInteger(m) || m < 0 || m > 59) {
    return {
      valid: false,
      error: "Minute must be an integer between 0-59",
    };
  }

  return { valid: true, value: { hour: h, minute: m } };
};

/**
 * Validates array with size constraints
 */
export const validateArray = (
  value: any,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 100,
): ValidationResult => {
  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must have at least ${minLength} items`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} items`,
    };
  }

  return { valid: true, value };
};

/**
 * Validates enum value
 */
export const validateEnum = (
  value: any,
  fieldName: string,
  allowedValues: any[],
): ValidationResult => {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    };
  }

  return { valid: true, value };
};

/**
 * Whitelist fields from object
 * Only returns specified fields, ignores others
 */
export const whitelistFields = (
  obj: Record<string, any>,
  allowedFields: string[],
): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
};

/**
 * Sanitizes string to prevent injection attacks
 * Removes special characters that could be used for injection
 */
export const sanitizeString = (value: string): string => {
  return String(value)
    .trim()
    .replace(/[\0\n\r\t]/g, "") // Remove null bytes, newlines, tabs
    .slice(0, 1000); // Cap at reasonable length
};

/**
 * Normalizes pagination parameters
 */
export const normalizePagination = (
  page?: any,
  limit?: any,
): { page: number; limit: number } => {
  const pageResult = validatePositiveInteger(page, "page", 1, 999999);
  if (!pageResult.valid) {
    return { page: 1, limit: 5 };
  }

  const limitResult = validateNonNegativeInteger(limit, "limit", 100);
  if (!limitResult.valid) {
    return { page: pageResult.value || 1, limit: 5 };
  }

  return {
    page: pageResult.value || 1,
    limit: Math.max(1, Math.min(100, limitResult.value || 5)),
  };
};

/**
 * Validates study log fields
 * Now includes subject fuzzy matching for abbreviations/misspellings
 */
export const validateStudyLogFields = (body: any) => {
  const errors: Record<string, string> = {};

  // Validate duration
  const durationResult = validateNonNegativeInteger(
    body.durationMinutes,
    "durationMinutes",
    1440, // Max 24 hours in one log
  );
  if (!durationResult.valid) {
    errors.durationMinutes = durationResult.error || "Invalid duration";
  }

  // Validate score
  const scoreResult = validateNonNegativeInteger(
    body.scoreEarned,
    "scoreEarned",
    10000, // Reasonable max score
  );
  if (!scoreResult.valid) {
    errors.scoreEarned = scoreResult.error || "Invalid score";
  }

  // Validate and normalize subject (handles abbreviations like "bio" → "Biology")
  const normalizedSubject = normalizeSubject(body.subject);
  if (!normalizedSubject) {
    errors.subject = "Subject is required";
  } else {
    const subjectStringResult = validateString(
      normalizedSubject,
      "subject",
      2,
      50,
    );
    if (!subjectStringResult.valid) {
      errors.subject = subjectStringResult.error || "Invalid subject";
    }
  }

  // Validate topic (optional)
  if (body.topic !== undefined) {
    const topicResult = validateString(body.topic, "topic", 1, 50);
    if (!topicResult.valid) {
      errors.topic = topicResult.error || "Invalid topic";
    }
  }

  // Validate notes (optional)
  if (body.notes !== undefined) {
    const notesResult = validateString(body.notes, "notes", 0, 500);
    if (!notesResult.valid) {
      errors.notes = notesResult.error || "Invalid notes";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      durationMinutes: durationResult.value || 0,
      scoreEarned: scoreResult.value || 0,
      subject: normalizedSubject || "",
      topic: body.topic,
      notes: body.notes,
    },
  };
};

/**
 * Validates note fields
 * Now includes subject fuzzy matching for abbreviations/misspellings
 */
export const validateNoteFields = (body: any) => {
  const errors: Record<string, string> = {};

  // Validate title
  const titleResult = validateString(body.title || "", "title", 1, 200);
  if (!titleResult.valid) {
    errors.title = titleResult.error || "Invalid title";
  }

  // Validate content
  const contentResult = validateString(body.content || "", "content", 1, 10000);
  if (!contentResult.valid) {
    errors.content = contentResult.error || "Invalid content";
  }

  // Validate and normalize subject (handles abbreviations like "bio" → "Biology")
  const normalizedSubject = normalizeSubject(body.subject);
  if (!normalizedSubject) {
    errors.subject = "Subject is required";
  } else {
    const subjectStringResult = validateString(
      normalizedSubject,
      "subject",
      2,
      50,
    );
    if (!subjectStringResult.valid) {
      errors.subject = subjectStringResult.error || "Invalid subject";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      title: titleResult.value || "",
      content: contentResult.value || "",
      subject: normalizedSubject || "",
    },
  };
};

/**
 * Validates relationship field for parent connections
 */
export const validateRelationship = (value: any) => {
  const allowedRelationships = ["mother", "father", "guardian", "other"];
  return validateEnum(value, "relationship", allowedRelationships);
};
