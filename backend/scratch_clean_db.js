const mongoose = require("mongoose");
require("dotenv").config();

async function cleanDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb+srv://kumarigadi_db_user:TMTzCe8PWhkIEhtK@cluster-quiz-app.ynsvbc4.mongodb.net/";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully to MongoDB.");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const preserveCollections = ["students", "admins", "users"];

  for (const collection of collections) {
    const name = collection.name;
    if (preserveCollections.includes(name.toLowerCase())) {
      console.log(`[PRESERVED] Keeping collection: ${name}`);
    } else {
      const countBefore = await db.collection(name).countDocuments();
      await db.collection(name).deleteMany({});
      console.log(`[CLEARED] Wiped collection ${name} (${countBefore} records deleted)`);
    }
  }

  console.log("\nDatabase cleanup finished! Student and Admin user credentials are kept intact.");
  await mongoose.disconnect();
  process.exit(0);
}

cleanDatabase().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
