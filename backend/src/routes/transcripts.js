const express = require('express');
const router = express.Router();
const { 
  processTranscript, 
  getTranscriptStatus, 
  getAllTranscripts 
} = require('../controllers/transcriptController');

// POST /api/transcripts - Process a transcript manually
router.post('/', processTranscript);

// GET /api/transcripts - Get all transcripts
router.get('/', getAllTranscripts);

// GET /api/transcripts/:transcriptId/status - Get transcript status
router.get('/:transcriptId/status', getTranscriptStatus);

module.exports = router;