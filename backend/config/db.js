const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // .env से MONGODB_URI लेगा
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connection Success!");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1); // अगर DB कनेक्ट न हो तो सर्वर बंद कर दें
  }
};

module.exports = connectDB;