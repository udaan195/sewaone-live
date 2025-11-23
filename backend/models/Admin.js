const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
  firstName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true, length: 10 },
  password: { type: String, required: true },
  
  // Role: SuperAdmin ya Agent
  role: { type: String, default: 'Agent', enum: ['SuperAdmin', 'Agent'] },
  specializations: [{ type: String, default: 'ALL' }],
  // Live Status (Refresh hone par bhi ye DB mein save rahega)
  isOnline: { type: Boolean, default: false }, 
  isBlocked: { type: Boolean, default: false },
  // Load Balancing
  currentLoad: { type: Number, default: 0 }, 
  maxCapacity: { type: Number, default: 5 }  // Default capacity badha di
});

module.exports = mongoose.model('Admin', AdminSchema);