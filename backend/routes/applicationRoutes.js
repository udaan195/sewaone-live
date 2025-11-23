const express = require('express');
const router = express.Router();

const Application = require('../models/Application');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Service = require('../models/Service'); 
const User = require('../models/User');

const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Optional: Import Utils if they exist in your project structure
// (Hum try-catch ke andar use karenge taaki agar file na ho to crash na ho)
let sendPushNotification, logAction;
try {
    const notifService = require('../utils/notificationService');
    sendPushNotification = notifService.sendPushNotification;
    const logService = require('../utils/loggingService');
    logAction = logService.logAction;
} catch (e) { console.log("Utils not found, skipping logs/notifs"); }

const generateTrackingId = () => 'SEWA-' + Math.floor(100000 + Math.random() * 900000);

// ==========================================
// 🧠 HELPER: FEE CALCULATOR
// ==========================================
const calculateFee = async (jobId, userCategory, userGender) => {
    try {
        if (!jobId) return 0;
        
        // Check Service First (Simpler Fee)
        const service = await Service.findById(jobId);
        if (service) return service.officialFee || 0;

        // Check Job (Complex Rules)
        const job = await Job.findById(jobId);
        if (!job) return 0;

        let finalFee = 0;
        const rules = job.applicationFee || job.fees;

        if (Array.isArray(rules)) {
            const uCat = userCategory?.toLowerCase() || 'general';
            const uGen = userGender?.toLowerCase() || 'male';
            
            const rule = rules.find(r => {
                const rCat = r.category?.toLowerCase() || '';
                const rGen = r.gender?.toLowerCase() || 'any';
                return (rCat.includes(uCat) || rCat === 'all') && (rGen === uGen || rGen === 'any');
            });
            
            if (rule) finalFee = Number(rule.amount || rule.fee);
        } 
        else if (rules && typeof rules === 'object') {
            finalFee = rules[userCategory] || rules['General'] || 0;
        } else {
            finalFee = Number(rules || 0);
        }
        return finalFee;
    } catch (err) { return 0; }
};

