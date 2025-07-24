const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/meetingController');

// GET /api/meetings - Get paginated meetings
router.get('/', MeetingController.getMeetings);

// GET /api/meetings/today - Get today's meetings
router.get('/today', MeetingController.getTodaysMeetings);

module.exports = router;