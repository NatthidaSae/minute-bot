const MeetingModel = require('../models/meetingModel');

class MeetingController {
  static async getMeetings(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      
      // For now, we'll use a hardcoded user ID from our seed data
      // In a real app, this would come from authentication middleware
      const userId = req.userId || await getUserId();
      
      const meetings = await MeetingModel.getMeetingsByUser(userId, page);
      
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  }
  
  static async getTodaysMeetings(req, res, next) {
    try {
      const userId = req.userId || await getUserId();
      const todaysMeetings = await MeetingModel.getTodaysMeetings(userId);
      
      res.json({ data: todaysMeetings });
    } catch (error) {
      next(error);
    }
  }
  
  static async getMeetingTranscripts(req, res, next) {
    try {
      const { meetingId } = req.params;
      const transcripts = await MeetingModel.getMeetingTranscripts(meetingId);
      
      res.json({ data: transcripts });
    } catch (error) {
      next(error);
    }
  }
}

// Helper function to get the test user ID
async function getUserId() {
  return '11111111-1111-1111-1111-111111111111'; // ใช้ mock user ที่มีอยู่จริง
}

module.exports = MeetingController;