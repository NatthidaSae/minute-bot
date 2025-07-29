const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/database');
const { validateTranscriptFilename, extractMeetingInfoFromFilename } = require('../utils/validation');
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

      // Generate file hash
      const fileContent = await fs.readFile(filePath, 'utf8');
      const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

      // Check if file already processed (duplicate check)
      const duplicateCheck = await pool.query(
        'SELECT id, status FROM transcripts WHERE file_hash = $1',
        [fileHash]
      );

      if (duplicateCheck.rows.length > 0) {
        console.log(`File already processed: ${filename} (status: ${duplicateCheck.rows[0].status})`);
        return;
      }

      console.log(`Processing new file: ${filename}`);

      // Extract meeting info from filename
      const { meetingName, meetingDate } = extractMeetingInfoFromFilename(filename);
      const effectiveDate = meetingDate || new Date();

      // Create or find meeting record
      const meetingResult = await this.findOrCreateMeeting(meetingName, effectiveDate);
      const meetingId = meetingResult.id;

      // Create transcript record with status 'process'
      const transcriptResult = await pool.query(
        `INSERT INTO transcripts (meeting_id, filename, file_hash, meeting_date, content, status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [meetingId, filename, fileHash, effectiveDate, fileContent, 'process']
      );

      const transcriptId = transcriptResult.rows[0].id;
      console.log(`Created transcript record: ${transcriptId}`);

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

    // Check if meeting exists
    const existingMeeting = await pool.query(
      'SELECT id FROM meetings WHERE title = $1 AND meeting_date = $2 AND user_id = $3',
      [meetingName, meetingDate, userId]
    );

    if (existingMeeting.rows.length > 0) {
      return existingMeeting.rows[0];
    }

    // Create new meeting
    const newMeeting = await pool.query(
      'INSERT INTO meetings (title, meeting_date, user_id) VALUES ($1, $2, $3) RETURNING id',
      [meetingName, meetingDate, userId]
    );

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
        discussion_highlights: summary.discussion_highlights,
        next_steps: summary.next_steps
      });

      // Update transcript status to 'done'
      await pool.query(
        'UPDATE transcripts SET status = $1, updated_at = NOW() WHERE id = $2',
        ['done', transcriptId]
      );

      console.log(`Summary generated successfully for transcript: ${transcriptId}`);

      // Write summary file back to Google Drive folder
      await this.writeSummaryFile(filename, summary, content);

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
   * Write summary file back to Google Drive folder
   */
  async writeSummaryFile(originalFilename, summary, originalContent) {
    try {
      const summaryFilename = originalFilename.replace('.txt', '.summary.txt');
      const summaryPath = path.join(WATCH_DIRECTORY, summaryFilename);

      // Format summary for text file
      let summaryText = `MEETING SUMMARY
===============

Date: ${new Date().toLocaleDateString()}
Generated from: ${originalFilename}

ATTENDEES
---------
${summary.attendees.join('\n')}

KEY DECISIONS
-------------
${summary.key_decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

ACTION ITEMS
------------
${summary.action_items.map((item, i) => {
  let text = `${i + 1}. ${item.task}`;
  if (item.assignedTo.length > 0) {
    text += ` (Assigned to: ${item.assignedTo.join(', ')})`;
  }
  if (item.dueDate) {
    text += ` [Due: ${item.dueDate}]`;
  }
  return text;
}).join('\n')}

DISCUSSION HIGHLIGHTS
--------------------
${summary.discussion_highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

NEXT STEPS
----------
${summary.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---
This summary was automatically generated by the Meeting Summary Bot.
`;

      await fs.writeFile(summaryPath, summaryText, 'utf8');
      console.log(`Summary file written: ${summaryFilename}`);

    } catch (error) {
      console.error('Error writing summary file:', error);
    }
  }
}

// Create singleton instance
const fileWatcherService = new FileWatcherService();

module.exports = fileWatcherService;