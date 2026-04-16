const express = require('express');
const Evaluation = require('../models/Evaluation');
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('createdBy', 'fullName');
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;