const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  // --- 1. BASIC INFO ---
  title: { type: String, required: true }, 
  organization: { type: String, required: true }, 
  shortDescription: { type: String }, 

  // --- 2. FEE CONFIGURATION (Smart System) ---
  serviceCharge: { type: Number, default: 50 }, // Aapki fixed fee

  // Fee Matrix Rules (Admin yahan batayega kis category/gender ki kya fee hai)
  // Example: [{ category: "General", gender: "Male", amount: 500 }]
  feeStructure: [{
    category: { type: String }, 
    gender: { type: String },   
    amount: { type: Number, default: 0 }
  }],

  // --- 3. DYNAMIC FORM BUILDER (User Input) ---
  // Admin yahan extra fields add karega jo user ko bharni hongi
  // Example: [{ label: "Father Name", type: "text", required: true }]
  formSchema: [{
    label: { type: String, required: true }, 
    type: { type: String, default: 'text', enum: ['text', 'number', 'dropdown', 'date', 'textarea'] },
    isRequired: { type: Boolean, default: true },
    options: [{ 
        label: String, 
        officialFee: { type: Number, default: 0 } // Option specific fee (optional)
    }]
  }],

  // --- 4. PROCESS SETTINGS ---
  processInstructions: { type: String },
  requiredDocuments: [{ type: String }], // List of docs needed (e.g. "Photo", "Signature")
  timeSlots: [{ type: String }], // Available slots for user selection

  // --- 5. DISPLAY DETAILS (Static Lists) ---
  importantDates: [{ 
    label: { type: String }, 
    value: { type: String } 
  }],
  
  applicationFee: [{ 
    category: { type: String }, 
    amount: { type: String } 
  }], // Sirf dikhane ke liye text list

  ageLimit: [{ 
    detail: { type: String } 
  }],
  
  // New: Simple text list for eligibility
  eligibilityDetails: [{ 
    detail: { type: String } 
  }], 

  vacancyDetails: [{ 
    postName: { type: String }, 
    totalPost: { type: String }, 
    eligibility: { type: String } 
  }],

  // --- 6. SMART ELIGIBILITY CHECK (Questions) ---
  // Example: { question: "10th Pass?", expectedValue: "Yes" }
  eligibilityCriteria: [{ 
    question: { type: String }, 
    key: { type: String }, 
    expectedValue: { type: String } 
  }],

  // --- 7. LINKS & BUTTONS ---
  applyLink: { type: String },
  notificationLink: { type: String },

  importantLinks: [{ 
    label: { type: String }, 
    url: { type: String },
    isShow: { type: Boolean, default: true } // Admin can hide/show buttons
  }],

  // --- 8. CONSENT TEXT ---
  consentTextEn: { type: String },
  consentTextHi: { type: String },

  // --- 9. META INFO ---
  category: { type: String, default: 'Government Job' },
  postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);