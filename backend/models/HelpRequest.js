const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HelpRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // User enter karega
  trackingId: { type: String, required: true },
  issueCategory: { type: String, required: true }, // e.g. "Payment", "Mistake", "Status"
  description: { type: String, required: true },

  // System khud bharega (Smart Logic)
  linkedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'Admin' }, // Filter ke liye zaroori

  status: { type: String, default: 'Open', enum: ['Open', 'Resolved'] },
  adminResponse: { type: String }, // Admin ka jawab
userRead: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HelpRequest', HelpRequestSchema);