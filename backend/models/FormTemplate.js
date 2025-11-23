const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FormTemplateSchema = new Schema({
  title: { type: String, required: true }, 
  
  // --- NEW: CONFIGURATION IN TEMPLATE ---
  officialFee: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 50 },
  requiredDocuments: [{ type: String }], // ["Aadhar", "Pan"]
  // -------------------------------------

  sections: [{
      heading: { type: String, required: true },
      fields: [{
          label: String, 
          type: { type: String, enum: ['text', 'number', 'date', 'dropdown', 'file', 'textarea'], default: 'text' },
          isRequired: { type: Boolean, default: false },
          options: [{ label: String }], 
          fileConfig: {
              allowedTypes: { type: String, default: 'all' },
              maxSizeMB: { type: Number, default: 2 }
          }
      }]
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FormTemplate', FormTemplateSchema);