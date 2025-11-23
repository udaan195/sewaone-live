const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const User = require('../models/User');
const Application = require('../models/Application');
const MasterData = require('../models/MasterData');
const Banner = require('../models/Banner');
const WalletTransaction = require('../models/WalletTransaction');
const AuditLog = require('../models/AuditLog'); // Import Log Model

const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');

// Helper to generate Refer Code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SEWA';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Logging Service
const { logAction } = require('../utils/loggingService');

// --- GET LOGS FUNCTION ---
const getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    console.error('Get Logs Error:', err);
    res.status(500).send('Server Error');
  }
};

router.get('/audit-logs', adminAuth, getLogs);

// 1. Register Admin (Seed)
router.post('/register-admin', async (req, res) => {
  const { firstName, mobile, password, secretKey } = req.body;
  if (secretKey !== process.env.SEED_ADMIN_SECRET) {
    return res.status(401).json({ msg: 'Invalid Secret Key.' });
  }

  try {
    let admin = await Admin.findOne({ mobile });
    if (admin) return res.status(400).json({ msg: 'Admin exists' });

    admin = new Admin({
      firstName,
      mobile,
      password,
      role: 'SuperAdmin',
      referralCode: generateReferralCode(),
    });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    await admin.save();

    res.status(201).json({ msg: 'Admin Created!' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).send('Server Error');
  }
});

// 2. Login Admin/Agent
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const admin = await Admin.findOne({ mobile });
    if (!admin) return res.status(400).json({ msg: 'Invalid Credentials' });

    if (admin.isBlocked) {
      return res.status(403).json({ msg: 'Account is blocked.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = {
      admin: {
        id: admin.id,
        role: admin.role,
        firstName: admin.firstName,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: admin.role });
      }
    );
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('Server Error');
  }
});

// 3. Create Agent (Audit Log: AGENT_CREATED)
router.post('/create-agent', adminAuth, async (req, res) => {
  try {
    const { firstName, mobile, password, specializations } = req.body;

    // Validation
    if (!firstName || !mobile || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check Duplicate
    let agent = await Admin.findOne({ mobile });
    if (agent) {
      return res
        .status(400)
        .json({ msg: 'Agent with this mobile already exists' });
    }

    // Password Hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Skills Save Logic
    const skillsToSave =
      specializations && specializations.length > 0
        ? specializations
        : ['ALL'];

    agent = new Admin({
      firstName,
      mobile,
      password: hashedPassword,
      role: 'Agent',
      specializations: skillsToSave,
      currentLoad: 0,
      maxCapacity: 5,
    });

    await agent.save();

    // Audit Log
    try {
      await logAction(
        req.admin.id,
        req.admin.firstName,
        req.admin.role,
        'AGENT_CREATED',
        `Agent ${agent.firstName} created by ${req.admin.firstName}.`,
        agent._id
      );
    } catch (logErr) {
      console.error('Log Error (create-agent):', logErr);
    }

    res.json({ msg: 'Agent Created Successfully', agent });
  } catch (err) {
    console.error('Create Agent Error:', err.message || err);
    res.status(500).send('Server Error');
  }
});

// Toggle Admin Online/Offline
router.put('/toggle-status', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });

    admin.isOnline = !admin.isOnline;
    if (!admin.isOnline) admin.isBusy = false;

    await admin.save();
    res.json({ msg: 'Status Updated', isOnline: admin.isOnline });
  } catch (err) {
    console.error('Toggle Status Error:', err);
    res.status(500).send('Server Error');
  }
});

// Get Live Agents (for users)
router.get('/live-agents', auth, async (req, res) => {
  try {
    const agents = await Admin.find({
      isOnline: true,
      isBusy: false,
    }).select('firstName mobile role');

    res.json(agents);
  } catch (err) {
    console.error('Live Agents Error:', err);
    res.status(500).send('Server Error');
  }
});

// --- MASTER DATA ROUTES ---

// Get Master Data List
router.get('/master-data/:type', async (req, res) => {
  try {
    const list = await MasterData.find({ type: req.params.type }).sort({
      label: 1,
    });
    res.json(list);
  } catch (err) {
    console.error('Master Data Fetch Error:', err);
    res.status(500).send('Server Error');
  }
});

// Add Master Data
router.post('/master-data/add', adminAuth, async (req, res) => {
  try {
    const { type, label } = req.body;
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    let item = await MasterData.findOne({ key });
    if (item) return res.status(200).json({ msg: 'Already exists', item });

    const newItem = new MasterData({ type, label, key });
    await newItem.save();

    res.json({ msg: 'Added', item: newItem });
  } catch (err) {
    console.error('Master Data Add Error:', err);
    res.status(500).send('Server Error');
  }
});

// --- BANNER ROUTES ---

// Add Banner
router.post('/banners/add', adminAuth, async (req, res) => {
  try {
    const { imageUrl, title, targetScreen } = req.body;
    const newBanner = new Banner({ imageUrl, title, targetScreen });
    await newBanner.save();
    res.json({ msg: 'Banner Added', banner: newBanner });
  } catch (err) {
    console.error('Banner Add Error:', err);
    res.status(500).send('Server Error');
  }
});

// Get All Banners
router.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    console.error('Banner Fetch Error:', err);
    res.status(500).send('Server Error');
  }
});

// Delete Banner
router.delete('/banners/:id', adminAuth, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Banner Deleted' });
  } catch (err) {
    console.error('Banner Delete Error:', err);
    res.status(500).send('Server Error');
  }
});

// --- DASHBOARD STATS ROUTE ---

