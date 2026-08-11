const mongoose = require('mongoose');
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        try {
            await mongoose.connection.collection('students').dropIndex('rollNumber_1');
            console.log('Dropped legacy rollNumber_1 index');
        } catch (e) {
            // index rollNumber_1 does not exist or already dropped
        }
    }
    catch(error){
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = { connectDB };