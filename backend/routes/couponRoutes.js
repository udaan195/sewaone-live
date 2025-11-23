const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');

// 1. Create Coupon (Admin Only)
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { code, type, value, usageLimitPerUser, minOrderValue, description } = req.body;
    
    // Check duplicate code
    let existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) return res.status(400).json({ msg: 'Coupon code already exists' });

    const newCoupon = new Coupon({
        code: code.toUpperCase(), // Always uppercase
        type, 
        value, 
        usageLimitPerUser: usageLimitPerUser || 1, 
        minOrderValue: minOrderValue || 0, 
        description
    });
    
    await newCoupon.save();
    res.json({ msg: 'Coupon Created Successfully!', coupon: newCoupon });
  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});

// 2. Verify & Apply Coupon (User)
router.post('/verify', auth, async (req, res) => {
  try {
    const { code, officialFee, serviceFee } = req.body;
    const userId = req.user.id;
    
    // --- SAFETY FIX: Ensure Numbers ---
    // Agar frontend se null/undefined aaya, to 0 maan lo
    const official = Number(officialFee) || 0;
    const service = Number(serviceFee) || 0;
    const totalOrderValue = official + service;

    // Coupon Find
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ msg: 'Invalid or Expired Coupon' });

    // Check Min Order
    if (totalOrderValue < coupon.minOrderValue) {
        return res.status(400).json({ msg: `Minimum order value must be ₹${coupon.minOrderValue}` });
    }

    // Check Usage
    const user = await User.findById(userId);
    if (!user.couponUsage) user.couponUsage = new Map();
    const usedCount = user.couponUsage.get(code.toUpperCase()) || 0;
    
    if (usedCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({ msg: 'Coupon usage limit exceeded.' });
    }

    // --- CALCULATION FIX ---
    let discountAmount = 0;

    if (coupon.type === 'PERCENT') {
        // % sirf Service Fee par lagega
        discountAmount = (service * coupon.value) / 100;
    } else {
        // Flat amount
        discountAmount = coupon.value;
    }

    // Discount kabhi bhi Service Fee se zyada nahi ho sakta
    if (discountAmount > service) {
        discountAmount = service;
    }

    // Ensure Integer & No Negative
    discountAmount = Math.floor(Math.max(0, discountAmount));
    const finalAmount = Math.floor(Math.max(0, totalOrderValue - discountAmount));

    res.json({ 
        msg: 'Coupon Applied!', 
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        code: coupon.code
    });

  } catch (err) { 
      console.error(err);
      res.status(500).send('Server Error'); 
  }
});


// 3. Get All Coupons (Admin)
router.get('/all', adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) { res.status(500).send('Server Error'); }
});

// 4. Delete Coupon (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Coupon Deleted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;