// @route   GET /api/admin/dashboard-stats
// @desc    Analytics Data for Dashboard
router.get('/dashboard-stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalApps = await Application.countDocuments();

    const financeStats = await Application.aggregate([
      {
        $group: {
          _id: null,
          collectedServiceFee: {
            $sum: {
              $cond: [
                { $eq: ['$paymentDetails.isPaid', true] },
                '$paymentDetails.serviceFee',
                0,
              ],
            },
          },
          collectedOfficialFee: {
            $sum: {
              $cond: [
                { $eq: ['$paymentDetails.isPaid', true] },
                '$paymentDetails.officialFee',
                0,
              ],
            },
          },
          pendingServiceFee: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['Payment Pending', 'Payment Verification Pending'],
                  ],
                },
                '$paymentDetails.serviceFee',
                0,
              ],
            },
          },
          pendingOfficialFee: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['Payment Pending', 'Payment Verification Pending'],
                  ],
                },
                '$paymentDetails.officialFee',
                0,
              ],
            },
          },
        },
      },
    ]);

    const finance =
      financeStats[0] || {
        collectedServiceFee: 0,
        collectedOfficialFee: 0,
        pendingServiceFee: 0,
        pendingOfficialFee: 0,
      };

    const agents = await Admin.find({ role: 'Agent' })
      .select('firstName mobile currentLoad isOnline')
      .sort({ currentLoad: -1 })
      .limit(5);

    const recentApps = await Application.find()
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate('userId', 'firstName mobile')
      .populate('jobId', 'title');

    const walletRequestsCount = await WalletTransaction.countDocuments({
      type: 'CREDIT',
      status: 'Pending',
    });

    const userHoldings = await User.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$walletBalance' } } },
    ]);

    const totalUserWalletBalance =
      (userHoldings[0] && userHoldings[0].totalBalance) || 0;

    res.json({
      counts: {
        totalUsers,
        totalApps,
        totalRevenue: finance.collectedServiceFee,
        totalGovtCollected: finance.collectedOfficialFee,
        totalPending:
          finance.pendingServiceFee + finance.pendingOfficialFee,
        pendingWalletRequests: walletRequestsCount,
        totalUserWalletBalance,
      },
      financeDetail: finance,
      agents,
      recentApps,
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).send('Server Error');
  }
});

// --- CURRENT ADMIN DETAILS ---

router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).send('Server Error');
  }
});

// Get All Agents
router.get('/agents/list', adminAuth, async (req, res) => {
  try {
    const agents = await Admin.find({ role: 'Agent' }).select('-password');
    res.json(agents);
  } catch (err) {
    console.error('Agents List Error:', err);
    res.status(500).send('Server Error');
  }
});

// 7. Update Agent (Block/Unblock/Edit)
router.put('/agent/update/:id', adminAuth, async (req, res) => {
  try {
    const { firstName, mobile, password, isBlocked, maxCapacity } = req.body;
    const agent = await Admin.findById(req.params.id);
    if (!agent) return res.status(404).json({ msg: 'Agent not found' });

    if (firstName) agent.firstName = firstName;
    if (mobile) agent.mobile = mobile;
    if (maxCapacity) agent.maxCapacity = maxCapacity;

    if (typeof isBlocked === 'boolean') {
      agent.isBlocked = isBlocked;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      agent.password = await bcrypt.hash(password, salt);
    }

    await agent.save();

    // Logging only for Block/Unblock
    if (typeof isBlocked === 'boolean') {
      try {
        const action = isBlocked ? 'AGENT_BLOCKED' : 'AGENT_UNBLOCKED';
        await logAction(
          req.admin.id,
          req.admin.firstName,
          req.admin.role,
          action,
          `${req.admin.firstName} ${action.toLowerCase()} agent ${agent.firstName}.`,
          agent._id
        );
      } catch (logErr) {
        console.error('Log Error (agent/update):', logErr);
      }
    }

    res.json({ msg: 'Agent Updated', agent });
  } catch (err) {
    console.error('Agent Update Error:', err);
    res.status(500).send('Server Error');
  }
});

// 8. Delete Agent (Audit Log: AGENT_DELETED)
router.delete('/agent/:id', adminAuth, async (req, res) => {
  try {
    const agent = await Admin.findById(req.params.id);
    if (!agent) return res.status(404).json({ msg: 'Agent not found' });

    await Admin.findByIdAndDelete(req.params.id);

    try {
      await logAction(
        req.admin.id,
        req.admin.firstName,
        req.admin.role,
        'AGENT_DELETED',
        `Agent ${agent.firstName} deleted by ${req.admin.firstName}.`,
        req.params.id
      );
    } catch (logErr) {
      console.error('Log Error (agent delete):', logErr);
    }

    res.json({ msg: 'Agent Deleted' });
  } catch (err) {
    console.error('Agent Delete Error:', err);
    res.status(500).send('Server Error');
  }
});

// 9. Agent Performance Report (Date Filter)
router.post('/agent/performance', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    let dateQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery = {
        'finalResult.completionDate': { $gte: start, $lte: end },
      };
    }

    const report = await Application.aggregate([
      { $match: { status: 'Completed', ...dateQuery } },
      {
        $group: {
          _id: '$assignedAgentId',
          totalCompleted: { $sum: 1 },
          revenueGenerated: { $sum: '$paymentDetails.serviceFee' },
        },
      },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: '_id',
          as: 'agentInfo',
        },
      },
      { $unwind: '$agentInfo' },
      {
        $project: {
          agentName: '$agentInfo.firstName',
          mobile: '$agentInfo.mobile',
          totalCompleted: 1,
          revenueGenerated: 1,
        },
      },
    ]);

    res.json(report);
  } catch (err) {
    console.error('Agent Performance Error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;