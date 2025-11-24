const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth'); // User Auth
const adminAuth = require('../middleware/adminAuth'); // Admin/Agent Auth

// @route   GET /api/chat/:applicationId
// @desc    Get chat history (Open for both User & Agent)
// Note: Security ke liye hum token check kar sakte hain, par abhi simple rakhte hain
router.get('/:applicationId', async (req, res) => {
  try {
    const messages = await Chat.find({ applicationId: req.params.applicationId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/send
// @desc    Send message (User Side)
router.post('/send', auth, async (req, res) => {
  try {
    const { applicationId, message } = req.body;

    const newChat = new Chat({
      applicationId,
      sender: 'User',
      senderId: req.user.id,
      message
    });

    await newChat.save();
    res.json(newChat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/agent/send
// @desc    Send message (Agent/Admin Side)
router.post('/agent/send', adminAuth, async (req, res) => {
  try {
    const { applicationId, message } = req.body;

    const newChat = new Chat({
      applicationId,
      sender: 'Agent',
      senderId: req.admin.id,
      message
    });

    await newChat.save();
    res.json(newChat);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;