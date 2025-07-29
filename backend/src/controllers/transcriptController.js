const { validateTranscript } = require('../utils/validation');
const { generateSummary } = require('../services/openaiService');
const pool = require('../config/database');

// Process transcript via API (for manual submission)
const processTranscript = async (req, res, next) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const validation = validateTranscript(transcript);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const summary = await generateSummary(transcript);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error processing transcript:', error);
    res.status(500).json({
      error: 'Failed to process transcript',
      message: error.message || 'Unknown error',
    });
  }
};

// Get transcript processing status
const getTranscriptStatus = async (req, res, next) => {
  try {
    const { transcriptId } = req.params;

    const result = await pool.query(
      'SELECT id, status, error_msg FROM transcripts WHERE id = $1',
      [transcriptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    const transcript = result.rows[0];
    res.json({
      id: transcript.id,
      status: transcript.status,
      error: transcript.error_msg
    });

  } catch (error) {
    console.error('Error fetching transcript status:', error);
    res.status(500).json({
      error: 'Failed to fetch transcript status',
      message: error.message || 'Unknown error',
    });
  }
};

// Get all transcripts with their processing status
const getAllTranscripts = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.filename,
        t.status,
        t.meeting_date,
        t.created_at,
        m.title as meeting_title
      FROM transcripts t
      JOIN meetings m ON t.meeting_id = m.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    res.json({
      transcripts: result.rows
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({
      error: 'Failed to fetch transcripts',
      message: error.message || 'Unknown error',
    });
  }
};

module.exports = {
  processTranscript,
  getTranscriptStatus,
  getAllTranscripts
};