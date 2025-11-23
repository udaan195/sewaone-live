const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuditLogSchema = new Schema({
  // Action kaun kar raha hai
  agentId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  agentName: { type: String, required: true },
  agentRole: { type: String, required: true },

  // Kya hua
  actionType: { 
    type: String, 
    required: true,
    enum: [
        'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'ORDER_COMPLETED', 
        'STATUS_CHANGE', 'TASK_REASSIGNED', 'AGENT_BLOCKED', 
        'COUPON_CREATED', 'MASTER_DATA_CHANGE'
    ]
  },
  
  // Details
  details: { type: String, required: true }, // Action ka poora description
  targetId: { type: String }, // Kis Application/User/Coupon par action hua
  
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);