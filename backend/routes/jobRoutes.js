const express = require('express');
const router = express.Router();
const Job = require('../models/Job'); // Job Model import karein

// 1. Create Job (Nayi job post karne ke liye)
router.post('/add', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json({ msg: 'Job successfully save ho gayi!', job: savedJob });
  } catch (err) {
    console.error("Error saving job:", err);
    res.status(500).json({ msg: 'Server Error: Job save nahi ho payi.' });
  }
});

// 2. Get All Jobs (Saari jobs ki list lane ke liye)
router.get('/all', async (req, res) => {
  try {
    // Sabse nayi job sabse upar dikhegi (postedAt: -1)
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ msg: 'Server Error: Jobs fetch nahi hui.' });
  }
});

// 3. Delete Job (Kisi job ko delete karne ke liye)
router.delete('/:id', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Job delete ho gayi.' });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ msg: 'Server Error: Delete nahi ho paya.' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Job details ko update karein
router.put('/:id', async (req, res) => {
  try {
    // 1. ID se job dhoondhein aur naye data se update karein
    // { new: true } ka matlab hai ki hamein updated document wapas mile
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );

    if (!updatedJob) {
      return res.status(404).json({ msg: 'Job nahi mili' });
    }

    res.json({ msg: 'Job successfully update ho gayi!', job: updatedJob });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ msg: 'Server Error: Update fail ho gaya.' });
  }
});

// --- YEH NAYA ROUTE JODEIN (GET SINGLE JOB FOR EDITING) ---
// @route   GET /api/jobs/:id
// @desc    Edit karne ke liye ek specific job ka data layein
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job nahi mili' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});
module.exports = router;