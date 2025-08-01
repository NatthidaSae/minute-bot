const pool = require('../config/database');

class MeetingModel {
  static async getMeetingsByUser(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count - temporarily showing all meetings
      const countQuery = `
        SELECT COUNT(DISTINCT m.id) 
        FROM meetings m
      `;
      const countResult = await pool.query(countQuery);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get meetings with latest transcript status - temporarily showing all meetings
      const query = `
        SELECT 
          m.id,
          m.title,
          m.meeting_date as date,
          m.meeting_time as time,
          m.timezone,
          COALESCE(t.status, 'pending') as status,
          t.id as transcript_id
        FROM meetings m
        LEFT JOIN LATERAL (
          SELECT id, status 
          FROM transcripts 
          WHERE meeting_id = m.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) t ON true
        ORDER BY m.meeting_date DESC, m.meeting_time DESC NULLS LAST
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      
      return {
        data: result.rows.map(row => ({
          id: row.id,
          title: row.title,
          date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          time: row.time ? row.time.substring(0, 5) : null, // Format as HH:MM
          timezone: row.timezone || 'UTC',
          status: row.status,
          transcriptId: row.transcript_id
        })),
        meta: {
          page,
          totalPages,
          totalCount
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getTodaysMeetings(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Temporarily showing all today's meetings regardless of user
      const query = `
        SELECT 
          m.id,
          m.title,
          m.meeting_date as date,
          m.meeting_time as time,
          m.timezone,
          COALESCE(t.status, 'pending') as status,
          t.id as transcript_id
        FROM meetings m
        LEFT JOIN LATERAL (
          SELECT id, status 
          FROM transcripts 
          WHERE meeting_id = m.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) t ON true
        WHERE DATE(m.meeting_date) = $1
        ORDER BY m.meeting_date DESC, m.meeting_time DESC NULLS LAST
      `;
      
      const result = await pool.query(query, [today]);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        date: row.date.toISOString().split('T')[0],
        time: row.time ? row.time.substring(0, 5) : null, // Format as HH:MM
        timezone: row.timezone || 'UTC',
        status: row.status,
        transcriptId: row.transcript_id
      }));
    } catch (error) {
      throw error;
    }
  }
  
  static async getMeetingTranscripts(meetingId) {
    try {
      const query = `
        SELECT 
          t.id,
          t.title,
          t.meeting_date,
          t.status,
          t.created_at,
          s.id as summary_id,
          m.title as meeting_title,
          m.meeting_time,
          m.timezone
        FROM transcripts t
        LEFT JOIN summaries s ON s.transcript_id = t.id
        LEFT JOIN meetings m ON m.id = t.meeting_id
        WHERE t.meeting_id = $1
        ORDER BY t.meeting_date DESC, t.created_at DESC
      `;
      
      const result = await pool.query(query, [meetingId]);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title || `Transcript - ${new Date(row.created_at).toLocaleTimeString()}`,
        date: row.meeting_date.toISOString().split('T')[0],
        time: row.meeting_time ? row.meeting_time.substring(0, 5) : null, // Format as HH:MM
        timezone: row.timezone || 'UTC',
        status: row.status,
        createdAt: row.created_at,
        summaryId: row.summary_id,
        meetingTitle: row.meeting_title
      }));
    } catch (error) {
      throw error;
    }
  }
  
  static async getMeetingSeriesTranscripts(meetingId) {
    try {
      // First get the meeting title from the provided meeting ID
      const meetingQuery = `
        SELECT title, user_id 
        FROM meetings 
        WHERE id = $1
      `;
      
      const meetingResult = await pool.query(meetingQuery, [meetingId]);
      
      if (meetingResult.rows.length === 0) {
        throw new Error('Meeting not found');
      }
      
      const { title, user_id } = meetingResult.rows[0];
      
      // Now get all transcripts for meetings with the same title (recurring meetings)
      const query = `
        SELECT 
          t.id,
          t.title as transcript_title,
          t.meeting_date,
          t.status,
          t.created_at,
          s.id as summary_id,
          m.id as meeting_id,
          m.title as meeting_title,
          m.meeting_time,
          m.timezone
        FROM meetings m
        INNER JOIN transcripts t ON t.meeting_id = m.id
        LEFT JOIN summaries s ON s.transcript_id = t.id
        WHERE m.title = $1 
          AND m.user_id = $2
        ORDER BY t.meeting_date DESC, m.meeting_time DESC NULLS LAST, t.created_at DESC
      `;
      
      const result = await pool.query(query, [title, user_id]);
      
      // Group by meeting to show multiple transcripts per meeting if they exist
      const transcriptsMap = new Map();
      
      result.rows.forEach(row => {
        const key = `${row.meeting_date.toISOString()}_${row.meeting_id}`;
        
        if (!transcriptsMap.has(key)) {
          transcriptsMap.set(key, {
            meetingId: row.meeting_id,
            meetingDate: row.meeting_date,
            meetingTime: row.meeting_time,
            transcripts: []
          });
        }
        
        transcriptsMap.get(key).transcripts.push({
          id: row.id,
          title: row.transcript_title || `Transcript - ${new Date(row.created_at).toLocaleTimeString()}`,
          date: row.meeting_date.toISOString().split('T')[0],
          time: row.meeting_time ? row.meeting_time.substring(0, 5) : null,
          timezone: row.timezone || 'UTC',
          status: row.status,
          createdAt: row.created_at,
          summaryId: row.summary_id,
          meetingTitle: row.meeting_title,
          meetingId: row.meeting_id,
          isCurrentMeeting: row.meeting_id === meetingId
        });
      });
      
      // Flatten the results
      const allTranscripts = [];
      transcriptsMap.forEach(meeting => {
        allTranscripts.push(...meeting.transcripts);
      });
      
      return allTranscripts;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MeetingModel;