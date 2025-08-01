const pool = require('../config/database');

class Summary {
  static async findByTranscriptId(transcriptId) {
    const query = `
      SELECT 
        s.id,
        s.transcript_id,
        s.date,
        s.attendees,
        s.key_decisions,
        s.action_items,
        s.discussion_highlights,
        s.created_at,
        s.updated_at,
        t.meeting_id,
        m.title as meeting_title
      FROM summaries s
      JOIN transcripts t ON t.id = s.transcript_id
      JOIN meetings m ON m.id = t.meeting_id
      WHERE s.transcript_id = $1
    `;
    
    const result = await pool.query(query, [transcriptId]);
    return result.rows[0] || null;
  }

  static async create(summaryData) {
    const {
      transcript_id,
      date,
      attendees,
      key_decisions,
      action_items,
      discussion_highlights
    } = summaryData;

    const query = `
      INSERT INTO summaries (
        transcript_id,
        date,
        attendees,
        key_decisions,
        action_items,
        discussion_highlights
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      transcript_id,
      date,
      JSON.stringify(attendees || []),
      JSON.stringify(key_decisions || []),
      JSON.stringify(action_items || []),
      JSON.stringify(discussion_highlights || [])
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Summary;