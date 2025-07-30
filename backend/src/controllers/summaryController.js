const pool = require('../config/database');

class SummaryController {
  static async getSummaryByTranscriptId(req, res, next) {
    try {
      const { transcriptId } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(transcriptId)) {
        return res.status(400).json({
          error: 'Invalid transcript ID format'
        });
      }

      // First, check if the transcript exists and get its status and content
      const transcriptQuery = `
        SELECT t.id, t.status, t.error_msg, t.content, t.meeting_id, m.title, m.meeting_date
        FROM transcripts t
        JOIN meetings m ON t.meeting_id = m.id
        WHERE t.id = $1
      `;
      
      const transcriptResult = await pool.query(transcriptQuery, [transcriptId]);
      
      if (transcriptResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Transcript not found'
        });
      }

      const transcript = transcriptResult.rows[0];

      // Check transcript status
      if (transcript.status === 'process') {
        return res.json({ status: 'process' });
      }

      // If status is 'done', fetch the summary
      const summaryQuery = `
        SELECT 
          s.id as "summaryId",
          s.transcript_id as "transcriptId",
          s.date,
          s.attendees,
          s.key_decisions as "keyDecisions",
          s.action_items as "actionItems",
          s.discussion_highlights as "discussionHighlights",
          s.created_at as "createdAt",
          s.updated_at as "updatedAt"
        FROM summaries s
        WHERE s.transcript_id = $1
      `;

      const summaryResult = await pool.query(summaryQuery, [transcriptId]);

      if (summaryResult.rows.length === 0) {
        // Summary doesn't exist despite transcript being 'done'
        return res.status(404).json({
          error: 'Summary not found for this transcript'
        });
      }

      const summary = summaryResult.rows[0];
      
      // Debug logging
      console.log('Transcript content exists?', !!transcript.content);
      console.log('Transcript content length:', transcript.content ? transcript.content.length : 0);
      
      // Format the response - include transcript content and meeting info
      const response = {
        summaryId: summary.summaryId,
        transcriptId: summary.transcriptId,
        meetingId: transcript.meeting_id,
        meetingTitle: transcript.title,
        date: summary.date,
        attendees: summary.attendees || [],
        keyDecisions: summary.keyDecisions || [],
        actionItems: summary.actionItems || [],
        discussionHighlights: summary.discussionHighlights || [],
        transcriptContent: transcript.content || '',
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt
      };

      res.json(response);

    } catch (error) {
      console.error('Error fetching summary:', error);
      next(error);
    }
  }
}

module.exports = SummaryController;