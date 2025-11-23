const express = require('express');
const router = express.Router();
const FormTemplate = require('../models/FormTemplate'); 
const adminAuth = require('../middleware/adminAuth');

// 1. Create Template
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { title, sections, officialFee, serviceCharge, requiredDocuments } = req.body;
    if (!title || !sections) return res.status(400).json({ msg: 'Data missing' });

    const newForm = new FormTemplate({
        title, sections, officialFee, serviceCharge, requiredDocuments
    });
    await newForm.save();
    res.json({ msg: 'Template Created!', form: newForm });
  } catch (err) { res.status(500).send('Server Error'); }
});

// 2. Get All Templates (List)
router.get('/list', adminAuth, async (req, res) => {
  try {
    const forms = await FormTemplate.find().select('title createdAt officialFee');
    res.json(forms);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 3. Get Single Template (Details)
router.get('/:id', async (req, res) => {
  try {
    const form = await FormTemplate.findById(req.params.id);
    if (!form) return res.status(404).json({ msg: 'Not found' });
    res.json(form);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 4. Update Template (NEW)
router.put('/update/:id', adminAuth, async (req, res) => {
  try {
    const { title, sections, officialFee, serviceCharge, requiredDocuments } = req.body;
    
    const updatedForm = await FormTemplate.findByIdAndUpdate(
      req.params.id,
      { title, sections, officialFee, serviceCharge, requiredDocuments },
      { new: true }
    );

    if (!updatedForm) return res.status(404).json({ msg: 'Form not found' });
    res.json({ msg: 'Template Updated!', form: updatedForm });
  } catch (err) { res.status(500).send('Server Error'); }
});

// 5. Delete Template
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await FormTemplate.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Template Deleted' });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;