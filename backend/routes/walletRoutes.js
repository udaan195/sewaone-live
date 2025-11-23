const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// 1. Get Wallet Details
router.get('/details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance walletPin');
    
    // Saare transactions layein
    const history = await WalletTransaction.find({ userId: req.user.id }).sort({ date: -1 });

    // Calculate Pending Amount (Jo abhi tak approve nahi hua)
    // Sirf CREDIT (Add Money) aur Pending status walon ko jodo
    const pendingTxns = history.filter(t => t.type === 'CREDIT' && t.status === 'Pending');
    
    // Total Pending Amount calculate karein
    const pendingAmount = pendingTxns.reduce((total, txn) => total + (txn.amount || 0), 0);

    res.json({ 
        balance: user.walletBalance, 
        pendingAmount: pendingAmount, // <--- YE NAYA HAI
        isPinSet: !!user.walletPin,
        history 
    });
  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});

// 2. Setup PIN
router.post('/setup-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4) return res.status(400).json({ msg: '4 digit PIN required' });
    const user = await User.findById(req.user.id);
    const salt = await bcrypt.genSalt(10);
    user.walletPin = await bcrypt.hash(pin, salt);
    await user.save();
    res.json({ msg: 'PIN Set!' });
  } catch (err) { res.status(500).send('Server Error'); }
});

// --- 3. ADD MONEY REQUEST (USER) [DEBUG ADDED] ---
router.post('/add-money-request', auth, async (req, res) => {
  try {
    const { amount, utr } = req.body;
    
    console.log("--- New Wallet Request ---");
    console.log("User:", req.user.id);
    console.log("Amount:", amount, "UTR:", utr);

    const txn = new WalletTransaction({
        userId: req.user.id,
        amount: amount,
        type: 'CREDIT',
        description: 'Add Money Request (UPI)',
        status: 'Pending', // Yeh field zaroori hai
        utr: utr
    });
    
    const savedTxn = await txn.save();
    console.log("Saved TXN:", savedTxn); // Check karein ki 'status' save hua ya nahi

    res.json({ msg: 'Request Submitted' });
  } catch (err) { 
      console.error("Wallet Req Error:", err);
      res.status(500).send('Server Error'); 
  }
});

// 4. Pay for App
router.post('/pay', auth, async (req, res) => {
  try {
    const { applicationId, amount, pin, couponCode } = req.body; // CouponCode receive karein
    const user = await User.findById(req.user.id);

    if (!user.walletPin) return res.status(400).json({ msg: 'Setup PIN first' });
    const isMatch = await bcrypt.compare(pin, user.walletPin);
    if (!isMatch) return res.status(400).json({ msg: 'Wrong PIN' });
    if (user.walletBalance < amount) return res.status(400).json({ msg: 'Low Balance' });

    // 1. Deduct Balance
    user.walletBalance -= Number(amount);
    
    // 2. TRACK COUPON USAGE (BUG FIX)
    if(couponCode) {
        if (!user.couponUsage) user.couponUsage = new Map();
        
        // Upper case mein convert karke check/set karein
        const codeKey = couponCode.toUpperCase();
        const currentCount = user.couponUsage.get(codeKey) || 0;
        
        user.couponUsage.set(codeKey, currentCount + 1);
        
        // --- CRITICAL FIX: Mark Modified ---
        user.markModified('couponUsage'); 
        // Iske bina Map data save nahi hota
    }

    await user.save();

    // 3. Update Application
    const app = await Application.findById(applicationId).populate('jobId');
    
    const txn = new WalletTransaction({
        userId: req.user.id,
        amount: amount,
        type: 'DEBIT',
        description: `Paid for ${app.jobId.title}`,
        status: 'Success',
        relatedApplicationId: applicationId
    });
    await txn.save();

    app.paymentDetails.isPaid = true;
    app.paymentDetails.paymentDate = new Date();
    app.paymentDetails.transactionId = `WALLET-${txn._id}`;
    app.paymentDetails.totalAmount = amount; // Discounted amount save karein
    
    app.status = 'Processing';
    app.userRead = false;
    await app.save();

    res.json({ msg: 'Payment Successful!', newBalance: user.walletBalance });
  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});


// --- 5. ADMIN: GET PENDING REQUESTS [DEBUG ADDED] ---
router.get('/admin/pending', adminAuth, async (req, res) => {
    try {
        console.log("--- Admin Fetching Pending Requests ---");
        
        // Query check
        const pending = await WalletTransaction.find({ 
            status: 'Pending', 
            type: 'CREDIT' 
        })
        .populate('userId', 'firstName mobile')
        .sort({ date: -1 });
        
        console.log("Found Pending:", pending.length);
        res.json(pending);
    } catch(e) { 
        console.error("Admin Wallet Error:", e);
        res.status(500).send('Error'); 
    }
});

// 6. Admin Action
router.put('/admin/action/:id', adminAuth, async (req, res) => {
    try {
        const { action } = req.body; 
        const txn = await WalletTransaction.findById(req.params.id);
        if(!txn || txn.status !== 'Pending') return res.status(400).json({msg:'Invalid'});

        if (action === 'approve') {
            txn.status = 'Success';
            const user = await User.findById(txn.userId);
            user.walletBalance += txn.amount;
            await user.save();
        } else {
            txn.status = 'Rejected';
        }
        await txn.save();
        res.json({ msg: `Request ${action}ed` });
    } catch(e) { res.status(500).send('Error'); }
});

module.exports = router;