const mongoose = require('mongoose');

let isConnecting = false;

async function connectDB() {
    if (isConnecting) return;
    isConnecting = true;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            family: 4, // Prefer IPv4 to prevent Windows DNS SRV lookup timeouts
        });
        console.log('Successfully connected to MongoDB Atlas');
        try {
            await mongoose.connection.collection('students').dropIndex('rollNumber_1');
        } catch (e) {
            // index rollNumber_1 does not exist or already dropped
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message || error);
        console.log('Retrying connection in 3 seconds...');
        setTimeout(() => {
            isConnecting = false;
            connectDB();
        }, 3000);
    } finally {
        isConnecting = false;
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection lost. Reconnecting...');
    connectDB();
});

module.exports = { connectDB };