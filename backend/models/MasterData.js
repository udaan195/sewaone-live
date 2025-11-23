const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MasterDataSchema = new Schema({
  // Type: 'document' ya 'question'
  type: { type: String, required: true, enum: ['document', 'question'] }, 
  
  // Label: Jo dikhega
  label: { type: String, required: true }, // Unique hata diya taaki error kam aayein
  
  // Key: System ID
  key: { type: String, required: true }
});

module.exports = mongoose.model('MasterData', MasterDataSchema);