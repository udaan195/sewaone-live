const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// --- ALL MODELS IMPORTED HERE ---
const User = require('../models/User');
const Application = require('../models/Application');
const HelpRequest = require('../models/HelpRequest');
const Job = require('../models/Job');
const Notification = require('../models/Notification'); // <--- YEH MISSING THA
const Update = require('../models/Update');
const WalletTransaction = require('../models/WalletTransaction'); 
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SEWA';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// 1. Register User
router.post('/register', async (req, res) => {
  const { firstName, lastName, mobile, email, password, state, city, pincode, referralCode } = req.body;
  
  try {
    let user = await User.findOne({ mobile });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Create new user object
    user = new User({ 
        firstName, lastName, mobile, email, password, state, city, pincode,
        referralCode: generateReferralCode(), // Naya code generate karo
        walletBalance: 0
    });

    // --- REFERRAL LOGIC ---
    if (referralCode) {
        // Check agar code valid hai
        const referrer = await User.findOne({ referralCode });
        
        if (referrer) {
            user.referredBy = referralCode;
            const BONUS_AMOUNT = 20; // ₹20 dono ko milenge

            // 1. Naye User ko Bonus
            user.walletBalance += BONUS_AMOUNT;
            
            // 2. Purane User (Referrer) ko Bonus
            referrer.walletBalance += BONUS_AMOUNT;
            await referrer.save();

            // 3. Referrer ke liye Transaction Log
            await new WalletTransaction({
                userId: referrer._id,
                amount: BONUS_AMOUNT,
                type: 'CREDIT',
                description: `Referral Bonus: ${firstName}`,
                status: 'Success'
            }).save();

            // 4. Naye User ke liye Transaction Log (Save hum niche kar rahe hain)
            // (Note: User abhi save nahi hua hai, isliye ID baad mein use hogi, 
            // lekin hum transaction create karke save kar sakte hain baad mein)
        }
    }
    // ----------------------

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    // Agar bonus mila tha, to naye user ka transaction bhi log karo
    if (user.walletBalance > 0) {
        await new WalletTransaction({
            userId: user._id,
            amount: 20,
            type: 'CREDIT',
            description: 'Welcome/Referral Bonus',
            status: 'Success'
        }).save();
    }

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. Login User
router.post('/login', async (req, res) => {
    const { mobile, password } = req.body;
    try {
      const user = await User.findOne({ mobile });
      if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

// 3. Get User Profile
router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) { res.status(500).send('Server Error'); }
});

// 4. Update Profile Details (Name, Email etc.)
router.put('/update-details', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, state, city, pincode } = req.body;
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (state) updateFields.state = state;
    if (city) updateFields.city = city;
    if (pincode) updateFields.pincode = pincode;

    await User.findByIdAndUpdate(req.user.id, { $set: updateFields });
    res.json({ msg: 'Profile Updated' });
  } catch (err) { res.status(500).send('Server Error'); }
});

// 5. Update Eligibility Data
router.post('/update-profile-data', auth, async (req, res) => {
  try {
    const { newData, forceUpdate } = req.body; 
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: 'User nahi mila' });

    // Ensure map exists
    if (!user.userProfileData) {
        user.userProfileData = new Map();
    }

    // --- CONFLICT CHECK LOGIC ---
    const conflicts = [];
    if (!forceUpdate) {
      for (const [key, newValue] of Object.entries(newData)) {
        const oldValue = user.userProfileData.get(key);
        // Agar purana data hai, aur naya data alag hai
        if (oldValue && oldValue !== newValue) {
          conflicts.push({ key, oldValue, newValue });
        }
      }

      // Agar koi conflict mila, to 409 bhejo
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          msg: 'Data conflict found', 
          conflicts: conflicts 
        });
      }
    }

    // Save Data
    for (const [key, value] of Object.entries(newData)) {
      user.userProfileData.set(key, value);
    }

    await user.save();
    res.json({ msg: 'Updated' });

  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});

