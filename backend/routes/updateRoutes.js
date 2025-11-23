const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');

// 1. Add Update & Notify Users
router.post('/add', adminAuth, async (req, res) => {
  try {
    const { title, category, linkedJobId, customFields, actionButtons, sendToAll } = req.body;
    
    const newUpdate = new Update({ 
        title, category, linkedJobId, customFields, actionButtons 
    });
    await newUpdate.save();

    let userIds = [];

    // --- NOTIFICATION LOGIC ---
    if (linkedJobId) {
        // 1. Linked Job: Sirf applied users ko bhejo
        const applications = await Application.find({ jobId: linkedJobId }).select('userId');
        userIds = [...new Set(applications.map(app => app.userId.toString()))];
    } 
    else if (sendToAll) {
        // 2. Custom Job + Send To All: Sabhi users ko bhejo
        const allUsers = await User.find().select('_id');
        userIds = allUsers.map(u => u._id.toString());
    }

    // Create Notifications
    if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
            userId: uid,
            title: `New ${category}`,
            message: `${title} is now available. Check Updates section.`,
            type: 'info' // 'info' type
        }));
        await Notification.insertMany(notifications);
    }
    // ------------------------

    res.json({ msg: 'Update Added!', update: newUpdate });
  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});

// 2. Get Updates
router.get('/get/:category', async (req, res) => {
  try {
    const updates = await Update.find({ category: req.params.category }).sort({ postedAt: -1 });
    res.json(updates);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 3. Get All Jobs for Dropdown (Admin Helper)
router.get('/job-list', adminAuth, async (req, res) => {
    try {
        const jobs = await Job.find().select('title organization');
        res.json(jobs);
    } catch(err) { res.status(500).send('Server Error'); }
});

// 4. Delete
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET /api/updates/job/:jobId
// @desc    Kisi specific job ke saare updates layein (User App ke liye)
router.get('/job/:jobId', async (req, res) => {
  try {
    // Wo updates dhoondo jinka linkedJobId match kare
    const updates = await Update.find({ linkedJobId: req.params.jobId })
      .sort({ postedAt: -1 }); // Naya update sabse upar
    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
module.exports = router;