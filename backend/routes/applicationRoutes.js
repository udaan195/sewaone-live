const express = require('express');
const router = express.Router();

const Application = require('../models/Application');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const Service = require('../models/Service'); 
const User = require('../models/User');

const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// --- UTILS IMPORT ---
let sendPushNotification, logAction, sendTelegramMessage;
try {
    const notifService = require('../utils/notificationService');
    sendPushNotification = notifService.sendPushNotification;
    const logService = require('../utils/loggingService');
    logAction = logService.logAction;
    
    // TELEGRAM IMPORT
    const teleService = require('../utils/telegramService');
    sendTelegramMessage = teleService.sendTelegramMessage;
} catch (e) { console.log("Utils import warning:", e.message); }

const generateTrackingId = () => 'SEWA-' + Math.floor(100000 + Math.random() * 900000);

// ==========================================
// FEE CALCULATOR
// ==========================================
const calculateFee = async (jobId, userCategory, userGender) => {
    try {
        if (!jobId) return 0;
        const service = await Service.findById(jobId);
        if (service) return service.officialFee || 0;
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
        } else if (rules && typeof rules === 'object') {
            finalFee = rules[userCategory] || rules['General'] || 0;
        } else {
            finalFee = Number(rules || 0);
        }
        return finalFee;
    } catch (err) { return 0; }
};

