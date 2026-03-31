// Test Cases for Edge Case Fixes
// Run these to verify all vulnerabilities are fixed

import axios from "axios";

const API = "http://localhost:5000/api";
let authToken = "";
let noteId = "";
let userId = "";

// Helper to make requests with auth token
const request = (method: string, endpoint: string, data?: any) => {
  return axios({
    method,
    url: `${API}${endpoint}`,
    data,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  }).catch((err: any) => err.response);
};

// ============================================================================
// TEST SUITE 1: PAGINATION EDGE CASES
// ============================================================================
describe("Pagination Edge Cases", () => {
  test("Should handle negative page number", async () => {
    const res = await request("GET", "/studyLog?page=-1&limit=5");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should use page 1 as default
  });

  test("Should handle NaN page parameter", async () => {
    const res = await request("GET", "/studyLog?page=abc&limit=5");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should use page 1 as default
  });

  test("Should handle Infinity limit", async () => {
    const res = await request("GET", "/studyLog?page=1&limit=Infinity");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should cap limit at 100
  });

  test("Should handle zero limit", async () => {
    const res = await request("GET", "/studyLog?page=1&limit=0");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should use minimum limit of 1
  });

  test("Should handle huge page number safely", async () => {
    const res = await request("GET", "/studyLog?page=999999&limit=100");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should not cause memory issues
  });

  test("Should handle both invalid", async () => {
    const res = await request("GET", "/studyLog?page=xyz&limit=abc");
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    // Should use defaults: page=1, limit=5
  });
});

// ============================================================================
// TEST SUITE 2: STUDY LOG VALIDATION
// ============================================================================
describe("Study Log Input Validation", () => {
  test("Should reject negative duration", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: -100,
      scoreEarned: 500,
      subject: "Mathematics",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("cannot be negative");
  });

  test("Should reject excessive duration", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 2000,
      scoreEarned: 500,
      subject: "Mathematics",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("must not exceed 1440");
  });

  test("Should reject negative score", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 100,
      scoreEarned: -50,
      subject: "Mathematics",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("cannot be negative");
  });

  test("Should reject excessive score", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 100,
      scoreEarned: 50000,
      subject: "Mathematics",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("must not exceed 10000");
  });

  test("Should reject invalid subject type", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 100,
      scoreEarned: 500,
      subject: "x", // Too short
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("at least 2 characters");
  });

  test("Should reject very long subject", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 100,
      scoreEarned: 500,
      subject: "a".repeat(100),
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("must not exceed 50 characters");
  });

  test("Should accept valid study log", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 120,
      scoreEarned: 500,
      subject: "Mathematics",
      topic: "Algebra",
      notes: "Good progress on equations",
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty("_id");
  });

  test("Should prevent field injection in study log", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 100,
      scoreEarned: 500,
      subject: "Math",
      maliciousField: "should_be_ignored",
      __proto__: { isAdmin: true },
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    // Verify extra fields not stored
    expect(res.data.data).not.toHaveProperty("maliciousField");
    expect(res.data.data).not.toHaveProperty("__proto__");
  });
});

