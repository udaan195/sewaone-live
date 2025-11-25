const express = require('express');
const router = express.Router();

const Application = require('../models/Application');
const Admin = require('../models/Admin');
const Job = require('../models/Job');
const User = require('../models/User');
const Service = require('../models/Service');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Optional Imports (Error handling ke saath)
let sendPushNotification, logAction;
try {
    const notifService = require('../utils/notificationService');
    sendPushNotification = notifService.sendPushNotification;
    const logService = require('../utils/loggingService');
    logAction = logService.logAction;
} catch (e) { console.log("Utils not found, skipping logs"); }

const generateTrackingId = () => 'SEWA-' + Math.floor(100000 + Math.random() * 900000);

// ==========================================
// 🧠 INTELLIGENT FEE CALCULATOR
// ==========================================
const calculateFee = async (jobId, category, gender) => {
  try {
    if (!jobId) return 0;
    
    // Check Service First
    const service = await Service.findById(jobId);
    if (service) return service.officialFee || 0;

    // Check Job
    const job = await Job.findById(jobId);
    if (!job) return 0;

    const userCat = category ? category.toString().trim().toLowerCase() : 'general';
    const userGen = gender ? gender.toString().trim().toLowerCase() : 'male';

    let finalFee = 0;
    const rules = job.applicationFee || job.fees;

    if (Array.isArray(rules)) {
      let match = null;
      for (let r of rules) {
        const dbCatRaw = r.category ? r.category.toString().toLowerCase() : '';
        const dbGenRaw = r.gender ? r.gender.toString().toLowerCase() : 'any';
        const amount = Number(r.amount || r.fee || r.price || r.officialFee || 0);

        const dbCategoriesList = dbCatRaw.split('/').map((c) => c.trim());
        const isCatMatch = dbCatRaw === userCat || dbCatRaw.includes(userCat) || dbCategoriesList.includes(userCat);

        if (isCatMatch) {
          const isGenMatch = dbGenRaw === userGen || dbGenRaw === 'any' || (dbGenRaw === 'male' && userGen === 'male');
          if (isGenMatch) {
            match = r;
            finalFee = amount;
            break;
          }
        }
      }
      if (!match) {
        const generalRule = rules.find(r => r.category?.toLowerCase().includes('general'));
        if (generalRule) finalFee = Number(generalRule.amount || 0);
      }
    } else if (job.fees && typeof job.fees === 'object') {
      finalFee = job.fees[userCat] || job.fees.General || 0;
    } else if (job.applicationFee) {
      finalFee = job.applicationFee;
    }

    return isNaN(Number(finalFee)) ? 0 : Number(finalFee);
  } catch (err) { return 0; }
};

// ==========================================
// 🚀 CORE SUBMIT LOGIC (Shared)
// ==========================================
const processApplication = async (req, res) => {
  try {
    const { jobId, uploadedDocuments, applicationData, paymentDetails = {}, isService, selectedSlot } = req.body;

    // 1. Identify Category for Agent Search (FIXED LOGIC)
    let workCategory = 'Other';
    let itemTitle = 'Unknown';
    
    // Check Service
    let srv = await Service.findById(jobId);
    if (srv) {
        workCategory = srv.subCategory || srv.category || 'Citizen Service';
        itemTitle = srv.title;
    } else {
        // Check Job
        let job = await Job.findById(jobId);
        if (job) {
            workCategory = job.category || 'Government Job';
            itemTitle = job.title;
        }
    }
    
    console.log(`📝 Processing: "${itemTitle}" | Agent Category Needed: "${workCategory}"`);

    // 2. Fee Calculation
    const userCategory = applicationData?.Category || 'General';
    const userGender = applicationData?.Gender || 'Male';
    let processedFee = await calculateFee(jobId, userCategory, userGender);
    if (processedFee === 0 && req.body.fee) processedFee = Number(req.body.fee);

    const frontendServiceFee = paymentDetails?.serviceFee ? Number(paymentDetails.serviceFee) : 50;
    const finalPaymentDetails = {
      serviceFee: frontendServiceFee,
      officialFee: processedFee,
      totalAmount: processedFee + frontendServiceFee,
      isPaid: false,
      ...paymentDetails,
    };

    // 3. SMART AGENT SEARCH (Category Based)
    // Logic: Online + Not Blocked + Capacity Left + (Expert OR All-Rounder)
    const availableAgent = await Admin.findOne({
      role: 'Agent',
      isOnline: true,
      isBlocked: false,
      $expr: { $lt: ['$currentLoad', '$maxCapacity'] },
      $or: [
        { specializations: 'ALL' },            
        { specializations: workCategory }, // ✅ Uses correct Service/Job Category
      ],
    }).sort({ currentLoad: 1 });

    // 4. Assign & Save
    const trackingId = generateTrackingId();
    let assignedAgentId = null;
    let status = selectedSlot ? 'Pending Verification' : 'Pending Verification'; // Default
    let agentName = null;

    // Agar Slot Booking NAHI hai (Live hai) tabhi agent assign karo
    if (availableAgent && !selectedSlot) {
      assignedAgentId = availableAgent._id;
      status = 'Processing';
      agentName = availableAgent.firstName;

      if (!availableAgent.currentLoad) availableAgent.currentLoad = 0;
      availableAgent.currentLoad += 1;
      await availableAgent.save();
      console.log(`✅ Assigned to: ${agentName}`);
    }

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
      paymentDetails: finalPaymentDetails,
      fee: processedFee,
    });

    await newApp.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { applications: newApp._id } });

    // Response
    if (assignedAgentId) {
        return res.json({
            status: 'ASSIGNED',
            agentName: agentName,
            trackingId,
            msg: 'Agent found! Request assigned.',
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
    res.status(500).send('Server Error');
  }
};

// ==========================================
// USER ROUTES
// ==========================================

// ✅ Consolidated Routes (Sabka logic same function handle karega)
router.post('/submit-live', auth, processApplication);
router.post('/apply', auth, processApplication); // For Govt Jobs
router.post('/submit-slot', auth, processApplication);

// My History
router.get('/my-history', auth, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user.id })
      .populate('jobId', ['title', 'organization', 'category']) // Job/Service fetch
      .populate('assignedAgentId', ['firstName'])
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Confirm Payment
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
    app.paymentDetails.isPaid = false;
    app.status = 'Payment Verification Pending';
    app.userRead = false;

    await app.save();
    res.json({ msg: 'Payment Submitted', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// ADMIN / AGENT ROUTES
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
      .populate('userId', ['firstName', 'lastName', 'mobile', 'email'])
      .populate('jobId')
      .populate('assignedAgentId', 'firstName');
    if (!app) return res.status(404).json({ msg: 'Not found' });
    res.json(app);
  } catch (err) { res.status(500).send('Server Error'); }
});

