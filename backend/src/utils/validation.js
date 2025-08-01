// Validation utilities for transcript processing
const { convertUTCtoAsiaTime } = require('./timeConversion');

/**
 * Validates a transcript content
 * @param {string} transcript - The transcript text content
 * @returns {Object} - { isValid: boolean, error?: string }
 */
function validateTranscript(transcript) {
  // Check if transcript exists
  if (!transcript) {
    return { isValid: false, error: 'Transcript content is required' };
  }

  // Check if transcript is a string
  if (typeof transcript !== 'string') {
    return { isValid: false, error: 'Transcript must be a string' };
  }

  // Check minimum length (at least 100 characters for a valid transcript)
  if (transcript.trim().length < 100) {
    return { isValid: false, error: 'Transcript is too short (minimum 100 characters)' };
  }

  // Check maximum length (10MB text is approximately 10 million characters)
  const maxLength = 10 * 1024 * 1024; // 10MB
  if (transcript.length > maxLength) {
    return { isValid: false, error: 'Transcript exceeds maximum size (10MB)' };
  }

  // Check if transcript contains actual content (not just whitespace/special chars)
  const wordCount = transcript.trim().split(/\s+/).length;
  if (wordCount < 20) {
    return { isValid: false, error: 'Transcript must contain at least 20 words' };
  }

  return { isValid: true };
}

/**
 * Validates a filename for transcript files
 * @param {string} filename - The filename to validate
 * @returns {Object} - { isValid: boolean, error?: string }
 */
function validateTranscriptFilename(filename) {
  if (!filename) {
    return { isValid: false, error: 'Filename is required' };
  }

  // Check file extension
  const allowedExtensions = ['.txt', '.docx'];
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return { isValid: false, error: 'Only .txt and .docx files are accepted' };
  }

  // Check filename length
  if (filename.length > 255) {
    return { isValid: false, error: 'Filename is too long' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Normalizes a meeting title for consistent grouping
 * @param {string} title - The meeting title to normalize
 * @returns {string} - Normalized meeting title
 */
function normalizeMeetingTitle(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove special characters except spaces
    .replace(/\b(meeting|call|sync|standup|stand up)\b/g, match => {
      // Standardize common meeting terms
      const standardTerms = {
        'meeting': 'meeting',
        'call': 'meeting',
        'sync': 'sync',
        'standup': 'standup',
        'stand up': 'standup'
      };
      return standardTerms[match] || match;
    });
}

/**
 * Extracts meeting info from filename
 * @param {string} filename - The transcript filename
 * @returns {Object} - { meetingName: string, transcriptTitle: string|null, meetingDate: Date|null, meetingTime: string|null }
 */
function extractMeetingInfoFromFilename(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(txt|docx)$/i, '');
  
  // Pattern for [Org] [Project] Description_DateTime format with time extraction
  // Example: [TrueVC] [Pegasus] Morning sync up_2025-01-17T02_54_32+00_00
  // Also handles: [TrueVC][Titanus][Argus] Morning sync up_2025-01-17T05_15_06+00_00
  const bracketPattern = /^(\[[^\]]+\]\s*\[[^\]]+\](?:\s*\[[^\]]+\])?\s*.+?)_(\d{4}-\d{2}-\d{2})T(\d{2})_(\d{2})_(\d{2})/;
  
  let match = nameWithoutExt.match(bracketPattern);
  if (match) {
    // Keep the full title including brackets and description
    const fullTitle = match[1];
    const dateStr = match[2];
    const hours = parseInt(match[3]);
    const minutes = parseInt(match[4]);
    const seconds = parseInt(match[5]);
    
    // Convert UTC time to Asia/Bangkok (UTC+7)
    const asiaTime = convertUTCtoAsiaTime(dateStr, hours, minutes, seconds);
    
    return {
      meetingName: fullTitle,
      transcriptTitle: fullTitle, // Use same as meeting name for consistency
      meetingDate: asiaTime.date,
      meetingTime: asiaTime.time
    };
  }
  
  // Pattern for single bracket format [Org] Description_Date with time
  const singleBracketTimePattern = /^(\[[^\]]+\]\s*.+?)_(\d{4}-\d{2}-\d{2})T(\d{2})_(\d{2})_(\d{2})/;
  match = nameWithoutExt.match(singleBracketTimePattern);
  if (match) {
    const fullTitle = match[1];
    const dateStr = match[2];
    const hours = parseInt(match[3]);
    const minutes = parseInt(match[4]);
    const seconds = parseInt(match[5]);
    
    // Convert UTC time to Asia/Bangkok (UTC+7)
    const asiaTime = convertUTCtoAsiaTime(dateStr, hours, minutes, seconds);
    
    return {
      meetingName: fullTitle,
      transcriptTitle: fullTitle,
      meetingDate: asiaTime.date,
      meetingTime: asiaTime.time
    };
  }
  
  // Pattern for formats without time
  const noTimePattern = /^(\[[^\]]+\].*?)_(\d{4}-\d{2}-\d{2})$/;
  match = nameWithoutExt.match(noTimePattern);
  if (match) {
    return {
      meetingName: match[1],
      transcriptTitle: match[1],
      meetingDate: new Date(match[2]),
      meetingTime: null
    };
  }
  
  // Try to match date patterns without brackets
  // Pattern 1: MeetingName_YYYY-MM-DD
  const pattern1 = /^(.+?)_(\d{4}-\d{2}-\d{2})$/;
  // Pattern 2: MeetingName_DD-MM-YYYY
  const pattern2 = /^(.+?)_(\d{2}-\d{2}-\d{4})$/;
  
  match = nameWithoutExt.match(pattern1);
  if (match) {
    const meetingName = match[1].replace(/_/g, ' ');
    return {
      meetingName: meetingName,
      transcriptTitle: null, // No separate transcript title for simple patterns
      meetingDate: new Date(match[2]),
      meetingTime: null
    };
  }
  
  match = nameWithoutExt.match(pattern2);
  if (match) {
    const [day, month, year] = match[2].split('-');
    const meetingName = match[1].replace(/_/g, ' ');
    return {
      meetingName: meetingName,
      transcriptTitle: null, // No separate transcript title for simple patterns
      meetingDate: new Date(`${year}-${month}-${day}`),
      meetingTime: null
    };
  }
  
  // No date found, use filename as meeting name
  const meetingName = nameWithoutExt.replace(/_/g, ' ');
  return {
    meetingName: meetingName,
    transcriptTitle: null,
    meetingDate: null,
    meetingTime: null
  };
}

module.exports = {
  validateTranscript,
  validateTranscriptFilename,
  extractMeetingInfoFromFilename,
  normalizeMeetingTitle
};