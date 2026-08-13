require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/database/connectdb");
const Question = require("./src/model/question.model");
const Test = require("./src/model/testModel/test.model");
const Topic = require("./src/model/topic.model");

const SAMPLE_QUESTIONS = [
  {
    question_text: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
    topicName: "Data Structures & Algorithms",
    difficulty: "medium",
    marks: 2,
    options: ["O(N)", "O(log N)", "O(N^2)", "O(1)"],
    correct_answer_index: 1
  },
  {
    question_text: "Which data structure operates on a Last-In, First-Out (LIFO) order?",
    topicName: "Data Structures & Algorithms",
    difficulty: "easy",
    marks: 1,
    options: ["Queue", "Stack", "Tree", "Graph"],
    correct_answer_index: 1
  },
  {
    question_text: "If a train 150 meters long crosses a telegraph post in 10 seconds, what is the speed of the train in km/hr?",
    topicName: "Quantitative Aptitude",
    difficulty: "medium",
    marks: 2,
    options: ["36 km/hr", "54 km/hr", "60 km/hr", "72 km/hr"],
    correct_answer_index: 1
  },
  {
    question_text: "Choose the word that is most nearly OPPOSITE in meaning to 'METICULOUS':",
    topicName: "Verbal Ability",
    difficulty: "easy",
    marks: 1,
    options: ["Careful", "Sloppy", "Accurate", "Diligent"],
    correct_answer_index: 1
  },
  {
    question_text: "Which HTTP status code represents 'Internal Server Error'?",
    topicName: "Web Development",
    difficulty: "easy",
    marks: 1,
    options: ["200 OK", "404 Not Found", "500 Internal Server Error", "403 Forbidden"],
    correct_answer_index: 2
  }
];

async function seedQuestions() {
  try {
    await connectDB.connectDB();
    console.log("🌱 Starting Question Seeding Process with Topics...");

    // 1. Create or Find Test
    let test = await Test.findOne({ title: "Sample Aptitude & Technical Benchmark Exam" });
    if (!test) {
      test = new Test({
        title: "Sample Aptitude & Technical Benchmark Exam",
        testType: "Aptitude",
        status: "Draft",
        duration_minutes: 30,
        totalMarks: 0,
        maxAttempts: 1
      });
      await test.save();
      console.log(`✅ Created Test: ${test.title} (ID: ${test._id})`);
    } else {
      console.log(`ℹ️ Found existing Test: ${test.title} (ID: ${test._id})`);
    }

    // Cache of topics to avoid repetitive DB hits
    const topicCache = {};
    let totalMarksAdded = 0;
    let insertedQuestions = [];

    for (const item of SAMPLE_QUESTIONS) {
      // Find or create topic by name
      const topicName = item.topicName || "General Aptitude";
      if (!topicCache[topicName]) {
        let topicDoc = await Topic.findOne({ name: topicName });
        if (!topicDoc) {
          topicDoc = new Topic({ name: topicName, status: "active" });
          await topicDoc.save();
          console.log(`  📂 Created Topic: "${topicDoc.name}" (ID: ${topicDoc._id})`);
        }
        topicCache[topicName] = topicDoc._id;
      }

      const topicId = topicCache[topicName];
      const formattedOptions = item.options.map(text => ({ text }));

      // Instantiate Question document
      const questionDoc = new Question({
        testId: test._id,
        topicId: topicId,
        question_text: item.question_text,
        difficulty: item.difficulty,
        marks: item.marks,
        options: formattedOptions
      });

      // Set correct_option_id from option subdocument _id
      const correctOptionSubdoc = questionDoc.options[item.correct_answer_index];
      questionDoc.correct_option_id = correctOptionSubdoc._id;

      await questionDoc.save();
      insertedQuestions.push(questionDoc);
      totalMarksAdded += item.marks;

      console.log(`  ➕ Seeded Question: "${questionDoc.question_text.slice(0, 45)}..."`);
      console.log(`     - Topic: "${topicName}" (TopicID: ${topicId})`);
      console.log(`     - Difficulty: ${questionDoc.difficulty} | Marks: ${questionDoc.marks}`);
    }

    // Update Test totalMarks
    await Test.findByIdAndUpdate(test._id, { $inc: { totalMarks: totalMarksAdded } });

    console.log("\n🎉 SEEDING WITH TOPIC NAMES COMPLETE!");
    console.log(`Summary: ${insertedQuestions.length} Questions successfully inserted into MongoDB.`);
    console.log(`Topics Linked: ${Object.keys(topicCache).join(", ")}`);
    console.log(`Test Title: "${test.title}" (ID: ${test._id})`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding questions:", err);
    process.exit(1);
  }
}

seedQuestions();
