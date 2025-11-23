const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// 1. Send Message (User)
router.post('/user/send', auth, async (req, res) => {
  try {
    const { applicationId, message } = req.body;
    // Check agar status Completed/Rejected hai to chat band
    const app = await Application.findById(applicationId);
    if (app.status === 'Completed' || app.status === 'Rejected') {
        return res.status(400).json({ msg: 'Chat is closed for this application.' });
    }

    const newMsg = new Chat({ applicationId, sender: 'User', message });
    await newMsg.save();
    res.json(newMsg);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 2. Send Message (Agent)
router.post('/agent/send', adminAuth, async (req, res) => {
  try {
    const { applicationId, message } = req.body;
    const newMsg = new Chat({ applicationId, sender: 'Agent', message });
    await newMsg.save();
    res.json(newMsg);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 3. Get Messages (Dono ke liye common)
// URL: /api/chat/:applicationId
router.get('/:applicationId', async (req, res) => {
  try {
    const messages = await Chat.find({ applicationId: req.params.applicationId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;