// ==========================================
// 🚀 CORE LOGIC: HANDLE SUBMISSION
// ==========================================
const handleApplicationSubmit = async (req, res) => {
  try {
    const {
      jobId,
      uploadedDocuments,
      applicationData,
      paymentDetails = {},
      isService,
      selectedSlot
    } = req.body;

    console.log(`🔵 Processing Application for ID: ${jobId}`);

    // --- 1. IDENTIFY CATEGORY (For Agent Search) ---
    let workCategory = 'Other';
    let itemTitle = 'Unknown';
    
    // Check Service
    let srv = await Service.findById(jobId);
    if (srv) {
        workCategory = srv.category || 'Citizen Service';
        itemTitle = srv.title;
    } else {
        // Check Job
        let job = await Job.findById(jobId);
        if (job) {
            workCategory = job.category || 'Government Job';
            itemTitle = job.title;
        }
    }

    console.log(`📝 Type: ${workCategory} | Title: ${itemTitle}`);

    // --- 2. CALCULATE FEES ---
    const userCategory = applicationData?.Category || 'General';
    const userGender = applicationData?.Gender || 'Male';
    
    let officialFee = await calculateFee(jobId, userCategory, userGender);
    // Fallback if frontend sent fee
    if (officialFee === 0 && req.body.fee) officialFee = Number(req.body.fee);
    if (officialFee === 0 && paymentDetails.officialFee) officialFee = Number(paymentDetails.officialFee);

    const serviceFee = Number(paymentDetails.serviceFee || 50);
    const totalAmount = officialFee + serviceFee;

    // --- 3. SMART AGENT SEARCH ---
    // Logic: Online + Not Blocked + Load < Max + (Skill Match OR All-Rounder)
    const availableAgent = await Admin.findOne({
      role: 'Agent',
      isOnline: true,
      isBlocked: false,
      $expr: { $lt: ['$currentLoad', '$maxCapacity'] },
      $or: [
        { specializations: 'ALL' },            
        { specializations: workCategory },     
      ],
    }).sort({ currentLoad: 1 }); 

    // --- 4. ASSIGNMENT ---
    const trackingId = generateTrackingId();
    let assignedAgentId = null;
    let status = 'Pending Verification';
    let agentName = null;

    // Agar Slot Booking nahi hai (Live hai) aur Agent mil gaya
    if (availableAgent && !selectedSlot) {
      assignedAgentId = availableAgent._id;
      status = 'Processing';
      agentName = availableAgent.firstName;

      // Increase Load
      if (!availableAgent.currentLoad) availableAgent.currentLoad = 0;
      availableAgent.currentLoad += 1;
      await availableAgent.save();
      console.log(`✅ Assigned to: ${agentName}`);
    } else {
      console.log("⏳ Queued (No Agent or Slot Booking)");
    }

    // --- 5. SAVE APPLICATION ---
    const newApp = new Application({
      userId: req.user.id,
      jobId, 
      serviceType: isService ? 'Service' : 'Job',
      trackingId,
      uploadedDocuments,
      assignedAgentId,
      isLiveRequest: !!assignedAgentId,
      selectedSlot: selectedSlot || null,
      status,
      userRead: true,
      applicationData,
      paymentDetails: {
          officialFee,
          serviceFee,
          totalAmount,
          isPaid: false,
          status: 'Pending'
      },
    });

    await newApp.save();
    
    // History Update
    await User.findByIdAndUpdate(req.user.id, { $push: { applications: newApp._id } });

    // --- 6. RESPONSE ---
    if (assignedAgentId) {
        return res.json({
            status: 'ASSIGNED',
            agentName: agentName,
            trackingId,
            msg: 'Agent Assigned!',
        });
    } else {
        return res.json({
            status: selectedSlot ? 'SLOT_BOOKED' : 'NO_AGENT',
            trackingId,
            msg: 'Request Submitted.',
        });
    }

  } catch (err) {
    console.error('🔴 SUBMIT ERROR:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ==========================================
// 1. USER ROUTES
// ==========================================

// All submit routes use the same smart handler
router.post('/apply', auth, handleApplicationSubmit);
router.post('/submit-live', auth, handleApplicationSubmit);
router.post('/submit-slot', auth, handleApplicationSubmit);

// Get History
router.get('/my-history', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title category')
      .populate('assignedAgentId', 'firstName')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Payment Confirmation
router.put('/confirm-payment/:id', auth, async (req, res) => {
  try {
    const { transactionId, paymentScreenshotUrl, couponCode, finalAmount } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'App not found' });

    if (couponCode) {
      const user = await User.findById(req.user.id);
      if (!user.couponUsage) user.couponUsage = new Map();
      const count = user.couponUsage.get(couponCode) || 0;
      user.couponUsage.set(couponCode, count + 1);
      await user.save();
    }

    app.paymentDetails.transactionId = transactionId;
    app.paymentDetails.paymentScreenshot = paymentScreenshotUrl;
    if (finalAmount) app.paymentDetails.totalAmount = finalAmount;
    app.status = 'Payment Verification Pending';
    app.userRead = false;

    await app.save();
    res.json({ msg: 'Payment Submitted', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// 2. ADMIN / AGENT ROUTES
// ==========================================

// Dashboard Data
router.get('/all-admin', adminAuth, async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('userId', '-password')
      .populate('jobId', 'title category')
      .populate('assignedAgentId', 'firstName mobile')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (e) { res.status(500).send('Server Error'); }
});

// Agent Tasks
router.get('/my-tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Application.find({ assignedAgentId: req.admin.id })
      .populate('userId', '-password')
      .populate('jobId')
      .sort({ appliedAt: -1 });
    res.json(tasks);
  } catch (e) { res.status(500).send('Server Error'); }
});

// Detail View
router.get('/detail/:id', adminAuth, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('userId', 'firstName lastName mobile email')
      .populate('jobId')
      .populate('assignedAgentId', 'firstName');
    if (!app) return res.status(404).json({ msg: 'Not found' });
    res.json(app);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Request Payment
router.put('/request-payment/:id', adminAuth, async (req, res) => {
  try {
    const { officialFee, serviceFee } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'Not found' });

    app.status = 'Payment Pending';
    app.userRead = false;
    app.paymentDetails.officialFee = officialFee;
    app.paymentDetails.serviceFee = serviceFee;
    app.paymentDetails.totalAmount = Number(officialFee) + Number(serviceFee);
    app.paymentDetails.isPaid = false;

    await app.save();
    
    // Notification
    if(sendPushNotification) {
        const user = await User.findById(app.userId);
        if(user?.pushToken) sendPushNotification(user.pushToken, 'Payment Requested', `Pay ₹${app.paymentDetails.totalAmount}`, { applicationId: app._id });
    }

    res.json({ msg: 'Request Sent', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Verify Payment
router.put('/verify-payment/:id', adminAuth, async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'Not found' });

    if (decision === 'approve') {
      app.status = 'Processing';
      app.paymentDetails.isPaid = true;
      app.paymentDetails.status = 'Paid';
    } else {
      app.status = 'Payment Rejected';
      app.paymentDetails.isPaid = false;
      app.paymentRejectionReason = rejectionReason;
    }
    app.userRead = false;
    await app.save();

    // Logging
    if(logAction) logAction(req.admin.id, req.admin.firstName, req.admin.role, decision==='approve'?'PAYMENT_APPROVED':'PAYMENT_REJECTED', `App ID: ${app.trackingId}`, app.trackingId);

    res.json({ msg: `Payment ${decision}d`, app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Update Status
router.put('/update-status/:id', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason, agentNotes } = req.body;
    const oldApp = await Application.findById(req.params.id);
    
    const updateData = { status, userRead: false };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes;

    const app = await Application.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // If Rejected, reduce agent load
    if (status === 'Rejected' && oldApp.status !== 'Rejected' && oldApp.assignedAgentId) {
        const agent = await Admin.findById(oldApp.assignedAgentId);
        if (agent && agent.currentLoad > 0) {
            agent.currentLoad -= 1;
            await agent.save();
        }
    }

    res.json({ msg: 'Updated', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Complete Order
router.post('/complete', adminAuth, async (req, res) => {
  try {
    const { applicationId, pdfUrl } = req.body;
    const app = await Application.findById(applicationId);

    if (!app) return res.status(404).json({ msg: 'Not found' });
    if (!app.paymentDetails.isPaid) return res.status(400).json({ msg: 'Payment Pending' });

    app.status = 'Completed';
    app.finalResult = { pdfUrl, completionDate: new Date() };
    app.userRead = false;
    await app.save();

    // Reduce Load
    if (app.assignedAgentId) {
        const agent = await Admin.findById(app.assignedAgentId);
        if (agent && agent.currentLoad > 0) {
            agent.currentLoad -= 1;
            await agent.save();
        }
    }
    
    if(logAction) logAction(req.admin.id, req.admin.firstName, req.admin.role, 'ORDER_COMPLETED', `Completed ${app.trackingId}`, app.trackingId);

    res.json({ msg: 'Completed!', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Reassign Task
router.put('/reassign/:id', adminAuth, async (req, res) => {
  try {
    const { newAgentId } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'Not found' });

    // Reduce Old
    if (app.assignedAgentId) {
        const old = await Admin.findById(app.assignedAgentId);
        if (old && old.currentLoad > 0) { old.currentLoad -= 1; await old.save(); }
    }

    // Increase New
    if (newAgentId) {
        const newA = await Admin.findById(newAgentId);
        if (newA) {
            newA.currentLoad = (newA.currentLoad || 0) + 1;
            await newA.save();
            app.assignedAgentId = newAgentId;
            app.status = 'Processing';
        }
    } else {
        app.assignedAgentId = null;
        app.status = 'Pending Verification';
    }

    await app.save();
    res.json({ msg: 'Reassigned', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;