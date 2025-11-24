const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  sender: { 
    type: String, 
    required: true, 
    enum: ['User', 'Agent', 'System'] 
  }, 
  senderId: { 
    type: mongoose.Schema.Types.ObjectId 
  }, // User ID or Admin ID
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Chat', ChatSchema);