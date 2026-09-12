require("dotenv").config();
const app = require('./src/app');
const connectDB = require('./src/database/connectdb');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB.connectDB();
});