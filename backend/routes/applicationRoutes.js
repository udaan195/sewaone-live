const express = require('express');
const router = express.Router();

const Application = require('../models/Application');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Service = require('../models/Service'); 
const User = require('../models/User');

const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// --- UTILS IMPORT (Notification, Logs & Telegram) ---
let sendPushNotification, logAction, sendTelegramMessage;
try {
    const notifService = require('../utils/notificationService');
    sendPushNotification = notifService.sendPushNotification;
    
    const logService = require('../utils/loggingService');
    logAction = logService.logAction;

    // ✅ Telegram Service Import
    const teleService = require('../utils/telegramService');
    sendTelegramMessage = teleService.sendTelegramMessage;
} catch (e) { console.log("Utils import warning:", e.message); }

const generateTrackingId = () => 'SEWA-' + Math.floor(100000 + Math.random() * 900000);

// ==========================================
// 🧠 HELPER: FEE CALCULATOR
// ==========================================
const calculateFee = async (jobId, userCategory, userGender) => {
    try {
        if (!jobId) return 0;
        
        // Check Service First
        const service = await Service.findById(jobId);
        if (service) return service.officialFee || 0;

        // Check Job
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

    // 1. Identify Category
    let workCategory = 'Other';
    let itemTitle = 'Unknown';
    let feeFromDb = 0;

    // Check Service
    let srv = await Service.findById(jobId);
    if (srv) {
        workCategory = srv.subCategory || srv.category || 'Citizen Service';
        itemTitle = srv.title;
        feeFromDb = srv.officialFee || 0;
    } else {
        // Check Job
        let job = await Job.findById(jobId);
        if (job) {
            workCategory = job.category || 'Government Job';
            itemTitle = job.title;
        }
    }

    // 2. Calculate Fees
    const userCategory = applicationData?.Category || 'General';
    const userGender = applicationData?.Gender || 'Male';
    
    let officialFee = await calculateFee(jobId, userCategory, userGender);
    if (officialFee === 0 && req.body.fee) officialFee = Number(req.body.fee);
    if (officialFee === 0 && paymentDetails.officialFee) officialFee = Number(paymentDetails.officialFee);
    if (officialFee === 0) officialFee = feeFromDb;

    const serviceFee = Number(paymentDetails.serviceFee || 50);
    const totalAmount = officialFee + serviceFee;

    // 3. Smart Agent Search
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

    // 4. Assignment
    const trackingId = generateTrackingId();
    let assignedAgentId = null;
    let status = 'Pending Verification';
    let agentName = 'Queue (Admin)';

    if (availableAgent && !selectedSlot) {
      assignedAgentId = availableAgent._id;
      status = 'Processing';
      agentName = availableAgent.firstName;

      if (!availableAgent.currentLoad) availableAgent.currentLoad = 0;
      availableAgent.currentLoad += 1;
      await availableAgent.save();
    }

    // 5. Save
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
    await User.findByIdAndUpdate(req.user.id, { $push: { applications: newApp._id } });

    // ✅ TELEGRAM ALERT (NEW APPLICATION)
    if(sendTelegramMessage) {
        const user = await User.findById(req.user.id);
        const userName = user ? `${user.firstName} ${user.lastName||''}` : 'User';
        const userMobile = user ? user.mobile : 'N/A';
        
        sendTelegramMessage(`
🚀 *New Application Received!*
🆔 *ID:* \`${trackingId}\`
📋 *Title:* ${itemTitle}
👤 *User:* ${userName} (${userMobile})
💰 *Total Fee:* ₹${totalAmount}
👨‍💻 *Assigned To:* ${agentName}
📂 *Category:* ${workCategory}
        `);
    }

    // 6. Response
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
    console.error('Submit Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// ==========================================
// 1. USER ROUTES
// ==========================================

router.post('/apply', auth, handleApplicationSubmit);
router.post('/submit-live', auth, handleApplicationSubmit);
router.post('/submit-slot', auth, handleApplicationSubmit);

router.get('/my-history', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title category')
      .populate('assignedAgentId', 'firstName')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Confirm Payment (User uploads screenshot)
router.put('/confirm-payment/:id', auth, async (req, res) => {
  try {
    const { transactionId, paymentScreenshotUrl, couponCode, finalAmount } = req.body;
    const app = await Application.findById(req.params.id).populate('userId', 'firstName mobile');
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

    // ✅ TELEGRAM ALERT (PAYMENT RECEIVED)
    if(sendTelegramMessage) {
        sendTelegramMessage(`
💸 *Payment Received*
🆔 *App ID:* \`${app.trackingId}\`
👤 *User:* ${app.userId.firstName} (${app.userId.mobile})
💰 *Amount:* ₹${app.paymentDetails.totalAmount}
🔢 *UTR:* \`${transactionId}\`
📸 [View Screenshot](${paymentScreenshotUrl})
        `);
    }

    res.json({ msg: 'Payment Submitted', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// 2. ADMIN / AGENT ROUTES
// ==========================================

router.get('/all-admin', adminAuth, async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('userId', '-password')
      .populate('jobId', 'title category')
      .populate('assignedAgentId', 'firstName mobile')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (e) { res.status(500).send('Error'); }
});

router.get('/my-tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await Application.find({ assignedAgentId: req.admin.id })
      .populate('userId', '-password')
      .populate('jobId')
      .sort({ appliedAt: -1 });
    res.json(tasks);
  } catch (e) { res.status(500).send('Error'); }
});

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
    
    // Push Notif
    if(sendPushNotification) {
        const user = await User.findById(app.userId);
        if(user?.pushToken) sendPushNotification(user.pushToken, 'Payment Requested', `Pay ₹${app.paymentDetails.totalAmount}`, { applicationId: app._id });
    }

    // ✅ TELEGRAM ALERT (PAYMENT REQUESTED)
    if(sendTelegramMessage) {
        sendTelegramMessage(`💳 *Payment Requested* by Agent\n🆔 \`${app.trackingId}\`\n💰 Asking: ₹${app.paymentDetails.totalAmount}`);
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
    
    // ✅ TELEGRAM ALERT (PAYMENT VERIFIED)
    if(sendTelegramMessage) {
        const statusIcon = decision === 'approve' ? '✅' : '❌';
        let msg = `${statusIcon} *Payment ${decision.toUpperCase()}*\n🆔 \`${app.trackingId}\``;
        if(decision === 'reject') msg += `\n⚠️ Reason: ${rejectionReason}`;
        sendTelegramMessage(msg);
    }

    // Push Notif
    const user = await User.findById(app.userId);
    if(user?.pushToken) sendPushNotification(user.pushToken, 'Payment Update', `Payment ${decision}d`, { applicationId: app._id });

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

    // Reduce load if Rejected
    if (status === 'Rejected' && oldApp.status !== 'Rejected' && oldApp.assignedAgentId) {
        const agent = await Admin.findById(oldApp.assignedAgentId);
        if (agent && agent.currentLoad > 0) { agent.currentLoad -= 1; await agent.save(); }
    }

    // ✅ TELEGRAM ALERT (STATUS CHANGE)
    if(sendTelegramMessage) {
        let msg = `🔄 *Status Update*\n🆔 \`${app.trackingId}\`\n👉 New Status: *${status}*`;
        if(status === 'Rejected') msg += `\n⚠️ Reason: ${rejectionReason}`;
        sendTelegramMessage(msg);
    }

    if(sendPushNotification) {
        const user = await User.findById(app.userId);
        if(user?.pushToken) sendPushNotification(user.pushToken, 'Status Update', `Status: ${status}`, { applicationId: app._id });
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
        if (agent && agent.currentLoad > 0) { agent.currentLoad -= 1; await agent.save(); }
    }
    
    if(logAction) logAction(req.admin.id, req.admin.firstName, req.admin.role, 'ORDER_COMPLETED', `Completed ${app.trackingId}`, app.trackingId);
    
    // ✅ TELEGRAM ALERT (COMPLETED)
    if(sendTelegramMessage) {
        sendTelegramMessage(`🎉 *Order Completed!*\n🆔 \`${app.trackingId}\`\n📄 *Result:* [Download PDF](${pdfUrl})`);
    }

    const user = await User.findById(app.userId);
    if(user?.pushToken) sendPushNotification(user.pushToken, 'Order Completed', 'Download PDF now', { applicationId: app._id });

    res.json({ msg: 'Completed!', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// Reassign Task
router.put('/reassign/:id', adminAuth, async (req, res) => {
  try {
    const { newAgentId } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'Not found' });

    if (app.assignedAgentId) {
        const old = await Admin.findById(app.assignedAgentId);
        if (old && old.currentLoad > 0) { old.currentLoad -= 1; await old.save(); }
    }

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
    
    // ✅ TELEGRAM ALERT (REASSIGN)
    if(sendTelegramMessage) sendTelegramMessage(`🔀 *Task Reassigned*\n🆔 \`${app.trackingId}\`\n👉 New Agent ID: ${newAgentId || 'Unassigned'}`);

    res.json({ msg: 'Reassigned', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;