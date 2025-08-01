const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meetingController');

// GET /api/meetings - Get paginated meetings
router.get('/', MeetingController.getMeetings);

// GET /api/meetings/today - Get today's meetings
router.get('/today', MeetingController.getTodaysMeetings);

// GET /api/meetings/:meetingId/transcripts - Get all transcripts for a meeting
router.get('/:meetingId/transcripts', MeetingController.getMeetingTranscripts);

// GET /api/meetings/:meetingId/series-transcripts - Get all transcripts for a meeting series (recurring meetings)
router.get('/:meetingId/series-transcripts', MeetingController.getMeetingSeriesTranscripts);

module.exports = router;