const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdateSchema = new Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Admit Card', 'Results', 'Answer Key', 'Admission', 'Others'] 
  },
  
  // Link to existing Job (Optional)
  linkedJobId: { type: Schema.Types.ObjectId, ref: 'Job' },

  // Admin dwara banaye gaye custom fields
  customFields: [{
    label: String, // e.g. "Exam Date"
    value: String  // e.g. "25th Dec 2025"
  }],

  // Admin dwara banaye gaye custom buttons
  actionButtons: [{
    label: String, // e.g. "Download Admit Card"
    url: String    // e.g. "https://ssc.nic.in..."
  }],

  postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Update', UpdateSchema);