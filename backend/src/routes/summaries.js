const express = require('express');
const router = express.Router();
const SummaryController = require('../controllers/summaryController');

// GET /api/summaries/:transcriptId - Get summary by transcript ID
router.get('/:transcriptId', SummaryController.getSummaryByTranscriptId);

module.exports = router;