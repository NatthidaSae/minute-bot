import api from '../config/api';

export const getSummaryByTranscriptId = async (transcriptId) => {
  try {
    const response = await api.get(`/api/summaries/${transcriptId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch summary');
    }
    throw new Error('Network error. Please check your connection.');
  }
};