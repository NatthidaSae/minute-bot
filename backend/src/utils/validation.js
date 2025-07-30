// Validation utilities for transcript processing

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
 * @returns {Object} - { meetingName: string, transcriptTitle: string|null, meetingDate: Date|null }
 */
function extractMeetingInfoFromFilename(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(txt|docx)$/i, '');
  
  // Pattern for [Org] [Project] Description_DateTime format
  // Example: [TrueVC] [Pegasus] Morning sync up_2025-01-17T02_54_32+00_00
  // Also handles: [TrueVC][Titanus][Argus] Morning sync up_2025-01-17T05_15_06+00_00
  const bracketPattern = /^\[([^\]]+)\]\s*\[([^\]]+)\](?:\s*\[([^\]]+)\])?\s*(.+?)_(\d{4}-\d{2}-\d{2})T/;
  
  let match = nameWithoutExt.match(bracketPattern);
  if (match) {
    // Handle both 2 and 3 bracket patterns
    if (match[3]) {
      // Three brackets: [Org][Project][SubProject] Description
      return {
        meetingName: `${match[1]}_${match[2]}_${match[3]}`,
        transcriptTitle: match[4].trim(),
        meetingDate: new Date(match[5])
      };
    } else {
      // Two brackets: [Org][Project] Description
      return {
        meetingName: `${match[1]}_${match[2]}`,
        transcriptTitle: match[4].trim(),
        meetingDate: new Date(match[5])
      };
    }
  }
  
  // Pattern for single bracket format [Org] Description_Date
  const singleBracketPattern = /^\[([^\]]+)\]\s*(.+?)_(\d{4}-\d{2}-\d{2})/;
  match = nameWithoutExt.match(singleBracketPattern);
  if (match) {
    return {
      meetingName: match[1], // Use the bracketed content as meeting name
      transcriptTitle: match[2].trim(), // The description part
      meetingDate: new Date(match[3])
    };
  }
  
  // Try to match date patterns
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
      meetingDate: new Date(match[2])
    };
  }
  
  match = nameWithoutExt.match(pattern2);
  if (match) {
    const [day, month, year] = match[2].split('-');
    const meetingName = match[1].replace(/_/g, ' ');
    return {
      meetingName: meetingName,
      transcriptTitle: null, // No separate transcript title for simple patterns
      meetingDate: new Date(`${year}-${month}-${day}`)
    };
  }
  
  // No date found, use filename as meeting name
  const meetingName = nameWithoutExt.replace(/_/g, ' ');
  return {
    meetingName: meetingName,
    transcriptTitle: null,
    meetingDate: null
  };
}

module.exports = {
  validateTranscript,
  validateTranscriptFilename,
  extractMeetingInfoFromFilename,
  normalizeMeetingTitle
};