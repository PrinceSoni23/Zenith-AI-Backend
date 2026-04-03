/**
 * Input Normalization Utility (Backend)
 * Ensures consistent handling of user inputs for caching and AI processing
 * Handles: case sensitivity, extra whitespace, special characters, unicode
 * Real-world scenarios: copy-paste from web, typos, mixed punctuation, etc.
 */

/**
 * Convert plural forms to singular for consistent topic matching
 * Ensures "photons" and "photon" generate the same cache key
 * Comprehensive coverage: Indian school curriculum (Class 3-12)
 * Examples: enzymes → enzyme, mitochondria → mitochondrion, photons → photon
 *
 * @param word The word to singularize
 * @returns Singularized form
 */
function singularize(word: string): string {
  if (!word || word.length === 0) return word;

  const lowerWord = word.toLowerCase();

  // Special cases that don't follow standard rules
  // COMPREHENSIVE: Indian curriculum Class 3-12 (CBSE, ICSE, State Boards)
  const specialCases: Record<string, string> = {
    // ════════════════════════════════════════════════════════
    // BIOLOGY - All Classes
    // ════════════════════════════════════════════════════════
    // Cells & Organelles (Class 5-6+)
    mitochondria: "mitochondrion",
    chloroplasts: "chloroplast",
    ribosomes: "ribosome",
    nuclei: "nucleus",
    nucleuses: "nucleus",
    vacuoles: "vacuole",
    lysosomes: "lysosome",
    centrioles: "centriole",
    chromosomes: "chromosome",
    centromeres: "centromere",
    genes: "gene",
    alleles: "allele",

    // Tissues & Organs (Class 6+)
    tissues: "tissue",
    organs: "organ",
    organisms: "organism",
    cells: "cell",
    neurons: "neuron",
    blood_vessels: "blood_vessel",

    // Enzymes, Proteins, Compounds
    enzymes: "enzyme",
    proteins: "protein",
    antibodies: "antibody",
    hormones: "hormone",
    peptides: "peptide",

    // Organelles & Structures
    organelles: "organelle",
    mitochondrions: "mitochondrion",
    vesicles: "vesicle",
    plastids: "plastid",

    // Photosynthesis & Respiration (Class 7+)
    photons: "photon",
    chlorophyll: "chlorophyll",
    glucose: "glucose",
    oxygen: "oxygen",
    carbon_dioxide: "carbon_dioxide",

    // Reproduction & Heredity (Class 10+)
    gametes: "gamete",
    zygotes: "zygote",
    phenotypes: "phenotype",
    genotypes: "genotype",
    mutations: "mutation",
    variations: "variation",
    traits: "trait",

    // Ecology (Class 7-8+)
    ecosystems: "ecosystem",
    habitats: "habitat",
    species: "species",
    populations: "population",
    communities: "community",
    predators: "predator",
    preys: "prey",
    producers: "producer",
    consumers: "consumer",
    decomposers: "decomposer",
    herbivores: "herbivore",
    carnivores: "carnivore",
    omnivores: "omnivore",
    food_chains: "food_chain",
    food_webs: "food_web",

    // Human Systems (Class 9-10)
    bones: "bone",
    muscles: "muscle",
    joints: "joint",
    ligaments: "ligament",
    tendons: "tendon",
    nerves: "nerve",
    arteries: "artery",
    veins: "vein",
    capillaries: "capillary",
    lungs: "lung",
    kidneys: "kidney",
    glands: "gland",

    // ════════════════════════════════════════════════════════
    // CHEMISTRY - All Classes
    // ════════════════════════════════════════════════════════
    // Atomic Theory (Class 8-9+)
    electrons: "electron",
    protons: "proton",
    neutrons: "neutron",
    atoms: "atom",
    molecules: "molecule",
    ions: "ion",
    isotopes: "isotope",
    orbitals: "orbital",
    shells: "shell",
    subshells: "subshell",

    // Compounds & Reactions (Class 8-10)
    compounds: "compound",
    elements: "element",
    salts: "salt",
    oxides: "oxide",
    hydroxides: "hydroxide",
    chlorides: "chloride",
    carbonates: "carbonate",
    nitrates: "nitrate",
    sulfates: "sulfate",
    phosphates: "phosphate",

    // Reactions & States (Class 6-9)
    reactions: "reaction",
    catalysts: "catalyst",
    reactants: "reactant",
    products: "product",
    mixtures: "mixture",
    solutions: "solution",
    suspensions: "suspension",
    colloids: "colloid",

    // Bond Types (Class 10+)
    bonds: "bond",
    covalent_bonds: "covalent_bond",
    ionic_bonds: "ionic_bond",
    hydrogen_bonds: "hydrogen_bond",
    metallic_bonds: "metallic_bond",

    // Organic Chemistry (Class 11-12)
    hydrocarbons: "hydrocarbon",
    alkanes: "alkane",
    alkenes: "alkene",
    alkynes: "alkyne",
    alcohols: "alcohol",
    aldehydes: "aldehyde",
    ketones: "ketone",
    carboxylic_acids: "carboxylic_acid",
    esters: "ester",
    amines: "amine",
    polymers: "polymer",

    // Redox & Electrochemistry (Class 11+)
    oxidants: "oxidant",
    reductants: "reductant",
    electrodes: "electrode",
    electrolytes: "electrolyte",

    // ════════════════════════════════════════════════════════
    // PHYSICS - All Classes
    // ════════════════════════════════════════════════════════
    // Mechanics (Class 6+)
    velocities: "velocity",
    accelerations: "acceleration",
    momenta: "momentum",
    momentums: "momentum",
    energies: "energy",
    forces: "force",
    magnets: "magnet",
    particles: "particle",
    pressures: "pressure",
    densities: "density",

    // Waves & Optics (Class 8-11)
    waves: "wave",
    frequencies: "frequency",
    wavelengths: "wavelength",
    amplitudes: "amplitude",
    periods: "period",
    rays: "ray",
    beams: "beam",
    lenses: "lens",
    mirrors: "mirror",
    prisms: "prism",
    spectra: "spectrum",

    // Electricity & Magnetism (Class 6-12)
    charges: "charge",
    currents: "current",
    voltages: "voltage",
    resistances: "resistance",
    capacitors: "capacitor",
    conductors: "conductor",
    insulators: "insulator",
    electromagnets: "electromagnet",
    coils: "coil",
    transformers: "transformer",
    motors: "motor",
    generators: "generator",

    // Modern Physics (Class 11-12)
    quarks: "quark",
    leptons: "lepton",
    bosons: "boson",
    fermions: "fermion",

    // Thermodynamics (Class 11-12)
    temperatures: "temperature",
    heats: "heat",
    entropies: "entropy",
    enthalpies: "enthalpy",
    caloric_values: "caloric_value",

    // ════════════════════════════════════════════════════════
    // MATHEMATICS - All Classes (Class 3-12)
    // ════════════════════════════════════════════════════════
    // Numbers & Geometry (Class 3+)
    numbers: "number",
    integers: "integer",
    fractions: "fraction",
    decimals: "decimal",
    ratios: "ratio",
    percentages: "percentage",
    vertices: "vertex",
    edges: "edge",
    angles: "angle",
    triangles: "triangle",
    rectangles: "rectangle",
    squares: "square",
    circles: "circle",
    polygons: "polygon",
    diagonals: "diagonal",

    // Trigonometry (Class 10+)
    diameters: "diameter",
    radii: "radius",
    circumferences: "circumference",
    areas: "area",
    perimeters: "perimeter",
    tangents: "tangent",
    secants: "secant",
    chords: "chord",

    // Algebra & Variables (Class 6+)
    equations: "equation",
    variables: "variable",
    expressions: "expression",
    coefficients: "coefficient",
    constants: "constant",
    polynomials: "polynomial",
    factors: "factor",
    multiples: "multiple",
    medians: "median",
    modes: "mode",
    means: "mean",
    standard_deviations: "standard_deviation",

    // Calculus (Class 11-12)
    derivatives: "derivative",
    integrals: "integral",
    limits: "limit",
    functions: "function",
    gradients: "gradient",
    vectors: "vector",
    matrices: "matrix",
    determinants: "determinant",

    // Sets & Logic (Class 11+)
    sets: "set",
    subsets: "subset",
    unions: "union",
    intersections: "intersection",
    complements: "complement",
    propositions: "proposition",
    theorems: "theorem",
    axioms: "axiom",
    postulates: "postulate",
    proofs: "proof",

    // ════════════════════════════════════════════════════════
    // HISTORY - All Classes (Class 6-12)
    // ════════════════════════════════════════════════════════
    // Ancient India (Class 6-9)
    kingdoms: "kingdom",
    dynasties: "dynasty",
    monarchs: "monarch",
    emperors: "emperor",
    rulers: "ruler",
    warriors: "warrior",
    merchants: "merchant",
    artisans: "artisan",
    slaves: "slave",
    soldiers: "soldier",
    citizens: "citizen",

    // Medieval & Modern (Class 7-12)
    invasions: "invasion",
    battles: "battle",
    conquests: "conquest",
    settlements: "settlement",
    colonies: "colony",
    rebellions: "rebellion",
    revolts: "revolt",
    movements: "movement",
    protests: "protest",
    revolutions: "revolution",

    // Independence & Nation Building (Class 8-10)
    leaders: "leader",
    nationalists: "nationalist",
    independence_fighters: "independence_fighter",
    organizations: "organization",
    associations: "association",
    congresses: "congress",
    parties: "party",
    governments: "government",
    constitutions: "constitution",

    // ════════════════════════════════════════════════════════
    // GEOGRAPHY - All Classes (Class 6-12)
    // ════════════════════════════════════════════════════════
    // Physical Geography
    mountains: "mountain",
    plateaus: "plateau",
    plains: "plain",
    valleys: "valley",
    rivers: "river",
    lakes: "lake",
    oceans: "ocean",
    continents: "continent",
    islands: "island",
    peninsulas: "peninsula",
    capes: "cape",
    gulfs: "gulf",
    straits: "strait",
    coasts: "coast",

    // Climate & Weather (Class 6-8)
    seasons: "season",
    monsoons: "monsoon",
    droughts: "drought",
    floods: "flood",
    cyclones: "cyclone",
    hurricanes: "hurricane",
    tornadoes: "tornado",
    earthquakes: "earthquake",
    volcanoes: "volcano",
    precipitation: "precipitation",
    humidities: "humidity",

    // Human Geography (Class 8-12)
    countries: "country",
    states: "state",
    cities: "city",
    villages: "village",
    migrations: "migration",
    industries: "industry",
    farms: "farm",
    plantations: "plantation",

    // ════════════════════════════════════════════════════════
    // ENGLISH LANGUAGE & LITERATURE (Class 3-12)
    // ════════════════════════════════════════════════════════
    // Grammar (Class 3+)
    nouns: "noun",
    verbs: "verb",
    adjectives: "adjective",
    adverbs: "adverb",
    pronouns: "pronoun",
    prepositions: "preposition",
    conjunctions: "conjunction",
    interjections: "interjection",
    phonemes: "phoneme",
    morphemes: "morpheme",
    clauses: "clause",
    phrases: "phrase",
    sentences: "sentence",
    paragraphs: "paragraph",

    // Literature & Writing (Class 6+)
    novels: "novel",
    poems: "poem",
    stories: "story",
    dramas: "drama",
    characters: "character",
    plots: "plot",
    themes: "theme",
    settings: "setting",
    conflicts: "conflict",
    resolutions: "resolution",
    metaphors: "metaphor",
    similes: "simile",
    personifications: "personification",
    alliterations: "alliteration",
    onomatopoeias: "onomatopoeia",
    idioms: "idiom",
    proverbs: "proverb",

    // ════════════════════════════════════════════════════════
    // GENERAL ACADEMIC TERMS
    // ════════════════════════════════════════════════════════
    analyses: "analysis",
    syntheses: "synthesis",
    systems: "system",
    processes: "process",
    theories: "theory",
    concepts: "concept",
    models: "model",
    examples: "example",
    definitions: "definition",
    classifications: "classification",
    observations: "observation",
    experiments: "experiment",
    hypothesis: "hypothesis",
    conclusions: "conclusion",
    results: "result",
    findings: "finding",
    properties: "property",
    characteristics: "characteristic",
    attributes: "attribute",
    methods: "method",
    techniques: "technique",
    strategies: "strategy",
    approaches: "approach",
    applications: "application",
  };

  // Check special cases first
  if (specialCases[lowerWord]) {
    return specialCases[lowerWord];
  }

  // Standard singularization rules (applied in order)
  // Rule 1: -ies → -y (studies → study, but not when root is -ie)
  if (lowerWord.endsWith("ies") && lowerWord.length > 4) {
    return word.slice(0, -3) + "y";
  }

  // Rule 2: -xes, -zes, -ches, -shes, -sses → -x, -z, -ch, -sh, -ss
  if (lowerWord.endsWith("xes")) return word.slice(0, -2);
  if (lowerWord.endsWith("zes")) return word.slice(0, -2);
  if (lowerWord.endsWith("ches")) return word.slice(0, -2);
  if (lowerWord.endsWith("shes")) return word.slice(0, -2);
  if (lowerWord.endsWith("sses")) return word.slice(0, -2);

  // Rule 3: -es (after consonant) → remove -es
  if (
    lowerWord.endsWith("es") &&
    lowerWord.length > 3 &&
    /[^aeiou]es$/.test(lowerWord)
  ) {
    return word.slice(0, -2);
  }

  // Rule 4: -s (general plural) → remove -s (but not words ending in -ss, -us, -is)
  if (
    lowerWord.endsWith("s") &&
    !lowerWord.endsWith("ss") &&
    !lowerWord.endsWith("us") &&
    !lowerWord.endsWith("is") &&
    lowerWord.length > 2
  ) {
    return word.slice(0, -1);
  }

  // If no rule matched, return original
  return word;
}

