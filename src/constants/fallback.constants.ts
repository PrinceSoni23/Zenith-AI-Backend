/**
 * Centralized Fallback Data for All Agents
 * Used when API calls fail or return invalid responses
 * Organized by agent name and language (hindi/hinglish/english)
 * Zero token usage - these are hardcoded responses
 */

export const AGENT_FALLBACKS = {
  classTranslator: {
    hindi: {
      simpleExplanation:
        "यह एक महत्वपूर्ण शैक्षणिक अवधारणा है जिसे आप अपनी पढ़ाई में सीखते हैं। इसका मतलब है कि हम जटिल और कठिन विचारों को छोटे-छोटे और सरल भागों में विभाजित करके समझते हैं। यह तरीका आपकी पढ़ाई को आसान बनाता है और आप सब कुछ बेहतर तरीके से याद रख सकते हैं। यह आपके सभी विषयों के लिए उपयोगी है।",
      realLifeExample:
        "देखो, तुम्हारे रोज़मर्रा के जीवन में यह अवधारणा हर जगह दिखाई देती है। जब तुम कोई बड़ा काम करते हो, जैसे होमवर्क खत्म करना या कोई खेल सीखना, तो तुम इसे छोटे-छोटे हिस्सों में बाँट देते हो। परीक्षा की तैयारी करते समय भी तुम एक बार में सब कुछ नहीं सीखते, बल्कि धीरे-धीरे एक अध्याय करते हो। यही इस अवधारणा का असली उदाहरण है।",
      keyPoints: [
        "मुख्य बिंदु 1: बुनियादी ज्ञान समझना जरूरी है",
        "मुख्य बिंदु 2: वास्तविक जीवन में उपयोग",
        "मुख्य बिंदु 3: आम गलतियाँ",
      ],
      translatedContent: "सामग्री की व्याख्या",
      formalDefinition: "औपचारिक परिभाषा: यह एक महत्वपूर्ण अवधारणा है।",
    },
    hinglish: {
      simpleExplanation:
        "Yeh ek bahut zaroori educational concept hai jo tumko apni padhai mein seekhna chahiye. Iska matlab hai ki complex aur mushkil vichar ko chhote-chhote aur simple parts mein divide karke samjhte hain. Yeh tarika tumhare padhai ko aasan banata hai aur tum sab kuch better tarike se yaad rakh sakte ho. Sab subjects ke liye yeh bahut useful hai.",
      realLifeExample:
        "Dekho, tumhare daily life ke har jagah yeh concept dikhai deta hai. Jab tum koi bada kaam karte ho, jaise homework khatam karna ya kisi khel ko seekhna, to tum isko chhote-chhote parts mein divide kar dete ho automatically. Exam ke liye padhai karte hue bhi tum ek sath sab nahi seekhte, balki slowly ek chapter karte ho. Sangeet ya sports sikhte hue bhi basics pehle seekhte ho, phir combine karte ho. Yahi is important concept ka real example hai.",
      keyPoints: [
        "Key Point 1: Basics samajhna zaruri hai",
        "Key Point 2: Real life mein application",
        "Key Point 3: Common galtiyan",
      ],
      translatedContent: "Content ka explanation",
      formalDefinition: "Formal Definition: Yeh ek important concept hai.",
    },
    english: {
      simpleExplanation:
        "This is an important educational concept that you learn in your studies. It means that we take complex and difficult ideas and break them down into smaller, simpler parts so we can understand them better. This approach makes your learning easier and helps you remember and apply what you've learned. It's a skill that will help you in many subjects and in real life.",
      realLifeExample:
        "Real-life examples are all around you every day. When you do homework, you break the entire assignment into smaller questions and solve them one by one instead of trying to tackle everything at once. When you prepare for an exam, you study one chapter at a time instead of trying to memorize everything at the last minute. Even when learning a sport, musical instrument, or cooking, you practice basic moves or techniques first before combining them into complete tasks. These are all practical examples of this important concept working in your everyday life.",
      keyPoints: [
        "Key Point 1: Start with the basic definition and core idea",
        "Key Point 2: Understand how it works in real situations",
        "Key Point 3: Learn the most common mistakes students make",
      ],
      translatedContent: "Concept explanation",
      formalDefinition:
        "Formal Definition: An important concept to understand.",
    },
  },

  storyMode: {
    hindi: {
      storyTitle: "सीखने की यात्रा",
      story:
        "एक बार की बात है, एक जिज्ञासु छात्र इस विषय को समझने के लिए एक यात्रा पर निकला। उसने रास्ते भर यह खोज किया कि यह अवधारणा कितनी महत्वपूर्ण है। अंत में, वह एक ज्ञानी बन गया।",
      moralOrLesson: "ज्ञान ही शक्ति है",
      conceptsExplained: {
        "मूल विचार": "इस विषय का आधार",
        "महत्वपूर्ण बात": "याद रखने लायक मुख्य बिंदु",
      },
      funFact: "यह विषय वास्तविक जीवन में महत्वपूर्ण है।",
    },
    hinglish: {
      storyTitle: "Sikhne ki Yatra",
      story:
        "Ek baar ki baat hai, ek curious student is topic ko samjhne ke liye journey pe nikla. Usne dekha ki yeh concepts ka real life mein kya importance hai. Aakhir mein wo sab seekh gaya.",
      moralOrLesson: "Jankari ही taakat hai",
      conceptsExplained: {
        "Key Idea": "Is topic ka base",
        Important: "Yaad rakhne layak baat",
      },
      funFact: "Yeh real life mein use hota hai.",
    },
    english: {
      storyTitle: "A Journey of Learning",
      story:
        "Once upon a time, a curious student discovered this fascinating topic. Through learning, they realized how these concepts apply to real life. They became wiser with each discovery.",
      moralOrLesson: "Knowledge is power",
      conceptsExplained: {
        "Key Idea": "The main concept",
        Important: "Key principle",
      },
      funFact: "This concept is used everywhere!",
    },
  },

  mentor: {
    hindi: {
      greeting: "नमस्ते, छात्र! वापसी पर स्वागत है!",
      todayMessage: "आज एक बेहतरीन दिन है प्रगति करने का। तुम कर सकते हो!",
      feedback:
        "तुम बहुत अच्छा कर रहे हो। लगातार प्रयास जारी रखो और अपनी वृद्धि देखो।",
      encouragement:
        "हर छोटा कदम जो तुम आज उठाते हो, वह तुम्हें अपने लक्ष्यों के करीब लाता है।",
      actionSuggestion:
        "आज 20-30 मिनट का एक केंद्रित अध्ययन सत्र पूरा करने का प्रयास करो।",
      moodCheck:
        "आज तुम कैसा महसूस कर रहे हो? क्या कोई चुनौती है जिस पर बात करनी चाहिए?",
      streakMessage: "तुम शानदार अध्ययन आदतें बना रहे हो!",
      weeklyInsight: "इस हफ्ते, अपने कमजोर विषयों को मजबूत करने पर ध्यान दो।",
      motivationalQuote:
        "सफलता अंतिम नहीं है, विफलता घातक नहीं है। जारी रखने की हिम्मत महत्वपूर्ण है।",
    },
    hinglish: {
      greeting: "Hello, Student! Welcome back!",
      todayMessage:
        "Aaj ek behatarin din hai progress karne ke liye. Tu kar sakta hai!",
      feedback: "Tu bahut accha kar raha hai. Lagatar mehnat karte raho!",
      encouragement:
        "Har chhota kadam jo tu aaj uthata hai, wo tujhe apne goals ke karib lata hai.",
      actionSuggestion:
        "Aaj 20-30 min ka ek focused study session complete karne ki koshish karo.",
      moodCheck: "Aaj tu kaisa feel kar raha hai? Kya koi challenge hai?",
      streakMessage: "Tu shandar study habits bana raha hai!",
      weeklyInsight:
        "Is hafta, apne weak subjects ko matabut karne par focus karo.",
      motivationalQuote:
        "Success aakhri nahin hai, failure fatal nahin hai. Jaari rakhne ki himmat zaroori hai.",
    },
    english: {
      greeting: "Hello, Student! Welcome back!",
      todayMessage: "Today is a great day to make progress. You've got this!",
      feedback:
        "You're doing well. Keep up the consistent effort and watch yourself grow.",
      encouragement:
        "Every small step you take today brings you closer to your goals.",
      actionSuggestion:
        "Try completing one focused study session of 20-30 minutes today.",
      moodCheck:
        "How are you feeling today? Any challenges you'd like to discuss?",
      streakMessage: "You're building great study habits!",
      weeklyInsight:
        "This week, focus on strengthening your weak areas with targeted practice.",
      motivationalQuote:
        "Success is not final, failure is not fatal. It's the courage to continue that counts.",
    },
  },

  mathsSolver: {
    hindi: {
      hints: [
        "दी गई जानकारी को सावधानी से देखें",
        "पहचानने की कोशिश करें कि कौन सा सूत्र लागू होता है",
      ],
      steps: [
        {
          stepNumber: 1,
          description: "दी गई जानकारी को समझें",
          calculation: "सभी दी गई जानकारी सूची बनाएं",
        },
        {
          stepNumber: 2,
          description: "उपयुक्त सूत्र चुनें",
          calculation: "सही गणितीय तरीका चुनें",
        },
        {
          stepNumber: 3,
          description: "गणना करें",
          calculation: "सूत्र को चरण दर चरण लागू करें",
        },
      ],
      fullSolution: "सभी चरणों के साथ पूरा समाधान",
      answer: "समाधान मान",
      conceptsUsed: ["बीजगणित", "समस्या समाधान"],
      formulasApplied: ["प्रासंगिक गणितीय सूत्र"],
      commonMistakes: ["समस्या को ध्यान से न पढ़ना"],
      similarExamples: ["समान समस्या के उदाहरण"],
    },
    hinglish: {
      hints: [
        "Given information ko carefully dekho",
        "Pehchanne ki koshish karo ki kaunsa formula apply hoga",
      ],
      steps: [
        {
          stepNumber: 1,
          description: "Given ki hui jaankari ko samjho",
          calculation: "Sab kuch list karo",
        },
        {
          stepNumber: 2,
          description: "Sahi formula select karo",
          calculation: "Right tarika choose karo",
        },
        {
          stepNumber: 3,
          description: "Calculation karo",
          calculation: "Formula ko step by step apply karo",
        },
      ],
      fullSolution: "Sab steps ke saath pura solution",
      answer: "Solution value",
      conceptsUsed: ["Algebra", "Problem-solving"],
      formulasApplied: ["Relevant mathematical formula"],
      commonMistakes: ["Problem ko properly padna zaroori hai"],
      similarExamples: ["Similar problem examples"],
    },
    english: {
      hints: [
        "Look at the given information carefully",
        "Try to identify which formula or concept applies",
      ],
      steps: [
        {
          stepNumber: 1,
          description: "Identify the given values and what to find",
          calculation: "List all given information",
        },
        {
          stepNumber: 2,
          description: "Select the appropriate formula or method",
          calculation: "Choose the relevant mathematical approach",
        },
        {
          stepNumber: 3,
          description: "Perform the calculation",
          calculation: "Apply the formula step by step",
        },
      ],
      fullSolution: "Complete solution with all steps shown",
      answer: "Solution value",
      conceptsUsed: ["Algebra", "Problem-solving"],
      formulasApplied: ["Relevant mathematical formula"],
      commonMistakes: ["Not reading the problem carefully"],
      similarExamples: ["Similar problem examples"],
    },
  },

  writingCoach: {
    hindi: {
      improvedText:
        "आपकी लेखन को बेहतर स्पष्टता और प्रभाव के लिए बढ़ाया गया है।",
      grammarFeedback: [
        "वाक्य संरचना की जांच करें",
        "विषय-क्रिया समझौता सुनिश्चित करें",
      ],
      structureFeedback:
        "अपने विचारों को स्पष्ट परिचय, निकाय और निष्कर्ष के साथ व्यवस्थित करें।",
      vocabularyEnhancements: [
        {
          original: "अच्छा",
          suggestion: "उत्कृष्ट/शानदार",
          reason: "अधिक विशिष्ट और प्रभावशाली",
        },
      ],
      corrections: [
        {
          original: "उदाहरण पाठ",
          corrected: "बेहतर उदाहरण पाठ",
          explanation: "बेहतर पहार",
        },
      ],
      overallScore: 75,
      strengths: ["स्पष्ट मुख्य विचार", "अच्छा प्रवाह"],
      areasToImprove: ["उदाहरणों के साथ विस्तारित करें", "संक्रमण में सुधार"],
      encouragement:
        "शानदार प्रयास! अधिक अभ्यास के साथ, आपकी लेखन और भी मजबूत हो जाएगी।",
    },
    hinglish: {
      improvedText:
        "Aapki writing ko better clarity aur impact ke liye improve kiya gaya hai.",
      grammarFeedback: [
        "Sentence structure ko dekho",
        "Subject-verb agreement check karo",
      ],
      structureFeedback:
        "Apne ideas ko clear intro, body, aur conclusion ke sath organize karo.",
      vocabularyEnhancements: [
        {
          original: "accha",
          suggestion: "excellent/outstanding",
          reason: "Zyada specific aur impactful",
        },
      ],
      corrections: [
        {
          original: "Example text",
          corrected: "Improved text",
          explanation: "Better phrasing",
        },
      ],
      overallScore: 75,
      strengths: ["Clear main idea", "Good flow"],
      areasToImprove: ["Expand with examples", "Improve transitions"],
      encouragement:
        "Bahut accha try! Aur practice se, tumhara writing even stronger ho jayega.",
    },
    english: {
      improvedText:
        "Your writing has been enhanced for better clarity and impact.",
      grammarFeedback: [
        "Check sentence structure",
        "Ensure subject-verb agreement",
      ],
      structureFeedback:
        "Organize your ideas with clear introduction, body, and conclusion.",
      vocabularyEnhancements: [
        {
          original: "good",
          suggestion: "excellent/outstanding",
          reason: "More specific and impactful",
        },
      ],
      corrections: [
        {
          original: "Example text",
          corrected: "Improved example text",
          explanation: "Better phrasing",
        },
      ],
      overallScore: 75,
      strengths: ["Clear main idea", "Good flow"],
      areasToImprove: ["Expand with examples", "Improve transitions"],
      encouragement:
        "Great effort! With more practice, your writing will become even stronger.",
    },
  },

  visionLens: {
    hindi: {
      explanation:
        "यह छवि शैक्षणिक सामग्री से संबंधित है। दिखाए गए आधार पर, यहाँ व्याख्या है: मुख्य अवधारणा में छवि में दिखाए गए विभिन्न तत्वों के बीच संबंधों को समझना शामिल है।",
      keyPoints: [
        "छवि से मुख्य अवधारणा",
        "मुख्य संबंध या सिद्धांत",
        "याद रखने के लिए महत्वपूर्ण विवरण",
      ],
      relatedTopics: [
        "संबंधित अवधारणा 1",
        "संबंधित अवधारणा 2",
        "संबंधित अवधारणा 3",
      ],
      studyTip:
        "समान छवियों का सामना करते समय, मुख्य तत्वों और उनके संबंधों की पहचान करने पर ध्यान दें ताकि समग्र अवधारणा को समझा जा सके।",
    },
    hinglish: {
      explanation:
        "Yeh image educational content se related hai. Jya ho dikhai de raha hai, yaha explanation hai: Main concept mein image mein dikhaye gaye element ke beech relationships ko samjhna shamil hai.",
      keyPoints: [
        "Image se main concept",
        "Main relationship ya principle",
        "Important detail to remember",
      ],
      relatedTopics: [
        "Related concept 1",
        "Related concept 2",
        "Related concept 3",
      ],
      studyTip:
        "Jab similar images dekho, tab main elements aur unke relationships ko identify karne par focus karo taaki overall concept samajh aaye.",
    },
    english: {
      explanation:
        "This image contains educational content. Based on what's shown, here's the explanation: The key concept involves understanding the relationships between different elements shown in the image.",
      keyPoints: [
        "Main concept from the image",
        "Key relationship or principle",
        "Important detail to remember",
      ],
      relatedTopics: [
        "Related concept 1",
        "Related concept 2",
        "Related concept 3",
      ],
      studyTip:
        "When encountering similar images, focus on identifying the main elements and their relationships to understand the overall concept.",
    },
  },

  studyPlanner: {
    hindi: {
      todaysTasks: [
        {
          title: "आज की अवधारणाओं की समीक्षा करें",
          description: "मुख्य अवधारणाओं को पढ़ें और समझें",
          subject: "सामान्य",
          taskType: "read",
          estimatedMinutes: 15,
          priority: "high",
        },
        {
          title: "अभ्यास समस्याएं",
          description: "इस विषय पर 5-10 अभ्यास समस्याओं को हल करें",
          subject: "सामान्य",
          taskType: "practice",
          estimatedMinutes: 20,
          priority: "high",
        },
        {
          title: "संशोधन",
          description: "पहले से चिन्हित कमजोर क्षेत्रों की समीक्षा करें",
          subject: "सामान्य",
          taskType: "revise",
          estimatedMinutes: 15,
          priority: "medium",
        },
      ],
      weeklyGoals: [
        "वर्तमान विषय में महारत हासिल करें",
        "सभी अभ्यास समस्याओं को पूरा करें",
      ],
      motivationalMessage: "आप शानदार काम कर रहे हैं! लगातार प्रयास जारी रखें।",
      studyTip: "हर 25 मिनट में ब्रेक लें और हाइड्रेटेड रहें।",
      totalEstimatedMinutes: 50,
    },
    hinglish: {
      todaysTasks: [
        {
          title: "Today ke Concepts Review Karo",
          description: "Main concepts ko padho aur samjho",
          subject: "General",
          taskType: "read",
          estimatedMinutes: 15,
          priority: "high",
        },
        {
          title: "Practice Problems",
          description: "5-10 practice problems solve karo",
          subject: "General",
          taskType: "practice",
          estimatedMinutes: 20,
          priority: "high",
        },
        {
          title: "Revision",
          description: "Weak areas ko review karo",
          subject: "General",
          taskType: "revise",
          estimatedMinutes: 15,
          priority: "medium",
        },
      ],
      weeklyGoals: [
        "Current topic mein master banो",
        "Sab practice problems complete karo",
      ],
      motivationalMessage:
        "Tum awesome kar rahe ho! Lagatar mehnat karte raho.",
      studyTip: "Har 25 min mein break lo aur hydrated raho.",
      totalEstimatedMinutes: 50,
    },
    english: {
      todaysTasks: [
        {
          title: "Review Today's Concepts",
          description: "Read through and understand the main concepts",
          subject: "General",
          taskType: "read",
          estimatedMinutes: 15,
          priority: "high",
        },
        {
          title: "Practice Problems",
          description: "Solve 5-10 practice problems on the topic",
          subject: "General",
          taskType: "practice",
          estimatedMinutes: 20,
          priority: "high",
        },
        {
          title: "Revision",
          description: "Review weak areas identified previously",
          subject: "General",
          taskType: "revise",
          estimatedMinutes: 15,
          priority: "medium",
        },
      ],
      weeklyGoals: ["Master current topic", "Complete all practice problems"],
      motivationalMessage: "You're doing great! Keep up the consistent effort.",
      studyTip: "Take breaks every 25 minutes and stay hydrated.",
      totalEstimatedMinutes: 50,
    },
  },

  smartNotes: {
    hindi: {
      cleanedNotes:
        "# अच्छी तरह से संगठित नोट्स\n\n## मुख्य अवधारणाएं\n- मुख्य विचार 1\n- मुख्य विचार 2\n\n## महत्वपूर्ण बातें\n- विवरण 1\n- विवरण 2",
      structuredSummary:
        "ये नोट्स बेहतर समझ के लिए संगठित और संरचित किए गए हैं।",
      keyDefinitions: [
        {
          term: "मुख्य शब्द",
          definition: "महत्वपूर्ण अवधारणा परिभाषा",
        },
      ],
      missingConcepts: ["पूर्वापेक्षा अवधारणाओं की समीक्षा करने पर विचार करें"],
      studyTips: ["नोट्स को कई बार पढ़ें", "अभ्यास प्रश्न बनाएं"],
      importantFormulas: ["याद रखने के लिए महत्वपूर्ण सूत्र या अवधारणा"],
    },
    hinglish: {
      cleanedNotes:
        "# Well-Organized Notes\n\n## Main Concepts\n- Main idea 1\n- Main idea 2\n\n## Important Points\n- Detail 1\n- Detail 2",
      structuredSummary:
        "Ye notes better understanding ke liye organized ho gaye hain.",
      keyDefinitions: [
        {
          term: "Key Term",
          definition: "Important concept definition",
        },
      ],
      missingConcepts: ["Prerequisite concepts ko review karne par DYA karo"],
      studyTips: ["Notes ko multiple times padho", "Practice questions banao"],
      importantFormulas: ["Key formula ya concept to remember"],
    },
    english: {
      cleanedNotes:
        "# Well-Organized Notes\n\n## Key Concepts\n- Main idea 1\n- Main idea 2\n\n## Important Points\n- Detail 1\n- Detail 2",
      structuredSummary:
        "These notes have been organized and structured for better understanding.",
      keyDefinitions: [
        {
          term: "Key Term",
          definition: "Important concept definition",
        },
      ],
      missingConcepts: ["Consider reviewing prerequisite concepts"],
      studyTips: ["Read the notes multiple times", "Create practice questions"],
      importantFormulas: ["Key formula or concept to remember"],
    },
  },

  revision: {
    hindi: {
      recallQuestions: [
        {
          question: "इस विषय की मुख्य अवधारणा क्या है?",
          answer: "मुख्य अवधारणा में मुख्य सिद्धांतों को समझना शामिल है",
          hint: "मुख्य विचारों पर ध्यान केंद्रित करें",
          difficulty: "easy",
        },
      ],
      flashCards: [
        {
          front: "मुख्य शब्द",
          back: "परिभाषा",
        },
      ],
      quickSummary: "ये नोट्स बेहतर समझ के लिए संगठित किए गए हैं।",
      revisionTips: ["नोट्स को कई बार पढ़ें", "अभ्यास प्रश्न बनाएं"],
      estimatedRevisionTime: 30,
    },
    hinglish: {
      recallQuestions: [
        {
          question: "Is topic ka main concept kya hai?",
          answer: "Main concept mein key principles ko samjhna shamil hai",
          hint: "Core ideas par focus karo",
          difficulty: "easy",
        },
      ],
      flashCards: [
        {
          front: "Key Term",
          back: "Definition",
        },
      ],
      quickSummary:
        "Ye notes better understanding ke liye organize ho gaye hain.",
      revisionTips: [
        "Notes ko multiple times padho",
        "Practice questions banao",
      ],
      estimatedRevisionTime: 30,
    },
    english: {
      recallQuestions: [
        {
          question: "What is the main concept from this topic?",
          answer: "The main concept involves understanding key principles",
          hint: "Focus on the core ideas",
          difficulty: "easy",
        },
      ],
      flashCards: [
        {
          front: "Key Term",
          back: "Definition",
        },
      ],
      quickSummary: "These notes have been organized for better understanding.",
      revisionTips: [
        "Read the notes multiple times",
        "Create practice questions",
      ],
      estimatedRevisionTime: 30,
    },
  },

  parentInsight: {
    hindi: {
      overallProgress:
        "आपके बच्चे की शिक्षा में शानदार प्रगति दिखाई दे रही है।",
      strongAreas: [
        "मुख्य विषय में शक्तिशाली",
        "निरंतर प्रयास दिखाई दे रहा है",
      ],
      areasForImprovement: [
        "कुछ विषयों में सुधार की आवश्यकता है",
        "अधिक अभ्यास से लाभ हो सकता है",
      ],
      keyRecommendations: [
        "नियमित अध्ययन को प्रोत्साहित करते रहें",
        "कमजोर क्षेत्रों पर अतिरिक्त ध्यान दें",
      ],
      studyHabitsInsight: "आपके बच्चे ने शानदार अध्ययन आदतें विकसित की हैं।",
      engagementLevel:
        "आपके बच्चे की शिक्षा में उच्च स्तरीय जुड़ाव दिखाई दे रहा है।",
      actionItemsForParent: [
        "नियमित अध्ययन के लिए समर्थन प्रदान करें",
        "कमजोर क्षेत्रों की पहचान करें और सहायता करें",
      ],
    },
    hinglish: {
      overallProgress:
        "Aapke child ki academics mein amazing progress dikh rhi hai.",
      strongAreas: [
        "Main subject mein strong",
        "Consistent effort dikh rha hai",
      ],
      areasForImprovement: [
        "Kuch subjects mein improvement zaroori hai",
        "Zyada practice se fayda hoga",
      ],
      keyRecommendations: [
        "Regular study ko encourage karte raho",
        "Weak areas par extra attention do",
      ],
      studyHabitsInsight:
        "Aapke child ne amazing study habits develop ki hain.",
      engagementLevel:
        "Aapke child ka high-level engagement dikhai de rha hai.",
      actionItemsForParent: [
        "Regular study ke liye support do",
        "Weak areas identify karo aur help karo",
      ],
    },
    english: {
      overallProgress:
        "Your child is showing excellent progress in their studies.",
      strongAreas: ["Strong in main subjects", "Showing consistent effort"],
      areasForImprovement: [
        "Some subjects need improvement",
        "Could benefit from more practice",
      ],
      keyRecommendations: [
        "Continue supporting regular study habits",
        "Focus on weak areas with targeted practice",
      ],
      studyHabitsInsight: "Your child has developed excellent study habits.",
      engagementLevel: "Your child shows high engagement levels in learning.",
      actionItemsForParent: [
        "Provide support for consistent practice",
        "Identify and help with weak areas",
      ],
    },
  },

  questionGenerator: {
    hindi: {
      questions: {
        easy: [
          {
            question: "इस विषय की बुनियादी परिभाषा लिखिए।",
            type: "short",
            correctAnswer: "मुख्य अवधारणा का स्पष्ट विवरण।",
            explanation: "यह प्रश्न बुनियादी समझ की जांच करता है।",
          },
        ],
        medium: [
          {
            question: "इस विषय का एक सरल उदाहरण दीजिए।",
            type: "short",
            correctAnswer: "संबंधित विषय से एक उपयुक्त अनुप्रयोग उदाहरण।",
            explanation: "यह प्रश्न अवधारणा के अनुप्रयोग की जांच करता है।",
          },
        ],
        hard: [
          {
            question: "इस विषय के सिद्धांत को विस्तार से समझाइए।",
            type: "long",
            correctAnswer: "कारण, प्रक्रिया और परिणाम सहित विश्लेषण।",
            explanation: "यह प्रश्न गहन विश्लेषण क्षमता की जांच करता है।",
          },
        ],
        thinking: [
          {
            question:
              "दैनिक जीवन की किसी स्थिति में इस विषय का उपयोग करके समाधान प्रस्तावित कीजिए।",
            type: "long",
            correctAnswer: "समस्या-आधारित तर्क के साथ व्यावहारिक समाधान।",
            explanation:
              "यह प्रश्न रचनात्मक और आलोचनात्मक सोच की जांच करता है।",
          },
        ],
      },
      totalQuestions: 4,
      topicCoverage: ["मुख्य विषय", "संबंधित अनुप्रयोग"],
    },
    hinglish: {
      questions: {
        easy: [
          {
            question: "Is topic ki basic definition likho.",
            type: "short",
            correctAnswer: "Main concept ka clear description.",
            explanation: "Ye question basic understanding check karta hai.",
          },
        ],
        medium: [
          {
            question: "Is topic ka ek simple example do.",
            type: "short",
            correctAnswer: "Topic se linked proper application example.",
            explanation: "Ye question concept application check karta hai.",
          },
        ],
        hard: [
          {
            question: "Is topic ke principle ko detail mein explain karo.",
            type: "long",
            correctAnswer: "Cause, process aur outcome ke sath analysis.",
            explanation: "Ye question deep analysis check karta hai.",
          },
        ],
        thinking: [
          {
            question:
              "Daily life ki ksi situation mein is topic use karke solution propose karo.",
            type: "long",
            correctAnswer: "Problem-based practical solution with reasoning.",
            explanation:
              "Ye question creative aur critical thinking check karta hai.",
          },
        ],
      },
      totalQuestions: 4,
      topicCoverage: ["Main topic", "Related application"],
    },
    english: {
      questions: {
        easy: [
          {
            question: "Write the basic definition of this topic.",
            type: "short",
            correctAnswer: "A clear and concise definition of the concept.",
            explanation: "This checks foundational understanding.",
          },
        ],
        medium: [
          {
            question: "Give one simple example of this topic.",
            type: "short",
            correctAnswer:
              "A valid application example connected to the subject.",
            explanation: "This checks conceptual application.",
          },
        ],
        hard: [
          {
            question: "Explain the principle of this topic in detail.",
            type: "long",
            correctAnswer:
              "A structured analysis with cause, process, and outcome.",
            explanation: "This checks deep analytical ability.",
          },
        ],
        thinking: [
          {
            question:
              "Propose a solution to a real-life situation using this topic.",
            type: "long",
            correctAnswer: "A practical solution supported by reasoning.",
            explanation: "This checks creative and critical thinking.",
          },
        ],
      },
      totalQuestions: 4,
      topicCoverage: ["Main topic", "Application area"],
    },
  },
};

/**
 * Helper function to get fallback data for an agent
 * @param agentName - Name of the agent (e.g., 'classTranslator')
 * @param language - Language code ('hindi', 'hinglish', 'english')
 * @returns Fallback data object for the agent
 */
export const getFallbackData = (
  agentName: keyof typeof AGENT_FALLBACKS,
  language: "hindi" | "hinglish" | "english",
) => {
  return (
    AGENT_FALLBACKS[agentName][language] || AGENT_FALLBACKS[agentName].english
  );
};
