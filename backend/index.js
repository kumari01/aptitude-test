require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const app = require("./src/app");
const { connectDB } = require("./src/database/connectdb");

// Set default global function options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Establish MongoDB Atlas connection if URI is available
if (process.env.MONGODB_URI) {
  connectDB();
}

// Export the Express server as Firebase 2nd Gen HTTPS Cloud Function
exports.api = onRequest(
  {
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  app
);
