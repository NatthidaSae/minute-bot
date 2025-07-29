const pool = require('../config/database');
const { validateTranscriptFilename, extractMeetingInfoFromFilename } = require('../utils/validation');
const { generateSummaryWithRetry } = require('./openaiService');
const SummaryModel = require('../models/summaryModel');
const googleDriveService = require('./googleDriveService');
const documentParser = require('./documentParser');
const { SYSTEM_USER_ID } = require('../constants/system');

// Configuration
const POLL_INTERVAL = process.env.POLL_INTERVAL || 600000; // 10 minutes in milliseconds
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

class GoogleDriveFileWatcher {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.processedFiles = new Set(); // Track processed files by hash
  }

  /**
   * Start the Google Drive file watcher service
   */
  async start() {
    console.log('Starting Google Drive file watcher service...');
    
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not set');
    }

    try {
      // Initialize Google Drive service
      await googleDriveService.initialize();
      
      this.isRunning = true;
      
      // Run immediately on start
      await this.scanGoogleDrive();
      
      // Set up interval for periodic scanning
      this.intervalId = setInterval(async () => {
        if (this.isRunning) {
          await this.scanGoogleDrive();
        }
      }, POLL_INTERVAL);
      
      console.log(`Google Drive file watcher started. Scanning every ${POLL_INTERVAL / 1000} seconds`);
    } catch (error) {
      console.error('Failed to start Google Drive file watcher:', error);
      throw error;
    }
  }

  /**
   * Stop the file watcher service
   */
  stop() {
    console.log('Stopping Google Drive file watcher service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Google Drive file watcher service stopped');
  }

  /**
   * Scan Google Drive folder for new transcript files
   */
  async scanGoogleDrive() {
    console.log(`Scanning Google Drive folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
    
    try {
      // List all processable files in the folder (.txt and Google Docs)
      const files = await googleDriveService.listFiles(GOOGLE_DRIVE_FOLDER_ID);
      
      console.log(`Found ${files.length} processable files in Google Drive`);
      
      for (const file of files) {
        await this.processGoogleDriveFile(file);
      }
    } catch (error) {
      console.error('Error scanning Google Drive:', error);
    }
  }

  /**
   * Process a single Google Drive file
   */
  async processGoogleDriveFile(fileMetadata) {
    try {
      const { id: fileId, name: filename, size } = fileMetadata;
      
      // Validate filename (skip validation for Google Docs and .docx files)
      const skipValidationTypes = [
        'application/vnd.google-apps.document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!skipValidationTypes.includes(fileMetadata.mimeType)) {
        const filenameValidation = validateTranscriptFilename(filename);
        if (!filenameValidation.isValid) {
          console.log(`Skipping invalid filename: ${filename} - ${filenameValidation.error}`);
          return;
        }
      }

      // Check file size
      if (size > MAX_FILE_SIZE) {
        console.log(`Skipping file ${filename} - exceeds size limit (${size} bytes)`);
        return;
      }

      // Download or export file content based on type
      let fileContent;
      if (fileMetadata.mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc as plain text
        console.log(`Exporting Google Doc: ${filename}`);
        fileContent = await googleDriveService.exportGoogleDoc(fileId);
      } else if (fileMetadata.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Download and parse .docx file
        console.log(`Processing .docx file: ${filename}`);
        const buffer = await googleDriveService.downloadFile(fileId);
        fileContent = await documentParser.parseDocx(buffer);
      } else {
        // Download regular text file
        const buffer = await googleDriveService.downloadFile(fileId);
        fileContent = buffer.toString('utf-8');
      }
      
      // Generate file hash
      const fileHash = googleDriveService.generateFileHash(fileContent);

      // Check if file already processed (duplicate check)
      const duplicateCheck = await pool.query(
        'SELECT id, status FROM transcripts WHERE file_hash = $1',
        [fileHash]
      );

      if (duplicateCheck.rows.length > 0) {
        console.log(`File already processed: ${filename} (status: ${duplicateCheck.rows[0].status})`);
        return;
      }

      console.log(`Processing new file from Google Drive: ${filename}`);

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
      this.processTranscriptAsync(transcriptId, fileContent, filename, fileId);

    } catch (error) {
      console.error(`Error processing Google Drive file ${fileMetadata.name}:`, error);
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
  async processTranscriptAsync(transcriptId, content, filename, originalFileId) {
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

      // Write summary file back to Google Drive using database data
      await this.writeSummaryToGoogleDrive(filename, savedSummary, originalFileId);

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
   * Write summary to Google Drive - append for text/Google Docs, create new file for .docx
   */
  async writeSummaryToGoogleDrive(originalFilename, summary, originalFileId) {
    try {
      console.log(`Processing summary for: ${originalFilename}`);

      // Get file metadata to check type
      const fileMetadata = await googleDriveService.drive.files.get({
        fileId: originalFileId,
        fields: 'mimeType, parents'
      });

      const isDocx = fileMetadata.data.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

      if (isDocx) {
        // For .docx files, create a new .txt file with summary
        const baseFilename = originalFilename.replace(/\.docx$/i, '');
        const summaryFilename = `${baseFilename}_summary.txt`;
        
        // Get original content for the summary file
        const originalContent = await this.getOriginalFileContent(originalFileId);
        const fullContent = originalContent + summaryText;
        
        // Create new file in the same folder
        const parentFolderId = fileMetadata.data.parents[0];
        await googleDriveService.uploadFile(summaryFilename, fullContent, parentFolderId);
        
        console.log(`Created summary file: ${summaryFilename} for .docx file`);
      } else {
        // For .txt files and Google Docs, append to original
        const originalContent = await this.getOriginalFileContent(originalFileId);
        const updatedContent = originalContent + summaryText;

        // Update the file in Google Drive
        await googleDriveService.updateFile(originalFileId, updatedContent);
        console.log(`Summary appended to original file: ${originalFilename}`);

        // Update the file hash in database to reflect the new content
        const newFileHash = googleDriveService.generateFileHash(updatedContent);
        await pool.query(
          'UPDATE transcripts SET file_hash = $1 WHERE file_hash = $2',
          [newFileHash, googleDriveService.generateFileHash(originalContent)]
        );
      }

    } catch (error) {
      console.error('Error appending summary to Google Drive file:', error);
    }
  }

  /**
   * Get original file content from Google Drive
   */
  async getOriginalFileContent(fileId) {
    try {
      // Check file type and get content accordingly
      const fileMetadata = await googleDriveService.drive.files.get({
        fileId: fileId,
        fields: 'mimeType'
      });

      let content;
      if (fileMetadata.data.mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc as text
        content = await googleDriveService.exportGoogleDoc(fileId);
      } else {
        // Download file
        const buffer = await googleDriveService.downloadFile(fileId);
        content = buffer.toString('utf-8');
      }

      return content;
    } catch (error) {
      console.error('Error getting original file content:', error);
      throw error;
    }
  }
}

// Create singleton instance
const googleDriveFileWatcher = new GoogleDriveFileWatcher();

module.exports = googleDriveFileWatcher;