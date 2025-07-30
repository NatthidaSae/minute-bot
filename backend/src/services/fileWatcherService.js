const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/database');
const { validateTranscriptFilename, extractMeetingInfoFromFilename, normalizeMeetingTitle } = require('../utils/validation');
const { generateSummaryWithRetry } = require('./openaiService');
const SummaryModel = require('../models/summaryModel');
const { SYSTEM_USER_ID } = require('../constants/system');

// Configuration
const WATCH_DIRECTORY = process.env.TRANSCRIPT_WATCH_DIR || '/mnt/gdrive/transcripts';
const POLL_INTERVAL = process.env.POLL_INTERVAL || 600000; // 10 minutes in milliseconds
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class FileWatcherService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the file watcher service
   */
  async start() {
    console.log(`Starting file watcher service for Google Drive folder: ${WATCH_DIRECTORY}`);
    
    // Check if directory exists
    try {
      await fs.access(WATCH_DIRECTORY);
    } catch (error) {
      console.error(`Watch directory does not exist: ${WATCH_DIRECTORY}`);
      throw new Error(`Watch directory not found: ${WATCH_DIRECTORY}`);
    }

    this.isRunning = true;
    
    // Run immediately on start
    await this.scanDirectory();
    
    // Set up interval for periodic scanning
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.scanDirectory();
      }
    }, POLL_INTERVAL);
    
    console.log(`File watcher service started. Scanning every ${POLL_INTERVAL / 1000} seconds`);
  }

  /**
   * Stop the file watcher service
   */
  stop() {
    console.log('Stopping file watcher service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('File watcher service stopped');
  }

  /**
   * Scan the directory for new transcript files
   */
  async scanDirectory() {
    console.log(`Scanning directory: ${WATCH_DIRECTORY}`);
    
    try {
      const files = await fs.readdir(WATCH_DIRECTORY);
      const txtFiles = files.filter(file => file.toLowerCase().endsWith('.txt') && !file.includes('.summary.txt'));
      
      console.log(`Found ${txtFiles.length} .txt files to check`);
      
      for (const filename of txtFiles) {
        await this.processFile(filename);
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }
  }

  /**
   * Process a single transcript file
   */
  async processFile(filename) {
    const filePath = path.join(WATCH_DIRECTORY, filename);
    
    try {
      // Validate filename
      const filenameValidation = validateTranscriptFilename(filename);
      if (!filenameValidation.isValid) {
        console.log(`Skipping invalid filename: ${filename} - ${filenameValidation.error}`);
        return;
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > MAX_FILE_SIZE) {
        console.log(`Skipping file ${filename} - exceeds size limit (${stats.size} bytes)`);
        return;
      }

      // Check if file already processed by filename
      const existingTranscript = await pool.query(
        'SELECT id, status FROM transcripts WHERE filename = $1',
        [filename]
      );

      let transcriptId;
      let isRetry = false;

      if (existingTranscript.rows.length > 0) {
        const status = existingTranscript.rows[0].status;
        transcriptId = existingTranscript.rows[0].id;
        
        if (status === 'done' || status === 'process') {
          console.log(`File already processed/processing: ${filename} (status: ${status})`);
          return;
        }
        
        if (status === 'error') {
          console.log(`Retrying previously failed file: ${filename}`);
          isRetry = true;
          // Update the existing transcript record to retry
          await pool.query(
            'UPDATE transcripts SET status = $1, updated_at = NOW() WHERE id = $2',
            ['process', transcriptId]
          );
        }
      }

      // Read file content after status check
      const fileContent = await fs.readFile(filePath, 'utf8');
      const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

      if (!isRetry) {
        console.log(`Processing new file: ${filename}`);

        // Extract meeting info from filename
        const { meetingName, transcriptTitle, meetingDate } = extractMeetingInfoFromFilename(filename);
        const effectiveDate = meetingDate || new Date();

        // Create or find meeting record
        const meetingResult = await this.findOrCreateMeeting(meetingName, effectiveDate);
        const meetingId = meetingResult.id;

        // Create transcript record with status 'process'
        const transcriptResult = await pool.query(
          `INSERT INTO transcripts (meeting_id, title, filename, file_hash, meeting_date, content, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [meetingId, transcriptTitle, filename, fileHash, effectiveDate, fileContent, 'process']
        );

        transcriptId = transcriptResult.rows[0].id;
        console.log(`Created transcript record: ${transcriptId}`);
      }

      // Process transcript asynchronously
      this.processTranscriptAsync(transcriptId, fileContent, filename);

    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
    }
  }

  /**
   * Find or create a meeting record
   */
  async findOrCreateMeeting(meetingName, meetingDate) {
    // Use system user ID for automated meeting inserts
    const userId = SYSTEM_USER_ID;

    // Normalize the meeting title for consistent grouping
    const normalizedTitle = normalizeMeetingTitle(meetingName);

    // Check if meeting exists with the same normalized title (case-insensitive)
    // We're looking for meetings with similar titles, regardless of date
    const existingMeeting = await pool.query(
      `SELECT id, title FROM meetings 
       WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) 
       AND user_id = $2
       LIMIT 1`,
      [meetingName, userId]
    );

    if (existingMeeting.rows.length > 0) {
      console.log(`Found existing meeting: ${existingMeeting.rows[0].title} (ID: ${existingMeeting.rows[0].id})`);
      return existingMeeting.rows[0];
    }

    // No existing meeting found, create new one
    // Use the first occurrence date as the meeting date
    const newMeeting = await pool.query(
      'INSERT INTO meetings (title, meeting_date, user_id) VALUES ($1, $2, $3) RETURNING id, title',
      [meetingName, meetingDate, userId]
    );

    console.log(`Created new meeting: ${newMeeting.rows[0].title} (ID: ${newMeeting.rows[0].id})`);
    return newMeeting.rows[0];
  }

  /**
   * Process transcript asynchronously (generate summary)
   */
  async processTranscriptAsync(transcriptId, content, filename) {
    try {
      console.log(`Generating summary for transcript: ${transcriptId}`);

      // Generate summary using LLM
      const summary = await generateSummaryWithRetry(content);

      // Get meeting date for summary
      const transcriptResult = await pool.query(
        'SELECT meeting_date FROM transcripts WHERE id = $1',
        [transcriptId]
      );
      const meetingDate = transcriptResult.rows[0].meeting_date;

      // Save summary to database
      await SummaryModel.create({
        transcript_id: transcriptId,
        date: meetingDate,
        attendees: summary.attendees,
        key_decisions: summary.key_decisions,
        action_items: summary.action_items,
        discussion_highlights: summary.discussion_highlights
      });

      // Update transcript status to 'done'
      await pool.query(
        'UPDATE transcripts SET status = $1, updated_at = NOW() WHERE id = $2',
        ['done', transcriptId]
      );

      console.log(`Summary generated successfully for transcript: ${transcriptId}`);

      // Fetch the saved summary from database to ensure consistency
      const savedSummaryResult = await pool.query(
        `SELECT 
          attendees,
          key_decisions,
          action_items,
          discussion_highlights,
          date
        FROM summaries 
        WHERE transcript_id = $1`,
        [transcriptId]
      );

      if (savedSummaryResult.rows.length === 0) {
        throw new Error('Summary not found after saving');
      }

      const savedSummary = savedSummaryResult.rows[0];

      // Write summary file back to Google Drive folder using database data
      await this.writeSummaryFile(filename, savedSummary, content);

    } catch (error) {
      console.error(`Error generating summary for transcript ${transcriptId}:`, error);

      // Update transcript status to 'error'
      await pool.query(
        'UPDATE transcripts SET status = $1, error_msg = $2, updated_at = NOW() WHERE id = $3',
        ['error', error.message, transcriptId]
      );
    }
  }

  /**
   * Append summary to original transcript file
   */
  async writeSummaryFile(originalFilename, summary, originalContent) {
    try {
      const filePath = path.join(WATCH_DIRECTORY, originalFilename);

      // Safely extract arrays from database JSONB fields
      const attendees = summary.attendees || [];
      const keyDecisions = summary.key_decisions || [];
      const actionItems = summary.action_items || [];
      const discussionHighlights = summary.discussion_highlights || [];

      // Format summary text
      const summaryText = `

========================================
MEETING SUMMARY (Generated on ${new Date().toLocaleDateString()})
========================================

ATTENDEES
---------
${attendees.length > 0 ? attendees.join('\n') : 'No attendees recorded'}

KEY DECISIONS
-------------
${keyDecisions.length > 0 ? keyDecisions.map((d, i) => `${i + 1}. ${d}`).join('\n') : 'No key decisions recorded'}

ACTION ITEMS
------------
${actionItems.length > 0 ? actionItems.map((item, i) => {
  let text = `${i + 1}. `;
  
  // Handle both object format and string format for backward compatibility
  if (typeof item === 'object' && item !== null) {
    text += item.task || 'No task description';
    if (item.assignedTo && item.assignedTo.length > 0) {
      text += ` (Assigned to: ${item.assignedTo.join(', ')})`;
    }
    if (item.dueDate) {
      text += ` [Due: ${item.dueDate}]`;
    }
  } else {
    // If it's a string (old format), just use it as is
    text += item;
  }
  
  return text;
}).join('\n') : 'No action items recorded'}

DISCUSSION HIGHLIGHTS
--------------------
${discussionHighlights.length > 0 ? discussionHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No discussion highlights recorded'}

---
This summary was automatically generated by the Meeting Summary Bot.
`;

      // Combine original content with summary
      const updatedContent = originalContent + summaryText;

      // Write updated content back to file
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`Summary appended to original file: ${originalFilename}`);

      // Update the file hash in database to reflect the new content
      const newFileHash = crypto.createHash('sha256').update(updatedContent).digest('hex');
      await pool.query(
        'UPDATE transcripts SET file_hash = $1 WHERE file_hash = $2',
        [newFileHash, crypto.createHash('sha256').update(originalContent).digest('hex')]
      );

    } catch (error) {
      console.error('Error appending summary to file:', error);
    }
  }
}

// Create singleton instance
const fileWatcherService = new FileWatcherService();

module.exports = fileWatcherService;