// ==========================================
// APPLICATION SUBMIT (WITH TELEGRAM NOTIFY)
// ==========================================
const handleApplicationSubmit = async (req, res) => {
  try {
    const { jobId, uploadedDocuments, applicationData, paymentDetails = {}, isService, selectedSlot } = req.body;

    let workCategory = 'Other';
    let itemTitle = 'Unknown';
    let feeFromDb = 0;
    let srv = await Service.findById(jobId);
    if (srv) {
        workCategory = srv.subCategory || srv.category || 'Citizen Service';
        itemTitle = srv.title;
        feeFromDb = srv.officialFee || 0;
    } else {
        let job = await Job.findById(jobId);
        if (job) {
            workCategory = job.category || 'Government Job';
            itemTitle = job.title;
        }
    }

    const user = await User.findById(req.user.id);
    const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';
    const userMobile = user ? user.mobile : 'N/A';

    const availableAgent = await Admin.findOne({
      role: 'Agent',
      isOnline: true,
      isBlocked: false,
      $expr: { $lt: ['$currentLoad', '$maxCapacity'] },
      $or: [ { specializations: 'ALL' }, { specializations: workCategory } ],
    }).sort({ currentLoad: 1 });

    const trackingId = generateTrackingId();
    let assignedAgentId = null;
    let status = 'Pending Verification';
    let agentName = 'Queue';

    if (availableAgent && !selectedSlot) {
      assignedAgentId = availableAgent._id;
      status = 'Processing';
      agentName = availableAgent.firstName;
      availableAgent.currentLoad = (availableAgent.currentLoad || 0) + 1;
      await availableAgent.save();
    }

    const processedFee = Number(paymentDetails.officialFee || feeFromDb || 0);
    const serviceFee = Number(paymentDetails.serviceFee || 50);
    const total = processedFee + serviceFee;

    const newApp = new Application({
      userId: req.user.id,
      jobId,
      serviceType: isService ? 'Service' : 'Job',
      trackingId,
      uploadedDocuments,
      assignedAgentId,
      isLiveRequest: !!availableAgent,
      selectedSlot: selectedSlot || null,
      status,
      userRead: true,
      applicationData,
      paymentDetails: { officialFee: processedFee, serviceFee, totalAmount: total, isPaid: false, status: 'Pending' },
    });

    await newApp.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { applications: newApp._id } });

    // ============================
    // TELEGRAM MESSAGE (NEW APP)
    // ============================
    if (sendTelegramMessage) {
        sendTelegramMessage(`
🚀 *New Application Received!*
🆔 ID: \`${trackingId}\`
📋 For: ${itemTitle}
👤 User: ${userName} (${userMobile})
💰 Fee: ₹${total}
👨‍💻 Assigned To: ${agentName}
📂 Category: ${workCategory}
        `);
    }

    if (assignedAgentId) {
        return res.json({ status: 'ASSIGNED', agentName, trackingId, msg: 'Agent Assigned!' });
    } else {
        return res.json({ status: selectedSlot ? 'SLOT_BOOKED' : 'NO_AGENT', trackingId, msg: 'Request Submitted.' });
    }

  } catch (err) {
    console.error('Submit Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ROUTES
router.post('/apply', auth, handleApplicationSubmit);
router.post('/submit-live', auth, handleApplicationSubmit);
router.post('/submit-slot', auth, handleApplicationSubmit);

// ==========================================
// PAYMENT CONFIRM + TELEGRAM
// ==========================================
router.put('/confirm-payment/:id', auth, async (req, res) => {
  try {
    const { transactionId, paymentScreenshotUrl, finalAmount } = req.body;
    const app = await Application.findById(req.params.id).populate('userId', 'firstName mobile');
    if (!app) return res.status(404).json({ msg: 'Not found' });

    app.paymentDetails.transactionId = transactionId;
    app.paymentDetails.paymentScreenshot = paymentScreenshotUrl;
    if (finalAmount) app.paymentDetails.totalAmount = finalAmount;
    app.status = 'Payment Verification Pending';
    app.userRead = false;
    await app.save();

    // TELEGRAM
    if(sendTelegramMessage) {
        sendTelegramMessage(`
💸 *Payment Submitted*
🆔 App ID: ${app.trackingId}
👤 User: ${app.userId.firstName}
💰 Amount: ₹${app.paymentDetails.totalAmount}
🔢 UTR: \`${transactionId}\`
📸 Screenshot: ${paymentScreenshotUrl}
        `);
    }

    res.json({ msg: 'Payment Submitted', app });
  } catch (err) { res.status(500).send('Error'); }
});

// ==========================================
// ADMIN ROUTES (STATUS + TELEGRAM)
// ==========================================
router.put('/verify-payment/:id', adminAuth, async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body;
    const app = await Application.findById(req.params.id);

    if (decision === 'approve') {
      app.status = 'Processing';
      app.paymentDetails.isPaid = true;
    } else {
      app.status = 'Payment Rejected';
      app.paymentDetails.isPaid = false;
      app.paymentRejectionReason = rejectionReason;
    }
    app.userRead = false;
    await app.save();

    // TELEGRAM
    if(sendTelegramMessage) {
      sendTelegramMessage(
        `${decision === 'approve' ? '✅' : '❌'} *Payment ${decision.toUpperCase()}* for App \`${app.trackingId}\``
      );
    }

    res.json({ msg: `Payment ${decision}d`, app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// STATUS UPDATE + TELEGRAM
// ==========================================
router.put('/update-status/:id', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const app = await Application.findById(req.params.id);
    app.status = status;
    if(rejectionReason) app.rejectionReason = rejectionReason;
    app.userRead = false;
    await app.save();

    if(sendTelegramMessage) {
      sendTelegramMessage(`🔄 *Status Update*  
🆔 ${app.trackingId}  
➡ New Status: *${status}*`);
    }

    res.json({ msg: 'Updated', app });
  } catch (err) { res.status(500).send('Error'); }
});

// ==========================================
// COMPLETE + TELEGRAM
// ==========================================
router.post('/complete', adminAuth, async (req, res) => {
  try {
    const { applicationId, pdfUrl } = req.body;
    const app = await Application.findById(applicationId);

    if (!app.paymentDetails.isPaid)
      return res.status(400).json({ msg: 'Payment Pending' });

    app.status = 'Completed';
    app.finalResult = { pdfUrl, completionDate: new Date() };
    app.userRead = false;
    await app.save();

    if(sendTelegramMessage) {
        sendTelegramMessage(`
🎉 *Order Completed*
🆔 ${app.trackingId}
📄 PDF: ${pdfUrl}
        `);
    }

    res.json({ msg: 'Completed!', app });
  } catch (err) { res.status(500).send('Error'); }
});

module.exports = router;