/**
 * Normalize subject names with fuzzy matching + stop words removal
 * Handles abbreviations and misspellings
 * Examples: "bio" → "Biology", "math" → "Mathematics", "the mathe" → "Mathematics"
 * NEW: Also handles singular/plural: "biologies" → "Biology"
 *
 * STEP 1: Singularize plural forms
 * STEP 2: Remove stop words first
 * STEP 3: Check predefined map
 * STEP 4: Use prefix/Levenshtein matching
 * STEP 5: Return with proper casing
 */
export function normalizeSubject(
  subject: string | null | undefined,
): string | null {
  if (typeof subject !== "string" || !subject.trim()) {
    return null;
  }

  // STEP 1: Singularize plural forms FIRST
  let normalized = subject.trim().toLowerCase();
  const words = normalized.split(/\s+/);
  const singularizedWords = words.map(word => singularize(word));
  const singularized = singularizedWords.join(" ");

  // STEP 2: Remove stop words
  const withoutStopWords = removeStopWords(singularized).trim();

  // If nothing left, use original normalized
  if (!withoutStopWords) {
    return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
  }

  // Subject mapping: abbreviations and common misspellings → canonical name
  const subjectMap: Record<string, string> = {
    // ════════════════════════════════════════════════════════════════
    // SCIENCES (Class 6-12) 🔬
    // ════════════════════════════════════════════════════════════════
    // General Science & Combined Science
    science: "Science",
    sci: "Science",
    sc: "Science",
    scie: "Science",
    sciences: "Science",
    general_science: "Science",
    generalscience: "Science",
    combined_science: "Science",
    integrated_science: "Science",

    // Biology
    bio: "Biology",
    biolog: "Biology",
    biologi: "Biology",
    biol: "Biology",
    bioo: "Biology",
    biology: "Biology",
    zoology: "Zoology",
    botany: "Botany",
    life_science: "Life Science",
    life_sciences: "Life Sciences",

    // Chemistry
    chem: "Chemistry",
    chemist: "Chemistry",
    chemistri: "Chemistry",
    chemistry: "Chemistry",
    "chemist ": "Chemistry",
    ch: "Chemistry",
    chemi: "Chemistry",
    chemestry: "Chemistry",

    // Physics
    physics: "Physics",
    physic: "Physics",
    phy: "Physics",
    phys: "Physics",
    physical: "Physics",
    physical_science: "Physics",
    physica: "Physics",

    // Environmental Science
    environmental: "Environmental Science",
    environmentalscience: "Environmental Science",
    env_science: "Environmental Science",
    envscience: "Environmental Science",
    environment: "Environmental Science",
    ecology: "Ecology",

    // ════════════════════════════════════════════════════════════════
    // MATHEMATICS (Class 3-12) 🔢
    // ════════════════════════════════════════════════════════════════
    math: "Mathematics",
    maths: "Mathematics",
    mathe: "Mathematics",
    mathem: "Mathematics",
    mathematic: "Mathematics",
    mathemat: "Mathematics",
    "math ": "Mathematics",
    mth: "Mathematics",
    mthl: "Mathematics",
    mathematics: "Mathematics",
    mathematica: "Mathematics",
    arithemtic: "Arithmetic",
    algebra: "Algebra",
    geometry: "Geometry",
    trigonometry: "Trigonometry",
    calculus: "Calculus",
    statistics: "Statistics",
    stats: "Statistics",

    // ════════════════════════════════════════════════════════════════
    // LANGUAGE & LITERATURE (Class 3-12) 📚
    // ════════════════════════════════════════════════════════════════
    // English
    english: "English",
    eng: "English",
    engl: "English",
    englsh: "English",
    english_language: "English",
    english_literature: "English",
    english_language_literature: "English",
    english_core: "English",
    englishcore: "English",
    english_elective: "English",

    // Hindi
    hindi: "Hindi",
    hind: "Hindi",
    "hi ": "Hindi",
    hindi_language: "Hindi",
    hindi_literature: "Hindi",
    hindi_core: "Hindi",
    hindcore: "Hindi",
    hindi_elective: "Hindi",

    // Regional Languages
    regional_language: "Regional Language",
    regional: "Regional Language",
    marathi: "Marathi",
    gujarati: "Gujarati",
    kannada: "Kannada",
    tamil: "Tamil",
    telugu: "Telugu",
    punjabi: "Punjabi",
    bengali: "Bengali",
    malayalam: "Malayalam",
    odia: "Odia",
    urdu: "Urdu",

    // Sanskrit & Classical Languages
    sanskrit: "Sanskrit",
    sans: "Sanskrit",
    skrit: "Sanskrit",
    classical_language: "Classical Language",
    classical: "Classical Language",

    // ════════════════════════════════════════════════════════════════
    // SOCIAL STUDIES & SOCIAL SCIENCES (Class 6-12) 🌍
    // ════════════════════════════════════════════════════════════════
    // General Social Studies
    social_studies: "Social Studies",
    social_science: "Social Science",
    social_scienc: "Social Science",
    socialscienc: "Social Science",
    social: "Social Studies",
    soc: "Social Studies",

    // History
    history: "History",
    hist: "History",
    histor: "History",
    hi: "History",
    histoire: "History",
    ancient_history: "History",
    modern_history: "History",
    medieval_history: "History",
    world_history: "History",

    // Geography
    geography: "Geography",
    geo: "Geography",
    geografi: "Geography",
    geog: "Geography",
    geograpy: "Geography",
    physical_geography: "Geography",
    human_geography: "Geography",

    // Civics & Governance
    civics: "Civics",
    civic: "Civics",
    civics_and_governance: "Civics",
    citizenship: "Civics",
    governance: "Civics",
    political_science: "Political Science",
    political: "Political Science",
    politics: "Political Science",
    pol: "Political Science",
    poltical_science: "Political Science",

    // Economics
    economics: "Economics",
    econ: "Economics",
    economi: "Economics",
    economic: "Economics",
    economcs: "Economics",

    // Psychology
    psychology: "Psychology",
    psych: "Psychology",
    psycholog: "Psychology",
    pschology: "Psychology",

    // Sociology
    sociology: "Sociology",
    socio: "Sociology",

    // ════════════════════════════════════════════════════════════════
    // INFORMATION TECHNOLOGY & COMPUTER SCIENCE (Class 6-12) 💻
    // ════════════════════════════════════════════════════════════════
    // Computer Science
    computer_science: "Computer Science",
    computer: "ComputerScience",
    computersci: "ComputerScience",
    cs: "ComputerScience",
    coding: "ComputerScience",
    code: "ComputerScience",
    programm: "ComputerScience",
    programming: "Computer Science",
    informatica: "Computer Science",
    informatics: "Computer Science",
    information_technology: "Information Technology",
    information_tech: "Information Technology",
    it: "Information Technology",
    ict: "Information Technology",

    // ════════════════════════════════════════════════════════════════
    // VOCATIONAL & SKILL-BASED (Class 9-12) 🛠️
    // ════════════════════════════════════════════════════════════════
    vocational: "Vocational",
    skill_development: "Skill",
    skill: "Skill",
    commerce: "Commerce",
    accounting: "Accounting",
    business_studies: "Business Studies",
    business: "Business Studies",
    entrepreneurship: "Entrepreneurship",
    hospitality: "Hospitality",
    tourism: "Tourism",
    beauty_culture: "Beauty Culture",
    agriculture: "Agriculture",
    home_science: "Home Science",
    home_economics: "Home Science",

    // ════════════════════════════════════════════════════════════════
    // PHYSICAL EDUCATION & SPORTS (Class 3-12) ⚽
    // ════════════════════════════════════════════════════════════════
    physical_education: "Physical Education",
    pe: "Physical Education",
    phys_ed: "Physical Education",
    physed: "Physical Education",
    sports: "Sports",
    sports_education: "Sports",
    exercise: "Physical Education",
    fitness: "Physical Education",
    yoga: "Yoga",

    // ════════════════════════════════════════════════════════════════
    // ARTS & PERFORMANCE (Class 3-12) 🎨
    // ════════════════════════════════════════════════════════════════
    art: "Art",
    arts: "Arts",
    visual_arts: "Visual Arts",
    painting: "Painting",
    drawing: "Drawing",
    sculpture: "Sculpture",
    crafts: "Crafts",
    music: "Music",
    musics: "Music",
    singing: "Singing",
    dance: "Dance",
    theater: "Theater",
    theatre: "Theatre",
    dramatics: "Dramatics",
    drama: "Drama",

    // ════════════════════════════════════════════════════════════════
    // SPECIALIZED SUBJECTS (Class Optional Electives)
    // ════════════════════════════════════════════════════════════════
    // Advanced Sciences
    geology: "Geology",
    astronomy: "Astronomy",
    meteorology: "Meteorology",
    biotechnology: "Biotechnology",
    microbiology: "Microbiology",

    // Languages & Literature
    french: "French",
    german: "German",
    spanish: "Spanish",
    japanese: "Japanese",
    chinese: "Chinese",
    mandarin: "Mandarin",

    // Mathematics Specializations
    applied_mathematics: "Applied Mathematics",
    pure_mathematics: "Pure Mathematics",
    business_mathematics: "Business Mathematics",

    // Other Specializations
    philosophy: "Philosophy",
    law: "Law",
    education: "Education",
    library_science: "Library Science",
    journalism: "Journalism",
    mass_communication: "Mass Communication",
    software_engineering: "Software Engineering",
    electronics: "Electronics",
    electrical: "Electrical",
    mechanical: "Mechanical",
    civil: "Civil",

    // ════════════════════════════════════════════════════════════════
    // CROSS-CURRICULAR & INTEGRATED
    // ════════════════════════════════════════════════════════════════
    stem: "STEM",
    steam: "STEAM",
    environmental_studies: "Environmental Studies",
    integrated_studies: "Integrated Studies",
    project_work: "Project Work",
    fieldwork: "Field work",
    practical: "Practical",
    practicals: "Practical",
    laboratory: "Laboratory",
    lab: "Laboratory",
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

  // If no match, return normalized version with proper casing (use withoutStopWords, not original subject!)
  return (
    withoutStopWords.charAt(0).toUpperCase() +
    withoutStopWords.slice(1).toLowerCase()
  );
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
 * NEW: Also handles singular/plural variations: "photons" → "Photon" (same cache key as "photon")
 *
 * STEP 1: Singularize plural forms (NEW - ensures "photons" = "photon" in cache)
 * STEP 2: Remove stop words (universal for all topics)
 * STEP 3: Check predefined map
 * STEP 4: Use Levenshtein distance for typos
 */
export function normalizeTopic(
  topic: string | null | undefined,
): string | null {
  if (typeof topic !== "string" || !topic.trim()) {
    return null;
  }

  let normalized = topic.trim().toLowerCase();

  // STEP 1: Singularize plural forms FIRST
  // Ensures: "photons" and "photon" both become "photon" → same cache key ✓
  // Applied BEFORE stop word removal to work on complete words
  const words = normalized.split(/\s+/);
  const singularizedWords = words.map(word => singularize(word));
  const singularized = singularizedWords.join(" ");

  // STEP 2: Remove stop words (applies UNIVERSALLY to ALL topics)
  // Ensures: "photosynthesis", "the photosynthesis", "definition of photosynthesis" all normalize to same
  const withoutStopWords = removeStopWords(singularized).trim();

  // If nothing left after removing stop words, fall back to original normalized
  if (!withoutStopWords) {
    return topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();
  }

  // Common topic misspellings mapping
  const topicMap: Record<string, string> = {
    // ════════════════════════════════════════════════════════════════
    // BIOLOGY - Class 5-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Photosynthesis & Respiration (Class 7-8)
    photosynthesis: "Photosynthesis",
    photosynhtesis: "Photosynthesis",
    photosysthesis: "Photosynthesis",
    photosynthsis: "Photosynthesis",
    photosynth: "Photosynthesis",
    photosyntheses: "Photosynthesis",
    photosynthetic: "Photosynthesis",
    light_reaction: "Light Reaction",
    dark_reaction: "Dark Reaction",
    calvin_cycle: "Calvin Cycle",
    krebs_cycle: "Krebs Cycle",
    cellular_respiration: "Cellular Respiration",
    aerobic_respiration: "Aerobic Respiration",
    anaerobic_respiration: "Anaerobic Respiration",
    glycolysis: "Glycolysis",
    citric_acid_cycle: "Citric Acid Cycle",

    // Cell Structure & Organelles (Class 5-6)
    cell: "Cell",
    mitochondria: "Mitochondria",
    mitocondria: "Mitochondria",
    mitochondrion: "Mitochondria",
    mitochindria: "Mitochondria",
    mitochondrial: "Mitochondria",
    chloroplast: "Chloroplast",
    chloroplst: "Chloroplast",
    chloroplastic: "Chloroplast",
    ribosome: "Ribosome",
    ribosme: "Ribosome",
    ribsomal: "Ribosome",
    nucleus: "Nucleus",
    nucleu: "Nucleus",
    nucleas: "Nucleus",
    nucleic: "Nucleus",
    lysosome: "Lysosome",
    lysosm: "Lysosome",
    vacuole: "Vacuole",
    vacuol: "Vacuole",
    endoplasmic_reticulum: "Endoplasmic Reticulum",
    golgi_apparatus: "Golgi Apparatus",
    centriole: "Centriole",
    centrosome: "Centrosome",
    cell_membrane: "Cell Membrane",
    cell_wall: "Cell Wall",
    cytoplasm: "Cytoplasm",
    protoplasm: "Protoplasm",
    nucleolus: "Nucleolus",
    chromatin: "Chromatin",
    chromosome: "Chromosome",
    chromosmal: "Chromosome",

    // Reproduction & Genetics (Class 9-10)
    reproduction: "Reproduction",
    reproduktion: "Reproduction",
    asexual_reproduction: "Asexual Reproduction",
    sexual_reproduction: "Sexual Reproduction",
    mitosis: "Mitosis",
    meiosis: "Meiosis",
    binary_fission: "Binary Fission",
    budding: "Budding",
    fragmentation: "Fragmentation",
    regeneration: "Regeneration",
    genetics: "Genetics",
    heredity: "Heredity",
    dna: "DNA",
    rna: "RNA",
    deoxyribonucleic_acid: "DNA",
    ribonucleic_acid: "RNA",
    gene: "Gene",
    genetic: "Genetic",
    allele: "Allele",
    phenotype: "Phenotype",
    genotype: "Genotype",
    dominant: "Dominant",
    recessive: "Recessive",
    mutation: "Mutation",
    mutant: "Mutation",
    variation: "Variation",
    trait: "Trait",
    mendelian_inheritance: "Mendelian Inheritance",

    // Human Anatomy & Physiology (Class 9-10)
    skeleton: "Skeleton",
    skeletal: "Skeleton",
    bone: "Bone",
    bonemass: "Bone",
    cartilage: "Cartilage",
    cartilaginous: "Cartilage",
    joint: "Joint",
    articulation: "Joint",
    ligament: "Ligament",
    tendon: "Tendon",
    muscle: "Muscle",
    muscular: "Muscle",
    cardiac_muscle: "Cardiac Muscle",
    smooth_muscle: "Smooth Muscle",
    skeletal_muscle: "Skeletal Muscle",
    nervous_system: "Nervous System",
    neuron: "Neuron",
    nerve: "Nerve",
    nerve_cell: "Nerve Cell",
    synapse: "Synapse",
    axon: "Axon",
    dendrite: "Dendrite",
    brain: "Brain",
    spinal_cord: "Spinal Cord",
    cerebrum: "Cerebrum",
    cerebellum: "Cerebellum",
    medulla: "Medulla",
    reflex: "Reflex",
    reflex_arc: "Reflex Arc",

    // Circulatory & Respiratory System (Class 9-10)
    circulatory_system: "Circulatory System",
    heart: "Heart",
    blood: "Blood",
    blood_cell: "Blood Cell",
    red_blood_cell: "Red Blood Cell",
    white_blood_cell: "White Blood Cell",
    platelet: "Platelet",
    artery: "Artery",
    arteries: "Artery",
    vein: "Vein",
    capillary: "Capillary",
    capillaries: "Capillary",
    hemoglobin: "Hemoglobin",
    respiration: "Respiration",
    respiratory_system: "Respiratory System",
    lung: "Lung",
    trachea: "Trachea",
    bronchi: "Bronchi",
    bronchiole: "Bronchiole",
    alveolus: "Alveolus",
    diaphragm: "Diaphragm",

    // Digestive & Excretory System (Class 9-10)
    digestive_system: "Digestive System",
    digestion: "Digestion",
    mouth: "Mouth",
    esophagus: "Esophagus",
    stomach: "Stomach",
    intestine: "Intestine",
    small_intestine: "Small Intestine",
    large_intestine: "Large Intestine",
    colon: "Colon",
    rectum: "Rectum",
    liver: "Liver",
    pancreas: "Pancreas",
    enzyme: "Enzyme",
    enyzme: "Enzyme",
    amylase: "Amylase",
    protease: "Protease",
    lipase: "Lipase",
    bile: "Bile",
    excretory_system: "Excretory System",
    kidney: "Kidney",
    ureter: "Ureter",
    bladder: "Bladder",
    urethra: "Urethra",
    nephron: "Nephron",
    glomerulus: "Glomerulus",

    // Endocrine & Immune System (Class 10)
    endocrine_system: "Endocrine System",
    hormone: "Hormone",
    hormnal: "Hormone",
    pituitary_gland: "Pituitary Gland",
    thyroid: "Thyroid",
    thyroid_gland: "Thyroid Gland",
    pancreatic: "Pancreatic",
    adrenal_gland: "Adrenal Gland",
    testosterone: "Testosterone",
    estrogen: "Estrogen",
    insulin: "Insulin",
    glucagon: "Glucagon",
    immune_system: "Immune System",
    immunity: "Immunity",
    antibody: "Antibody",
    antigen: "Antigen",
    white_blood_cells: "White Blood Cell",
    lymphocyte: "Lymphocyte",

    // Plant Physiology (Class 6-10)
    plant_physiology: "Plant Physiology",
    transpiration: "Transpiration",
    translocation: "Translocation",
    phototropism: "Phototropism",
    geotropism: "Geotropism",
    hydrotropism: "Hydrotropism",
    plant_hormone: "Plant Hormone",
    auxin: "Auxin",
    gibberellin: "Gibberellin",
    cytokinin: "Cytokinin",
    ethylene: "Ethylene",
    abscisic_acid: "Abscisic Acid",

    // Ecology (Class 7-8)
    ecology: "Ecology",
    ecosystem: "Ecosystem",
    biosphere: "Biosphere",
    habitat: "Habitat",
    niche: "Niche",
    population: "Population",
    community: "Community",
    biotic: "Biotic",
    abiotic: "Abiotic",
    species: "Species",
    biodiversity: "Biodiversity",
    food_chain: "Food Chain",
    food_web: "Food Web",
    energy_pyramid: "Energy Pyramid",
    predator: "Predator",
    prey: "Prey",
    predation: "Predation",
    herbivore: "Herbivore",
    carnivore: "Carnivore",
    omnivore: "Omnivore",
    producer: "Producer",
    consumer: "Consumer",
    decomposer: "Decomposer",
    primary_consumer: "Primary Consumer",
    secondary_consumer: "Secondary Consumer",
    tertiary_consumer: "Tertiary Consumer",
    succession: "Succession",
    symbiosis: "Symbiosis",
    mutualism: "Mutualism",
    commensalism: "Commensalism",
    parasitism: "Parasitism",
    biome: "Biome",
    forest: "Forest",
    grassland: "Grassland",
    desert: "Desert",
    aquatic_ecosystem: "Aquatic Ecosystem",
    freshwater: "Freshwater",
    saltwater: "Saltwater",
    marine: "Marine",
    conservation: "Conservation",
    endangered_species: "Endangered Species",

    // ════════════════════════════════════════════════════════════════
    // CHEMISTRY - Class 6-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Atomic Structure (Class 8-11)
    atom: "Atom",
    atomic_structure: "Atomic Structure",
    electron: "Electron",
    electronn: "Electron",
    proton: "Proton",
    neutron: "Neutron",
    atomic_number: "Atomic Number",
    mass_number: "Mass Number",
    isotope: "Isotope",
    isobar: "Isobar",
    orbital: "Orbital",
    shell: "Shell",
    subshell: "Subshell",
    s_orbital: "S Orbital",
    p_orbital: "P Orbital",
    d_orbital: "D Orbital",
    f_orbital: "F Orbital",
    electron_configuration: "Electron Configuration",
    valence_electron: "Valence Electron",
    bohr_model: "Bohr Model",
    quantum_mechanical_model: "Quantum Mechanical Model",

    // Chemical Bonding (Class 9-11)
    chemical_bonding: "Chemical Bonding",
    bond: "Bond",
    covalent_bond: "Covalent Bond",
    ionic_bond: "Ionic Bond",
    metallic_bond: "Metallic Bond",
    hydrogen_bond: "Hydrogen Bond",
    van_der_waals_force: "Van der Waals Force",
    electronegativity: "Electronegativity",
    electrnegativty: "Electronegativity",
    polarity: "Polarity",
    polar_bond: "Polar Bond",
    nonpolar_bond: "Nonpolar Bond",
    dative_bond: "Dative Bond",
    coordinate_bond: "Coordinate Bond",
    multiple_bond: "Multiple Bond",
    double_bond: "Double Bond",
    triple_bond: "Triple Bond",

    // Molecules & Compounds (Class 6-9)
    molecule: "Molecule",
    molcule: "Molecule",
    compound: "Compound",
    element: "Element",
    mixture: "Mixture",
    solution: "Solution",
    solute: "Solute",
    solvent: "Solvent",
    alloy: "Alloy",
    colloid: "Colloid",
    suspension: "Suspension",
    emulsion: "Emulsion",
    sol: "Sol",
    gel: "Gel",

    // Periodic Table & Elements (Class 8-11)
    periodic_table: "Periodic Table",
    period: "Period",
    group: "Group",
    alkali_metal: "Alkali Metal",
    alkaline_earth_metal: "Alkaline Earth Metal",
    transition_metal: "Transition Metal",
    halogen: "Halogen",
    noble_gas: "Noble Gas",
    nonmetal: "Nonmetal",
    metalloid: "Metalloid",
    hydrogen: "Hydrogen",
    oxygen: "Oxygen",
    nitrogen: "Nitrogen",
    carbon: "Carbon",
    chlorine: "Chlorine",
    sodium: "Sodium",
    potassium: "Potassium",
    calcium: "Calcium",
    magnesium: "Magnesium",
    iron: "Iron",
    copper: "Copper",
    zinc: "Zinc",
    silver: "Silver",
    gold: "Gold",
    sulfur: "Sulfur",
    phosphorus: "Phosphorus",

    // Chemical Reactions (Class 6-10)
    chemical_reaction: "Chemical Reaction",
    chemical_change: "Chemical Change",
    physical_change: "Physical Change",
    combustion: "Combustion",
    oxidation: "Oxidation",
    oxydation: "Oxidation",
    reduction: "Reduction",
    reduation: "Reduction",
    redox_reaction: "Redox Reaction",
    decomposition: "Decomposition",
    combination: "Combination",
    displacement: "Displacement",
    single_displacement: "Single Displacement",
    double_displacement: "Double Displacement",
    synthesis: "Synthesis",
    hydrolysis: "Hydrolysis",
    neutralization: "Neutralization",
    esterification: "Esterification",
    polymerization: "Polymerization",
    exothermic: "Exothermic",
    endothermic: "Endothermic",
    catalyst: "Catalyst",
    catlayst: "Catalyst",
    inhibitor: "Inhibitor",
    activation_energy: "Activation Energy",

    // Acids, Bases & Salts (Class 7-10)
    acid: "Acid",
    base: "Base",
    salt: "Salt",
    ph: "pH",
    ph_scale: "pH Scale",
    acidic: "Acidic",
    basic: "Basic",
    neutral: "Neutral",
    indicator: "Indicator",
    strong_acid: "Strong Acid",
    weak_acid: "Weak Acid",
    strong_base: "Strong Base",
    weak_base: "Weak Base",
    hydrochloric_acid: "Hydrochloric Acid",
    sulfuric_acid: "Sulfuric Acid",
    nitric_acid: "Nitric Acid",
    acetic_acid: "Acetic Acid",
    sodium_hydroxide: "Sodium Hydroxide",
    ammonia: "Ammonia",
    sodium_chloride: "Sodium Chloride",
    naci: "Sodium Chloride",

    // Organic Chemistry (Class 11-12)
    organic_chemistry: "Organic Chemistry",
    hydrocarbon: "Hydrocarbon",
    hydrocabon: "Hydrocarbon",
    alkane: "Alkane",
    alkene: "Alkene",
    alkyne: "Alkyne",
    aromatic: "Aromatic",
    benzene: "Benzene",
    alcohol: "Alcohol",
    aldehyde: "Aldehyde",
    ketone: "Ketone",
    carboxylic_acid: "Carboxylic Acid",
    ester: "Ester",
    ether: "Ether",
    amine: "Amine",
    amide: "Amide",
    polymer: "Polymer",
    polymr: "Polymer",
    monomer: "Monomer",
    plastic: "Plastic",
    rubber: "Rubber",
    isomerism: "Isomerism",
    structural_isomer: "Structural Isomer",

    // Mole Concept & Stoichiometry (Class 9-12)
    mole: "Mole",
    mole_concept: "Mole Concept",
    avogadro_number: "Avogadro Number",
    molar_mass: "Molar Mass",
    molar_volume: "Molar Volume",
    stoichiometry: "Stoichiometry",
    empirical_formula: "Empirical Formula",
    molecular_formula: "Molecular Formula",
    limiting_reagent: "Limiting Reagent",
    percent_yield: "Percent Yield",

    // ════════════════════════════════════════════════════════════════
    // PHYSICS - Class 6-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Motion & Forces (Class 6-9)
    motion: "Motion",
    distance: "Distance",
    speed: "Speed",
    velocity: "Velocity",
    velocty: "Velocity",
    velcity: "Velocity",
    acceleration: "Acceleration",
    accelaration: "Acceleration",
    force: "Force",
    frce: "Force",
    newton_law: "Newton Law",
    inertia: "Inertia",
    momentum: "Momentum",
    mometnm: "Momentum",
    impulse: "Impulse",
    friction: "Friction",
    frction: "Friction",
    static_friction: "Static Friction",
    kinetic_friction: "Kinetic Friction",
    pressure: "Pressure",
    presure: "Pressure",

    // Energy (Class 6-11)
    energy: "Energy",
    energi: "Energy",
    enrgy: "Energy",
    kinetic_energy: "Kinetic Energy",
    potential_energy: "Potential Energy",
    mechanical_energy: "Mechanical Energy",
    thermal_energy: "Thermal Energy",
    chemical_energy: "Chemical Energy",
    electrical_energy: "Electrical Energy",
    nuclear_energy: "Nuclear Energy",
    work: "Work",
    power: "Power",
    efficiency: "Efficiency",

    // Waves (Class 8-11)
    wave: "Wave",
    wave_motion: "Wave Motion",
    frequency: "Frequency",
    freqency: "Frequency",
    wavelength: "Wavelength",
    wavength: "Wavelength",
    amplitude: "Amplitude",
    amplitud: "Amplitude",
    sound_wave: "Sound Wave",
    light_wave: "Light Wave",
    electromagnetic_wave: "Electromagnetic Wave",
    transverse_wave: "Transverse Wave",
    longitudinal_wave: "Longitudinal Wave",
    speed_of_sound: "Speed of Sound",
    speed_of_light: "Speed of Light",
    doppler_effect: "Doppler Effect",
    resonance: "Resonance",

    // Optics (Class 8-11)
    optics: "Optics",
    light: "Light",
    reflection: "Reflection",
    rflection: "Reflection",
    refraction: "Refraction",
    refarction: "Refraction",
    lens: "Lens",
    mirror: "Mirror",
    prism: "Prism",
    spectrum: "Spectrum",
    spectral: "Spectrum",
    color: "Color",
    dispersion: "Dispersion",
    total_internal_reflection: "Total Internal Reflection",
    critical_angle: "Critical Angle",
    focal_length: "Focal Length",
    magnification: "Magnification",
    concave_lens: "Concave Lens",
    convex_lens: "Convex Lens",
    concave_mirror: "Concave Mirror",
    convex_mirror: "Convex Mirror",

    // Electricity & Magnetism (Class 6-12)
    electricity: "Electricity",
    electric_current: "Electric Current",
    electric_charge: "Electric Charge",
    voltage: "Voltage",
    volt: "Volt",
    current: "Current",
    ampere: "Ampere",
    resistance: "Resistance",
    resistivity: "Resistivity",
    conductor: "Conductor",
    insulator: "Insulator",
    ohm_law: "Ohm Law",
    power_dissipation: "Power Dissipation",
    series_circuit: "Series Circuit",
    parallel_circuit: "Parallel Circuit",
    electrostatics: "Electrostatics",
    coulomb_law: "Coulomb Law",
    electric_field: "Electric Field",
    magnetism: "Magnetism",
    magnetic_field: "Magnetic Field",
    magnetic_force: "Magnetic Force",
    electromagnet: "Electromagnet",
    electromagnetic_induction: "Electromagnetic Induction",
    transformer: "Transformer",
    motor: "Motor",
    generator: "Generator",
    capacitor: "Capacitor",
    capacitence: "Capacitance",
    inductor: "Inductor",

    // Modern Physics (Class 11-12)
    modern_physics: "Modern Physics",
    atomic_physics: "Atomic Physics",
    nuclear_physics: "Nuclear Physics",
    quantum_mechanics: "Quantum Mechanics",
    photon: "Photon",
    photoelectric_effect: "Photoelectric Effect",
    photoelectric: "Photoelectric",
    planck_constant: "Planck Constant",
    photon_energy: "Photon Energy",
    wave_particle_duality: "Wave Particle Duality",
    uncertainty_principle: "Uncertainty Principle",
    radioactivity: "Radioactivity",
    radioactive: "Radioactive",
    half_life: "Half Life",
    alpha_decay: "Alpha Decay",
    beta_decay: "Beta Decay",
    gamma_decay: "Gamma Decay",
    nuclear_fission: "Nuclear Fission",
    nuclear_fusion: "Nuclear Fusion",
    mass_defect: "Mass Defect",
    binding_energy: "Binding Energy",

    // ════════════════════════════════════════════════════════════════
    // MATHEMATICS - Class 3-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Number System (Class 3-6)
    number: "Number",
    number_system: "Number System",
    whole_number: "Whole Number",
    natural_number: "Natural Number",
    integer: "Integer",
    rational_number: "Rational Number",
    irrational_number: "Irrational Number",
    real_number: "Real Number",
    complex_number: "Complex Number",
    prime_number: "Prime Number",
    composite_number: "Composite Number",
    even_number: "Even Number",
    odd_number: "Odd Number",
    fraction: "Fraction",
    decimal: "Decimal",
    percentage: "Percentage",
    ratio: "Ratio",
    proportion: "Proportion",

    // Algebra (Class 6-12)
    algebra: "Algebra",
    algebraic: "Algebraic",
    equation: "Equation",
    inequation: "Inequation",
    inequality: "Inequality",
    variable: "Variable",
    constant: "Constant",
    expression: "Expression",
    algebraic_expression: "Algebraic Expression",
    polynomial: "Polynomial",
    monomial: "Monomial",
    binomial: "Binomial",
    trinomial: "Trinomial",
    coefficient: "Coefficient",
    exponent: "Exponent",
    root: "Root",
    square_root: "Square Root",
    cube_root: "Cube Root",
    quadratic_equation: "Quadratic Equation",
    linear_equation: "Linear Equation",
    cubic_equation: "Cubic Equation",
    factorization: "Factorization",
    factor: "Factor",
    multiple: "Multiple",
    hcf: "HCF",
    lcm: "LCM",
    greatest_common_divisor: "Greatest Common Divisor",
    least_common_multiple: "Least Common Multiple",

    // Trigonometry (Class 10-12)
    trigonometry: "Trigonometry",
    sin: "Sine",
    sine: "Sine",
    cos: "Cosine",
    cosine: "Cosine",
    tan: "Tangent",
    tangent: "Tangent",
    cot: "Cotangent",
    cotangent: "Cotangent",
    sec: "Secant",
    secant: "Secant",
    csc: "Cosecant",
    cosecant: "Cosecant",
    trigonometric_ratio: "Trigonometric Ratio",
    angle: "Angle",
    radian: "Radian",
    degree: "Degree",
    inverse_trigonometry: "Inverse Trigonometry",
    inverse_sine: "Inverse Sine",
    inverse_cosine: "Inverse Cosine",
    inverse_tangent: "Inverse Tangent",

    // Geometry (Class 6-12)
    geometry: "Geometry",
    geometric: "Geometric",
    rectangle: "Rectangle",
    rectange: "Rectangle",
    square: "Square",
    triangle: "Triangle",
    tringle: "Triangle",
    circle: "Circle",
    polygon: "Polygon",
    regular_polygon: "Regular Polygon",
    pentagon: "Pentagon",
    hexagon: "Hexagon",
    heptagon: "Heptagon",
    octagon: "Octagon",
    quadrilateral: "Quadrilateral",
    parallelogram: "Parallelogram",
    rhombus: "Rhombus",
    trapezoid: "Trapezoid",
    trapezium: "Trapezium",
    kite: "Kite",
    cone: "Cone",
    cylinder: "Cylinder",
    sphere: "Sphere",
    cube: "Cube",
    cuboid: "Cuboid",
    rectangular_prism: "Rectangular Prism",
    pyramid: "Pyramid",
    hemisphere: "Hemisphere",
    vertex: "Vertex",
    edge: "Edge",
    face: "Face",
    diagonal: "Diagonal",
    perimeter: "Perimeter",
    circumference: "Circumference",
    area: "Area",
    surface_area: "Surface Area",
    volume: "Volume",
    height: "Height",
    radius: "Radius",
    radious: "Radius",
    diameter: "Diameter",
    dimaeter: "Diameter",
    chord: "Chord",
    arc: "Arc",
    sector: "Sector",

    // Coordinate Geometry & Vectors (Class 9-12)
    coordinate_geometry: "Coordinate Geometry",
    cartesian_plane: "Cartesian Plane",
    x_axis: "X Axis",
    y_axis: "Y Axis",
    origin: "Origin",
    quadrant: "Quadrant",
    coordinate: "Coordinate",
    distance_formula: "Distance Formula",
    section_formula: "Section Formula",
    slope: "Slope",
    gradient: "Gradient",
    collinearity: "Collinearity",
    vector: "Vector",
    scalar: "Scalar",
    vector_addition: "Vector Addition",
    vector_subtraction: "Vector Subtraction",
    dot_product: "Dot Product",
    cross_product: "Cross Product",
    magnitude: "Magnitude",
    direction: "Direction",

    // Calculus (Class 11-12)
    calculus: "Calculus",
    limit: "Limit",
    continuity: "Continuity",
    derivative: "Derivative",
    differentiability: "Differentiability",
    integral: "Integral",
    definite_integral: "Definite Integral",
    indefinite_integral: "Indefinite Integral",
    differentiation: "Differentiation",
    integration: "Integration",
    chain_rule: "Chain Rule",
    product_rule: "Product Rule",
    quotient_rule: "Quotient Rule",
    fundamental_theorem: "Fundamental Theorem",
    application_of_derivative: "Application of Derivative",
    maxima: "Maxima",
    minima: "Minima",
    increasing_function: "Increasing Function",
    decreasing_function: "Decreasing Function",

    // Statistics & Probability (Class 8-12)
    statistics: "Statistics",
    statistical: "Statistical",
    probability: "Probability",
    probablity: "Probability",
    mean: "Mean",
    median: "Median",
    mode: "Mode",
    standard_deviation: "Standard Deviation",
    variance: "Variance",
    frequency_distribution: "Frequency Distribution",
    histogram: "Histogram",
    bar_graph: "Bar Graph",
    pie_chart: "Pie Chart",
    scatter_plot: "Scatter Plot",
    normal_distribution: "Normal Distribution",
    binomial_distribution: "Binomial Distribution",
    poisson_distribution: "Poisson Distribution",
    permutation: "Permutation",
    factorial: "Factorial",
    sample_space: "Sample Space",
    event: "Event",
    independent_event: "Independent Event",
    dependent_event: "Dependent Event",
    conditional_probability: "Conditional Probability",

    // ════════════════════════════════════════════════════════════════
    // HISTORY - Class 6-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Ancient India (Class 6-9)
    ancient_india: "Ancient India",
    indus_valley_civilization: "Indus Valley Civilization",
    vedic_age: "Vedic Age",
    vedas: "Vedas",
    rigveda: "Rigveda",
    yajurveda: "Yajurveda",
    samaveda: "Samaveda",
    atharvaveda: "Atharvaveda",
    aryan: "Aryan",
    vedic_period: "Vedic Period",
    heroic_age: "Heroic Age",
    upanishad: "Upanishad",
    brahmanism: "Brahmanism",
    caste_system: "Caste System",
    mauryan_empire: "Mauryan Empire",
    ashoka: "Ashoka",
    chandragupta: "Chandragupta",
    gupta_empire: "Gupta Empire",
    samudragupta: "Samudragupta",
    chandragupta_ii: "Chandragupta II",
    harsha: "Harsha",

    // Medieval India (Class 7-10)
    delhi_sultanate: "Delhi Sultanate",
    mughal_empire: "Mughal Empire",
    akbar: "Akbar",
    babar: "Babar",
    humayun: "Humayun",
    shah_jahan: "Shah Jahan",
    taj_mahal: "Taj Mahal",
    aurangzeb: "Aurangzeb",
    sufism: "Sufism",
    bhakti_movement: "Bhakti Movement",
    ramanuja: "Ramanuja",
    kabir: "Kabir",
    tulsidas: "Tulsidas",
    guru_nanak: "Guru Nanak",

    // Modern India (Class 8-10)
    modern_india: "Modern India",
    british_raj: "British Raj",
    east_india_company: "East India Company",
    british_india: "British India",
    sepoy_mutiny: "Sepoy Mutiny",
    revolt_of_1857: "Revolt of 1857",
    indian_national_congress: "Indian National Congress",
    nationalism: "Nationalism",
    nationalist_movement: "Nationalist Movement",
    independence_movement: "Independence Movement",
    swadeshi_movement: "Swadeshi Movement",
    khilafat_movement: "Khilafat Movement",
    non_cooperation_movement: "Non Cooperation Movement",
    civil_disobedience: "Civil Disobedience",
    quit_india_movement: "Quit India Movement",
    mahatma_gandhi: "Mahatma Gandhi",
    jawaharlal_nehru: "Jawaharlal Nehru",
    sardar_vallabhbhai_patel: "Sardar Vallabhbhai Patel",
    independence: "Independence",
    partition: "Partition",
    communal_violence: "Communal Violence",

    // ════════════════════════════════════════════════════════════════
    // GEOGRAPHY - Class 6-12 (CBSE, ICSE, State Boards)
    // ════════════════════════════════════════════════════════════════
    // Physical Geography
    geography: "Geography",
    earth: "Earth",
    globe: "Globe",
    map: "Map",
    mapmaking: "Mapmaking",
    cartography: "Cartography",
    latitude: "Latitude",
    longitude: "Longitude",
    equator: "Equator",
    tropic_of_cancer: "Tropic of Cancer",
    tropic_of_capricorn: "Tropic of Capricorn",
    arctic_circle: "Arctic Circle",
    antarctic_circle: "Antarctic Circle",
    prime_meridian: "Prime Meridian",
    timezone: "Timezone",
    continent: "Continent",
    ocean: "Ocean",
    sea: "Sea",
    mountain: "Mountain",
    mountain_range: "Mountain Range",
    plateau: "Plateau",
    plain: "Plain",
    valley: "Valley",
    canyon: "Canyon",
    gorge: "Gorge",
    island: "Island",
    peninsula: "Peninsula",
    cape: "Cape",
    gulf: "Gulf",
    bay: "Bay",
    strait: "Strait",
    delta: "Delta",
    estuary: "Estuary",
    river: "River",
    tributary: "Tributary",
    lake: "Lake",
    lagoon: "Lagoon",
    glacier: "Glacier",
    waterfall: "Waterfall",
    geyser: "Geyser",
    hot_spring: "Hot Spring",
    soil: "Soil",
    rock: "Rock",
    mineral: "Mineral",
    ore: "Ore",
    fossil_fuel: "Fossil Fuel",
    coal: "Coal",
    petroleum: "Petroleum",
    natural_gas: "Natural Gas",

    // Climate & Weather
    climate: "Climate",
    weather: "Weather",
    temperature: "Temperature",
    humidity: "Humidity",
    precipitation: "Precipitation",
    rainfall: "Rainfall",
    snowfall: "Snowfall",
    hailstorm: "Hailstorm",
    monsoon: "Monsoon",
    monsoon_wind: "Monsoon Wind",
    trade_wind: "Trade Wind",
    westerly_wind: "Westerly Wind",
    cyclone: "Cyclone",
    typhoon: "Typhoon",
    hurricane: "Hurricane",
    tornado: "Tornado",
    blizzard: "Blizzard",
    drought: "Drought",
    flood: "Flood",
    earthquake: "Earthquake",
    tsunami: "Tsunami",
    volcano: "Volcano",
    volcanic: "Volcanic",
    eruption: "Eruption",
    lava: "Lava",
    magma: "Magma",

    // Human Geography
    demography: "Demography",
    birth_rate: "Birth Rate",
    death_rate: "Death Rate",
    life_expectancy: "Life Expectancy",
    migration: "Migration",
    urbanization: "Urbanization",
    settlement: "Settlement",
    rural_settlement: "Rural Settlement",
    urban_settlement: "Urban Settlement",
    city: "City",
    village: "Village",
    metropolis: "Metropolis",
    developed_country: "Developed Country",
    developing_country: "Developing Country",
    underdeveloped_country: "Underdeveloped Country",
    economy: "Economy",
    industry: "Industry",
    agriculture: "Agriculture",
    manufacturing: "Manufacturing",
    service: "Service",
    tourism: "Tourism",
    trade: "Trade",
    commerce: "Commerce",
    transportation: "Transportation",
    communication: "Communication",
    infrastructure: "Infrastructure",
    culture: "Culture",
    language: "Language",
    religion: "Religion",
    tradition: "Tradition",

    // ════════════════════════════════════════════════════════════════
    // GENERAL ACADEMIC TERMS
    // ════════════════════════════════════════════════════════════════
    analysis: "Analysis",
    anallysis: "Analysis",
    analysys: "Analysis",
    sythesis: "Synthesis",
    system: "System",
    systme: "System",
    process: "Process",
    procces: "Process",
    theory: "Theory",
    theorey: "Theory",
    concept: "Concept",
    model: "Model",
    example: "Example",
    definition: "Definition",
    classification: "Classification",
    observation: "Observation",
    experiment: "Experiment",
    hypothesis: "Hypothesis",
    conclusion: "Conclusion",
    result: "Result",
    finding: "Finding",
    research: "Research",
    study: "Study",
    examination: "Examination",
    test: "Test",
    assessment: "Assessment",
  };

  // STEP 2: Check predefined mappings using stop-word-free version
  // ⚠️ CRITICAL: Check EXACT match FIRST before prefix matching!
  // Reason: "electron" should match "electron" (exact) not "electronegativity" (prefix)
  console.log(
    `[normalizeTopic DEBUG] withoutStopWords="${withoutStopWords}", checking topicMap...`,
  );
  if (topicMap[withoutStopWords]) {
    console.log(
      `[normalizeTopic DEBUG] ✅ EXACT MATCH FOUND: ${withoutStopWords} → ${topicMap[withoutStopWords]}`,
    );
    return topicMap[withoutStopWords];
  }
  console.log(
    `[normalizeTopic DEBUG] ❌ No exact match for "${withoutStopWords}"`,
  );

  // Prefix matching (only if exact match failed)
  // ⚠️ CRITICAL: Only check keys that are NOT longer than input by a lot
  // This prevents "electron" from matching "electronegativity"
  for (const [key, value] of Object.entries(topicMap)) {
    // Only accept prefix matches if key is not much longer than input
    // e.g., "photo" can match "photosynthesis" but "electron" shouldn't match "electronegativity"
    const reasonableMatch = Math.abs(key.length - withoutStopWords.length) <= 5;
    if (
      reasonableMatch &&
      (key.startsWith(withoutStopWords) || withoutStopWords.startsWith(key))
    ) {
      console.log(
        `[normalizeTopic DEBUG] 🔗 PREFIX MATCH (reasonable length): "${withoutStopWords}" matched to key "${key}" → ${value}`,
      );
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

  // Return normalized version with proper casing (use withoutStopWords, not original topic!)
  return (
    withoutStopWords.charAt(0).toUpperCase() +
    withoutStopWords.slice(1).toLowerCase()
  );
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
    // ── Singularize words for consistent caching ──
    // Ensures: "forces" = "force", "photons" = "photon", etc.
    // Applied BEFORE duplicate removal so we work with complete words
    .split(" ")
    .map(word => singularize(word))
    .join(" ")
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
    // Trim and singularize words
    .trim()
    // ── Singularize words for consistent caching ──
    // Ensures: "forces" = "force", "energies" = "energy", etc.
    .split(" ")
    .map(word => singularize(word))
    .join(" ")
    // Deduplicate words
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
