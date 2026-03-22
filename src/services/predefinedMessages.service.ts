/**
 * Predefined Messages Service
 * Provides fast, template-based welcome and motivational messages
 * without calling external AI APIs
 */

export interface MentorMessage {
  greeting: string;
  todayMessage: string;
  feedback: string;
  encouragement: string;
  actionSuggestion: string;
  moodCheck: string;
  streakMessage: string;
  weeklyInsight: string;
  motivationalQuote: string;
}

// Predefined templates with placeholders
const baseMessages = {
  greetings: [
    "Hello {name}! 👋",
    "Welcome back, {name}! 🎯",
    "Great to see you, {name}! ✨",
    "Hey {name}, let's make today count! 💪",
  ],
  todayMessages: [
    "Today is a perfect day to begin building your study streak. Every small step counts!",
    "This is your moment to shine! Today's a great opportunity to strengthen your knowledge.",
    "Let's turn today into a productive learning day. You're capable of amazing things!",
    "Great to see you here today. Ready to unlock new knowledge?",
  ],
  feedbacks: [
    "You're building great study habits. Keep it up!",
    "Your consistency is impressive. You're on the right track!",
    "Nice effort! Every study session brings you closer to your goals.",
    "You're making real progress. Stay dedicated!",
  ],
  encouragements: [
    "Remember: every master was once a beginner. You're doing great!",
    "Your hard work will truly pay off. Keep pushing forward!",
    "Believe in yourself. You're more capable than you think!",
    "Success is not final, failure is not fatal. Keep going!",
  ],
  actionSuggestions: [
    "💡 Pick one subject from your {classLevel} {board} syllabus (like Maths or Science) and study for just 15 minutes today.",
    "💡 Spend 20 minutes reviewing one weak topic. Small progress is still progress!",
    "💡 Complete one practice exercise in your most challenging subject.",
    "💡 Study for 30 minutes without distractions. Quality over quantity!",
    "💡 Review one chapter and make quick notes. Active learning is key!",
  ],
  moodChecks: [
    "How are you feeling today? Any challenges you'd like to work on?",
    "What's on your mind? Excited to learn something new?",
    "Are you ready to tackle some study goals today?",
    "Feeling stressed? Remember, learning is a marathon, not a sprint!",
  ],
  streakMessages: [
    "🔥 You're {streak} days into your study streak! That's awesome!",
    "🔥 {streak}-day streak going strong! Keep the fire alive!",
    "🔥 Amazing commitment! You've been consistent for {streak} days!",
    "🔥 Your {streak}-day streak shows dedication. Don't break it now!",
  ],
  weeklyInsights: [
    "This week, focus on strengthening your weak areas with targeted practice.",
    "Great week of learning! Push harder this week to reach your next milestone.",
    "Notice any patterns in your study habits this week? Refine what works!",
    "This is the perfect time to diversify your subjects and broaden your knowledge.",
  ],
  motivationalQuotes: [
    "Success is not final, failure is not fatal. It's the courage to continue that counts. — Winston Churchill",
    "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
    "The beautiful thing about learning is that no one can take it away from you. — B.B. King",
    "Your education is a dress rehearsal for a life that is yours to lead. — Nora Ephron",
    "Learning never exhausts the mind. — Leonardo da Vinci",
  ],
};

/**
 * Get a random message from a category
 */
function getRandomMessage(category: string[]): string {
  return category[Math.floor(Math.random() * category.length)];
}

/**
 * Replace placeholders in message template
 */
function replacePlaceholders(
  message: string,
  data: Record<string, string | number>,
): string {
  let result = message;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, "g"), String(value));
  });
  return result;
}

/**
 * Generate predefined mentor message for the user
 * Fast, deterministic, and doesn't require AI API calls
 */
export function generatePredefinedMentorMessage(options: {
  studentName: string;
  streakDays: number;
  classLevel: string;
  board: string;
  weakSubjects?: string[];
}): MentorMessage {
  const {
    studentName = "Student",
    streakDays = 0,
    classLevel = "Class 10",
    board = "ICSE",
    weakSubjects = [],
  } = options;

  const placeholders = {
    name: studentName,
    streak: Math.max(streakDays, 1),
    classLevel,
    board,
  };

  return {
    greeting: replacePlaceholders(
      getRandomMessage(baseMessages.greetings),
      placeholders,
    ),
    todayMessage: getRandomMessage(baseMessages.todayMessages),
    feedback: getRandomMessage(baseMessages.feedbacks),
    encouragement: getRandomMessage(baseMessages.encouragements),
    actionSuggestion: replacePlaceholders(
      getRandomMessage(baseMessages.actionSuggestions),
      placeholders,
    ),
    moodCheck: getRandomMessage(baseMessages.moodChecks),
    streakMessage: replacePlaceholders(
      getRandomMessage(baseMessages.streakMessages),
      placeholders,
    ),
    weeklyInsight: getRandomMessage(baseMessages.weeklyInsights),
    motivationalQuote: getRandomMessage(baseMessages.motivationalQuotes),
  };
}

/**
 * Generate predefined daily tasks (study planner replacement)
 */
export function generatePredefinedDailyTasks(options: {
  subjects: string[];
  classLevel: string;
  weakSubjects?: string[];
  availableMinutes?: number;
}): {
  title: string;
  description: string;
  estimatedTime: number;
  priority: "high" | "medium" | "low";
  subject: string;
}[] {
  const {
    subjects = ["Maths", "Science", "English"],
    classLevel = "Class 10",
    weakSubjects = [],
    availableMinutes = 60,
  } = options;

  const taskTemplates = [
    {
      title: "Review Weak Topics",
      description: "Spend 15 minutes reviewing topics you find challenging",
      estimatedTime: 15,
      priority: "high" as const,
    },
    {
      title: "Practice Problems",
      description: "Solve 5-10 practice problems to strengthen concepts",
      estimatedTime: 20,
      priority: "high" as const,
    },
    {
      title: "Read New Chapter",
      description:
        "Read and understand one new chapter from your textbook or notes",
      estimatedTime: 25,
      priority: "medium" as const,
    },
    {
      title: "Revision Session",
      description: "Quick revision of previously learned topics",
      estimatedTime: 15,
      priority: "medium" as const,
    },
    {
      title: "Take Notes",
      description: "Create clear and organized notes for today's topic",
      estimatedTime: 20,
      priority: "medium" as const,
    },
  ];

  // Distribute tasks across available subjects
  const selectedSubjects = subjects.slice(0, Math.ceil(availableMinutes / 20));

  return taskTemplates
    .slice(0, Math.min(3, availableMinutes / 15))
    .map(task => ({
      ...task,
      subject:
        selectedSubjects[Math.floor(Math.random() * selectedSubjects.length)],
    }));
}
