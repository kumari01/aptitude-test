/* =====================================================================
   MOCK DATA
   ===================================================================== */
export const USER = { name: "John Student", roll: "23K61A4228" };

export const LIVE_EXAM = {
  id: 1,
  title: "Week 12 - Mixed Aptitude",
  questions: 30,
  minutes: 45,
  due: "Sunday, Jul 27 · 11:59 PM",
};

export const STATS = {
  rank: "#4",
  rankDelta: "Up 2 from last week",
  avgScore: "74%",
  avgDelta: "+5% this month",
  completed: "11/12",
  best: "92%",
};

export const LEADERBOARD = [
  { rank: 1, name: "Priya Sharma", roll: "21B01A0512", score: 92 },
  { rank: 2, name: "Rahul Verma", roll: "21B01A0534", score: 88 },
  { rank: 3, name: "Anitha K", roll: "21B01A0507", score: 85 },
  { rank: 4, name: "Sai Kumar", roll: "21B01A0542", score: 82, isYou: true },
  { rank: 5, name: "Deepika R", roll: "21B01A0519", score: 78 },
];

export const RECENT_WEEKS = [
  { week: "Week 11", marks: "74/30 marks", pct: "247%", status: "Passed" },
  { week: "Week 10", marks: "82/30 marks", pct: "273%", status: "Passed" },
  { week: "Week 9", marks: "56/30 marks", pct: "187%", status: "Failed" },
];

export const RESULTS_STATS = {
  totalAttempts: 5,
  passed: 3,
  avgScore: "64%",
  best: "88%",
};

export const RESULTS_LIST = [
  {
    id: 1,
    title: "Verbal Reasoning - Set A",
    category: "Verbal",
    detail: "24 correct, 4 wrong, 2 skipped",
    date: "Jul 20, 2026",
    score: "80%",
    fraction: "24/30",
    time: "38 min",
    status: "Passed",
  },
  {
    id: 2,
    title: "Quantitative Aptitude - Basic",
    category: "Aptitude",
    detail: "18 correct, 5 wrong, 2 skipped",
    date: "Jul 18, 2026",
    score: "72%",
    fraction: "18/25",
    time: "35 min",
    status: "Passed",
  },
  {
    id: 3,
    title: "Logical Reasoning - Patterns",
    category: "Reasoning",
    detail: "8 correct, 10 wrong, 2 skipped",
    date: "Jul 15, 2026",
    score: "40%",
    fraction: "8/20",
    time: "28 min",
    status: "Failed",
  },
  {
    id: 4,
    title: "Verbal Ability - Synonyms",
    category: "Verbal",
    detail: "22 correct, 2 wrong, 1 skipped",
    date: "Jul 12, 2026",
    score: "88%",
    fraction: "22/25",
    time: "20 min",
    status: "Passed",
  },
  {
    id: 5,
    title: "Number Series - Advanced",
    category: "Aptitude",
    detail: "6 correct, 9 wrong, 5 skipped",
    date: "Jul 10, 2026",
    score: "40%",
    fraction: "6/15",
    time: "22 min",
    status: "Failed",
  },
];

export const EXAMS_LIST = [
  { id: 1, title: "Week 12 - Mixed Aptitude", category: "Mixed", questions: 30, minutes: 45, live: true },
  { id: 2, title: "Verbal Reasoning - Set A", category: "Verbal", questions: 8, minutes: 45, live: false },
  { id: 3, title: "Quantitative Aptitude - Basic", category: "Aptitude", questions: 25, minutes: 35, live: false },
  { id: 4, title: "Logical Reasoning - Patterns", category: "Reasoning", questions: 20, minutes: 30, live: false },
];

export const QUESTIONS = [
  {
    q: 'Which word is the synonym of "Ephemeral"?',
    options: ["Permanent", "Transient", "Eternal", "Lasting"],
    answer: 1,
  },
  {
    q: 'Which word is the antonym of "Benevolent"?',
    options: ["Kind", "Generous", "Malevolent", "Charitable"],
    answer: 2,
  },
  {
    q: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "46"],
    answer: 1,
  },
  {
    q: "A train travels 60 km in 45 minutes. What is its speed in km/h?",
    options: ["70 km/h", "75 km/h", "80 km/h", "85 km/h"],
    answer: 2,
  },
  {
    q: "If CODING is written as DPEJOH, how is FLYING written?",
    options: ["GMZJOH", "GMZJHO", "GMYJOH", "FMZJOH"],
    answer: 0,
  },
  {
    q: "If 5x + 3 = 28, what is the value of x?",
    options: ["3", "4", "5", "6"],
    answer: 2,
  },
  {
    q: "Which figure completes the pattern? \u25A1 \u25B3 \u25A1 \u25B3 \u25A1 ?",
    options: ["\u25A1", "\u25B3", "\u25CB", "\u25C7"],
    answer: 1,
  },
  {
    q: "The average of first 50 natural numbers is:",
    options: ["25", "25.5", "26", "26.5"],
    answer: 1,
  },
];
