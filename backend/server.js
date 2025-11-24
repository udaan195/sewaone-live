const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*', // Filhal sabke liye allow kar rahe hain taaki error na aaye
    credentials: true
}));
app.use(express.json()); 

app.get('/api/test', (req, res) => res.json({ message: "Backend connected!" }));

// --- API ROUTES ---
try {
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/jobs', require('./routes/jobRoutes'));
    app.use('/api/applications', require('./routes/applicationRoutes'));
    app.use('/api/help', require('./routes/helpRoutes'));
    app.use('/api/updates', require('./routes/updateRoutes'));
    app.use('/api/services', require('./routes/serviceRoutes'));
    app.use('/api/wallet', require('./routes/walletRoutes'));
    app.use('/api/coupons', require('./routes/couponRoutes')); 
    app.use('/api/forms', require('./routes/formRoutes')); 
    app.use('/api/chat', require('./routes/chatRoutes'));
    
    // YAHAN ADMIN ROUTES USE KARNA HAI
    const adminRouter = require('./routes/adminRoutes');
    app.use('/api/admin', adminRouter);
    
    // NOTE: Audit Logs ka route adminRoutes.js mein define ho chuka hai
} catch (error) {
    console.error("❌ Route Import Error:", error.message);
}

// ✅ FIX: Use process.env.PORT for Render and '0.0.0.0' for binding


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
