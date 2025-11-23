const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true }, // CREDIT = Add, DEBIT = Spend
  description: { type: String, required: true },
  
  // --- NEW FIELDS FOR REAL MONEY ---
  status: { type: String, default: 'Success', enum: ['Pending', 'Success', 'Rejected'] },
  utr: { type: String }, // User ka Transaction ID
  proofUrl: { type: String }, // Screenshot (Optional)
  // -------------------------------

  relatedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);