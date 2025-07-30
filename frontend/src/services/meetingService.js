import api from '../config/api';

export const meetingService = {
  // Get paginated meetings
  getMeetings: async (page = 1) => {
    try {
      const response = await api.get('/api/meetings', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  },

  // Get today's meetings
  getTodaysMeetings: async () => {
    try {
      const response = await api.get('/api/meetings/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s meetings:', error);
      throw error;
    }
  },

  // Get all transcripts for a specific meeting
  getMeetingTranscripts: async (meetingId) => {
    try {
      const response = await api.get(`/api/meetings/${meetingId}/transcripts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meeting transcripts:', error);
      throw error;
    }
  }
};