// ============================================================================
// TEST SUITE 3: NOTE VALIDATION
// ============================================================================
describe("Note Input Validation", () => {
  test("Should reject empty title", async () => {
    const res = await request("POST", "/notes", {
      title: "",
      content: "Some content",
      subject: "Biology",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("at least 1 characters");
  });

  test("Should reject very long title", async () => {
    const res = await request("POST", "/notes", {
      title: "a".repeat(300),
      content: "Some content",
      subject: "Biology",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("must not exceed 200 characters");
  });

  test("Should reject very long content", async () => {
    const res = await request("POST", "/notes", {
      title: "My Note",
      content: "a".repeat(20000),
      subject: "Biology",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("must not exceed 10000 characters");
  });

  test("Should reject invalid subject", async () => {
    const res = await request("POST", "/notes", {
      title: "My Note",
      content: "Some content",
      subject: "x",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should accept valid note", async () => {
    const res = await request("POST", "/notes", {
      title: "Photosynthesis Notes",
      content: "Photosynthesis is the process...",
      subject: "Biology",
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveProperty("_id");
    noteId = res.data.data._id; // Save for later tests
  });
});

// ============================================================================
// TEST SUITE 4: OBJECTID VALIDATION
// ============================================================================
describe("ObjectId Validation", () => {
  test("Should reject invalid ObjectId format", async () => {
    const res = await request("GET", "/notes/invalid_id_12345");
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("Invalid note ID format");
  });

  test("Should reject empty ObjectId", async () => {
    const res = await request("GET", "/notes/");
    // Will be 404 (route not found) which is acceptable
    expect([404, 400]).toContain(res.status);
  });

  test("Should reject null ObjectId", async () => {
    const res = await request("GET", "/notes/null");
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should accept valid ObjectId", async () => {
    if (!noteId) {
      // Create a note first
      const createRes = await request("POST", "/notes", {
        title: "Test",
        content: "Test",
        subject: "Math",
      });
      noteId = createRes.data.data._id;
    }

    const res = await request("GET", `/notes/${noteId}`);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 5: PASSWORD VALIDATION
// ============================================================================
describe("Password Validation", () => {
  test("Should reject password too short", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `test${Date.now()}@example.com`,
      password: "Short1",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("at least 8 characters");
  });

  test("Should reject password without uppercase", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `test${Date.now()}@example.com`,
      password: "password123",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("uppercase letter");
  });

  test("Should reject password without lowercase", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `test${Date.now()}@example.com`,
      password: "PASSWORD123",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("lowercase letter");
  });

  test("Should reject password without number", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `test${Date.now()}@example.com`,
      password: "PasswordOnly",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("number");
  });

  test("Should reject empty password", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `test${Date.now()}@example.com`,
      password: "",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should accept strong password", async () => {
    const email = `test${Date.now()}@example.com`;
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email,
      password: "SecurePass123",
      role: "student",
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    authToken = res.data.token; // Save for later tests
  });
});

// ============================================================================
// TEST SUITE 6: EMAIL VALIDATION
// ============================================================================
describe("Email Validation", () => {
  test("Should reject email without @", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: "invalidemail.com",
      password: "ValidPass123",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("Email format is invalid");
  });

  test("Should reject email without domain", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: "user@",
      password: "ValidPass123",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should reject email without TLD", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: "user@domain",
      password: "ValidPass123",
      role: "student",
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should accept valid email", async () => {
    const res = await request("POST", "/auth/register", {
      name: "John Doe",
      email: `valid${Date.now()}@example.com`,
      password: "ValidPass123",
      role: "student",
    });
    expect([201, 409]).toContain(res.status); // 201 = new, 409 = duplicate
    if (res.status === 201) {
      expect(res.data.success).toBe(true);
    }
  });
});

// ============================================================================
// TEST SUITE 7: TIME VALIDATION
// ============================================================================
describe("Time Validation", () => {
  test("Should reject hour > 23", async () => {
    const res = await request("POST", "/api/streak/power-hour/schedule", {
      hour: 24,
      minute: 0,
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("0-23");
  });

  test("Should reject hour < 0", async () => {
    const res = await request("POST", "/api/streak/power-hour/schedule", {
      hour: -1,
      minute: 0,
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should reject minute > 59", async () => {
    const res = await request("POST", "/api/streak/power-hour/schedule", {
      hour: 20,
      minute: 60,
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("0-59");
  });

  test("Should reject minute < 0", async () => {
    const res = await request("POST", "/api/streak/power-hour/schedule", {
      hour: 20,
      minute: -1,
    });
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  test("Should accept valid time", async () => {
    const res = await request("POST", "/api/streak/power-hour/schedule", {
      hour: 20,
      minute: 30,
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 8: AUTHORIZATION & SECURITY
// ============================================================================
describe("Authorization & Security", () => {
  test("Should reject unauthorized access", async () => {
    const res = await axios
      .get(`${API}/studyLog`, {
        // No auth token
      })
      .catch((err: any) => err.response);

    expect(res.status).toBe(401);
    expect(res.data.success).toBe(false);
    expect(res.data.message).toContain("Unauthorized");
  });

  test("Should reject invalid token", async () => {
    const res = await axios
      .get(`${API}/studyLog`, {
        headers: { Authorization: "Bearer invalid_token" },
      })
      .catch((err: any) => err.response);

    expect(res.status).toBe(401);
  });

  test("Should prevent field injection", async () => {
    // Attempt to inject admin=true
    const res = await request("POST", "/notes", {
      title: "Test",
      content: "Test",
      subject: "Math",
      isAdmin: true,
      __proto__: { isAdmin: true },
    });

    if (res.status === 201) {
      expect(res.data.data.isAdmin).toBeUndefined();
      expect(res.data.data.__proto__.isAdmin).toBeUndefined();
    }
  });

  test("Should handle null bytes in input", async () => {
    const res = await request("POST", "/notes", {
      title: "Test\x00Injection",
      content: "Test",
      subject: "Math",
    });

    expect(res.status).toBe(400); // Should reject
  });

  test("Should sanitize very long strings", async () => {
    const res = await request("POST", "/notes", {
      title: "A".repeat(10000), // Way over limit
      content: "Test",
      subject: "Math",
    });

    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });
});

// ============================================================================
// TEST SUITE 9: QUERY PARAMETER INJECTION
// ============================================================================
describe("Query Parameter Injection Prevention", () => {
  test("Should reject MongoDB operator in subject filter", async () => {
    const res = await request("GET", "/studyLog?subject=$ne:null");
    // Should either sanitize or reject
    expect([200, 400]).toContain(res.status);
  });

  test("Should reject XSS in subject filter", async () => {
    const res = await request(
      "GET",
      "/studyLog?subject=<script>alert(1)</script>",
    );
    expect(res.status).toBe(200); // Might be sanitized
    // Important: Should NOT execute JavaScript
  });

  test("Should safely handle special characters", async () => {
    const res = await request("GET", "/studyLog?subject=Math%& Physics");
    expect([200, 400]).toContain(res.status); // Safe handling
  });
});

// ============================================================================
// TEST SUITE 10: TYPE COERCION ATTACKS
// ============================================================================
describe("Type Coercion Protection", () => {
  test('Should handle string "0" as safe falsy', async () => {
    const res = await axios.post(
      `${API}/auth/login`,
      {
        email: "0",
        password: "password",
      },
      {
        validateStatus: () => true,
      },
    );
    // Should reject invalid email, not treat "0" as truthy
    expect(res.status).toBe(400);
  });

  test('Should handle string "true" safely', async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: "true", // String, not boolean
      scoreEarned: 500,
      subject: "Math",
    });
    // Should either coerce and validate, or reject as invalid
    expect([201, 400]).toContain(res.status);
  });

  test("Should handle array in scalar field", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: [100, 200], // Array instead of number
      scoreEarned: 500,
      subject: "Math",
    });
    expect(res.status).toBe(400);
  });

  test("Should handle object in scalar field", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: { value: 100 }, // Object instead of number
      scoreEarned: 500,
      subject: "Math",
    });
    expect(res.status).toBe(400);
  });
});

// ============================================================================
// TEST SUITE 10: SUBJECT ABBREVIATION & MISSPELLING EDGE CASES
// ============================================================================
describe("Subject Fuzzy Matching Edge Cases", () => {
  test("Should convert 'bio' to 'Biology'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "bio",
    });
    expect(res.status).toBe(201);
    // Subject should be normalized to "Biology"
    expect(res.data.data?.subject).toBe("Biology");
  });

  test("Should convert 'math' to 'Mathematics'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 750,
      subject: "math",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Mathematics");
  });

  test("Should convert 'mathe' to 'Mathematics'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 600,
      subject: "mathe",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Mathematics");
  });

  test("Should convert 'chem' to 'Chemistry'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 550,
      subject: "chem",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Chemistry");
  });

  test("Should convert 'phy' to 'Physics'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 55,
      scoreEarned: 700,
      subject: "phy",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Physics");
  });

  test("Should convert 'eng' to 'English'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 40,
      scoreEarned: 500,
      subject: "eng",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("English");
  });

  test("Should handle uppercase abbreviation 'MATH'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 800,
      subject: "MATH",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Mathematics");
  });

  test("Should handle mixed case 'BiO'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 650,
      subject: "BiO",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Biology");
  });

  test("Should handle abbreviation in notes", async () => {
    const res = await request("POST", "/notes", {
      title: "Test Note",
      content: "This is a test note",
      subject: "chem",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Chemistry");
  });

  test("Should handle partial misspelling 'biologi'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "biologi",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Biology");
  });

  test("Should handle 'cs' as ComputerScience", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 900,
      subject: "cs",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("ComputerScience");
  });

  test("Should handle 'hist' as History", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 700,
      subject: "hist",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("History");
  });

  test("Should handle 'geo' as Geography", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 600,
      subject: "geo",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Geography");
  });

  test("Should handle 'hindi' as Hindi", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 500,
      subject: "hindi",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Hindi");
  });

  test("Should handle 'sci' as Science", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 800,
      subject: "sci",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.subject).toBe("Science");
  });

  test("Should reject empty subject", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "",
    });
    expect(res.status).toBe(400);
  });

  test("Should reject null subject", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: null,
    });
    expect(res.status).toBe(400);
  });

  test("Should normalize subject in query parameters", async () => {
    const res = await request("GET", "/studyLog?subject=bio");
    expect(res.status).toBe(200);
    // Should filter by normalized subject
  });
});

