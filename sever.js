require("dotenv").config();
const app = require('./src/app');
const connectDB = require('./src/database/connectdb');

app.listen(process.env.PORT, async () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB.connectDB();
})


