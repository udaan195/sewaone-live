const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  password: { type: String, required: true },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },
  walletBalance: { type: Number, default: 0 },
  walletPin: { type: String },
  userProfileData: { type: Map, of: String, default: {} },
  savedDocuments: { type: Map, of: String, default: {} },
pushToken: { type: String }, 
referralCode: { type: String, unique: true }, // Khud ka code
  referredBy: { type: String },
  couponUsage: {
    type: Map,
    of: Number, // { "FIRST50": 1, "OFF10": 2 }
    default: {}
  },
  // --- NEW: Smart Timestamps for Badges ---
  lastChecked: {
    jobs: { type: Date, default: new Date(0) },
    admitCard: { type: Date, default: new Date(0) },
    results: { type: Date, default: new Date(0) },
    answerKey: { type: Date, default: new Date(0) },
    admission: { type: Date, default: new Date(0) },
    others: { type: Date, default: new Date(0) },
    // Notification Bell ke liye alag logic hai (isRead field)
  },
  // ---------------------------------------

  isAdmin: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);