// Payment & Status Updates (With Logs & Notifications)
router.put('/request-payment/:id', adminAuth, async (req, res) => {
  try {
    const { officialFee, serviceFee } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'App not found' });

    if (app.status === 'Completed' || app.paymentDetails.isPaid) {
        return res.status(400).json({ msg: 'Invalid request' });
    }

    app.status = 'Payment Pending';
    app.userRead = false;
    app.paymentDetails.officialFee = officialFee;
    app.paymentDetails.serviceFee = serviceFee;
    app.paymentDetails.totalAmount = Number(officialFee) + Number(serviceFee);
    app.paymentDetails.isPaid = false;

    await app.save();

    if(sendPushNotification) {
        const user = await User.findById(app.userId);
        if(user?.pushToken) sendPushNotification(user.pushToken, 'Payment Requested', `Pay ₹${app.paymentDetails.totalAmount}`, { applicationId: app._id });
    }
    res.json({ msg: 'Payment Requested', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/verify-payment/:id', adminAuth, async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ msg: 'Not found' });

    if (decision === 'approve') {
      app.status = 'Processing';
      app.paymentDetails.isPaid = true;
      app.userRead = false;
    } else {
      app.status = 'Payment Rejected';
      app.paymentDetails.isPaid = false;
      app.paymentRejectionReason = rejectionReason;
      app.userRead = false;
    }
    await app.save();

    if(logAction) logAction(req.admin.id, req.admin.firstName, req.admin.role, decision==='approve'?'PAYMENT_APPROVED':'PAYMENT_REJECTED', `App ID: ${app.trackingId}`, app.trackingId);
    
    const user = await User.findById(app.userId);
    if(user?.pushToken) sendPushNotification(user.pushToken, 'Payment Update', `Payment ${decision}d`, { applicationId: app._id });

    res.json({ msg: `Payment ${decision}d`, app });
  } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/update-status/:id', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason, agentNotes } = req.body;
    const oldApp = await Application.findById(req.params.id);
    
    const updateData = { status, userRead: false };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes;

    const app = await Application.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (status === 'Rejected' && oldApp.status !== 'Rejected' && oldApp.assignedAgentId) {
        const agent = await Admin.findById(oldApp.assignedAgentId);
        if (agent && agent.currentLoad > 0) { agent.currentLoad -= 1; await agent.save(); }
    }

    if(sendPushNotification) {
        const user = await User.findById(app.userId);
        if(user?.pushToken) sendPushNotification(user.pushToken, 'Status Update', `Status: ${status}`, { applicationId: app._id });
    }

    res.json({ msg: 'Status Updated', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

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

    if (app.assignedAgentId) {
        const agent = await Admin.findById(app.assignedAgentId);
        if (agent && agent.currentLoad > 0) { agent.currentLoad -= 1; await agent.save(); }
    }
    
    if(logAction) logAction(req.admin.id, req.admin.firstName, req.admin.role, 'ORDER_COMPLETED', `Completed ${app.trackingId}`, app.trackingId);
    
    const user = await User.findById(app.userId);
    if(user?.pushToken) sendPushNotification(user.pushToken, 'Order Completed', 'Download PDF now', { applicationId: app._id });

    res.json({ msg: 'Completed!', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

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
    res.json({ msg: 'Reassigned', app });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;