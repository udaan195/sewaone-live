const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BannerSchema = new Schema({
  imageUrl: { type: String, required: true }, // Cloudinary URL
  title: { type: String }, // Optional: Image ke upar text
  targetScreen: { type: String, default: 'GovtJobs' }, // Click karne par kahan jaye?
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', BannerSchema);