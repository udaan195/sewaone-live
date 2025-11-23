const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  trackingId: { type: String, required: true, unique: true },
  agentNotes: { type: String, default: "" },
  // ✅ FIX: Fee ko direct yahan bhi save karenge
  fee: { type: Number, default: 0 },

  // ✅ FIX: Payment Details Object Add kiya (Ye missing tha!)
  paymentDetails: {
    officialFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    transactionId: String,
    paymentDate: Date
  },
  serviceType: { 
    type: String, 
    required: true, 
    enum: ['Job', 'Service'],
    default: 'Job' // Purane data ke liye fallback
  },
    jobId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    refPath: 'serviceType' // Magic happens here
  },

  assignedAgentId: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  
  selectedSlot: { 
    date: String, 
    time: String 
  },

  uploadedDocuments: [{ docName: String, url: String }],
  status: { type: String, default: 'Pending Verification' },
  isLiveRequest: { type: Boolean, default: false }, 
  
  applicationData: { 
    type: Map, 
    of: String, 
    default: {} 
  },
  rejectionReason: { type: String }, // Job rejection ka karan
  paymentRejectionReason: { type: String },
  finalResult: {
    pdfUrl: String,      
    completionDate: Date
  },
  userRead: { type: Boolean, default: true }, 
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);