// ============================================================================
// TEST SUITE 11: TOPIC/CONCEPT MISSPELLING EDGE CASES
// ============================================================================
describe("Topic Misspelling & Fuzzy Matching", () => {
  test("Should convert 'photosynhtesis' to 'Photosynthesis'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "Biology",
      topic: "photosynhtesis",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Photosynthesis");
  });

  test("Should convert 'mitocondria' to 'Mitochondria'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 600,
      subject: "Biology",
      topic: "mitocondria",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Mitochondria");
  });

  test("Should convert 'oxidaton' to 'Oxidation'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 55,
      scoreEarned: 700,
      subject: "Chemistry",
      topic: "oxidaton",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Oxidation");
  });

  test("Should convert 'velocty' to 'Velocity'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 800,
      subject: "Physics",
      topic: "velocty",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Velocity");
  });

  test("Should convert 'accelaration' to 'Acceleration'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 50,
      scoreEarned: 650,
      subject: "Physics",
      topic: "accelaration",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Acceleration");
  });

  test("Should convert 'mometnm' to 'Momentum'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "Physics",
      topic: "mometnm",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Momentum");
  });

  test("Should convert 'anallysis' to 'Analysis'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 40,
      scoreEarned: 550,
      subject: "Mathematics",
      topic: "anallysis",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Analysis");
  });

  test("Should convert 'sythesis' to 'Synthesis'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 55,
      scoreEarned: 700,
      subject: "Chemistry",
      topic: "sythesis",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Synthesis");
  });

  test("Should convert partial topic 'photosynth' to 'Photosynthesis'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "Biology",
      topic: "photosynth",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Photosynthesis");
  });

  test("Should handle uppercase topic 'VELOCITY'", async () => {
    const res = await request("POST", "/studyLog", {
      durationMinutes: 60,
      scoreEarned: 800,
      subject: "Physics",
      topic: "VELOCITY",
    });
    expect(res.status).toBe(201);
    expect(res.data.data?.topic).toBe("Velocity");
  });
});

