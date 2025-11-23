const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   POST /api/help/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { trackingId, issueCategory, description } = req.body;

    console.log("Help Request Received for:", trackingId); // Debug Log

    // 1. Tracking ID se Application dhoondo (Case Insensitive)
    // Taaki 'sewa-123' aur 'SEWA-123' dono chalein
    const linkedApp = await Application.findOne({ 
        trackingId: { $regex: new RegExp(`^${trackingId}$`, 'i') } 
    });

    const newHelp = new HelpRequest({
      userId: req.user.id,
      trackingId: trackingId.toUpperCase(), // Hamesha capital save karein
      issueCategory,
      description,
      // Agar app mili to link karo, nahi to undefined
      linkedApplicationId: linkedApp ? linkedApp._id : undefined,
      assignedAgentId: linkedApp ? linkedApp.assignedAgentId : undefined
    });

    await newHelp.save();
    console.log("Help Request Saved!"); // Success Log

    res.status(201).json({ msg: 'Request Submitted Successfully!' });

  } catch (err) {
    console.error("Help Submit Error:", err); // Asli Error yahan dikhega
    res.status(500).json({ msg: 'Server Error: ' + err.message }); // Frontend ko error bhejo
  }
});

// ... (baaki routes - all-admin aur resolve - waise hi rahenge) ...
// (Agar aapne pichla code replace kiya hai, to neeche wala part copy kar lein)

router.get('/all-admin', adminAuth, async (req, res) => {
  try {
    const { agentId, date, status, trackingId } = req.query;
    let query = {};
    if (trackingId) query.trackingId = { $regex: trackingId, $options: 'i' };
    if (status) query.status = status;
    if (agentId) query.assignedAgentId = agentId;
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      query.createdAt = { $gte: start, $lte: end };
    }
    const requests = await HelpRequest.find(query)
      .populate('userId', ['firstName', 'mobile'])
      .populate('assignedAgentId', ['firstName'])
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/resolve/:id', adminAuth, async (req, res) => {
  try {
    const { adminResponse } = req.body;
    await HelpRequest.findByIdAndUpdate(req.params.id, { status: 'Resolved', adminResponse, userRead: false // <--- YEH LINE JODEIN
    });
    res.json({ msg: 'Ticket Resolved' });
  } catch (err) { res.status(500).send('Server Error'); }
});
// @route   GET /api/help/my-history
// @desc    User apni khud ki requests dekhega
// @access  Private
router.get('/my-history', auth, async (req, res) => {
  try {
    const requests = await HelpRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 }); // Sabse nayi upar
    res.json(requests);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});
module.exports = router;