// 6. Save Documents (Locker)
router.post('/save-documents', auth, async (req, res) => {
    try {
        const { newDocuments } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Ensure map exists
        if (!user.savedDocuments) {
            user.savedDocuments = new Map();
        }

        // Merge new documents
        for (const [name, url] of Object.entries(newDocuments)) {
            user.savedDocuments.set(name, url);
        }

        // --- YEH LINE ZAROORI HAI ---
        // Mongoose ko batao ki Map change hua hai
        user.markModified('savedDocuments'); 
        // ----------------------------

        await user.save();
        
        console.log("Documents Saved to Profile:", user.savedDocuments); // Debug Log
        
        res.json({ msg: 'Docs Saved', savedDocuments: user.savedDocuments });
    } catch (err) { 
        console.error("Doc Save Error:", err);
        res.status(500).send('Server Error'); 
    }
});

// 7. Get Notifications Count (Badges)
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Bell Icon Count
    const bellCount = await Notification.countDocuments({ userId, isRead: false });

    // Job Count (New jobs since last check)
    const jobCount = await Job.countDocuments({ 
        postedAt: { $gt: user.lastChecked?.jobs || new Date(0) } 
    });

    // Updates Helper
    const countUpdates = async (category, lastTime) => {
        return await Update.countDocuments({ category, postedAt: { $gt: lastTime || new Date(0) } });
    };

    const admitCardCount = await countUpdates('Admit Card', user.lastChecked?.admitCard);
    const resultCount = await countUpdates('Results', user.lastChecked?.results);
    const answerKeyCount = await countUpdates('Answer Key', user.lastChecked?.answerKey);
    const admissionCount = await countUpdates('Admission', user.lastChecked?.admission);
    const othersCount = await countUpdates('Others', user.lastChecked?.others);

    // Total Badge for Govt Jobs Menu
    const totalGovtBadge = jobCount + admitCardCount + resultCount + answerKeyCount + admissionCount + othersCount;

    // Applications Tab Badge
    const appCount = await Application.countDocuments({ userId, userRead: false });
    
    // Help Tab Badge
    const helpCount = await HelpRequest.countDocuments({ userId, userRead: false });

    res.json({
        bellCount,
        totalGovtBadge,
        jobCount, admitCardCount, resultCount, answerKeyCount, admissionCount, othersCount,
        appCount,
        helpCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 8. Mark as Read (Clear Badge)
router.put('/mark-read', auth, async (req, res) => {
  try {
    const { category } = req.body; // e.g. 'notifications', 'jobs', 'admitCard', 'application'
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (category === 'notifications') {
        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    } 
    else if (category === 'application') {
        await Application.updateMany({ userId, userRead: false }, { $set: { userRead: true } });
    }
    else if (category === 'help') {
        await HelpRequest.updateMany({ userId, userRead: false }, { $set: { userRead: true } });
    }
    else {
        // Categories like 'jobs', 'admitCard', 'results' -> Update timestamp
        // Ensure lastChecked object exists
        if (!user.lastChecked) user.lastChecked = {};
        
        // Map category names to schema keys if needed, or ensure frontend sends correct key
        // Frontend sends: 'jobs', 'admitCard', 'result' (careful with 's')
        // Schema keys: jobs, admitCard, results
        
        let schemaKey = category;
        if (category === 'result') schemaKey = 'results'; // Map singular to plural if needed

        user.lastChecked[schemaKey] = new Date();
        await user.save();
    }

    res.json({ msg: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 9. Get My Notification List
router.get('/my-notifications', auth, async (req, res) => {
    try {
      const list = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/save-push-token
// @desc    User ka Expo Push Token save karein
router.put('/save-push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: 'Token required' });

    await User.findByIdAndUpdate(req.user.id, { pushToken: token });
    res.json({ msg: 'Push Token Saved' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});
module.exports = router;