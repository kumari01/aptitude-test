const mongoose = require('mongoose');
const dns = require('dns');

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let connectionPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI environment variable is not defined.');
        return null;
    }

    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4, // Prefer IPv4 to prevent Windows DNS SRV lookup timeouts
    })
    .then(async (conn) => {
        console.log('Successfully connected to MongoDB Atlas');
        try {
            await mongoose.connection.collection('students').dropIndex('rollNumber_1');
        } catch (e) {}
        return conn;
    })
    .catch((error) => {
        connectionPromise = null;
        console.error('Error connecting to MongoDB:', error.message || error);
        throw error;
    });

    return connectionPromise;
}

mongoose.connection.on('disconnected', () => {
    connectionPromise = null;
});

module.exports = { connectDB };