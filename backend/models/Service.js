const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  title: { type: String, required: true }, 
  description: { type: String },
  
  // Main Category (Citizen Service, Govt Scheme, etc.)
  category: { type: String, default: 'Citizen Service' }, 
  
  // Sub Category (For folders like "Identity", "Transport")
  subCategory: { type: String }, 

  officialFee: { type: Number, default: 0 },   
  serviceCharge: { type: Number, default: 50 }, 
  
  requiredDocuments: [{ type: String }], 

  isReadyForLaunch: { type: Boolean, default: false }, 
  
  requiredFields: [{ 
      label: String, 
      type: { type: String, default: 'text' }, 
      required: { type: Boolean, default: true }
  }],

  linkedFormId: { type: Schema.Types.ObjectId, ref: 'FormTemplate' },

  instructions: { type: String }, 
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', ServiceSchema);