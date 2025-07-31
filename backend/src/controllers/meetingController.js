const MeetingModel = require('../models/meetingModel');
const { SYSTEM_USER_ID } = require('../constants/system');

class MeetingController {
  static async getMeetings(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      
      // Use system user ID for now since we don't have authentication
      const userId = req.userId || SYSTEM_USER_ID;
      
      const meetings = await MeetingModel.getMeetingsByUser(userId, page);
      
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  }
  
  static async getTodaysMeetings(req, res, next) {
    try {
      const userId = req.userId || SYSTEM_USER_ID;
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
  
  static async getMeetingSeriesTranscripts(req, res, next) {
    try {
      const { meetingId } = req.params;
      const transcripts = await MeetingModel.getMeetingSeriesTranscripts(meetingId);
      
      res.json({ data: transcripts });
    } catch (error) {
      next(error);
    }
  }
}


module.exports = MeetingController;