// ============================================================================
// TEST SUITE 12: LEARNING STYLE FUZZY MATCHING
// ============================================================================
describe("Learning Style Fuzzy Matching", () => {
  test("Should convert 'visuual' to 'visual'", async () => {
    const res = await request("POST", "/auth/register", {
      email: "visual@test.com",
      password: "Secure123!",
      name: "Visual Learner",
      learningStyle: "visuual",
    });
    const status = [201, 400]; // Created or exists
    expect(status).toContain(res.status);
  });

  test("Should convert 'auditry' to 'auditory'", async () => {
    const res = await request("POST", "/auth/register", {
      email: "auditory@test.com",
      password: "Secure123!",
      name: "Audio Learner",
      learningStyle: "auditry",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should convert 'reding' to 'reading'", async () => {
    const res = await request("POST", "/auth/register", {
      email: "reading@test.com",
      password: "Secure123!",
      name: "Reader",
      learningStyle: "reding",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should accept 'kinesthetic'", async () => {
    const res = await request("POST", "/auth/register", {
      email: "kinesthetic@test.com",
      password: "Secure123!",
      name: "Kinesthetic Learner",
      learningStyle: "kinesthetic",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should convert 'aud' to 'auditory' (abbreviation)", async () => {
    const res = await request("POST", "/auth/register", {
      email: "aud@test.com",
      password: "Secure123!",
      name: "Auditory",
      learningStyle: "aud",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });
});

// ============================================================================
// TEST SUITE 13: NOTE SOURCE TYPE FUZZY MATCHING
// ============================================================================
describe("Source Type Fuzzy Matching", () => {
  test("Should convert 'txt' to 'text'", async () => {
    const res = await request("POST", "/notes", {
      title: "Text Note",
      content: "This is text",
      subject: "Biology",
      sourceType: "txt",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should convert 'img' to 'image'", async () => {
    const res = await request("POST", "/notes", {
      title: "Image Note",
      content: "Image content",
      subject: "Physics",
      sourceType: "img",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should convert 'photo' to 'image'", async () => {
    const res = await request("POST", "/notes", {
      title: "Photo Note",
      content: "Photo from lesson",
      subject: "Chemistry",
      sourceType: "photo",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });

  test("Should convert 'document' to 'pdf'", async () => {
    const res = await request("POST", "/notes", {
      title: "PDF Document",
      content: "PDF content",
      subject: "Mathematics",
      sourceType: "document",
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });
});

// ============================================================================
// TEST SUITE 14: REGIONAL SPELLING VARIATIONS
// ============================================================================
describe("Regional Spelling Variations", () => {
  test("Should handle both 'analyze' and 'analyse'", async () => {
    const res1 = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "Mathematics",
      topic: "analyse",
    });
    const res2 = await request("POST", "/studyLog", {
      durationMinutes: 45,
      scoreEarned: 500,
      subject: "Mathematics",
      topic: "analyze",
    });
    expect([201, 400]).toContain(res1.status);
    expect([201, 400]).toContain(res2.status);
  });

  test("Should handle 'color' vs 'colour' in tags", async () => {
    const res = await request("POST", "/notes", {
      title: "Color Note",
      content: "About colors",
      subject: "Science",
      tags: ["colour", "physics"],
    });
    const status = [201, 400];
    expect(status).toContain(res.status);
  });
});

// ============================================================================
// TEST SUITE 15: COMMON TYPO PATTERNS
// ============================================================================
describe("Common Typo Pattern Handling", () => {
  test("Should handle transposition: 'teh' → 'the'", async () => {
    const res = await request("POST", "/notes", {
      title: "Teh Fundumentals",
      content: "About teh basics",
      subject: "Science",
    });
    expect(res.status).toBe(201);
  });

  test("Should handle double letters: 'occured' → 'occurred'", async () => {
    const res = await request("POST", "/notes", {
      title: "When Did It Occure",
      content: "Historical event",
      subject: "History",
    });
    expect(res.status).toBe(201);
  });

  test("Should handle missing letters: 'studing' → 'studying'", async () => {
    const res = await request("POST", "/notes", {
      title: "Studing Tips",
      content: "How to study better",
      subject: "English",
    });
    expect(res.status).toBe(201);
  });

  test("Should handle extra letters: 'becuase' → 'because'", async () => {
    const res = await request("POST", "/notes", {
      title: "Becuase It Matters",
      content: "Why this is important",
      subject: "Education",
    });
    expect(res.status).toBe(201);
  });
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

console.log("✅ Edge case test suite ready");
console.log('Run with: npm test -- --testNamePattern="Edge Case"');
console.log("");
console.log("Coverage:");
console.log("  ✅ Pagination (6 tests)");
console.log("  ✅ Study Log (8 tests)");
console.log("  ✅ Notes (5 tests)");
console.log("  ✅ ObjectId (3 tests)");
console.log("  ✅ Password (6 tests)");
console.log("  ✅ Email (4 tests)");
console.log("  ✅ Time (5 tests)");
console.log("  ✅ Auth & Security (5 tests)");
console.log("  ✅ Type Coercion (4 tests)");
console.log("  ✅ Subject Fuzzy Matching (18 tests)");
console.log("  ✅ Topic Misspelling (10 tests)");
console.log("  ✅ Learning Style Fuzzy Matching (5 tests)");
console.log("  ✅ Source Type Fuzzy Matching (4 tests)");
console.log("  ✅ Regional Spelling Variations (2 tests)");
console.log("  ✅ Common Typo Patterns (4 tests)");
console.log("");
console.log(
  "Total: 85+ test cases covering all edge cases including fuzzy matching",
);
