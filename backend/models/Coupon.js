const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true }, // Ex: "FIRST50"
  description: { type: String }, // Ex: "50% Off on first order"
  
  // Discount Type
  type: { type: String, enum: ['FLAT', 'PERCENT'], required: true },
  value: { type: Number, required: true }, // 50 (Rs) or 50 (%)
  
  // Target Users (Optional)
  targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Agar empty hai to sabke liye
  
  // Limits
  usageLimitPerUser: { type: Number, default: 1 }, // Ek user kitni baar use kar sakta hai
  minOrderValue: { type: Number, default: 0 }, // Kam se kam itna order hona chahiye
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);