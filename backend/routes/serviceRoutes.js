const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const adminAuth = require('../middleware/adminAuth');
const FormTemplate = require('../models/FormTemplate');
// 1. Add Service (Admin)
router.post('/add', adminAuth, async (req, res) => {
  try {
    const { linkedFormId, title, description, category, subCategory, instructions } = req.body;
    
    // Default values
    let serviceData = {
        title, description, category, subCategory, instructions,
        officialFee: 0,
        serviceCharge: 50,
        requiredDocuments: [],
        linkedFormId
    };

    // Agar Template Link kiya hai, to wahan se data copy karo
    if (linkedFormId) {
        const template = await FormTemplate.findById(linkedFormId);
        if (template) {
            serviceData.officialFee = template.officialFee;
            serviceData.serviceCharge = template.serviceCharge;
            serviceData.requiredDocuments = template.requiredDocuments;
            // Form fields copy karne ki zaroorat nahi, wo linkedFormId se hi load honge wizard mein
        }
    }

    const newService = new Service(serviceData);
    await newService.save();
    res.json({ msg: 'Service Added Successfully!', service: newService });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// 2. Get Services by Category (Public) - YEH NAYA HAI
router.get('/category/:type', async (req, res) => {
  try {
    const type = decodeURIComponent(req.params.type);
    // 'isActive: true' zaroor check karein
    const services = await Service.find({ category: type, isActive: true }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error("Service Fetch Error:", err);
    res.status(500).send('Server Error');
  }
});

// 3. Get All (Admin List ke liye)
router.get('/all', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 4. Delete
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Service Deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/status/:type', async (req, res) => {
    try {
        const type = decodeURIComponent(req.params.type);
        
        // Find one service in this category and check its isReadyForLaunch status
        const service = await Service.findOne({ category: type }).select('isReadyForLaunch');
        
        // Agar koi service hi nahi hai to default false bhejo
        res.json({ 
            isReady: service ? service.isReadyForLaunch : false 
        });
    } catch (err) { res.status(500).send('Server Error'); }
});

// 6. Update Launch Status (Admin) - Yahan Admin manage karega
router.put('/launch-status/:type', adminAuth, async (req, res) => {
    try {
        const { isReady } = req.body;
        const type = decodeURIComponent(req.params.type);

        // Update all services in that category (Mass update)
        await Service.updateMany({ category: type }, { $set: { isReadyForLaunch: isReady } });

        res.json({ msg: `Launch status set to ${isReady}` });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET /api/services/:id
// @desc    Get single service for editing
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ msg: 'Service not found' });
    res.json(service);
  } catch (err) { res.status(500).send('Server Error'); }
});

// @route   PUT /api/services/update/:id
// @desc    Update a service
router.put('/update/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ msg: 'Service Updated', service });
  } catch (err) { res.status(500).send('Server Error'); }
});


module.exports = router;